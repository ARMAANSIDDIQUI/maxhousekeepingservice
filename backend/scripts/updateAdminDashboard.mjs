import fs from 'fs';
import path from 'path';

const filePath = path.resolve('frontend/src/pages/admin/AdminDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Icon imports
content = content.replace(
  '  LuLayers,\n  LuChevronDown',
  '  LuLayers,\n  LuChevronDown,\n  LuRuler,\n  LuCalculator,\n  LuVideo'
);

// 2. newServiceForm & serviceForm states + userSearch & userRoleFilter
const oldNewForm = `  const [createServiceModalOpen, setCreateServiceModalOpen] = useState(false);
  const [newServiceForm, setNewServiceForm] = useState({
    title: '',
    slug: '',
    price: 499,
    mrp: 699,
    duration: '1.5 hrs',
    icon: 'Sparkles',
    shortDescription: '',
    description: '',
    categories: [],
    imageUrl: '',
    images: [],
    variantGroupLabel: 'Apartment / House Size',
    variantGroupKey: 'size',
    variants: [],
    inclusions: '',
    exclusions: ''
  });
  const [savingNewService, setSavingNewService] = useState(false);
  const [uploadingNewServiceImage, setUploadingNewServiceImage] = useState(false);
  const [uploadingMultiple, setUploadingMultiple] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit Service Dual-Pricing Modal State
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    title: '',
    slug: '',
    categories: [],
    icon: 'Sparkles',
    price: 0, // Offered Price
    mrp: 0,   // Shown Price (regular)
    duration: '',
    matrix: [],
    imageUrl: '',
    images: [],
    inclusions: '',
    exclusions: ''
  });`;

const newNewForm = `  const [createServiceModalOpen, setCreateServiceModalOpen] = useState(false);
  const [newServiceForm, setNewServiceForm] = useState({
    title: '',
    slug: '',
    pricingType: 'normal',
    pricingUnit: 'fixed',
    price: 499,
    mrp: 699,
    unitRateMoradabad: 499,
    unitRateOther: 499,
    unitLabel: 'Sq. Ft.',
    minUnitQuantity: 1,
    cityExtraCharge: 0,
    moradabadOnly: false,
    cityAvailability: ['moradabad'],
    videoUrl: '',
    duration: '1.5 hrs',
    icon: 'Sparkles',
    shortDescription: '',
    description: '',
    categories: [],
    imageUrl: '',
    images: [],
    variantGroupLabel: 'Apartment / House Size',
    variantGroupKey: 'size',
    variants: [],
    inclusions: '',
    exclusions: ''
  });
  const [savingNewService, setSavingNewService] = useState(false);
  const [uploadingNewServiceImage, setUploadingNewServiceImage] = useState(false);
  const [uploadingMultiple, setUploadingMultiple] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit Service Dual-Pricing Modal State
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    title: '',
    slug: '',
    pricingType: 'normal',
    pricingUnit: 'fixed',
    price: 0,
    mrp: 0,
    unitRateMoradabad: 0,
    unitRateOther: 0,
    unitLabel: 'Sq. Ft.',
    minUnitQuantity: 1,
    cityExtraCharge: 0,
    moradabadOnly: false,
    cityAvailability: ['moradabad'],
    videoUrl: '',
    categories: [],
    icon: 'Sparkles',
    duration: '',
    matrix: [],
    imageUrl: '',
    images: [],
    inclusions: '',
    exclusions: ''
  });

  // User Search & Role Filter State
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');`;

if (!content.includes(oldNewForm)) {
  console.error('Could not find oldNewForm block!');
  process.exit(1);
}
content = content.replace(oldNewForm, newNewForm);

// 3. openCreateServiceModal
const oldOpenCreate = `  const openCreateServiceModal = () => {
    const defaultCatId = categories.length > 0 ? String(categories[0]._id) : '';
    setNewServiceForm({
      title: '',
      slug: '',
      categories: defaultCatId ? [defaultCatId] : [],
      price: 499,
      mrp: 699,
      duration: '1.5 hrs',
      icon: 'Sparkles',
      shortDescription: '',
      description: '',
      imageUrl: '',
      images: [],
      variantGroupLabel: 'Apartment / House Size',
      variantGroupKey: 'size',
      variants: [],
      inclusions: '',
      exclusions: ''
    });
    setCreateServiceModalOpen(true);
  };`;

const newOpenCreate = `  const openCreateServiceModal = () => {
    const defaultCatId = categories.length > 0 ? String(categories[0]._id) : '';
    setNewServiceForm({
      title: '',
      slug: '',
      categories: defaultCatId ? [defaultCatId] : [],
      pricingType: 'normal',
      pricingUnit: 'fixed',
      price: 499,
      mrp: 699,
      unitRateMoradabad: 499,
      unitRateOther: 499,
      unitLabel: 'Sq. Ft.',
      minUnitQuantity: 1,
      cityExtraCharge: 0,
      moradabadOnly: false,
      cityAvailability: ['moradabad'],
      videoUrl: '',
      duration: '1.5 hrs',
      icon: 'Sparkles',
      shortDescription: '',
      description: '',
      imageUrl: '',
      images: [],
      variantGroupLabel: 'Apartment / House Size',
      variantGroupKey: 'size',
      variants: [],
      inclusions: '',
      exclusions: ''
    });
    setCreateServiceModalOpen(true);
  };`;

if (!content.includes(oldOpenCreate)) {
  console.error('Could not find oldOpenCreate block!');
  process.exit(1);
}
content = content.replace(oldOpenCreate, newOpenCreate);

// 4. openEditService
const oldOpenEdit = `    setServiceForm({
      title: service.title,
      slug: service.slug || '',
      categories: service.categories && service.categories.length > 0
        ? service.categories.map(c => (c && c._id ? String(c._id) : String(c)))
        : (service.category ? [String(service.category._id || service.category)] : (categories.length > 0 ? [String(categories[0]._id)] : [])),
      icon: service.icon || 'Sparkles',
      price: service.price,
      mrp: service.mrp,
      duration: service.duration || '1.5 hrs',
      variantGroupLabel: groupLabel,
      variantGroupKey: groupKey,
      variants,
      imageUrl: initialImages[0]?.url || service.media?.hero?.url || '',
      images: initialImages,
      inclusions: Array.isArray(service.inclusions) ? service.inclusions.join('\\n') : (service.inclusions || ''),
      exclusions: Array.isArray(service.exclusions) ? service.exclusions.join('\\n') : (service.exclusions || '')
    });`;

const newOpenEdit = `    const activePricingType = service.pricingType || (service.pricingUnit && service.pricingUnit !== 'fixed' ? 'unit' : 'normal');
    const allAvailableCities = Array.isArray(service.cityAvailability) && service.cityAvailability.length > 0
      ? service.cityAvailability
      : ['moradabad'];

    setServiceForm({
      title: service.title,
      slug: service.slug || '',
      categories: service.categories && service.categories.length > 0
        ? service.categories.map(c => (c && c._id ? String(c._id) : String(c)))
        : (service.category ? [String(service.category._id || service.category)] : (categories.length > 0 ? [String(categories[0]._id)] : [])),
      icon: service.icon || 'Sparkles',
      pricingType: activePricingType,
      pricingUnit: service.pricingUnit || (activePricingType === 'unit' ? 'sq_ft' : 'fixed'),
      unitRateMoradabad: service.unitRateMoradabad ?? service.price ?? 0,
      unitRateOther: service.unitRateOther ?? service.unitRateMoradabad ?? service.price ?? 0,
      unitLabel: service.unitLabel || (service.pricingUnit === 'litre' ? 'Litres' : 'Sq. Ft.'),
      minUnitQuantity: service.minUnitQuantity || (service.pricingUnit === 'sq_ft' ? 100 : service.pricingUnit === 'litre' ? 500 : 1),
      cityExtraCharge: service.cityExtraCharge || 0,
      moradabadOnly: Boolean(service.moradabadOnly || (allAvailableCities.length === 1 && allAvailableCities[0] === 'moradabad')),
      cityAvailability: allAvailableCities,
      videoUrl: service.videoUrl || '',
      price: service.price,
      mrp: service.mrp,
      duration: service.duration || '1.5 hrs',
      variantGroupLabel: groupLabel,
      variantGroupKey: groupKey,
      variants,
      imageUrl: initialImages[0]?.url || service.media?.hero?.url || '',
      images: initialImages,
      inclusions: Array.isArray(service.inclusions) ? service.inclusions.join('\\n') : (service.inclusions || ''),
      exclusions: Array.isArray(service.exclusions) ? service.exclusions.join('\\n') : (service.exclusions || '')
    });`;

if (!content.includes(oldOpenEdit)) {
  console.error('Could not find oldOpenEdit block!');
  process.exit(1);
}
content = content.replace(oldOpenEdit, newOpenEdit);

// 5. handleSaveService payload
const oldSavePayload = `      const payload = {
        title: serviceForm.title,
        slug: serviceForm.slug,
        categories: selectedCats,
        icon: serviceForm.icon,
        price: Number(serviceForm.price),
        mrp: Number(serviceForm.mrp),
        duration: serviceForm.duration,
        variantGroupLabel: serviceForm.variantGroupLabel || 'Apartment / House Size',
        variantGroupKey: serviceForm.variantGroupKey || 'size',
        variants: serviceForm.variants || [],
        inclusions: parseList(serviceForm.inclusions),
        exclusions: parseList(serviceForm.exclusions)
      };`;

const newSavePayload = `      const isUnit = serviceForm.pricingType === 'unit';
      const mbdRate = Number(serviceForm.unitRateMoradabad) || Number(serviceForm.price) || 0;
      const otherRate = Number(serviceForm.unitRateOther) || mbdRate;
      const activeCities = Array.isArray(serviceForm.cityAvailability) && serviceForm.cityAvailability.length > 0
        ? serviceForm.cityAvailability
        : ['moradabad'];

      const payload = {
        title: serviceForm.title,
        slug: serviceForm.slug,
        categories: selectedCats,
        icon: serviceForm.icon,
        pricingType: serviceForm.pricingType || 'normal',
        pricingUnit: isUnit ? (serviceForm.pricingUnit || 'sq_ft') : 'fixed',
        unitRateMoradabad: mbdRate,
        unitRateOther: otherRate,
        unitLabel: serviceForm.unitLabel || 'Sq. Ft.',
        minUnitQuantity: Number(serviceForm.minUnitQuantity) || 1,
        cityExtraCharge: Number(serviceForm.cityExtraCharge) || 0,
        moradabadOnly: Boolean(serviceForm.moradabadOnly || (activeCities.length === 1 && activeCities[0] === 'moradabad')),
        cityAvailability: activeCities,
        videoUrl: serviceForm.videoUrl || '',
        price: isUnit ? mbdRate : Number(serviceForm.price),
        mrp: isUnit ? (Number(serviceForm.mrp) || Math.round(mbdRate * 1.25)) : Number(serviceForm.mrp),
        duration: serviceForm.duration,
        variantGroupLabel: serviceForm.variantGroupLabel || 'Apartment / House Size',
        variantGroupKey: serviceForm.variantGroupKey || 'size',
        variants: isUnit ? [] : (serviceForm.variants || []),
        inclusions: parseList(serviceForm.inclusions),
        exclusions: parseList(serviceForm.exclusions)
      };`;

if (!content.includes(oldSavePayload)) {
  console.error('Could not find oldSavePayload block!');
  process.exit(1);
}
content = content.replace(oldSavePayload, newSavePayload);

// 6. handleCreateService payload
const oldCreatePayload = `      const payload = {
        title: newServiceForm.title.trim(),
        slug: newServiceForm.slug.trim() || newServiceForm.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        categories: selectedCats,
        price: Number(newServiceForm.price),
        mrp: Number(newServiceForm.mrp),
        duration: newServiceForm.duration || '1.5 hrs',
        icon: newServiceForm.icon || 'Sparkles',
        shortDescription: newServiceForm.shortDescription,
        description: newServiceForm.description || newServiceForm.shortDescription || \`\${newServiceForm.title} by Max Housekeeping Service.\`,
        variantGroupLabel: newServiceForm.variantGroupLabel || 'Apartment / House Size',
        variantGroupKey: newServiceForm.variantGroupKey || 'size',
        variants: newServiceForm.variants || [],
        inclusions: parseList(newServiceForm.inclusions),
        exclusions: parseList(newServiceForm.exclusions)
      };`;

const newCreatePayload = `      const isUnit = newServiceForm.pricingType === 'unit';
      const mbdRate = Number(newServiceForm.unitRateMoradabad) || Number(newServiceForm.price) || 0;
      const otherRate = Number(newServiceForm.unitRateOther) || mbdRate;
      const activeCities = Array.isArray(newServiceForm.cityAvailability) && newServiceForm.cityAvailability.length > 0
        ? newServiceForm.cityAvailability
        : ['moradabad'];

      const payload = {
        title: newServiceForm.title.trim(),
        slug: newServiceForm.slug.trim() || newServiceForm.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        categories: selectedCats,
        pricingType: newServiceForm.pricingType || 'normal',
        pricingUnit: isUnit ? (newServiceForm.pricingUnit || 'sq_ft') : 'fixed',
        unitRateMoradabad: mbdRate,
        unitRateOther: otherRate,
        unitLabel: newServiceForm.unitLabel || 'Sq. Ft.',
        minUnitQuantity: Number(newServiceForm.minUnitQuantity) || 1,
        cityExtraCharge: Number(newServiceForm.cityExtraCharge) || 0,
        moradabadOnly: Boolean(newServiceForm.moradabadOnly || (activeCities.length === 1 && activeCities[0] === 'moradabad')),
        cityAvailability: activeCities,
        videoUrl: newServiceForm.videoUrl || '',
        price: isUnit ? mbdRate : Number(newServiceForm.price),
        mrp: isUnit ? (Number(newServiceForm.mrp) || Math.round(mbdRate * 1.25)) : Number(newServiceForm.mrp),
        duration: newServiceForm.duration || '1.5 hrs',
        icon: newServiceForm.icon || 'Sparkles',
        shortDescription: newServiceForm.shortDescription,
        description: newServiceForm.description || newServiceForm.shortDescription || \`\${newServiceForm.title} by Max Housekeeping Service.\`,
        variantGroupLabel: newServiceForm.variantGroupLabel || 'Apartment / House Size',
        variantGroupKey: newServiceForm.variantGroupKey || 'size',
        variants: isUnit ? [] : (newServiceForm.variants || []),
        inclusions: parseList(newServiceForm.inclusions),
        exclusions: parseList(newServiceForm.exclusions)
      };`;

if (!content.includes(oldCreatePayload)) {
  console.error('Could not find oldCreatePayload block!');
  process.exit(1);
}
content = content.replace(oldCreatePayload, newCreatePayload);

// 7. Add renderServicePricingConfig helper
const helperCode = `  // Dedicated Service Type & City Pricing Configuration (Step 1: Normal vs Per Sq. Ft. / Unit Calculation + City-Wise Rates & Availability)
  const renderServicePricingConfig = (isEdit = false) => {
    const form = isEdit ? serviceForm : newServiceForm;
    const setter = isEdit ? setServiceForm : setNewServiceForm;

    const isUnit = form.pricingType === 'unit';
    const activePricingUnit = form.pricingUnit || (isUnit ? 'sq_ft' : 'fixed');
    const unitLabel = form.unitLabel || (activePricingUnit === 'sq_ft' ? 'Sq. Ft.' : activePricingUnit === 'litre' ? 'Litres' : activePricingUnit === 'seat' ? 'Seats' : activePricingUnit === 'chair' ? 'Chairs' : activePricingUnit === 'fan' ? 'Fans' : 'Units');

    // Available cities list
    const cityList = cities.map(c => {
      if (typeof c === 'string') return { name: c, slug: c.toLowerCase() };
      return { name: c.name || c.slug, slug: (c.slug || c.name || '').toLowerCase() };
    });
    if (!cityList.some(c => c.slug === 'moradabad')) {
      cityList.unshift({ name: 'Moradabad', slug: 'moradabad' });
    }

    const currentCities = Array.isArray(form.cityAvailability) ? form.cityAvailability : ['moradabad'];

    const handleToggleCity = (slug) => {
      const lowerSlug = slug.toLowerCase();
      setter(prev => {
        const curr = Array.isArray(prev.cityAvailability) ? prev.cityAvailability : ['moradabad'];
        let updated;
        if (curr.includes(lowerSlug)) {
          if (curr.length <= 1) {
            toast.error('Service must be available in at least one city.');
            return prev;
          }
          updated = curr.filter(s => s !== lowerSlug);
        } else {
          updated = [...curr, lowerSlug];
        }
        return {
          ...prev,
          cityAvailability: updated,
          moradabadOnly: updated.length === 1 && updated[0] === 'moradabad'
        };
      });
    };

    const handleSelectAllCities = () => {
      const allSlugs = cityList.map(c => c.slug);
      setter(prev => ({
        ...prev,
        cityAvailability: allSlugs,
        moradabadOnly: false
      }));
      toast.success('Service enabled for all cities!');
    };

    const handleMoradabadOnly = () => {
      setter(prev => ({
        ...prev,
        cityAvailability: ['moradabad'],
        moradabadOnly: true
      }));
      toast.info('Service restricted to Moradabad only.');
    };

    return (
      <div className="space-y-4">
        {/* STEP 1: TYPE OF SERVICE (NORMAL VS PER SQ. FT. / UNIT CALC) */}
        <div className="p-4 rounded-2xl bg-[#ECE5D8]/90 border border-[#E2D9C8] space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2D9C8]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#10231D] text-[#E9A23B] flex items-center justify-center shrink-0 shadow-xs">
                <LuCalculator className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-[#10231D] uppercase tracking-wider">
                  Step 1: Type of Service & Calculation Method
                </h4>
                <p className="text-[10px] text-[#6B8077] mt-0.5">
                  Select service model: Normal service (flat/BHK) or dynamic Per Sq. Ft. / Unit calculator
                </p>
              </div>
            </div>
            <span className={\`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase font-mono \${
              isUnit ? 'bg-[#E9A23B] text-[#10231D]' : 'bg-[#10231D] text-[#F4EFE6]'
            }\`}>
              {isUnit ? '📐 Per Sq. Ft. / Unit' : '🏢 Normal Service'}
            </span>
          </div>

          {/* Toggle Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setter(prev => ({ ...prev, pricingType: 'normal', pricingUnit: 'fixed' }))}
              className={\`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer \${
                !isUnit
                  ? 'bg-[#10231D] border-[#10231D] text-[#F4EFE6] shadow-md ring-2 ring-[#E9A23B]'
                  : 'bg-white border-[#E2D9C8] text-[#10231D] hover:bg-[#F4EFE6]'
              }\`}
            >
              <div className={\`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 \${!isUnit ? 'bg-[#E9A23B] text-[#10231D]' : 'bg-[#ECE5D8] text-[#3D524A]'}\`}>
                <LuLayers className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight">Normal Service</p>
                <p className={\`text-[10px] mt-0.5 leading-snug \${!isUnit ? 'text-[#E2D9C8]' : 'text-[#6B8077]'}\`}>
                  Fixed prices, tiered BHK variants (1, 2, 3, 4, 5+ BHK), or fixed package rates. Form remains standard.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setter(prev => ({
                ...prev,
                pricingType: 'unit',
                pricingUnit: prev.pricingUnit === 'fixed' ? 'sq_ft' : prev.pricingUnit,
                unitLabel: prev.unitLabel || 'Sq. Ft.',
                minUnitQuantity: prev.minUnitQuantity || 100,
                unitRateMoradabad: prev.unitRateMoradabad || prev.price || 4,
                unitRateOther: prev.unitRateOther || prev.unitRateMoradabad || prev.price || 5,
                mrp: prev.mrp || Math.round((prev.unitRateMoradabad || prev.price || 4) * 1.3)
              }))}
              className={\`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer \${
                isUnit
                  ? 'bg-[#10231D] border-[#10231D] text-[#F4EFE6] shadow-md ring-2 ring-[#E9A23B]'
                  : 'bg-white border-[#E2D9C8] text-[#10231D] hover:bg-[#F4EFE6]'
              }\`}
            >
              <div className={\`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 \${isUnit ? 'bg-[#E9A23B] text-[#10231D]' : 'bg-[#ECE5D8] text-[#3D524A]'}\`}>
                <LuRuler className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight">Per Sq. Ft. / Unit Calculation</p>
                <p className={\`text-[10px] mt-0.5 leading-snug \${isUnit ? 'text-[#E2D9C8]' : 'text-[#6B8077]'}\`}>
                  Dynamic calculator for customer: carpet area (sq ft), water tank (litres), sofa seats, chairs, fans.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* CONDITIONAL BODY: NORMAL SERVICE FORM */}
        {!isUnit ? (
          <div className="space-y-4">
            {/* Base Prices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Base Shown Price (MRP Crossed Out):
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.mrp}
                  onChange={(e) => setter(prev => ({ ...prev, mrp: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-sm font-bold text-[#10231D] tnum"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Base Offered Price (Payable):
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setter(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-sm font-black text-[#10231D] tnum"
                  required
                />
              </div>
            </div>

            {/* Dynamic Service Variants & Tiered Rates */}
            <div className="pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h4 className="font-display font-bold text-sm text-[#10231D] flex items-center gap-1.5">
                    <LuTicket className="w-4 h-4 text-[#E9A23B]" />
                    <span>Service Variants & Tiered Rates ({form.variants?.length || 0})</span>
                  </h4>
                  <p className="text-[11px] text-[#6B8077]">
                    Add 1, 2, 3, 4, 5+ BHK variants or custom sizes with individual rates & MRPs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newIdx = (form.variants?.length || 0) + 1;
                    setter(prev => {
                      const newVar = {
                        key: \`variant-\${newIdx}\`,
                        label: \`\${newIdx} BHK\`,
                        price: (Number(prev.price) || 2800) + (newIdx * 1000),
                        mrp: (Number(prev.mrp) || 2999) + (newIdx * 1500),
                        duration: \`\${newIdx + 2}-\${newIdx + 3} hrs\`,
                        isDefault: (prev.variants?.length || 0) === 0
                      };
                      return {
                        ...prev,
                        variants: [...(prev.variants || []), newVar]
                      };
                    });
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#10231D] font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto transition-colors shadow-xs"
                >
                  <LuPlus className="w-4 h-4" />
                  <span>Add Variant</span>
                </button>
              </div>

              {/* Variant Group Label */}
              <div className="mb-3">
                <label className="block text-[11px] font-bold text-[#3D524A] mb-1">
                  Variant Group Label (e.g. Apartment / House Size, Sofa Seats, Tank Capacity):
                </label>
                <input
                  type="text"
                  value={form.variantGroupLabel || ''}
                  placeholder="e.g. Apartment / House Size"
                  onChange={(e) => setter(prev => ({ ...prev, variantGroupLabel: e.target.value }))}
                  className="w-full p-2 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-semibold text-[#10231D]"
                />
              </div>

              {/* List of Dynamic Variants */}
              {(!form.variants || form.variants.length === 0) ? (
                <div className="p-4 rounded-xl border-2 border-dashed border-[#E2D9C8] bg-[#ECE5D8]/40 text-center">
                  <p className="text-xs text-[#6B8077]">
                    No variants added. This service currently uses a single flat rate.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setter(prev => ({
                          ...prev,
                          variantGroupLabel: 'Apartment / House Size',
                          variantGroupKey: 'size',
                          price: 4999,
                          mrp: 6999,
                          duration: '4-5 hrs',
                          variants: [
                            { key: '1-bhk', label: '1 BHK', price: 4999, mrp: 6999, duration: '3-4 hrs', isDefault: true },
                            { key: '2-bhk', label: '2 BHK', price: 7500, mrp: 9999, duration: '4-5 hrs', isDefault: false },
                            { key: '3-bhk', label: '3 BHK', price: 9999, mrp: 12999, duration: '5-7 hrs', isDefault: false },
                            { key: '4-bhk', label: '4 BHK', price: 14999, mrp: 18999, duration: '1-2 Days', isDefault: false },
                            { key: '5-bhk', label: '5 BHK', price: 16999, mrp: 21999, duration: '2 Days', isDefault: false }
                          ]
                        }));
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#10231D] bg-[#E9A23B] px-3 py-1.5 rounded-lg hover:bg-[#D48E28] transition-colors"
                    >
                      <LuPlus className="w-3.5 h-3.5" />
                      <span>Load 1 to 5 BHK Apartment Preset</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setter(prev => ({
                          ...prev,
                          variantGroupLabel: 'Seating Configuration',
                          variantGroupKey: 'seats',
                          price: 1500,
                          mrp: 1800,
                          duration: '2-3 hrs',
                          variants: [
                            { key: '3-seater', label: '3 Seater Sofa', price: 900, mrp: 1200, duration: '1.5-2 hrs', isDefault: false },
                            { key: '5-seater', label: '5 Seater Sofa (3+1+1)', price: 1500, mrp: 1800, duration: '2-3 hrs', isDefault: true },
                            { key: '7-seater', label: '7 Seater Sofa', price: 2100, mrp: 2500, duration: '3-4 hrs', isDefault: false }
                          ]
                        }));
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#10231D] bg-[#ECE5D8] border border-[#E2D9C8] px-3 py-1.5 rounded-lg hover:bg-[#E2D9C8] transition-colors"
                    >
                      <LuPlus className="w-3.5 h-3.5" />
                      <span>Load Sofa Seats Preset</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {form.variants.map((v, vIdx) => {
                    const discount = v.mrp > v.price ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0;
                    return (
                      <div key={vIdx} className="p-3 rounded-xl bg-white border border-[#E2D9C8] shadow-2xs space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold text-[#6B8077] uppercase">
                            Variant #{vIdx + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1 text-[11px] font-semibold text-[#10231D] cursor-pointer">
                              <input
                                type="radio"
                                name={isEdit ? "edit-default-variant" : "create-default-variant"}
                                checked={Boolean(v.isDefault)}
                                onChange={() => {
                                  setter(prev => ({
                                    ...prev,
                                    variants: prev.variants.map((item, i) => ({
                                      ...item,
                                      isDefault: i === vIdx
                                    }))
                                  }));
                                }}
                                className="accent-[#E9A23B]"
                              />
                              <span>Default</span>
                            </label>
                            {discount > 0 && (
                              <span className="text-[10px] font-bold text-[#C2512D] bg-[#F9ECE8] px-1.5 py-0.5 rounded">
                                {discount}% OFF
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setter(prev => ({
                                  ...prev,
                                  variants: prev.variants.filter((_, i) => i !== vIdx)
                                }));
                              }}
                              className="p-1 text-[#C2512D] hover:bg-[#F9ECE8] rounded-md transition-colors"
                              title="Delete variant"
                            >
                              <LuTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              placeholder="Variant Label (e.g. 2 BHK)"
                              value={v.label}
                              onChange={(e) => {
                                const val = e.target.value;
                                setter(prev => {
                                  const updated = [...prev.variants];
                                  updated[vIdx] = {
                                    ...updated[vIdx],
                                    label: val,
                                    key: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || updated[vIdx].key
                                  };
                                  return { ...prev, variants: updated };
                                });
                              }}
                              className="w-full p-2 rounded-lg bg-[#F4EFE6] border border-[#E2D9C8] font-bold text-[#10231D]"
                              required
                            />
                          </div>
                          <div>
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-[#6B8077] font-bold text-[11px]">₹</span>
                              <input
                                type="number"
                                placeholder="Payable"
                                title="Payable Price"
                                value={v.price}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setter(prev => {
                                    const updated = [...prev.variants];
                                    updated[vIdx] = { ...updated[vIdx], price: val };
                                    return { ...prev, variants: updated };
                                  });
                                }}
                                className="w-full p-2 pl-6 rounded-lg bg-[#F4EFE6] border border-[#E2D9C8] text-[#10231D] font-black tnum"
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-[#6B8077] font-bold text-[11px]">₹</span>
                              <input
                                type="number"
                                placeholder="MRP"
                                title="Shown Price (MRP Crossed Out)"
                                value={v.mrp}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setter(prev => {
                                    const updated = [...prev.variants];
                                    updated[vIdx] = { ...updated[vIdx], mrp: val };
                                    return { ...prev, variants: updated };
                                  });
                                }}
                                className="w-full p-2 pl-6 rounded-lg bg-[#F4EFE6] border border-[#E2D9C8] text-[#6B8077] font-bold line-through tnum"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-[#6B8077] shrink-0">Duration:</span>
                          <input
                            type="text"
                            placeholder="e.g. 4-5 hrs, 2 Days"
                            value={v.duration || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setter(prev => {
                                const updated = [...prev.variants];
                                updated[vIdx] = { ...updated[vIdx], duration: val };
                                return { ...prev, variants: updated };
                              });
                            }}
                            className="flex-1 p-1.5 rounded-lg bg-[#F4EFE6] border border-[#E2D9C8] text-[#10231D]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* CONDITIONAL BODY: PER SQ. FT. / UNIT CALCULATION FORM */
          <div className="p-4 rounded-2xl bg-white border border-[#E2D9C8] space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2D9C8]">
              <div className="flex items-center gap-2">
                <LuRuler className="w-4 h-4 text-[#E9A23B]" />
                <h4 className="text-xs font-black text-[#10231D] uppercase tracking-wider">
                  Per Sq. Ft. & Unit Configuration
                </h4>
              </div>
              <span className="text-[10px] text-[#6B8077] font-mono">Dynamic Booking Calculator</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Unit Type:
                </label>
                <select
                  value={form.pricingUnit || 'sq_ft'}
                  onChange={(e) => {
                    const u = e.target.value;
                    const labels = {
                      sq_ft: 'Sq. Ft.',
                      litre: 'Litres',
                      seat: 'Seats',
                      chair: 'Chairs',
                      fan: 'Fans',
                      unit: 'Units'
                    };
                    const mins = {
                      sq_ft: 100,
                      litre: 500,
                      seat: 1,
                      chair: 2,
                      fan: 1,
                      unit: 1
                    };
                    setter(prev => ({
                      ...prev,
                      pricingUnit: u,
                      unitLabel: labels[u] || 'Units',
                      minUnitQuantity: mins[u] || 1
                    }));
                  }}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-bold text-[#10231D] focus:ring-1 focus:ring-[#E9A23B]"
                >
                  <option value="sq_ft">Square Feet (Sq. Ft.) - Carpet, Floor, Marble</option>
                  <option value="litre">Water Tank Capacity (Litres)</option>
                  <option value="seat">Sofa / Recliner (Seats)</option>
                  <option value="chair">Dining / Office (Chairs)</option>
                  <option value="fan">Ceiling / Exhaust (Fans)</option>
                  <option value="unit">Custom Count / Items (Units)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Unit Label Display:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sq. Ft. or Litres"
                  value={form.unitLabel || 'Sq. Ft.'}
                  onChange={(e) => setter(prev => ({ ...prev, unitLabel: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-bold text-[#10231D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Min. Order Quantity:
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 100 or 500"
                  value={form.minUnitQuantity || 1}
                  onChange={(e) => setter(prev => ({ ...prev, minUnitQuantity: Math.max(1, Number(e.target.value) || 1) }))}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-bold text-[#10231D] tnum"
                  required
                />
              </div>
            </div>

            {/* City-Wise Unit Rates */}
            <div className="pt-2 border-t border-[#E2D9C8]">
              <label className="block text-xs font-black text-[#10231D] mb-2 uppercase tracking-wide">
                City-Wise Unit Rates (Per {unitLabel}):
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#ECE5D8]/70 border border-[#E2D9C8]">
                  <label className="block text-[11px] font-bold text-[#10231D] mb-1">
                    Rate in Moradabad (₹ / {unitLabel}): <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-[#6B8077] font-bold text-xs">₹</span>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={form.unitRateMoradabad ?? form.price ?? 0}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setter(prev => ({
                          ...prev,
                          unitRateMoradabad: val,
                          price: val,
                          unitRateOther: prev.unitRateOther || val
                        }));
                      }}
                      className="w-full p-2 pl-6 rounded-lg bg-white border border-[#E2D9C8] text-sm font-black text-[#10231D] tnum"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-[#6B8077] mt-1">Payable by Moradabad customers</p>
                </div>

                <div className="p-3 rounded-xl bg-[#ECE5D8]/70 border border-[#E2D9C8]">
                  <label className="block text-[11px] font-bold text-[#10231D] mb-1">
                    Rate in Other Cities (₹ / {unitLabel}): <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-[#6B8077] font-bold text-xs">₹</span>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={form.unitRateOther ?? form.unitRateMoradabad ?? form.price ?? 0}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setter(prev => ({ ...prev, unitRateOther: val }));
                      }}
                      className="w-full p-2 pl-6 rounded-lg bg-white border border-[#E2D9C8] text-sm font-black text-[#10231D] tnum"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-[#6B8077] mt-1">Outstation rate (Rampur, Sambhal, etc.)</p>
                </div>

                <div className="p-3 rounded-xl bg-[#ECE5D8]/70 border border-[#E2D9C8]">
                  <label className="block text-[11px] font-bold text-[#10231D] mb-1">
                    Crossed-out MRP (₹ / {unitLabel}):
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-[#6B8077] font-bold text-xs">₹</span>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={form.mrp ?? 0}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setter(prev => ({ ...prev, mrp: val }));
                      }}
                      className="w-full p-2 pl-6 rounded-lg bg-white border border-[#E2D9C8] text-sm font-bold text-[#6B8077] line-through tnum"
                    />
                  </div>
                  <p className="text-[10px] text-[#6B8077] mt-1">Original before-discount rate</p>
                </div>
              </div>
            </div>

            {/* Live Calculation Formula Preview */}
            <div className="p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-xs">
              <span className="font-bold text-[#10231D] block mb-1">Live Calculation Formula Preview:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-white border border-[#E2D9C8]">
                  <span className="font-bold text-[#3D524A] block">In Moradabad:</span>
                  <span className="font-mono text-[#10231D]">
                    500 {unitLabel} × ₹{form.unitRateMoradabad || form.price || 0} = <strong>₹{Math.round(500 * (Number(form.unitRateMoradabad) || Number(form.price) || 0)).toLocaleString('en-IN')}</strong>
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-[#E2D9C8]">
                  <span className="font-bold text-[#3D524A] block">In Rampur / Other Cities:</span>
                  <span className="font-mono text-[#10231D]">
                    500 {unitLabel} × ₹{form.unitRateOther || form.unitRateMoradabad || 0}
                    {Number(form.cityExtraCharge) > 0 ? \` + ₹\${form.cityExtraCharge} outstation\` : ''} = <strong>₹{(Math.round(500 * (Number(form.unitRateOther) || Number(form.unitRateMoradabad) || 0)) + (Number(form.cityExtraCharge) || 0)).toLocaleString('en-IN')}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CITY-WISE SURCHARGE & DEMO VIDEO */}
        <div className="p-4 rounded-2xl bg-[#ECE5D8]/90 border border-[#E2D9C8] space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2D9C8]">
            <h4 className="text-xs font-black text-[#10231D] uppercase tracking-wider flex items-center gap-1.5">
              <LuDollarSign className="w-4 h-4 text-[#E9A23B]" />
              <span>Outstation Dispatch Surcharge & Demo Link</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#10231D] mb-1">
                Outstation Extra Surcharge (₹ added for cities outside Moradabad):
              </label>
              <input
                type="number"
                min={0}
                placeholder="e.g. 100 or 0"
                value={form.cityExtraCharge || 0}
                onChange={(e) => setter(prev => ({ ...prev, cityExtraCharge: Number(e.target.value) || 0 }))}
                className="w-full p-2.5 rounded-xl bg-white border border-[#E2D9C8] text-xs font-bold text-[#10231D] tnum"
              />
              <p className="text-[10px] text-[#6B8077] mt-1">
                Automatically added on checkout when service is booked outside Moradabad.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#10231D] mb-1">
                YouTube Video Demo URL (optional):
              </label>
              <input
                type="url"
                placeholder="https://youtu.be/yCkBXdzwjic"
                value={form.videoUrl || ''}
                onChange={(e) => setter(prev => ({ ...prev, videoUrl: e.target.value }))}
                className="w-full p-2.5 rounded-xl bg-white border border-[#E2D9C8] text-xs text-[#10231D]"
              />
              <p className="text-[10px] text-[#6B8077] mt-1">
                Demonstration link embedded on the service detail page.
              </p>
            </div>
          </div>
        </div>

        {/* CITY AVAILABILITY MULTI-CHECKBOXES */}
        <div className="p-4 rounded-2xl bg-[#ECE5D8]/90 border border-[#E2D9C8] space-y-3.5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#E2D9C8] gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#10231D] text-[#E9A23B] flex items-center justify-center shrink-0 shadow-xs">
                <LuMapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-[#10231D] uppercase tracking-wider">
                    City Availability Checkboxes
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10231D] text-[#F4EFE6]">
                    {currentCities.length} {currentCities.length === 1 ? 'City' : 'Cities'} Active
                  </span>
                </div>
                <p className="text-[10px] text-[#6B8077] mt-0.5">
                  Check which cities can book this service. Unchecked cities will automatically hide this service.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleSelectAllCities}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#F4EFE6] border border-[#E2D9C8] text-[11px] font-bold text-[#10231D] transition-colors cursor-pointer"
              >
                All Cities
              </button>
              <button
                type="button"
                onClick={handleMoradabadOnly}
                className="px-2.5 py-1 rounded-lg bg-[#10231D] hover:bg-[#3D524A] text-[11px] font-bold text-[#F4EFE6] transition-colors cursor-pointer"
              >
                Moradabad Only
              </button>
            </div>
          </div>

          {/* Grid of City Checkboxes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
            {cityList.map((c) => {
              const isChecked = currentCities.includes(c.slug);
              return (
                <label
                  key={c.slug}
                  className={\`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all select-none \${
                    isChecked
                      ? 'bg-white border-[#10231D] shadow-2xs ring-1 ring-[#10231D]'
                      : 'bg-[#F4EFE6]/70 border-[#E2D9C8] hover:bg-white text-[#6B8077]'
                  }\`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleCity(c.slug)}
                    className="w-4 h-4 rounded text-[#10231D] accent-[#10231D] focus:ring-0 cursor-pointer shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={\`text-xs font-bold truncate \${isChecked ? 'text-[#10231D]' : 'text-[#6B8077]'}\`}>
                      {c.name}
                    </p>
                    {c.slug === 'moradabad' && (
                      <span className="text-[9px] font-black uppercase text-[#E9A23B] bg-[#10231D] px-1.5 py-0.5 rounded-sm inline-block">
                        HQ
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Load All Admin Data`;

content = content.replace('  // Load All Admin Data', helperCode);

// 8. Replace Base Prices & Variants in Edit Service Modal and Create Service Modal
// We'll search for the occurrences of:
// `              {/* Base Prices */}`
// and find the next:
// `              {/* Dynamic Inclusions & Exclusions (Managed from Admin Panel) */}`
const startTag = '              {/* Base Prices */}';
const endTag = '              {/* Dynamic Inclusions & Exclusions (Managed from Admin Panel) */}';

// First occurrence: Edit Modal
const editIdx = content.indexOf(startTag);
const editEndIdx = content.indexOf(endTag, editIdx);
if (editIdx === -1 || editEndIdx === -1) {
  console.error('Could not find Edit Modal price bounds!');
  process.exit(1);
}

const editReplacement = `              {/* Step 1 Service Type, Dynamic Unit Pricing & City Availability */}
              {renderServicePricingConfig(true)}

`;

content = content.slice(0, editIdx) + editReplacement + content.slice(editEndIdx);

// Second occurrence: Create Modal
const createIdx = content.indexOf(startTag, editIdx + editReplacement.length);
const createEndIdx = content.indexOf(endTag, createIdx);
if (createIdx === -1 || createEndIdx === -1) {
  console.error('Could not find Create Modal price bounds!');
  process.exit(1);
}

const createReplacement = `              {/* Step 1 Service Type, Dynamic Unit Pricing & City Availability */}
              {renderServicePricingConfig(false)}

`;

content = content.slice(0, createIdx) + createReplacement + content.slice(createEndIdx);

// 9. Update Users Tab with Search and Filter
const oldUsersTabHeader = `            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
              <div>
                <h3 className="font-display font-bold text-xl text-[#10231D] flex items-center gap-2">
                  <span>Users & Customer Database</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#10231D] text-[#F4EFE6]">
                    {users.length} Accounts
                  </span>
                </h3>
                <p className="text-xs text-[#6B8077] mt-0.5">
                  Registered customer profiles and role-based administration.
                </p>
              </div>
            </div>`;

const newUsersTabHeader = `            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
              <div>
                <h3 className="font-display font-bold text-xl text-[#10231D] flex items-center gap-2">
                  <span>Users & Customer Database</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#10231D] text-[#F4EFE6]">
                    {users.length} Accounts
                  </span>
                </h3>
                <p className="text-xs text-[#6B8077] mt-0.5">
                  Registered customer profiles and role-based administration.
                </p>
              </div>

              {/* Search & Role Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <div className="relative min-w-[240px]">
                  <LuSearch className="w-4 h-4 text-[#6B8077] absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search users by name, phone, email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-[#E2D9C8] text-xs font-semibold text-[#10231D] focus:ring-1 focus:ring-[#E9A23B] focus:outline-none"
                  />
                  {userSearch && (
                    <button
                      type="button"
                      onClick={() => setUserSearch('')}
                      className="absolute right-2.5 top-2.5 text-[#6B8077] hover:text-[#10231D] cursor-pointer"
                      title="Clear search"
                    >
                      <LuX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="min-w-[130px]">
                  <CustomSelect
                    size="sm"
                    value={userRoleFilter}
                    onChange={(val) => setUserRoleFilter(val)}
                    options={[
                      { value: 'all', label: 'All Roles' },
                      { value: 'customer', label: 'Customers' },
                      { value: 'cleaner', label: 'Staff' },
                      { value: 'admin', label: 'Admins' }
                    ]}
                    placeholder="Filter Role..."
                  />
                </div>
              </div>
            </div>`;

if (!content.includes(oldUsersTabHeader)) {
  console.error('Could not find oldUsersTabHeader!');
  process.exit(1);
}
content = content.replace(oldUsersTabHeader, newUsersTabHeader);

// Replace user mapping in Users tab
const oldUserMapStart = `            {users.length === 0 ? (`;
const oldUserMapEnd = `                  <tbody className="divide-y divide-[#E2D9C8]/60">
                    {users.map((u) => (`;

const newUserMapFragment = `            {(() => {
              const q = userSearch.toLowerCase().trim();
              const filteredUsers = users.filter((u) => {
                const matchesSearch = !q || (
                  (u.name && u.name.toLowerCase().includes(q)) ||
                  (u.email && u.email.toLowerCase().includes(q)) ||
                  (u.phone && u.phone.toLowerCase().includes(q)) ||
                  (u.role && u.role.toLowerCase().includes(q))
                );
                const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
                return matchesSearch && matchesRole;
              });

              if (users.length === 0) {
                return (
                  <div className="py-12 text-center text-[#6B8077]">
                    <LuUsers className="w-10 h-10 mx-auto mb-2 opacity-50 text-[#10231D]" />
                    <p className="text-sm font-bold text-[#10231D]">No registered users loaded</p>
                    <p className="text-xs text-[#6B8077] mt-1">Users will appear here as soon as they create an account via the Sign Up form.</p>
                  </div>
                );
              }

              if (filteredUsers.length === 0) {
                return (
                  <div className="py-12 text-center text-[#6B8077] bg-white/60 rounded-2xl border border-dashed border-[#E2D9C8]">
                    <LuSearch className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#10231D]" />
                    <p className="text-sm font-bold text-[#10231D]">No users found matching "{userSearch}"</p>
                    <p className="text-xs text-[#6B8077] mt-1">Try adjusting your search terms or clearing the role filter.</p>
                    <button
                      type="button"
                      onClick={() => { setUserSearch(''); setUserRoleFilter('all'); }}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-[#10231D] text-[#F4EFE6] text-xs font-bold hover:bg-[#3D524A] transition-colors cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                );
              }

              return (
                <div>
                  <div className="flex items-center justify-between mb-3 text-[11px] text-[#6B8077]">
                    <span>Showing <strong>{filteredUsers.length}</strong> of {users.length} accounts</span>
                    {(userSearch || userRoleFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => { setUserSearch(''); setUserRoleFilter('all'); }}
                        className="text-[#C2512D] font-bold hover:underline cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#E2D9C8] text-[#6B8077] font-mono uppercase">
                          <th className="py-3 px-3">User Profile</th>
                          <th className="py-3 px-3">Contact Details</th>
                          <th className="py-3 px-3">Role</th>
                          <th className="py-3 px-3">Saved Addresses</th>
                          <th className="py-3 px-3">Registered Date</th>
                          <th className="py-3 px-3 text-right">Account Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2D9C8]/60">
                        {filteredUsers.map((u) => (`;

const userMapTarget = `            {users.length === 0 ? (
              <div className="py-12 text-center text-[#6B8077]">
                <LuUsers className="w-10 h-10 mx-auto mb-2 opacity-50 text-[#10231D]" />
                <p className="text-sm font-bold text-[#10231D]">No registered users loaded</p>
                <p className="text-xs text-[#6B8077] mt-1">Users will appear here as soon as they create an account via the Sign Up form.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E2D9C8] text-[#6B8077] font-mono uppercase">
                      <th className="py-3 px-3">User Profile</th>
                      <th className="py-3 px-3">Contact Details</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Saved Addresses</th>
                      <th className="py-3 px-3">Registered Date</th>
                      <th className="py-3 px-3 text-right">Account Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2D9C8]/60">
                    {users.map((u) => (`;

if (!content.includes(userMapTarget)) {
  console.error('Could not find userMapTarget!');
  process.exit(1);
}
content = content.replace(userMapTarget, newUserMapFragment);

// And close the IIFE for users table
const oldUsersEnd = `                    ))}
                  </tbody>
                </table>
              </div>
            )}`;

const newUsersEnd = `                    ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}`;

if (!content.includes(oldUsersEnd)) {
  console.error('Could not find oldUsersEnd!');
  process.exit(1);
}
content = content.replace(oldUsersEnd, newUsersEnd);

// 10. Update Service Cards in Services Tab with Unit and City badges
const oldPricingCardBox = `                      {/* Pricing Comparison */}
                      <div className="p-3 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] space-y-1 mb-4 text-xs">`;

const newPricingCardBox = `                      {/* Unit Pricing / City Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {svc.pricingType === 'unit' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#10231D] text-[#E9A23B] flex items-center gap-1 font-mono">
                            <LuRuler className="w-3 h-3" />
                            <span>Per {svc.unitLabel || 'Sq. Ft.'} Calc</span>
                          </span>
                        )}
                        {svc.cityAvailability && svc.cityAvailability.length > 0 && (
                          <span className={\`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 \${
                            svc.cityAvailability.length === 1 && svc.cityAvailability[0] === 'moradabad'
                              ? 'bg-amber-500/15 text-amber-900 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-900 border border-emerald-500/30'
                          }\`}>
                            <LuMapPin className="w-3 h-3" />
                            <span>{svc.cityAvailability.length === 1 && svc.cityAvailability[0] === 'moradabad' ? 'Moradabad Only' : \`\${svc.cityAvailability.length} Cities Active\`}</span>
                          </span>
                        )}
                        {svc.cityExtraCharge > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#ECE5D8] text-[#3D524A] border border-[#E2D9C8]">
                            +₹{svc.cityExtraCharge} Outstation
                          </span>
                        )}
                      </div>

                      {/* Pricing Comparison */}
                      <div className="p-3 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] space-y-1 mb-4 text-xs">`;

if (content.includes(oldPricingCardBox)) {
  content = content.replace(oldPricingCardBox, newPricingCardBox);
  console.log('Service cards updated with badges');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('AdminDashboard.jsx updated completely and accurately!');
