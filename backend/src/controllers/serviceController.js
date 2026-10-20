import Service from '../models/Service.js';
import Category from '../models/Category.js';

/**
 * Get all active services with optional filtering
 * GET /api/v1/services
 */
export async function getServices(req, res, next) {
  try {
    const { category, city, search, popular } = req.query;
    const query = { isActive: true };

    if (category) {
      // Find category by slug if not object id
      const catDoc = await Category.findOne({ slug: category });
      if (catDoc) {
        query.category = catDoc._id;
      }
    }

    if (city) {
      query.$or = [
        { cityAvailability: { $exists: false } },
        { cityAvailability: { $size: 0 } },
        { cityAvailability: city.toLowerCase() }
      ];
    }

    if (popular === 'true') {
      query.isPopular = true;
    }

    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { shortDescription: regex }
      ];
    }

    const services = await Service.find(query)
      .populate('category', 'name slug iconKey image')
      .sort({ sortOrder: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: services.length,
      services
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get a single service by slug or legacy alias
 * GET /api/v1/services/:slug
 */
export async function getServiceBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    // First try direct slug
    let service = await Service.findOne({ slug: slug.toLowerCase() })
      .populate('category', 'name slug iconKey image');

    // If not found, check if it's an alias from legacy 37 URLs
    let isRedirect = false;
    let targetVariant = null;

    if (!service) {
      service = await Service.findOne({ aliases: slug.toLowerCase() })
        .populate('category', 'name slug iconKey image');

      if (service) {
        isRedirect = true;
        // Check if the legacy slug corresponds to a specific BHK or variant
        if (slug.includes('1-bhk')) targetVariant = '1-bhk';
        else if (slug.includes('2-bhk')) targetVariant = '2-bhk';
        else if (slug.includes('3-bhk')) targetVariant = '3-bhk';
        else if (slug.includes('4-bhk')) targetVariant = '4-bhk';
        else if (slug.includes('villa')) targetVariant = 'villa';
      }
    }

    if (!service || (!service.isActive && req.user?.role !== 'admin')) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.'
      });
    }

    res.status(200).json({
      success: true,
      service,
      isRedirect,
      canonicalSlug: service.slug,
      suggestedVariant: targetVariant
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all categories with service counts
 * GET /api/v1/categories
 */
export async function getCategories(req, res, next) {
  try {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 });

    // Aggregate active service count per category
    const counts = await Service.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    counts.forEach(c => {
      countMap[c._id.toString()] = c.count;
    });

    const categoriesWithCount = categories.map(cat => ({
      ...cat.toObject(),
      serviceCount: countMap[cat._id.toString()] || 0
    }));

    res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      categories: categoriesWithCount
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getServices,
  getServiceBySlug,
  getCategories
};
