import cloudinary, { deleteCloudinaryAsset } from '../config/cloudinary.js';
import { Media } from '../models/Supporting.js';

/**
 * Upload single image to Cloudinary
 * POST /api/v1/admin/upload
 */
export async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file was provided.'
      });
    }

    const folder = req.body.folder || 'max-housekeeping/uploads';
    const hasCloudinaryKeys = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    // If Cloudinary keys are configured, stream to Cloudinary
    if (hasCloudinaryKeys) {
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }]
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      const result = await uploadPromise;

      // Save media record in DB
      try {
        await Media.create({
          publicId: result.public_id,
          url: result.secure_url,
          resourceType: 'image',
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          alt: req.body.alt || req.file.originalname,
          folder,
          createdBy: req.user?._id
        });
      } catch (dbErr) {
        console.warn('[Media DB Save Notice]:', dbErr.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Image uploaded successfully to Cloudinary',
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format
      });
    }

    // Dev Fallback when Cloudinary keys are not yet configured:
    // Generate clean base64 data URI so admin preview and saves work immediately!
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const mockPublicId = `local_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    console.log('[Cloudinary Simulator] Cloudinary credentials not set in .env. Serving data URI for development.');

    return res.status(200).json({
      success: true,
      simulated: true,
      message: 'Image uploaded in dev mode. To upload directly to your Cloudinary cloud, add CLOUDINARY_CLOUD_NAME in .env',
      url: base64,
      publicId: mockPublicId
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete image from Cloudinary
 * DELETE /api/v1/admin/upload/:publicId
 */
export async function deleteImage(req, res, next) {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({ success: false, message: 'publicId is required' });
    }

    if (publicId.startsWith('local_')) {
      return res.status(200).json({ success: true, message: 'Local image record removed.' });
    }

    const result = await deleteCloudinaryAsset(publicId);
    await Media.findOneAndDelete({ publicId });

    res.status(200).json({
      success: true,
      message: 'Image deleted from Cloudinary successfully',
      result
    });
  } catch (err) {
    next(err);
  }
}

export default {
  uploadImage,
  deleteImage
};
