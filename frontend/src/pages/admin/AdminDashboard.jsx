import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuLayoutDashboard,
  LuCalendar,
  LuSparkles,
  LuDollarSign,
  LuUsers,
  LuSquarePen,
  LuCheck,
  LuTrash2,
  LuPlus,
  LuStar,
  LuMessageSquare,
  LuUpload,
  LuEye,
  LuEyeOff,
  LuShieldCheck,
  LuImage,
  LuX,
  LuInbox,
  LuPhone,
  LuMail,
  LuMapPin,
  LuTicket,
  LuSettings,
  LuMenu,
  LuSearch,
  LuRotateCcw,
  LuClock,
  LuCreditCard,
  LuLayers,
  LuChevronDown,
  LuRuler,
  LuCalculator,
  LuVideo,
  LuTag,
  LuCamera,
  LuKey,
  LuUserCheck,
  LuCopy,
  LuTriangleAlert,
  LuGift,
  LuPercent,
  LuCompass,
  LuNavigation,
  LuExternalLink
} from 'react-icons/lu';
import { formatDateDMY } from '../../utils/date';
import {
  apiRequest,
  adminAPI
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useBooking } from '../../context/BookingContext';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import CustomSelect from '../../components/common/CustomSelect';
import { getServiceIcon, AVAILABLE_ICONS } from '../../utils/iconHelper';
import ServiceCarousel from '../../components/common/ServiceCarousel';
import LiveTrackingRadar from '../../components/common/LiveTrackingRadar';
import SEO from '../../components/common/SEO';

const ICON_SELECT_OPTIONS = AVAILABLE_ICONS.map((ic) => ({
  value: ic.key,
  label: `${ic.key} (${ic.label})`,
  icon: getServiceIcon(ic.key, 'w-4 h-4 text-[#E9A23B]')
}));

export default function AdminDashboard() {
  const { refreshSettings } = useBooking();
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'services' | 'categories' | 'cities' | ...
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);
  const [stats, setStats] = useState({ totalBookings: 0, pendingBookings: 0, totalRevenue: 0, totalCustomerSavings: 0 });
  const [bookings, setBookings] = useState([]);
  // Supervisors State (Urban Company / Pronto supervisor management)
  const [supervisors, setSupervisors] = useState([]);
  const [supervisorModalOpen, setSupervisorModalOpen] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState(null);
  const [supervisorSearch, setSupervisorSearch] = useState('');
  const [supervisorStatusFilter, setSupervisorStatusFilter] = useState('all');
  const [supervisorForm, setSupervisorForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: 'moradabad',
    status: 'active'
  });
  const [savingSupervisor, setSavingSupervisor] = useState(false);

  // Supervisor Booking Assignment Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignBooking, setAssignBooking] = useState(null);
  const [assignSupervisorId, setAssignSupervisorId] = useState('');
  const [assignDate, setAssignDate] = useState('');
  const [assignTimeWindow, setAssignTimeWindow] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [assignAllowConflict, setAssignAllowConflict] = useState(false);
  const [slotAvailability, setSlotAvailability] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [slotConflictWarning, setSlotConflictWarning] = useState(null);
  const [assigningSupervisor, setAssigningSupervisor] = useState(false);

  // Service Video Upload State (<50MB Cloudinary video)
  const [uploadingServiceVideo, setUploadingServiceVideo] = useState(false);

  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    tagline: '',
    iconKey: 'PiHouseLine',
    imageUrl: '',
    sortOrder: 0,
    isActive: true
  });
  const [savingCategory, setSavingCategory] = useState(false);
  const [uploadingCategoryImg, setUploadingCategoryImg] = useState(false);
  const [cities, setCities] = useState([]);
  const [users, setUsers] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'flat',
    discountValue: 100,
    minOrderValue: 499,
    maxDiscount: 500,
    expiryDate: '',
    usageLimit: 1000,
    firstBookingOnly: false,
    oncePerUser: true,
    showInOffers: true,
    applicableServices: []
  });
  const [savingCoupon, setSavingCoupon] = useState(false);

  const [settingsForm, setSettingsForm] = useState({
    brandName: 'Max Housekeeping Service',
    tagline: 'A spotless home, without lifting a finger.',
    phone: '+91 98977 66002',
    alternatePhone: '',
    whatsappNumber: '+91 98977 66002',
    email: 'contactmaxhousekeepingservice@gmail.com',
    address: 'Kanth road Behind, Asian Vivekanand Hospital, Moradabad, Uttar Pradesh 244001',
    workingHours: '8:00 AM – 8:00 PM (Monday – Sunday)',
    ratingClaim: 'Rated 4.9/5 by 10,000+ happy homes',
    acceptOnlinePayments: false,
    paymentGatewayProvider: 'razorpay',
    razorpayKeyId: '',
    razorpayKeySecret: '',
    gstEnabled: false,
    gstPercentage: 18,
    platformChargeEnabled: false,
    platformChargeType: 'flat',
    platformChargeAmount: 49,
    platformChargeLabel: 'Platform Charges'
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const [createServiceModalOpen, setCreateServiceModalOpen] = useState(false);
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
    hasCitySpecificRates: false,
    cityRates: [],
    cityExtraCharge: 100,
    moradabadOnly: false,
    cityAvailability: ['moradabad'],
    videoUrl: '',
    youtubeUrl: '',
    uploadedVideoUrl: '',
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
    exclusions: '',
    tags: 'deep-cleaning, housekeeping, professional-cleaning',
    rankingScore: 100,
    rankingTier: 'standard'
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
    hasCitySpecificRates: false,
    cityRates: [],
    cityExtraCharge: 100,
    moradabadOnly: false,
    cityAvailability: ['moradabad'],
    videoUrl: '',
    youtubeUrl: '',
    uploadedVideoUrl: '',
    categories: [],
    icon: 'Sparkles',
    duration: '',
    matrix: [],
    imageUrl: '',
    images: [],
    inclusions: '',
    exclusions: '',
    tags: '',
    rankingScore: 100,
    rankingTier: 'standard'
  });

  // Booking Details Modal State
  const [viewBookingDetails, setViewBookingDetails] = useState(null);
  const [showAdminRadar, setShowAdminRadar] = useState(false);

  // Inquiry / Contact Message Details Modal State
  const [viewInquiryDetails, setViewInquiryDetails] = useState(null);

  // Extra Filter States for Admin Sections
  const [bookingCityFilter, setBookingCityFilter] = useState('all');
  const [bookingPaymentFilter, setBookingPaymentFilter] = useState('all');

  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState('all');
  const [servicePricingTypeFilter, setServicePricingTypeFilter] = useState('all');
  const [serviceCityFilter, setServiceCityFilter] = useState('all');

  const [categoryStatusFilter, setCategoryStatusFilter] = useState('all');

  const [citySearch, setCitySearch] = useState('');
  const [cityStatusFilter, setCityStatusFilter] = useState('all');

  const [testimonialSearch, setTestimonialSearch] = useState('');
  const [testimonialStatusFilter, setTestimonialStatusFilter] = useState('all');

  const [messageSearch, setMessageSearch] = useState('');
  const [messageStatusFilter, setMessageStatusFilter] = useState('all');

  const [couponSearch, setCouponSearch] = useState('');
  const [couponStatusFilter, setCouponStatusFilter] = useState('all');

  // Automatic Tag & SEO Generation (No manual admin entry needed)
  const generateAutoServiceTags = (title, catIds, isMoradabadOnly, pricingType) => {
    const tagSet = new Set();
    if (title) {
      title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2).forEach(w => tagSet.add(w));
      tagSet.add(title.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    }
    if (Array.isArray(catIds)) {
      catIds.forEach(id => {
        const cat = categories.find(c => String(c._id) === String(id));
        if (cat?.slug) tagSet.add(cat.slug);
        if (cat?.name) tagSet.add(cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      });
    }
    if (isMoradabadOnly) {
      tagSet.add('moradabad');
      tagSet.add('moradabad-exclusive');
    } else {
      tagSet.add('moradabad');
      tagSet.add('all-cities-available');
      tagSet.add('rampur');
      tagSet.add('sambhal');
      tagSet.add('amroha');
      tagSet.add('bijnor');
    }
    if (pricingType === 'unit') {
      tagSet.add('per-sqft');
      tagSet.add('custom-area');
    }
    tagSet.add('deep-cleaning');
    tagSet.add('professional-cleaning');
    tagSet.add('top-rated');
    return Array.from(tagSet);
  };

  // User Search & Role Filter State
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [uploadingServiceImage, setUploadingServiceImage] = useState(false);

  // City Modal & Form State
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [isAutoDetectingCityGeo, setIsAutoDetectingCityGeo] = useState(false);
  const [cityForm, setCityForm] = useState({
    name: '',
    slug: '',
    state: '',
    latitude: '',
    longitude: '',
    serviceRadiusKm: 25,
    pincodes: '',
    status: 'active',
    sortOrder: 0,
    tags: '',
    rankingScore: 100,
    rankingTier: 'primary'
  });

  // Testimonial Modal & Form State
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [testimonialForm, setTestimonialForm] = useState({
    name: '',
    role: 'Homeowner',
    city: 'Moradabad',
    serviceTitle: '',
    quote: '',
    rating: 5,
    avatar: '',
    avatarPublicId: '',
    videoUrl: '',
    videoPublicId: '',
    isFeatured: false,
    isActive: true
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingTestimonialVideo, setUploadingTestimonialVideo] = useState(false);

  // Chat Communication Thread State
  const [chatBooking, setChatBooking] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [trackingBookingAdmin, setTrackingBookingAdmin] = useState(null);

  const { user, isAdmin, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Guard: if not admin, redirect only after authentication check finishes
  useEffect(() => {
    if (!isAuthLoading && !isAdmin) {
      toast.error('Admin authentication required.');
      navigate('/login');
    }
  }, [isAdmin, isAuthLoading]);

  // Open Create Service Modal with First Category Pre-selected
  const openCreateServiceModal = () => {
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
      hasCitySpecificRates: false,
      cityRates: [],
      cityExtraCharge: 100,
      moradabadOnly: false,
      cityAvailability: ['moradabad'],
      videoUrl: '',
      youtubeUrl: '',
      uploadedVideoUrl: '',
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
  };

  // Dedicated Category & Classification Section (Dropdown + Multi-Select Cards)
  const renderCategorySelectionSection = (isEdit = false) => {
    const form = isEdit ? serviceForm : newServiceForm;
    const currentCats = (form.categories || []).map(c => c && c._id ? String(c._id) : String(c)).filter(Boolean);
    const primaryId = currentCats[0] || (categories[0] ? String(categories[0]._id) : '');

    const handleSelectPrimary = (catId) => {
      const targetId = String(catId);
      if (!targetId) return;
      const updateFn = isEdit ? setServiceForm : setNewServiceForm;
      updateFn(prev => {
        const curr = (prev.categories || []).map(c => c && c._id ? String(c._id) : String(c)).filter(Boolean);
        const rest = curr.filter(id => id !== targetId);
        return { ...prev, categories: [targetId, ...rest] };
      });
    };

    const handleToggleSecondary = (catId) => {
      const targetId = String(catId);
      const updateFn = isEdit ? setServiceForm : setNewServiceForm;
      updateFn(prev => {
        const curr = (prev.categories || []).map(c => c && c._id ? String(c._id) : String(c)).filter(Boolean);
        if (curr.includes(targetId)) {
          if (curr.length <= 1) {
            toast.error('Service must belong to at least one category.');
            return prev;
          }
          return { ...prev, categories: curr.filter(id => id !== targetId) };
        } else {
          return { ...prev, categories: [...curr, targetId] };
        }
      });
    };

    return (
      <div className="p-4 rounded-2xl bg-[#ECE5D8]/90 border border-[#E2D9C8] space-y-3.5 shadow-2xs">
        {/* Section Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#E2D9C8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#10231D] text-[#E9A23B] flex items-center justify-center shrink-0 shadow-xs">
              <LuLayers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-[#10231D] uppercase tracking-wider">
                  Category & Service Classification
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10231D]/10 text-[#10231D]">
                  {currentCats.length} {currentCats.length === 1 ? 'Category' : 'Categories'} Selected
                </span>
              </div>
              <p className="text-[10px] text-[#6B8077] mt-0.5">
                Assign primary category for catalog routing & optional secondary categories
              </p>
            </div>
          </div>
        </div>

        {/* 1. Primary Category Select Dropdown */}
        <div>
          <label className="block text-xs font-bold text-[#10231D] mb-1.5">
            Primary Category <span className="text-red-500">*</span> (Main Section in Navigation & Bookings):
          </label>
          <div className="relative">
            <select
              value={primaryId}
              onChange={(e) => handleSelectPrimary(e.target.value)}
              className="w-full p-2.5 pr-9 rounded-xl bg-white border border-[#E2D9C8] text-xs sm:text-sm font-bold text-[#10231D] focus:ring-2 focus:ring-[#E9A23B] focus:outline-none appearance-none cursor-pointer shadow-2xs"
              required
            >
              <option value="">-- Choose Primary Category (Required) --</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name} {cat.slug ? `(/${cat.slug})` : ''}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#10231D]">
              <LuChevronDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-[#6B8077] mt-1">
            This category is used as the service's primary URL and main listing tag.
          </p>
        </div>

        {/* 2. Multi-Category Checkbox Grid */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-[#10231D]">
              Assign Additional Categories (Multi-Category Display):
            </label>
            <span className="text-[10px] text-[#6B8077]">
              Check all categories where this service should appear
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categories.map((cat) => {
              const catIdStr = String(cat._id);
              const isSelected = currentCats.includes(catIdStr);
              const isPrimary = primaryId === catIdStr;

              return (
                <div
                  key={cat._id}
                  onClick={() => {
                    if (isPrimary) return;
                    handleToggleSecondary(cat._id);
                  }}
                  className={`p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer select-none ${
                    isPrimary
                      ? 'bg-[#10231D] text-[#E9A23B] border-[#10231D] shadow-xs'
                      : isSelected
                      ? 'bg-white text-[#10231D] border-[#E9A23B] ring-1 ring-[#E9A23B]/30'
                      : 'bg-[#F4EFE6]/80 text-[#3D524A] hover:bg-white border-[#E2D9C8]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                        isSelected
                          ? isPrimary
                            ? 'bg-[#E9A23B] border-[#E9A23B] text-[#10231D]'
                            : 'bg-[#10231D] border-[#10231D] text-white'
                          : 'border-[#6B8077]/40 bg-white'
                      }`}
                    >
                      {isSelected && <LuCheck className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className={`font-bold ${isPrimary ? 'text-[#E9A23B]' : isSelected ? 'text-[#10231D]' : 'text-[#3D524A]'}`}>
                      {cat.name}
                    </span>
                  </div>

                  {isPrimary ? (
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E9A23B] text-[#10231D] flex items-center gap-1">
                      <LuStar className="w-2.5 h-2.5 fill-current" /> Primary
                    </span>
                  ) : isSelected ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPrimary(cat._id);
                      }}
                      className="text-[9px] font-bold text-[#6B8077] hover:text-[#10231D] hover:underline px-2 py-0.5 rounded bg-[#ECE5D8]"
                      title="Set as Primary Category"
                    >
                      Make Primary
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Multi-Image Upload & Gallery Management
  const handleMultipleImagesUpload = async (e, isEdit = false) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingMultiple(true);
    try {
      const res = await adminAPI.uploadMultipleImages(files, 'max-housekeeping/services');
      if (res && res.images && res.images.length > 0) {
        const updateFn = isEdit ? setServiceForm : setNewServiceForm;
        updateFn(prev => {
          const existing = prev.images && prev.images.length > 0 
            ? prev.images 
            : (prev.imageUrl ? [{ url: prev.imageUrl, alt: prev.title || 'Service Photo' }] : []);
          const combined = [...existing, ...res.images];
          return {
            ...prev,
            images: combined,
            imageUrl: combined[0]?.url || prev.imageUrl
          };
        });
        toast.success(`Successfully uploaded ${res.images.length} photos to Cloudinary!`);
      } else {
        toast.error('Upload completed, but no image data was returned.');
      }
    } catch (err) {
      console.error('[Multi-Image Upload Error]', err);
      toast.error(err.message || 'Failed to upload multiple images.');
    } finally {
      setUploadingMultiple(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index, isEdit = false) => {
    const updateFn = isEdit ? setServiceForm : setNewServiceForm;
    updateFn(prev => {
      const existing = prev.images && prev.images.length > 0
        ? [...prev.images]
        : (prev.imageUrl ? [{ url: prev.imageUrl }] : []);
      existing.splice(index, 1);
      return {
        ...prev,
        images: existing,
        imageUrl: existing[0]?.url || ''
      };
    });
  };

  const handleSetCoverImage = (index, isEdit = false) => {
    if (index === 0) return;
    const updateFn = isEdit ? setServiceForm : setNewServiceForm;
    updateFn(prev => {
      const existing = prev.images && prev.images.length > 0
        ? [...prev.images]
        : (prev.imageUrl ? [{ url: prev.imageUrl }] : []);
      const [target] = existing.splice(index, 1);
      existing.unshift(target);
      return {
        ...prev,
        images: existing,
        imageUrl: existing[0]?.url || ''
      };
    });
    toast.success('Selected image set as primary cover photo.');
  };

  const renderImageUploadSection = (isEdit = false) => {
    const form = isEdit ? serviceForm : newServiceForm;
    const images = form.images && form.images.length > 0
      ? form.images
      : (form.imageUrl ? [{ url: form.imageUrl, alt: `${form.title || 'Service'} Photo` }] : []);

    return (
      <div className="p-4 rounded-2xl bg-[#ECE5D8]/90 border border-[#E2D9C8] space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E2D9C8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#10231D] text-[#E9A23B] flex items-center justify-center shrink-0 shadow-xs">
              <LuImage className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-[#10231D] uppercase tracking-wider">
                  Service Photos & Gallery ({images.length})
                </h4>
                {images.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E9A23B]/20 border border-[#E9A23B]/40 text-[#10231D]">
                    Multi-Image Carousel Active
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#6B8077] mt-0.5">
                Upload multiple high-resolution photos. The first image serves as the main cover photo.
              </p>
            </div>
          </div>
          <div>
            <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#10231D] text-[#F4EFE6] text-xs font-bold cursor-pointer hover:bg-[#3D524A] transition-colors shrink-0 shadow-xs">
              <LuUpload className="w-3.5 h-3.5 text-[#E9A23B]" />
              <span>{uploadingMultiple ? 'Uploading Photos...' : 'Upload Photos (Cloudinary)'}</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleMultipleImagesUpload(e, isEdit)}
                className="hidden"
                disabled={uploadingMultiple}
              />
            </label>
          </div>
        </div>

        {/* Thumbnail Preview Grid */}
        {images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`relative rounded-xl overflow-hidden border-2 group bg-white shadow-xs transition-all ${
                  idx === 0
                    ? 'border-[#E9A23B] ring-2 ring-[#E9A23B]/30'
                    : 'border-[#E2D9C8] hover:border-[#10231D]'
                }`}
              >
                <div className="aspect-4/3 w-full bg-[#ECE5D8] overflow-hidden">
                  <img
                    src={img.url}
                    alt={img.alt || `Photo ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Cover badge / Set as cover button */}
                {idx === 0 ? (
                  <div className="absolute top-1.5 left-1.5 bg-[#E9A23B] text-[#10231D] text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                    <LuStar className="w-3 h-3 fill-current" />
                    <span>COVER</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetCoverImage(idx, isEdit)}
                    className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-[#10231D]/90 hover:bg-[#10231D] text-[#F4EFE6] text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs"
                    title="Set this photo as main cover"
                  >
                    Set as Cover
                  </button>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx, isEdit)}
                  className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-xs transition-colors"
                  title="Remove photo"
                >
                  <LuX className="w-3 h-3 stroke-[2.5]" />
                </button>

                <div className="p-1.5 bg-white text-[10px] font-bold text-[#6B8077] truncate text-center border-t border-[#ECE5D8] flex items-center justify-center gap-1">
                  {idx === 0 ? (
                    <>
                      <LuStar className="w-2.5 h-2.5 fill-[#E9A23B] text-[#E9A23B]" />
                      <span>Primary Cover</span>
                    </>
                  ) : (
                    `Gallery Photo #${idx + 1}`
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-7 border-2 border-dashed border-[#E2D9C8] rounded-xl flex flex-col items-center justify-center text-center p-4">
            <div className="w-10 h-10 rounded-full bg-white border border-[#E2D9C8] flex items-center justify-center text-[#6B8077] mb-2 shadow-2xs">
              <LuImage className="w-5 h-5 text-[#93A59E]" />
            </div>
            <p className="text-xs font-bold text-[#10231D]">No photos uploaded yet</p>
            <p className="text-[11px] text-[#6B8077] max-w-xs mt-0.5">
              Click the button above to upload multiple photos. Images will show in a carousel on cards and service details.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Dedicated Service Type & City Pricing Configuration (Step 1: Normal vs Per Sq. Ft. / Unit Calculation + City-Wise Rates & Availability)
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
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase font-mono flex items-center gap-1.5 ${
              isUnit ? 'bg-[#E9A23B] text-[#10231D]' : 'bg-[#10231D] text-[#F4EFE6]'
            }`}>
              {isUnit ? (
                <>
                  <LuRuler className="w-3 h-3" />
                  <span>Per Sq. Ft. / Unit</span>
                </>
              ) : (
                <span>Normal Service</span>
              )}
            </span>
          </div>

          {/* Toggle Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setter(prev => ({ ...prev, pricingType: 'normal', pricingUnit: 'fixed' }))}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                !isUnit
                  ? 'bg-[#10231D] border-[#10231D] text-[#F4EFE6] shadow-md ring-2 ring-[#E9A23B]'
                  : 'bg-white border-[#E2D9C8] text-[#10231D] hover:bg-[#F4EFE6]'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${!isUnit ? 'bg-[#E9A23B] text-[#10231D]' : 'bg-[#ECE5D8] text-[#3D524A]'}`}>
                <LuLayers className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight">Normal Service</p>
                <p className={`text-[10px] mt-0.5 leading-snug ${!isUnit ? 'text-[#E2D9C8]' : 'text-[#6B8077]'}`}>
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
              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                isUnit
                  ? 'bg-[#10231D] border-[#10231D] text-[#F4EFE6] shadow-md ring-2 ring-[#E9A23B]'
                  : 'bg-white border-[#E2D9C8] text-[#10231D] hover:bg-[#F4EFE6]'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isUnit ? 'bg-[#E9A23B] text-[#10231D]' : 'bg-[#ECE5D8] text-[#3D524A]'}`}>
                <LuRuler className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight">Per Sq. Ft. / Unit Calculation</p>
                <p className={`text-[10px] mt-0.5 leading-snug ${isUnit ? 'text-[#E2D9C8]' : 'text-[#6B8077]'}`}>
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

            {/* City-Wise Pricing Configuration for Normal Service */}
            <div className="pt-2 border-t border-[#E2D9C8] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-black text-[#10231D] uppercase tracking-wide">
                  Pricing & Rates Overrides:
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-[#ECE5D8] px-3 py-1.5 rounded-xl border border-[#E2D9C8]">
                  <input
                    type="checkbox"
                    checked={Boolean(form.hasCitySpecificRates)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setter(prev => ({
                        ...prev,
                        hasCitySpecificRates: checked
                      }));
                    }}
                    className="rounded text-[#E9A23B] focus:ring-[#E9A23B] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#10231D]">
                    Different rates for different cities?
                  </span>
                </label>
              </div>

              {/* City-by-City Rates Grid when hasCitySpecificRates is enabled */}
              {form.hasCitySpecificRates ? (
                <div className="p-3.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#10231D] block">
                        City-Wise Custom Rates & Pricing
                      </span>
                      <span className="text-[10px] text-[#6B8077]">
                        Enter specific rate and MRP for each city. Unset cities use the base price (₹{form.price || 0}). For variant services, variant prices automatically scale relative to this city's base rate.
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {cities.filter(c => c.status === 'active' || !c.status).map(city => {
                      const citySlug = (city.slug || city.name.toLowerCase()).trim();
                      const currentCityRate = Array.isArray(form.cityRates)
                        ? form.cityRates.find(cr => (cr.citySlug || '').toLowerCase() === citySlug)
                        : undefined;
                      const displayPrice = currentCityRate?.rate !== undefined
                        ? currentCityRate.rate
                        : (citySlug === 'moradabad' ? (form.price || 0) : (form.price || 0));
                      const displayMrp = currentCityRate?.mrp !== undefined
                        ? currentCityRate.mrp
                        : (citySlug === 'moradabad' ? (form.mrp || 0) : (form.mrp || 0));

                      return (
                        <div key={city._id || citySlug} className="p-2.5 rounded-lg bg-white border border-[#E2D9C8] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#10231D]">{city.name}</span>
                            <span className="text-[10px] font-mono text-[#6B8077] uppercase">{city.state || 'UP'}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className="block text-[9px] font-bold text-[#10231D]">Price (₹)</label>
                              <div className="relative">
                                <span className="absolute left-2 top-1.5 text-[#6B8077] font-bold text-[11px]">₹</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={displayPrice}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    setter(prev => {
                                      const existingRates = Array.isArray(prev.cityRates) ? [...prev.cityRates] : [];
                                      const idx = existingRates.findIndex(cr => (cr.citySlug || '').toLowerCase() === citySlug);
                                      const prevMrp = existingRates[idx]?.mrp || displayMrp;
                                      const entry = {
                                        cityId: city._id,
                                        cityName: city.name,
                                        citySlug: citySlug,
                                        rate: val,
                                        mrp: prevMrp
                                      };
                                      if (idx >= 0) {
                                        existingRates[idx] = entry;
                                      } else {
                                        existingRates.push(entry);
                                      }
                                      const updates = { ...prev, cityRates: existingRates };
                                      if (citySlug === 'moradabad') {
                                        updates.price = val;
                                      }
                                      return updates;
                                    });
                                  }}
                                  className="w-full pl-5 pr-1.5 py-1 rounded bg-[#F4EFE6] border border-[#E2D9C8] text-xs font-black text-[#10231D] tnum"
                                  placeholder="Rate"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-[#6B8077]">MRP (₹)</label>
                              <div className="relative">
                                <span className="absolute left-2 top-1.5 text-[#6B8077] font-bold text-[11px]">₹</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={displayMrp}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    setter(prev => {
                                      const existingRates = Array.isArray(prev.cityRates) ? [...prev.cityRates] : [];
                                      const idx = existingRates.findIndex(cr => (cr.citySlug || '').toLowerCase() === citySlug);
                                      const prevRate = existingRates[idx]?.rate || displayPrice;
                                      const entry = {
                                        cityId: city._id,
                                        cityName: city.name,
                                        citySlug: citySlug,
                                        rate: prevRate,
                                        mrp: val
                                      };
                                      if (idx >= 0) {
                                        existingRates[idx] = entry;
                                      } else {
                                        existingRates.push(entry);
                                      }
                                      const updates = { ...prev, cityRates: existingRates };
                                      if (citySlug === 'moradabad') {
                                        updates.mrp = val;
                                      }
                                      return updates;
                                    });
                                  }}
                                  className="w-full pl-5 pr-1.5 py-1 rounded bg-[#F4EFE6] border border-[#E2D9C8] text-xs font-bold text-[#6B8077] line-through tnum"
                                  placeholder="MRP"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#ECE5D8]/50 border border-[#E2D9C8] text-[11px] text-[#6B8077]">
                  All serviceable cities currently use the uniform base price of <strong>₹{form.price || 0}</strong>. Check "Different rates for different cities?" above to customize prices per city.
                </div>
              )}
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
                        key: `variant-${newIdx}`,
                        label: `${newIdx} BHK`,
                        price: (Number(prev.price) || 2800) + (newIdx * 1000),
                        mrp: (Number(prev.mrp) || 2999) + (newIdx * 1500),
                        duration: `${newIdx + 2}-${newIdx + 3} hrs`,
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

            {/* Quick Presets Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
              <span className="text-[11px] font-bold text-[#6B8077]">Quick Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setter(prev => ({
                    ...prev,
                    pricingType: 'unit',
                    pricingUnit: 'sq_ft',
                    unitLabel: 'Sq. Ft.',
                    minUnitQuantity: 50,
                    unitRateMoradabad: 30,
                    unitRateOther: 30,
                    price: 30,
                    mrp: 40,
                    hasCitySpecificRates: false
                  }));
                }}
                className="px-2.5 py-1 rounded-lg bg-[#ECE5D8] hover:bg-[#E2D9C8] text-[#10231D] text-xs font-bold border border-[#E2D9C8] transition-colors cursor-pointer"
              >
                + Carpet Cleaning (₹30 / Sq. Ft.)
              </button>
              <button
                type="button"
                onClick={() => {
                  setter(prev => ({
                    ...prev,
                    pricingType: 'unit',
                    pricingUnit: 'litre',
                    unitLabel: 'Litres',
                    minUnitQuantity: 1000,
                    unitRateMoradabad: 0.05,
                    unitRateOther: 0.10,
                    price: 0.05,
                    mrp: 0.08,
                    hasCitySpecificRates: true
                  }));
                }}
                className="px-2.5 py-1 rounded-lg bg-[#ECE5D8] hover:bg-[#E2D9C8] text-[#10231D] text-xs font-bold border border-[#E2D9C8] transition-colors cursor-pointer"
              >
                + Swimming Pool (₹0.05/L Moradabad · ₹0.10/L Others)
              </button>
              <button
                type="button"
                onClick={() => {
                  setter(prev => ({
                    ...prev,
                    pricingType: 'unit',
                    pricingUnit: 'sq_ft',
                    unitLabel: 'Sq. Ft.',
                    minUnitQuantity: 100,
                    unitRateMoradabad: 10,
                    unitRateOther: 15,
                    price: 10,
                    mrp: 15,
                    hasCitySpecificRates: true
                  }));
                }}
                className="px-2.5 py-1 rounded-lg bg-[#ECE5D8] hover:bg-[#E2D9C8] text-[#10231D] text-xs font-bold border border-[#E2D9C8] transition-colors cursor-pointer"
              >
                + Floor Cleaning (₹10/Sq. Ft. Moradabad · ₹15/Sq. Ft. Others)
              </button>
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
                      litre: 1000,
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
                  <option value="litre">Swimming Pool / Water Tank Volume (Litres / Ltr)</option>
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

            {/* City-Wise Unit Rates Configuration */}
            <div className="pt-2 border-t border-[#E2D9C8] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-black text-[#10231D] uppercase tracking-wide">
                  Pricing & Rates (Per {unitLabel}):
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-[#ECE5D8] px-3 py-1.5 rounded-xl border border-[#E2D9C8]">
                  <input
                    type="checkbox"
                    checked={Boolean(form.hasCitySpecificRates)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setter(prev => ({
                        ...prev,
                        hasCitySpecificRates: checked
                      }));
                    }}
                    className="rounded text-[#E9A23B] focus:ring-[#E9A23B] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#10231D]">
                    Different rates for different cities?
                  </span>
                </label>
              </div>

              {/* Base Rates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#ECE5D8]/70 border border-[#E2D9C8]">
                  <label className="block text-[11px] font-bold text-[#10231D] mb-1">
                    Base Rate (₹ / {unitLabel}): <span className="text-red-500">*</span>
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
                  <p className="text-[10px] text-[#6B8077] mt-1">Default rate used for booking calculations</p>
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
                  <p className="text-[10px] text-[#6B8077] mt-1">Strikethrough original rate shown to customers</p>
                </div>
              </div>

              {/* City-by-City Rates Grid when hasCitySpecificRates is enabled */}
              {form.hasCitySpecificRates ? (
                <div className="p-3.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#10231D] block">
                        City-Wise Custom Rates (Per {unitLabel})
                      </span>
                      <span className="text-[10px] text-[#6B8077]">
                        Enter specific rate for each city. Any unset city defaults to the base rate.
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {cities.filter(c => c.status === 'active' || !c.status).map(city => {
                      const citySlug = (city.slug || city.name.toLowerCase()).trim();
                      const currentCityRate = Array.isArray(form.cityRates)
                        ? form.cityRates.find(cr => (cr.citySlug || '').toLowerCase() === citySlug)?.rate
                        : undefined;
                      const displayVal = currentCityRate !== undefined
                        ? currentCityRate
                        : (citySlug === 'moradabad' ? (form.unitRateMoradabad || form.price || 0) : (form.unitRateOther || form.unitRateMoradabad || form.price || 0));

                      return (
                        <div key={city._id || citySlug} className="p-2.5 rounded-lg bg-white border border-[#E2D9C8]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-[#10231D]">{city.name}</span>
                            <span className="text-[10px] font-mono text-[#6B8077] uppercase">{city.state || 'UP'}</span>
                          </div>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-[#6B8077] font-bold text-xs">₹</span>
                            <input
                              type="number"
                              step="any"
                              min={0}
                              value={displayVal}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setter(prev => {
                                  const existingRates = Array.isArray(prev.cityRates) ? [...prev.cityRates] : [];
                                  const idx = existingRates.findIndex(cr => (cr.citySlug || '').toLowerCase() === citySlug);
                                  const entry = {
                                    cityId: city._id,
                                    cityName: city.name,
                                    citySlug: citySlug,
                                    rate: val
                                  };
                                  if (idx >= 0) {
                                    existingRates[idx] = entry;
                                  } else {
                                    existingRates.push(entry);
                                  }
                                  const updates = { ...prev, cityRates: existingRates };
                                  if (citySlug === 'moradabad') {
                                    updates.unitRateMoradabad = val;
                                    updates.price = val;
                                  }
                                  return updates;
                                });
                              }}
                              className="w-full pl-6 pr-2 py-1.5 rounded-md bg-[#F4EFE6] border border-[#E2D9C8] text-xs font-bold text-[#10231D] tnum"
                              placeholder={`Rate in ${city.name}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#ECE5D8]/50 border border-[#E2D9C8] text-[11px] text-[#6B8077]">
                  All serviceable cities currently use the uniform base rate of <strong>₹{form.unitRateMoradabad || form.price || 0} / {unitLabel}</strong>. Check "Different rates for different cities?" above to customize rates per city.
                </div>
              )}
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
                  <span className="font-bold text-[#3D524A] block">In Other Cities:</span>
                  <span className="font-mono text-[#10231D]">
                    500 {unitLabel} × ₹{form.unitRateOther || form.unitRateMoradabad || 0}
                    {Number(form.cityExtraCharge) > 0 ? ` + ₹${form.cityExtraCharge} outstation` : ''} = <strong>₹{(Math.round(500 * (Number(form.unitRateOther) || Number(form.unitRateMoradabad) || 0)) + (Number(form.cityExtraCharge) || 0)).toLocaleString('en-IN')}</strong>
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
                placeholder="100"
                value={form.cityExtraCharge !== undefined && form.cityExtraCharge !== null ? form.cityExtraCharge : 100}
                onChange={(e) => setter(prev => ({ ...prev, cityExtraCharge: Number(e.target.value) || 0 }))}
                className="w-full p-2.5 rounded-xl bg-white border border-[#E2D9C8] text-xs font-bold text-[#10231D] tnum"
              />
              <p className="text-[10px] text-[#6B8077] mt-1">
                Automatically added on checkout when service is booked outside Moradabad.
              </p>
            </div>

            {/* Dual Video Showcase: YouTube Stream & Uploaded HD Video */}
            <div className="space-y-4 pt-2 border-t border-[#E2D9C8]">
              {/* 1. YouTube Showcase Stream */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-white border border-[#E2D9C8]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#10231D] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-pulse" />
                    <span>YouTube Showcase Stream (Watch / Live / Shorts URL):</span>
                  </label>
                  <span className="text-[10px] font-mono text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md font-bold">
                    YouTube Stream
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    value={form.youtubeUrl || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setter(prev => ({
                        ...prev,
                        youtubeUrl: val,
                        videoUrl: prev.uploadedVideoUrl || val
                      }));
                    }}
                    className="w-full p-2.5 rounded-xl bg-[#F8F5EE] border border-[#E2D9C8] text-xs text-[#10231D] font-mono focus:bg-white focus:outline-none"
                  />
                  {form.youtubeUrl && (
                    <button
                      type="button"
                      onClick={() => setter(prev => ({
                        ...prev,
                        youtubeUrl: '',
                        videoUrl: prev.uploadedVideoUrl || ''
                      }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#C2512D] hover:text-red-700 font-bold cursor-pointer"
                      title="Clear YouTube Link"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {form.youtubeUrl && (
                  <div className="p-2.5 rounded-xl bg-red-50/60 border border-red-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <LuVideo className="w-4 h-4 text-red-600 shrink-0" />
                      <div className="truncate">
                        <p className="font-bold text-red-950 truncate">YouTube Showcase Connected</p>
                        <p className="text-[10px] text-red-700 font-mono truncate">{form.youtubeUrl}</p>
                      </div>
                    </div>
                    <a
                      href={form.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 shadow-2xs"
                    >
                      <LuEye className="w-3 h-3" />
                      <span>Preview YouTube</span>
                    </a>
                  </div>
                )}
                <p className="text-[10px] text-[#6B8077]">
                  Embeds a branded, responsive YouTube Showcase stream on the customer service page.
                </p>
              </div>

              {/* 2. Uploaded Demonstration Video */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-white border border-[#E2D9C8]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#10231D] flex items-center gap-1.5">
                    <LuVideo className="w-3.5 h-3.5 text-[#E9A23B]" />
                    <span>Uploaded Demonstration Video (Cloudinary HD Walkthrough):</span>
                  </label>
                  <span className="text-[10px] font-mono text-[#6B8077] bg-[#ECE5D8] px-2 py-0.5 rounded-md border border-[#E2D9C8]">
                    Max 50MB • MP4 / WebM / MOV
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <div className="relative flex-1 w-full">
                    <input
                      type="url"
                      placeholder="Cloudinary video URL or upload direct video file below..."
                      value={form.uploadedVideoUrl || form.videoUrl || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setter(prev => ({
                          ...prev,
                          uploadedVideoUrl: val,
                          videoUrl: val || prev.youtubeUrl || ''
                        }));
                      }}
                      className="w-full p-2.5 rounded-xl bg-[#F8F5EE] border border-[#E2D9C8] text-xs text-[#10231D] font-mono focus:bg-white focus:outline-none"
                    />
                    {(form.uploadedVideoUrl || form.videoUrl) && (
                      <button
                        type="button"
                        onClick={() => setter(prev => ({
                          ...prev,
                          uploadedVideoUrl: '',
                          videoUrl: prev.youtubeUrl || ''
                        }))}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#C2512D] hover:text-red-700 font-bold cursor-pointer"
                        title="Clear Uploaded Video"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <label className={`shrink-0 w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    uploadingServiceVideo
                      ? 'bg-amber-100 text-amber-800 border border-amber-300 pointer-events-none'
                      : 'bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] shadow-sm'
                  }`}>
                    <LuUpload className="w-3.5 h-3.5 text-[#E9A23B]" />
                    <span>{uploadingServiceVideo ? 'Uploading (50MB max)...' : 'Upload Video (<50MB)'}</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/ogg"
                      onChange={(e) => handleServiceVideoUpload(e, setter)}
                      disabled={uploadingServiceVideo}
                      className="hidden"
                    />
                  </label>
                </div>

                {(form.uploadedVideoUrl || (form.videoUrl && !form.videoUrl.includes('youtu'))) && (
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#10231D] text-[#E9A23B] flex items-center justify-center shrink-0">
                        <LuVideo className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-emerald-950 truncate">Cloudinary HD Video Active</p>
                        <p className="text-[10px] text-emerald-700 font-mono truncate">
                          {form.uploadedVideoUrl || form.videoUrl}
                        </p>
                      </div>
                    </div>
                    <a
                      href={form.uploadedVideoUrl || form.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] text-[11px] font-bold flex items-center gap-1 shrink-0"
                    >
                      <LuEye className="w-3 h-3 text-[#E9A23B]" />
                      <span>Watch HD Video</span>
                    </a>
                  </div>
                )}
                <p className="text-[10px] text-[#6B8077]">
                  Urban Company / Pronto standard: Hosted HD field walkthrough video player.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] flex items-start gap-2 text-[11px] text-[#3D524A]">
                <LuSparkles className="w-3.5 h-3.5 text-[#E9A23B] shrink-0 mt-0.5" />
                <span>
                  <strong>Dual Video Support:</strong> You can add both a YouTube Showcase Stream and an Uploaded HD Video. When both are present, both players are displayed separately on the customer service page.
                </span>
              </div>
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
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all select-none ${
                    isChecked
                      ? 'bg-white border-[#10231D] shadow-2xs ring-1 ring-[#10231D]'
                      : 'bg-[#F4EFE6]/70 border-[#E2D9C8] hover:bg-white text-[#6B8077]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleCity(c.slug)}
                    className="w-4 h-4 rounded text-[#10231D] accent-[#10231D] focus:ring-0 cursor-pointer shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold truncate ${isChecked ? 'text-[#10231D]' : 'text-[#6B8077]'}`}>
                      {c.name}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

      </div>
    );
  };

  // Load All Admin Data
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, bookingsRes, servicesRes, categoriesRes, citiesRes, usersRes, testsRes, msgsRes, couponsRes, settingsRes, supervisorsRes] = await Promise.allSettled([
        apiRequest('/admin/stats'),
        apiRequest('/admin/bookings?limit=50'),
        apiRequest('/admin/services'),
        adminAPI.getCategories(),
        adminAPI.getCities(),
        adminAPI.getUsers(),
        adminAPI.getTestimonials(),
        adminAPI.getContactMessages(),
        adminAPI.getCoupons(),
        adminAPI.getSettings(),
        adminAPI.getSupervisors()
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.stats) {
        setStats(statsRes.value.stats);
      }
      if (bookingsRes.status === 'fulfilled' && bookingsRes.value?.bookings) {
        setBookings(bookingsRes.value.bookings);
      }
      if (servicesRes.status === 'fulfilled' && servicesRes.value?.services?.length > 0) {
        setServices(servicesRes.value.services);
      }
      if (categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value?.categories)) {
        setCategories(categoriesRes.value.categories);
      }
      if (citiesRes.status === 'fulfilled' && Array.isArray(citiesRes.value?.cities)) {
        setCities(citiesRes.value.cities);
      }
      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value?.users)) {
        setUsers(usersRes.value.users);
      }
      if (testsRes.status === 'fulfilled' && testsRes.value?.testimonials?.length > 0) {
        setTestimonials(testsRes.value.testimonials);
      }
      if (msgsRes.status === 'fulfilled' && msgsRes.value?.messages) {
        setContactMessages(msgsRes.value.messages);
      }
      if (couponsRes.status === 'fulfilled' && Array.isArray(couponsRes.value?.coupons)) {
        setCoupons(couponsRes.value.coupons);
      }
      if (settingsRes.status === 'fulfilled' && settingsRes.value?.settings) {
        setSettingsForm(prev => ({ ...prev, ...settingsRes.value.settings }));
      }
      if (supervisorsRes.status === 'fulfilled' && Array.isArray(supervisorsRes.value?.supervisors)) {
        setSupervisors(supervisorsRes.value.supervisors);
      }
    } catch (err) {
      console.warn('Failed loading live admin data from MongoDB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadAdminData();
  }, [isAdmin]);

  // Update Booking Status
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const res = await apiRequest(`/admin/bookings/${bookingId}`, {
        method: 'PUT',
        body: { status: newStatus }
      });
      if (res.success) {
        toast.success(`Booking status updated to ${newStatus} (Customer notified via email)`);
        setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: newStatus } : b));
      }
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  // Delete Booking permanently
  const handleDeleteBooking = (bookingId, bookingCode) => {
    setConfirmModalConfig({
      isOpen: true,
      title: `Delete Booking #${bookingCode}`,
      message: `Are you sure you want to permanently delete booking #${bookingCode}? This action cannot be undone and will erase this booking record.`,
      confirmText: 'Delete Booking',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          const res = await adminAPI.deleteBooking(bookingId);
          if (res.success) {
            toast.success(`Booking #${bookingCode} deleted successfully`);
            setBookings(prev => prev.filter(b => b._id !== bookingId));
            setStats(prev => ({
              ...prev,
              totalBookings: Math.max(0, (prev?.totalBookings || 1) - 1)
            }));
          }
        } catch (err) {
          toast.error(err.message || 'Failed to delete booking.');
        } finally {
          setConfirmModalConfig(null);
        }
      }
    });
  };

  // Open Edit Service Modal with Variants Parser
  const openEditService = (service) => {
    setEditingService(service);
    const optGroup = service.optionGroups?.[0];
    const groupKey = optGroup?.key || 'size';
    const groupLabel = optGroup?.label || 'Apartment / House Size';

    let variants = [];
    if (service.matrix && service.matrix.length > 0) {
      variants = service.matrix.map((r, i) => {
        const sel = r.selection instanceof Map ? Object.fromEntries(r.selection) : (r.selection || {});
        const key = sel[groupKey] || Object.values(sel)[0] || `var-${i + 1}`;
        const opt = optGroup?.options?.find(o => o.key === key);
        return {
          key,
          label: opt?.label || key.replace(/-/g, ' ').toUpperCase(),
          price: r.price,
          mrp: r.mrp || r.price,
          duration: r.duration || service.duration || '1.5 hrs',
          isDefault: Boolean(opt?.isDefault ?? (i === 0))
        };
      });
    } else if (optGroup && optGroup.options?.length > 0) {
      variants = optGroup.options.map((opt, i) => ({
        key: opt.key,
        label: opt.label,
        price: service.price + (opt.priceDelta || 0),
        mrp: service.mrp + (opt.mrpDelta || opt.priceDelta || 0),
        duration: opt.durationDelta || service.duration || '1.5 hrs',
        isDefault: Boolean(opt.isDefault ?? (i === 0))
      }));
    }

    let initialImages = [];
    if (Array.isArray(service.images) && service.images.length > 0) {
      initialImages = service.images.map(img => typeof img === 'string' ? { url: img, alt: service.title } : img);
    } else {
      if (service.media?.hero?.url) {
        initialImages.push(service.media.hero);
      }
      if (Array.isArray(service.media?.gallery)) {
        service.media.gallery.forEach(g => {
          if (g?.url) initialImages.push(g);
        });
      }
    }

    const activePricingType = service.pricingType || (service.pricingUnit && service.pricingUnit !== 'fixed' ? 'unit' : 'normal');
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
      hasCitySpecificRates: Boolean(service.hasCitySpecificRates),
      cityRates: Array.isArray(service.cityRates) ? service.cityRates : [],
      cityExtraCharge: typeof service.cityExtraCharge === 'number' ? service.cityExtraCharge : 100,
      moradabadOnly: Boolean(service.moradabadOnly || (allAvailableCities.length === 1 && allAvailableCities[0] === 'moradabad')),
      cityAvailability: allAvailableCities,
      videoUrl: service.videoUrl || '',
      youtubeUrl: service.youtubeUrl || (service.videoUrl?.includes('youtu') ? service.videoUrl : ''),
      uploadedVideoUrl: service.uploadedVideoUrl || (!service.videoUrl?.includes('youtu') ? service.videoUrl : ''),
      price: service.price,
      mrp: service.mrp,
      duration: service.duration || '1.5 hrs',
      variantGroupLabel: groupLabel,
      variantGroupKey: groupKey,
      variants,
      imageUrl: initialImages[0]?.url || service.media?.hero?.url || '',
      images: initialImages,
      inclusions: Array.isArray(service.inclusions) ? service.inclusions.join('\n') : (service.inclusions || ''),
      exclusions: Array.isArray(service.exclusions) ? service.exclusions.join('\n') : (service.exclusions || ''),
      tags: Array.isArray(service.tags) ? service.tags.join(', ') : (service.tags || ''),
      rankingScore: service.rankingScore ?? 100,
      rankingTier: service.rankingTier || 'standard'
    });
  };

  // Service Image Upload to Cloudinary
  const handleServiceImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingServiceImage(true);
    try {
      const res = await adminAPI.uploadImage(file, 'max-housekeeping/services');
      if (res && res.url) {
        setServiceForm(prev => ({ ...prev, imageUrl: res.url }));
        toast.success('Service image uploaded successfully to Cloudinary!');
      } else {
        toast.error('Upload completed, but URL was not returned.');
      }
    } catch (err) {
      console.error('[Cloudinary Upload Error]', err);
      toast.error('Failed to upload image to Cloudinary.');
    } finally {
      setUploadingServiceImage(false);
    }
  };

  // Save Service Dual-Pricing Updates with Dynamic Variants & Inclusions/Exclusions
  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      const parseList = (str) => {
        if (!str) return [];
        if (Array.isArray(str)) return str.map(s => String(s).trim()).filter(Boolean);
        return str.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      };

      let selectedCats = (serviceForm.categories || []).map(c => c && c._id ? String(c._id) : String(c)).filter(Boolean);
      if (selectedCats.length === 0 && categories.length > 0) {
        selectedCats = [String(categories[0]._id)];
      }
      if (selectedCats.length === 0) {
        toast.error('Please select at least one category for this service.');
        return;
      }

      const isUnit = serviceForm.pricingType === 'unit';
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
        hasCitySpecificRates: Boolean(serviceForm.hasCitySpecificRates),
        cityRates: Array.isArray(serviceForm.cityRates) ? serviceForm.cityRates : [],
        cityExtraCharge: serviceForm.cityExtraCharge !== undefined && serviceForm.cityExtraCharge !== null ? Number(serviceForm.cityExtraCharge) : 100,
        moradabadOnly: Boolean(serviceForm.moradabadOnly || (activeCities.length === 1 && activeCities[0] === 'moradabad')),
        cityAvailability: activeCities,
        videoUrl: serviceForm.uploadedVideoUrl || serviceForm.youtubeUrl || serviceForm.videoUrl || '',
        youtubeUrl: serviceForm.youtubeUrl || '',
        uploadedVideoUrl: serviceForm.uploadedVideoUrl || '',
        price: isUnit ? mbdRate : Number(serviceForm.price),
        mrp: isUnit ? (Number(serviceForm.mrp) || Math.round(mbdRate * 1.25)) : Number(serviceForm.mrp),
        duration: serviceForm.duration,
        variantGroupLabel: serviceForm.variantGroupLabel || 'Apartment / House Size',
        variantGroupKey: serviceForm.variantGroupKey || 'size',
        variants: isUnit ? [] : (serviceForm.variants || []),
        inclusions: parseList(serviceForm.inclusions),
        exclusions: parseList(serviceForm.exclusions),
        tags: generateAutoServiceTags(serviceForm.title, selectedCats, serviceForm.moradabadOnly, serviceForm.pricingType),
        rankingScore: 500,
        rankingTier: 'standard'
      };

      const formImages = serviceForm.images && serviceForm.images.length > 0
        ? serviceForm.images
        : (serviceForm.imageUrl ? [{ url: serviceForm.imageUrl, alt: `${serviceForm.title} deep cleaning` }] : []);

      payload.images = formImages;
      if (formImages.length > 0) {
        payload.media = {
          hero: {
            url: formImages[0].url,
            alt: formImages[0].alt || `${serviceForm.title} deep cleaning`
          },
          gallery: formImages.slice(1).map(img => ({
            url: img.url,
            alt: img.alt || `${serviceForm.title} gallery`
          }))
        };
      }

      const res = await apiRequest(`/admin/services/${editingService._id}`, {
        method: 'PUT',
        body: payload
      });

      if (res.success && res.service) {
        toast.success(`Updated details, variants and pricing for ${res.service.title}`);
        setServices(prev => prev.map(s => s._id === res.service._id ? res.service : s));
        setEditingService(null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update service pricing.');
    }
  };

  // Delete Service
  const handleDeleteService = (id, title) => {
    setConfirmModalConfig({
      isOpen: true,
      title: `Delete Service "${title}"`,
      message: `Permanently delete service "${title}"? This cannot be undone. Any active bookings referencing this service will retain historical snapshots.`,
      confirmText: 'Delete Service',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          const res = await adminAPI.deleteService(id);
          if (res.success) {
            toast.success(`Service "${title}" deleted.`);
            setServices(prev => prev.filter(s => s._id !== id));
          }
        } catch (err) {
          toast.error('Failed to delete service.');
        } finally {
          setConfirmModalConfig(null);
        }
      }
    });
  };

  // Create Service
  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!newServiceForm.title.trim()) {
      toast.error('Service title is required.');
      return;
    }
    setSavingNewService(true);
    try {
      const parseList = (str) => {
        if (!str) return [];
        if (Array.isArray(str)) return str.map(s => String(s).trim()).filter(Boolean);
        return str.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      };

      let selectedCats = (newServiceForm.categories || []).map(c => c && c._id ? String(c._id) : String(c)).filter(Boolean);
      if (selectedCats.length === 0 && categories.length > 0) {
        selectedCats = [String(categories[0]._id)];
      }
      if (selectedCats.length === 0) {
        toast.error('Please select at least one category for this service.');
        setSavingNewService(false);
        return;
      }

      const isUnit = newServiceForm.pricingType === 'unit';
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
        hasCitySpecificRates: Boolean(newServiceForm.hasCitySpecificRates),
        cityRates: Array.isArray(newServiceForm.cityRates) ? newServiceForm.cityRates : [],
        cityExtraCharge: newServiceForm.cityExtraCharge !== undefined && newServiceForm.cityExtraCharge !== null ? Number(newServiceForm.cityExtraCharge) : 100,
        moradabadOnly: Boolean(newServiceForm.moradabadOnly || (activeCities.length === 1 && activeCities[0] === 'moradabad')),
        cityAvailability: activeCities,
        videoUrl: newServiceForm.uploadedVideoUrl || newServiceForm.youtubeUrl || newServiceForm.videoUrl || '',
        youtubeUrl: newServiceForm.youtubeUrl || '',
        uploadedVideoUrl: newServiceForm.uploadedVideoUrl || '',
        price: isUnit ? mbdRate : Number(newServiceForm.price),
        mrp: isUnit ? (Number(newServiceForm.mrp) || Math.round(mbdRate * 1.25)) : Number(newServiceForm.mrp),
        duration: newServiceForm.duration || '1.5 hrs',
        icon: newServiceForm.icon || 'Sparkles',
        shortDescription: newServiceForm.shortDescription,
        description: newServiceForm.description || newServiceForm.shortDescription || `${newServiceForm.title} by Max Housekeeping Service.`,
        variantGroupLabel: newServiceForm.variantGroupLabel || 'Apartment / House Size',
        variantGroupKey: newServiceForm.variantGroupKey || 'size',
        variants: isUnit ? [] : (newServiceForm.variants || []),
        inclusions: parseList(newServiceForm.inclusions),
        exclusions: parseList(newServiceForm.exclusions),
        tags: generateAutoServiceTags(newServiceForm.title, selectedCats, newServiceForm.moradabadOnly, newServiceForm.pricingType),
        rankingScore: 500,
        rankingTier: 'standard'
      };
      const formImages = newServiceForm.images && newServiceForm.images.length > 0
        ? newServiceForm.images
        : (newServiceForm.imageUrl ? [{ url: newServiceForm.imageUrl, alt: `${newServiceForm.title} service photo` }] : []);

      payload.images = formImages;
      if (formImages.length > 0) {
        payload.media = {
          hero: {
            url: formImages[0].url,
            alt: formImages[0].alt || `${newServiceForm.title} service photo`
          },
          gallery: formImages.slice(1).map(img => ({
            url: img.url,
            alt: img.alt || `${newServiceForm.title} gallery`
          }))
        };
      }
      const res = await adminAPI.createService(payload);
      if (res.success && res.service) {
        toast.success(`Service "${res.service.title}" created successfully with ${res.service.matrix?.length || 0} variant tiers!`);
        setServices(prev => [res.service, ...prev]);
        setCreateServiceModalOpen(false);
        setNewServiceForm({
          title: '',
          slug: '',
          categories: [],
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
          exclusions: '',
          tags: 'deep-cleaning, housekeeping, professional-cleaning',
          rankingScore: 100,
          rankingTier: 'standard'
        });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create service.');
    } finally {
      setSavingNewService(false);
    }
  };

  // Upload New Service Image
  const handleNewServiceImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingNewServiceImage(true);
    try {
      const res = await adminAPI.uploadImage(file, 'max-housekeeping/services');
      if (res && res.url) {
        setNewServiceForm(prev => ({ ...prev, imageUrl: res.url }));
        toast.success('Service photo uploaded to Cloudinary!');
      } else {
        toast.error('Upload completed, but URL was missing.');
      }
    } catch (err) {
      toast.error('Failed to upload service image.');
    } finally {
      setUploadingNewServiceImage(false);
    }
  };

  // Category Form Handlers
  const handleEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name || '',
      slug: cat.slug || '',
      tagline: cat.tagline || '',
      iconKey: cat.iconKey || 'PiHouseLine',
      imageUrl: cat.image?.url || '',
      sortOrder: cat.sortOrder ?? 0,
      isActive: cat.isActive !== undefined ? cat.isActive : true
    });
    setCategoryModalOpen(true);
  };

  const handleCreateCategoryOpen = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      slug: '',
      tagline: '',
      iconKey: 'PiHouseLine',
      imageUrl: '',
      sortOrder: categories.length + 1,
      isActive: true
    });
    setCategoryModalOpen(true);
  };

  const handleCategoryImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCategoryImg(true);
    try {
      const res = await adminAPI.uploadImage(file, 'max-housekeeping/categories');
      if (res && res.url) {
        setCategoryForm(prev => ({ ...prev, imageUrl: res.url }));
        toast.success('Category image uploaded successfully!');
      } else {
        toast.error('Upload completed, but URL not returned.');
      }
    } catch (err) {
      toast.error('Failed to upload image.');
    } finally {
      setUploadingCategoryImg(false);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required.');
      return;
    }
    setSavingCategory(true);
    try {
      const payload = {
        name: categoryForm.name.trim(),
        slug: categoryForm.slug.trim() || categoryForm.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        tagline: categoryForm.tagline.trim(),
        iconKey: categoryForm.iconKey,
        image: categoryForm.imageUrl ? { url: categoryForm.imageUrl, alt: `${categoryForm.name} photo` } : undefined,
        sortOrder: Number(categoryForm.sortOrder) || 0,
        isActive: Boolean(categoryForm.isActive)
      };

      if (editingCategory) {
        const res = await adminAPI.updateCategory(editingCategory._id, payload);
        if (res.success && res.category) {
          toast.success(`Category "${res.category.name}" updated successfully.`);
          setCategories(prev => prev.map(c => c._id === res.category._id ? { ...res.category, serviceCount: c.serviceCount } : c));
          setCategoryModalOpen(false);
        }
      } else {
        const res = await adminAPI.createCategory(payload);
        if (res.success && res.category) {
          toast.success(`Category "${res.category.name}" created successfully.`);
          setCategories(prev => [...prev, { ...res.category, serviceCount: 0 }]);
          setCategoryModalOpen(false);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save category.');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = (id, name) => {
    setConfirmModalConfig({
      isOpen: true,
      title: `Delete Category "${name}"`,
      message: `Are you sure you want to delete category "${name}"? Services assigned solely to this category will be updated. This action cannot be undone.`,
      confirmText: 'Delete Category',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          const res = await adminAPI.deleteCategory(id);
          if (res.success) {
            toast.success(`Category "${name}" deleted.`);
            setCategories(prev => prev.filter(c => c._id !== id));
          }
        } catch (err) {
          toast.error(err.message || 'Failed to delete category.');
        } finally {
          setConfirmModalConfig(null);
        }
      }
    });
  };

  const handleToggleCategoryActive = async (cat) => {
    try {
      const newStatus = !cat.isActive;
      const res = await adminAPI.updateCategory(cat._id, { isActive: newStatus });
      if (res.success) {
        toast.success(`Category is now ${newStatus ? 'Active' : 'Inactive'}.`);
        setCategories(prev => prev.map(c => c._id === cat._id ? { ...c, isActive: newStatus } : c));
      }
    } catch (err) {
      toast.error('Failed to toggle category status.');
    }
  };

  // Coupon Handlers
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code.trim()) {
      toast.error('Coupon code is required.');
      return;
    }
    setSavingCoupon(true);
    try {
      const payload = {
        code: couponForm.code.trim().toUpperCase(),
        description: couponForm.description?.trim() || '',
        discountType: couponForm.discountType,
        discountValue: Number(couponForm.discountValue),
        minOrderValue: Number(couponForm.minOrderValue) || 0,
        minBookingAmount: Number(couponForm.minOrderValue) || 0,
        maxDiscount: couponForm.discountType === 'percentage' && couponForm.maxDiscount ? Number(couponForm.maxDiscount) : undefined,
        usageLimit: Number(couponForm.usageLimit) || 1000,
        expiryDate: couponForm.expiryDate ? new Date(couponForm.expiryDate) : undefined,
        validUntil: couponForm.expiryDate ? new Date(couponForm.expiryDate) : undefined,
        firstBookingOnly: Boolean(couponForm.firstBookingOnly),
        oncePerUser: Boolean(couponForm.oncePerUser),
        showInOffers: Boolean(couponForm.showInOffers),
        applicableServices: couponForm.applicableServices || [],
        isActive: true
      };
      const res = await adminAPI.createCoupon(payload);
      if (res.success && res.coupon) {
        toast.success(`Coupon "${res.coupon.code}" created successfully!`);
        setCoupons(prev => [res.coupon, ...prev]);
        setCouponModalOpen(false);
        setCouponForm({
          code: '',
          description: '',
          discountType: 'flat',
          discountValue: 100,
          minOrderValue: 499,
          maxDiscount: 500,
          expiryDate: '',
          usageLimit: 1000,
          firstBookingOnly: false,
          oncePerUser: true,
          showInOffers: true,
          applicableServices: []
        });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create coupon.');
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleDeleteCoupon = (id, code) => {
    setConfirmModalConfig({
      isOpen: true,
      title: `Delete Coupon "${code}"`,
      message: `Permanently delete discount code "${code}"? Customers will no longer be able to apply this discount.`,
      confirmText: 'Delete Coupon',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          const res = await adminAPI.deleteCoupon(id);
          if (res.success) {
            toast.success(`Coupon "${code}" deleted.`);
            setCoupons(prev => prev.filter(c => c._id !== id));
          }
        } catch (err) {
          toast.error('Failed to delete coupon.');
        } finally {
          setConfirmModalConfig(null);
        }
      }
    });
  };

  const handleToggleCouponStatus = async (coupon) => {
    try {
      const nextStatus = !coupon.isActive;
      const res = await adminAPI.updateCoupon(coupon._id, { isActive: nextStatus });
      if (res.success) {
        toast.success(`Coupon "${coupon.code}" is now ${nextStatus ? 'active' : 'inactive'}.`);
        setCoupons(prev => prev.map(c => c._id === coupon._id ? { ...c, isActive: nextStatus } : c));
      }
    } catch (err) {
      toast.error('Failed to toggle coupon status.');
    }
  };

  // Settings Handlers
  const [togglingOnlinePayments, setTogglingOnlinePayments] = useState(false);
  const [togglingGst, setTogglingGst] = useState(false);
  const [togglingPlatformCharge, setTogglingPlatformCharge] = useState(false);

  const handleToggleOnlinePayments = async (nextVal) => {
    setTogglingOnlinePayments(true);
    const updated = { ...settingsForm, acceptOnlinePayments: nextVal };
    setSettingsForm(updated);

    try {
      const res = await adminAPI.updateSettings(updated);
      if (res && res.success !== false) {
        if (res.settings) {
          setSettingsForm(prev => ({ ...prev, ...res.settings }));
        }
        if (typeof refreshSettings === 'function') {
          await refreshSettings();
        }
        window.dispatchEvent(new Event('max_settings_updated'));
        toast.success(
          nextVal
            ? 'Online payments (Razorpay) activated! Customers can now pay online or choose Cash on Service.'
            : 'Online payments deactivated. Customer booking checkout set to Cash on Service only.'
        );
      } else {
        throw new Error(res?.message || 'Failed to update payment setting');
      }
    } catch (err) {
      console.error('Failed toggling online payments:', err);
      toast.error('Failed to update online payment setting. Please check your connection.');
      setSettingsForm(prev => ({ ...prev, acceptOnlinePayments: !nextVal }));
    } finally {
      setTogglingOnlinePayments(false);
    }
  };

  const handleToggleGst = async (nextVal) => {
    setTogglingGst(true);
    const pct = Number(settingsForm.gstPercentage ?? 18) || 18;
    const updated = { ...settingsForm, gstEnabled: nextVal, gstPercentage: pct };
    setSettingsForm(updated);

    try {
      const res = await adminAPI.updateSettings(updated);
      if (res && res.success !== false) {
        if (res.settings) {
          setSettingsForm(prev => ({ ...prev, ...res.settings }));
        }
        if (typeof refreshSettings === 'function') {
          await refreshSettings();
        }
        window.dispatchEvent(new Event('max_settings_updated'));
        toast.success(
          nextVal
            ? `Separate GST (${pct}%) enabled on overall service bill!`
            : 'Separate GST disabled on overall service bill.'
        );
      } else {
        throw new Error(res?.message || 'Failed to update GST setting');
      }
    } catch (err) {
      console.error('Failed toggling GST:', err);
      toast.error('Failed to update GST setting. Please check your connection.');
      setSettingsForm(prev => ({ ...prev, gstEnabled: !nextVal }));
    } finally {
      setTogglingGst(false);
    }
  };

  const handleTogglePlatformCharge = async (nextVal) => {
    setTogglingPlatformCharge(true);
    const amt = Number(settingsForm.platformChargeAmount ?? 49) || 0;
    const type = settingsForm.platformChargeType === 'percentage' ? 'percentage' : 'flat';
    const label = (settingsForm.platformChargeLabel || 'Platform Charges').trim() || 'Platform Charges';
    const updated = {
      ...settingsForm,
      platformChargeEnabled: nextVal,
      platformChargeType: type,
      platformChargeAmount: amt,
      platformChargeLabel: label
    };
    setSettingsForm(updated);

    try {
      const res = await adminAPI.updateSettings(updated);
      if (res && res.success !== false) {
        if (res.settings) {
          setSettingsForm(prev => ({ ...prev, ...res.settings }));
        }
        if (typeof refreshSettings === 'function') {
          await refreshSettings();
        }
        window.dispatchEvent(new Event('max_settings_updated'));
        toast.success(
          nextVal
            ? `${label} (${type === 'percentage' ? `${amt}%` : `₹${amt}`}) enabled on overall service bill!`
            : `${label} disabled on overall service bill.`
        );
      } else {
        throw new Error(res?.message || 'Failed to update platform charges setting');
      }
    } catch (err) {
      console.error('Failed toggling platform charges:', err);
      toast.error('Failed to update platform charges setting. Please check your connection.');
      setSettingsForm(prev => ({ ...prev, platformChargeEnabled: !nextVal }));
    } finally {
      setTogglingPlatformCharge(false);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setSavingSettings(true);
    try {
      const payload = {
        ...settingsForm,
        gstEnabled: Boolean(settingsForm.gstEnabled),
        gstPercentage: Math.max(0, Math.min(100, Number(settingsForm.gstPercentage ?? 18) || 0)),
        platformChargeEnabled: Boolean(settingsForm.platformChargeEnabled),
        platformChargeType: settingsForm.platformChargeType === 'percentage' ? 'percentage' : 'flat',
        platformChargeAmount: Math.max(0, Number(settingsForm.platformChargeAmount ?? 0) || 0),
        platformChargeLabel: (settingsForm.platformChargeLabel || 'Platform Charges').trim() || 'Platform Charges'
      };
      const res = await adminAPI.updateSettings(payload);
      if (res.success) {
        toast.success('Business settings, GST, and Platform Charges saved successfully!');
        if (res.settings) {
          setSettingsForm(prev => ({ ...prev, ...res.settings }));
        }
        if (typeof refreshSettings === 'function') {
          await refreshSettings();
        }
        window.dispatchEvent(new Event('max_settings_updated'));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Open Testimonial Modal (Add or Edit)
  const openTestimonialModal = (item = null) => {
    if (item) {
      setEditingTestimonial(item);
      setTestimonialForm({
        name: item.name || '',
        role: item.role || 'Homeowner',
        city: item.city || 'Moradabad',
        serviceTitle: item.serviceTitle || '',
        quote: item.quote || '',
        rating: item.rating || 5,
        avatar: item.avatar || '',
        avatarPublicId: item.avatarPublicId || '',
        videoUrl: item.videoUrl || '',
        videoPublicId: item.videoPublicId || '',
        isFeatured: Boolean(item.isFeatured),
        isActive: item.isActive !== false
      });
    } else {
      setEditingTestimonial(null);
      setTestimonialForm({
        name: '',
        role: 'Homeowner',
        city: 'Moradabad',
        serviceTitle: '',
        quote: '',
        rating: 5,
        avatar: '',
        avatarPublicId: '',
        videoUrl: '',
        videoPublicId: '',
        isFeatured: false,
        isActive: true
      });
    }
    setTestimonialModalOpen(true);
  };

  // Testimonial Avatar Upload to Cloudinary
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const res = await adminAPI.uploadImage(file, 'max-housekeeping/testimonials');
      if (res && res.url) {
        setTestimonialForm(prev => ({
          ...prev,
          avatar: res.url,
          avatarPublicId: res.publicId || ''
        }));
        toast.success('Avatar image uploaded to Cloudinary!');
      } else {
        toast.error('Failed to parse uploaded avatar response.');
      }
    } catch (err) {
      console.error('[Avatar Upload Error]', err);
      toast.error('Failed to upload avatar to Cloudinary.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Testimonial Video Upload to Cloudinary
  const handleTestimonialVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video size must be under 50MB.');
      return;
    }

    setUploadingTestimonialVideo(true);
    try {
      const res = await adminAPI.uploadVideo(file, 'max-housekeeping/testimonials/videos');
      if (res && res.url) {
        setTestimonialForm(prev => ({
          ...prev,
          videoUrl: res.url,
          videoPublicId: res.publicId || ''
        }));
        toast.success('Customer video testimonial uploaded successfully!');
      } else {
        toast.error('Failed to parse uploaded video response.');
      }
    } catch (err) {
      console.error('[Testimonial Video Upload Error]', err);
      toast.error(err.message || 'Failed to upload video testimonial.');
    } finally {
      setUploadingTestimonialVideo(false);
      e.target.value = '';
    }
  };

  // Save Testimonial (Create or Update)
  const handleSaveTestimonial = async (e) => {
    e.preventDefault();
    if (!testimonialForm.name.trim() || (!testimonialForm.quote.trim() && !testimonialForm.videoUrl.trim())) {
      toast.error('Client name and either a written review quote or a video testimonial are required.');
      return;
    }

    try {
      if (editingTestimonial?._id) {
        const res = await adminAPI.updateTestimonial(editingTestimonial._id, testimonialForm);
        if (res.success) {
          toast.success('Testimonial updated successfully!');
          setTestimonials(prev =>
            prev.map(t => t._id === editingTestimonial._id ? res.testimonial : t)
          );
          setTestimonialModalOpen(false);
        }
      } else {
        const res = await adminAPI.createTestimonial(testimonialForm);
        if (res.success) {
          toast.success('New testimonial published to Home & About pages!');
          setTestimonials(prev => [res.testimonial, ...prev]);
          setTestimonialModalOpen(false);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save testimonial.');
    }
  };

  // Toggle Testimonial Active Status
  const handleToggleTestimonialStatus = async (item) => {
    try {
      const updatedStatus = !item.isActive;
      const res = await adminAPI.updateTestimonial(item._id, { isActive: updatedStatus });
      if (res.success) {
        toast.success(`Testimonial is now ${updatedStatus ? 'Published' : 'Hidden'}.`);
        setTestimonials(prev =>
          prev.map(t => t._id === item._id ? { ...t, isActive: updatedStatus } : t)
        );
      }
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  // Delete Testimonial
  const handleDeleteTestimonial = (id) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Testimonial',
      message: 'Are you sure you want to permanently delete this customer testimonial from the website?',
      confirmText: 'Delete Testimonial',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          const res = await adminAPI.deleteTestimonial(id);
          if (res.success) {
            toast.success('Testimonial deleted successfully.');
            setTestimonials(prev => prev.filter(t => t._id !== id));
          }
        } catch (err) {
          toast.error('Failed to delete testimonial.');
        } finally {
          setConfirmModalConfig(null);
        }
      }
    });
  };

  // Update Contact Message Status
  const handleUpdateMessageStatus = async (id, status) => {
    try {
      const res = await adminAPI.updateContactMessage(id, { status });
      if (res.success) {
        toast.success(`Inquiry marked as ${status}.`);
        setContactMessages(prev =>
          prev.map(m => m._id === id ? { ...m, status } : m)
        );
        setViewInquiryDetails(prev => prev && prev._id === id ? { ...prev, status } : prev);
      }
    } catch (err) {
      toast.error('Failed to update message status.');
    }
  };

  // Open Inquiry Details Modal (marks unread as read automatically)
  const handleOpenInquiryDetails = (msg) => {
    setViewInquiryDetails(msg);
    if (msg.status === 'unread') {
      handleUpdateMessageStatus(msg._id, 'read');
    }
  };

  // Delete Contact Message
  const handleDeleteMessage = (id) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Inquiry',
      message: 'Are you sure you want to permanently delete this customer contact inquiry?',
      confirmText: 'Delete Inquiry',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          const res = await adminAPI.deleteContactMessage(id);
          if (res.success) {
            toast.success('Contact inquiry removed.');
            setContactMessages(prev => prev.filter(m => m._id !== id));
          }
        } catch (err) {
          toast.error('Failed to delete contact inquiry.');
        } finally {
          setConfirmModalConfig(null);
        }
      }
    });
  };

  const toCitySlug = (str = '') =>
    String(str)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const buildCityDefaultTags = (citySlug, stateStr) => {
    const cleanCitySlug = toCitySlug(citySlug);
    const cleanStateSlug = toCitySlug(stateStr);
    return [
      cleanCitySlug,
      cleanStateSlug,
      'full-home-cleaning',
      'sofa-carpet-hub',
      'doorstep-dispatch',
      'fast-service'
    ]
      .filter(Boolean)
      .join(', ');
  };

  // Handle typing City Name -> Automatically generate URL Slug & check existing MongoDB cities first
  const handleCityNameAutoChange = (rawName) => {
    const autoSlug = toCitySlug(rawName);
    const existingMongoCity = cities.find(
      (c) =>
        toCitySlug(c.slug || c.name) === autoSlug ||
        String(c.name || '').toLowerCase() === String(rawName || '').trim().toLowerCase()
    );

    if (existingMongoCity) {
      const [lng, lat] = Array.isArray(existingMongoCity.location?.coordinates) && existingMongoCity.location.coordinates.length === 2
        ? existingMongoCity.location.coordinates
        : [78.7733, 28.8386];
      setCityForm(prev => ({
        ...prev,
        name: rawName,
        slug: autoSlug,
        state: existingMongoCity.state || '',
        latitude: String(lat),
        longitude: String(lng),
        serviceRadiusKm: existingMongoCity.serviceRadiusKm || 25,
        pincodes: Array.isArray(existingMongoCity.pincodes) ? existingMongoCity.pincodes.join(', ') : '',
        rankingScore: existingMongoCity.rankingScore || 800,
        rankingTier: existingMongoCity.rankingTier || 'tier_1',
        tags: Array.isArray(existingMongoCity.tags) && existingMongoCity.tags.length > 0
          ? existingMongoCity.tags.join(', ')
          : buildCityDefaultTags(autoSlug, existingMongoCity.state)
      }));
    } else {
      setCityForm(prev => ({
        ...prev,
        name: rawName,
        slug: autoSlug,
        state: '',
        latitude: '',
        longitude: '',
        pincodes: '',
        tags: autoSlug
          ? buildCityDefaultTags(autoSlug, '')
          : prev.tags
      }));
    }
  };

  // Live Lookup for ANY City Name using free public APIs (OpenStreetMap Nominatim + Photon + India Post API `api.postalpincode.in`)
  // Zero hardcoded city dictionaries!
  const handleAutoDetectCityFromMap = async (targetCityName = cityForm.name) => {
    const cleanName = String(targetCityName || '').trim();
    if (!cleanName) {
      toast.error('Please enter a City Name first.');
      return;
    }

    const autoSlug = toCitySlug(cleanName);
    setCityForm(prev => ({ ...prev, name: cleanName, slug: autoSlug }));
    setIsAutoDetectingCityGeo(true);

    try {
      let detectedState = '';
      let detectedLat = NaN;
      let detectedLng = NaN;
      const pinSet = new Set();

      // 1. Live Geocode via OpenStreetMap Nominatim (Free, zero API key) -> State, Lat/Lng & Postcodes
      try {
        const q = encodeURIComponent(`${cleanName}, India`);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=in&q=${q}`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (res.ok) {
          const results = await res.json();
          if (Array.isArray(results) && results.length > 0) {
            const best = results[0];
            detectedLat = parseFloat(best.lat);
            detectedLng = parseFloat(best.lon);
            detectedState =
              best.address?.state ||
              best.address?.state_district ||
              '';
            for (const r of results) {
              const pc = String(r.address?.postcode || '').replace(/\D/g, '').slice(0, 6);
              if (pc.length === 6) pinSet.add(pc);
            }
          }
        }
      } catch (_) {}

      // 2. Fallback / Enrichment via Photon Komoot API (Free OpenStreetMap geocoder)
      if (!detectedState || isNaN(detectedLat) || isNaN(detectedLng)) {
        try {
          const photRes = await fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(`${cleanName}, India`)}&limit=5`
          );
          if (photRes.ok) {
            const photData = await photRes.json();
            const feat = (photData?.features || []).find(
              (f) => String(f?.properties?.countrycode || '').toUpperCase() === 'IN'
            ) || photData?.features?.[0];
            if (feat) {
              const [lng, lat] = feat.geometry?.coordinates || [];
              if (isNaN(detectedLat) && typeof lat === 'number') detectedLat = lat;
              if (isNaN(detectedLng) && typeof lng === 'number') detectedLng = lng;
              if (!detectedState && feat.properties?.state) {
                detectedState = feat.properties.state;
              }
              const pc = String(feat.properties?.postcode || '').replace(/\D/g, '').slice(0, 6);
              if (pc.length === 6) pinSet.add(pc);
            }
          }
        } catch (_) {}
      }

      // 3. Official India Post Public API (`https://api.postalpincode.in/postoffice/{City}`) -> Official State & Covered Pincodes
      try {
        const postRes = await fetch(
          `https://api.postalpincode.in/postoffice/${encodeURIComponent(cleanName)}`
        );
        if (postRes.ok) {
          const postData = await postRes.json();
          const postOffices = postData?.[0]?.PostOffice;
          if (Array.isArray(postOffices) && postOffices.length > 0) {
            const matchingOffices = detectedState
              ? postOffices.filter((po) => String(po.State || '').toLowerCase() === detectedState.toLowerCase())
              : postOffices;
            const listToUse = matchingOffices.length > 0 ? matchingOffices : postOffices;

            if (!detectedState && listToUse[0]?.State) {
              detectedState = listToUse[0].State;
            }
            for (const po of listToUse.slice(0, 8)) {
              const pin = String(po.Pincode || '').replace(/\D/g, '').slice(0, 6);
              if (pin.length === 6) pinSet.add(pin);
            }
          }
        }
      } catch (_) {}

      // 4. Reverse-geocode center point if pincode set is still empty
      if (pinSet.size === 0 && !isNaN(detectedLat) && !isNaN(detectedLng)) {
        try {
          const revRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${detectedLat}&lon=${detectedLng}&zoom=14&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (revRes.ok) {
            const revData = await revRes.json();
            const revPin = String(revData?.address?.postcode || '').replace(/\D/g, '').slice(0, 6);
            if (revPin.length === 6) pinSet.add(revPin);
            if (!detectedState && revData?.address?.state) {
              detectedState = revData.address.state;
            }
          }
        } catch (_) {}
      }

      if (!isNaN(detectedLat) || detectedState || pinSet.size > 0) {
        const pinsStr = Array.from(pinSet).join(', ');
        const isUp = /uttar pradesh/i.test(detectedState);

        setCityForm(prev => ({
          ...prev,
          name: cleanName,
          slug: autoSlug,
          state: detectedState || prev.state,
          latitude: !isNaN(detectedLat) ? detectedLat.toFixed(4) : prev.latitude,
          longitude: !isNaN(detectedLng) ? detectedLng.toFixed(4) : prev.longitude,
          pincodes: pinsStr || prev.pincodes,
          tags: buildCityDefaultTags(autoSlug, detectedState || prev.state),
          rankingScore: isUp ? 850 : 750,
          rankingTier: 'tier_1'
        }));

        toast.success(
          `Auto-filled state (${detectedState || 'Detected'})${!isNaN(detectedLat) ? `, GPS (${detectedLat.toFixed(4)}, ${detectedLng.toFixed(4)})` : ''}${pinsStr ? ` & pincodes (${pinsStr})` : ''} for ${cleanName}!`
        );
      } else {
        toast.error(`Could not find "${cleanName}" via live geo/postal APIs. Please check spelling.`);
      }
    } catch (err) {
      toast.error('Live city lookup failed. Check your internet connection.');
    } finally {
      setIsAutoDetectingCityGeo(false);
    }
  };

  // Open City Modal
  const openCityModal = (city = null) => {
    if (city) {
      setEditingCity(city);
      const [lng, lat] = Array.isArray(city.location?.coordinates) && city.location.coordinates.length === 2
        ? city.location.coordinates
        : [78.7733, 28.8386];
      setCityForm({
        name: city.name || '',
        slug: city.slug || toCitySlug(city.name || ''),
        state: city.state || '',
        latitude: String(lat ?? 28.8386),
        longitude: String(lng ?? 78.7733),
        serviceRadiusKm: city.serviceRadiusKm || 25,
        pincodes: Array.isArray(city.pincodes) ? city.pincodes.join(', ') : '',
        status: city.status || 'active',
        sortOrder: city.sortOrder || 0,
        tags: Array.isArray(city.tags) ? city.tags.join(', ') : (city.tags || ''),
        rankingScore: city.rankingScore ?? 100,
        rankingTier: city.rankingTier || 'primary'
      });
    } else {
      setEditingCity(null);
      setCityForm({
        name: '',
        slug: '',
        state: '',
        latitude: '',
        longitude: '',
        serviceRadiusKm: 25,
        pincodes: '',
        status: 'active',
        sortOrder: cities.length + 1,
        tags: '',
        rankingScore: 800,
        rankingTier: 'tier_1'
      });
    }
    setCityModalOpen(true);
  };

  // Save City (Create or Update in MongoDB)
  const handleSaveCity = async (e) => {
    e.preventDefault();
    if (!cityForm.name.trim()) {
      toast.error('City name is required.');
      return;
    }
    const pincodesArray = cityForm.pincodes
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    const tagsArray = cityForm.tags
      ? (typeof cityForm.tags === 'string' ? cityForm.tags.split(',').map(t => t.trim()).filter(Boolean) : cityForm.tags)
      : [];

    const generatedSlug = toCitySlug(cityForm.slug || cityForm.name);

    const payload = {
      name: cityForm.name.trim(),
      slug: generatedSlug,
      state: cityForm.state.trim(),
      latitude: cityForm.latitude !== '' ? Number(cityForm.latitude) : undefined,
      longitude: cityForm.longitude !== '' ? Number(cityForm.longitude) : undefined,
      serviceRadiusKm: Number(cityForm.serviceRadiusKm) || 25,
      pincodes: pincodesArray,
      status: cityForm.status,
      sortOrder: Number(cityForm.sortOrder) || 0,
      tags: tagsArray,
      rankingScore: Number(cityForm.rankingScore) || 100,
      rankingTier: cityForm.rankingTier || 'primary'
    };

    try {
      if (editingCity?._id) {
        const res = await adminAPI.updateCity(editingCity._id, payload);
        if (res.success) {
          toast.success(`City "${res.city.name}" updated successfully!`);
          setCities(prev => prev.map(c => c._id === editingCity._id ? res.city : c));
          setCityModalOpen(false);
        }
      } else {
        const res = await adminAPI.createCity(payload);
        if (res.success) {
          toast.success(`City "${res.city.name}" added successfully!`);
          setCities(prev => [...prev, res.city]);
          setCityModalOpen(false);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save city.');
    }
  };

  // Toggle City Status
  const handleToggleCityStatus = async (city) => {
    try {
      const nextStatus = city.status === 'active' ? 'inactive' : 'active';
      const res = await adminAPI.updateCity(city._id, { status: nextStatus });
      if (res.success) {
        toast.success(`City ${city.name} marked as ${nextStatus}.`);
        setCities(prev => prev.map(c => c._id === city._id ? { ...c, status: nextStatus } : c));
      }
    } catch (err) {
      toast.error('Failed to update city status.');
    }
  };

  // Delete City
  const handleDeleteCity = (id, cityName) => {
    setConfirmModalConfig({
      isOpen: true,
      title: `Delete City "${cityName}"`,
      message: `Are you sure you want to remove "${cityName}" from serviceable locations? Customers will not be able to select this city.`,
      confirmText: 'Delete City',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          const res = await adminAPI.deleteCity(id);
          if (res.success) {
            toast.success(`City "${cityName}" deleted successfully.`);
            setCities(prev => prev.filter(c => c._id !== id));
          }
        } catch (err) {
          toast.error('Failed to delete city.');
        } finally {
          setConfirmModalConfig(null);
        }
      }
    });
  };

  // Update User Role
  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const res = await adminAPI.updateUserRole(userId, newRole);
      if (res.success) {
        toast.success(`User role updated to ${newRole}.`);
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update user role.');
    }
  };

  // Delete User Account
  const handleDeleteUser = (userId, userName) => {
    setConfirmModalConfig({
      isOpen: true,
      title: `Delete User "${userName}"`,
      message: `Are you sure you want to delete user "${userName}"? This will terminate their account and access immediately.`,
      confirmText: 'Delete User',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          const res = await adminAPI.deleteUser(userId);
          if (res.success) {
            toast.success(`User "${userName}" removed.`);
            setUsers(prev => prev.filter(u => u._id !== userId));
          }
        } catch (err) {
          toast.error(err.message || 'Failed to delete user.');
        } finally {
          setConfirmModalConfig(null);
        }
      }
    });
  };

  const unreadMessagesCount = contactMessages.filter(m => m.status === 'unread').length;

  const filteredCategories = categories.filter(c => {
    const q = categorySearch.trim().toLowerCase();
    const matchesSearch = !q || (
      c.name?.toLowerCase().includes(q) ||
      c.slug?.toLowerCase().includes(q) ||
      c.tagline?.toLowerCase().includes(q)
    );
    const matchesStatus = categoryStatusFilter === 'all' || (
      categoryStatusFilter === 'active' ? Boolean(c.isActive) : !c.isActive
    );
    return matchesSearch && matchesStatus;
  });

  const filteredBookings = bookings.filter((b) => {
    const q = bookingSearch.trim().toLowerCase();
    const matchesSearch = !q || (
      b.bookingCode?.toLowerCase().includes(q) ||
      b.customer?.name?.toLowerCase().includes(q) ||
      b.customer?.phone?.includes(q) ||
      b.customer?.email?.toLowerCase().includes(q) ||
      b.cityName?.toLowerCase().includes(q)
    );
    const matchesStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
    const matchesCity = bookingCityFilter === 'all' || (
      (b.citySlug && b.citySlug.toLowerCase() === bookingCityFilter.toLowerCase()) ||
      (b.cityName && b.cityName.toLowerCase() === bookingCityFilter.toLowerCase())
    );
    const matchesPayment = bookingPaymentFilter === 'all' || (
      b.paymentStatus === bookingPaymentFilter || b.paymentMode === bookingPaymentFilter
    );
    return matchesSearch && matchesStatus && matchesCity && matchesPayment;
  });

  const filteredServices = services.filter((s) => {
    const q = serviceSearch.trim().toLowerCase();
    const matchesSearch = !q || (
      s.title?.toLowerCase().includes(q) ||
      s.slug?.toLowerCase().includes(q) ||
      s.shortDescription?.toLowerCase().includes(q)
    );
    const matchesCategory = serviceCategoryFilter === 'all' || (
      Array.isArray(s.categories) && s.categories.some(c => (typeof c === 'string' ? c === serviceCategoryFilter : (c._id === serviceCategoryFilter || c.slug === serviceCategoryFilter)))
    );
    const matchesPricingType = servicePricingTypeFilter === 'all' || (
      servicePricingTypeFilter === 'unit'
        ? (s.pricingType === 'unit' || s.pricingType === 'per_unit')
        : (s.pricingType !== 'unit' && s.pricingType !== 'per_unit')
    );
    const matchesCity = serviceCityFilter === 'all' || (
      serviceCityFilter === 'moradabad'
        ? true
        : (!s.moradabadOnly && Array.isArray(s.cityAvailability) && s.cityAvailability.includes(serviceCityFilter))
    );
    return matchesSearch && matchesCategory && matchesPricingType && matchesCity;
  });

  const filteredCitiesList = cities.filter(city => {
    const q = citySearch.trim().toLowerCase();
    const matchesSearch = !q || (
      city.name?.toLowerCase().includes(q) ||
      city.slug?.toLowerCase().includes(q) ||
      city.state?.toLowerCase().includes(q)
    );
    const matchesStatus = cityStatusFilter === 'all' || city.status === cityStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTestimonialsList = testimonials.filter(t => {
    const q = testimonialSearch.trim().toLowerCase();
    const matchesSearch = !q || (
      t.name?.toLowerCase().includes(q) ||
      t.city?.toLowerCase().includes(q) ||
      t.quote?.toLowerCase().includes(q)
    );
    const matchesStatus = testimonialStatusFilter === 'all' || (
      testimonialStatusFilter === 'active' ? Boolean(t.isActive) : !t.isActive
    );
    return matchesSearch && matchesStatus;
  });

  const filteredMessagesList = contactMessages.filter(m => {
    const q = messageSearch.trim().toLowerCase();
    const matchesSearch = !q || (
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phone?.includes(q) ||
      m.message?.toLowerCase().includes(q) ||
      m.subject?.toLowerCase().includes(q)
    );
    const matchesStatus = messageStatusFilter === 'all' || m.status === messageStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCouponsList = coupons.filter(c => {
    const q = couponSearch.trim().toLowerCase();
    const matchesSearch = !q || c.code?.toLowerCase().includes(q);
    const matchesStatus = couponStatusFilter === 'all' || (
      couponStatusFilter === 'active' ? Boolean(c.isActive) : !c.isActive
    );
    return matchesSearch && matchesStatus;
  });

  // Filtered Supervisors (Search by name, email, phone, city & status filter)
  const filteredSupervisorsList = supervisors.filter(s => {
    const q = supervisorSearch.trim().toLowerCase();
    const matchesSearch = !q || (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.city?.toLowerCase().includes(q)
    );
    const matchesStatus = supervisorStatusFilter === 'all' || s.status === supervisorStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Supervisor CRUD Handlers (Admin creates & manages supervisor credentials)
  const handleOpenCreateSupervisor = () => {
    setEditingSupervisor(null);
    setSupervisorForm({
      name: '',
      email: '',
      password: '',
      phone: '',
      city: cities[0]?.slug || 'moradabad',
      status: 'active'
    });
    setSupervisorModalOpen(true);
  };

  const handleOpenEditSupervisor = (sup) => {
    setEditingSupervisor(sup);
    setSupervisorForm({
      name: sup.name || '',
      email: sup.email || '',
      password: '',
      phone: sup.phone || '',
      city: sup.city || 'moradabad',
      status: sup.status || 'active'
    });
    setSupervisorModalOpen(true);
  };

  const handleSaveSupervisor = async (e) => {
    e.preventDefault();
    if (!supervisorForm.name.trim() || !supervisorForm.email.trim()) {
      toast.error('Name and email are required.');
      return;
    }
    if (!editingSupervisor && (!supervisorForm.password || supervisorForm.password.length < 6)) {
      toast.error('Password must be at least 6 characters for a new supervisor.');
      return;
    }
    setSavingSupervisor(true);
    try {
      if (editingSupervisor) {
        const payload = { ...supervisorForm };
        if (!payload.password) delete payload.password;
        const res = await adminAPI.updateSupervisor(editingSupervisor._id, payload);
        if (res.success && res.supervisor) {
          toast.success(`Supervisor "${res.supervisor.name}" updated successfully.`);
          setSupervisors(prev => prev.map(s => s._id === res.supervisor._id ? { ...s, ...res.supervisor } : s));
          setSupervisorModalOpen(false);
        }
      } else {
        const res = await adminAPI.createSupervisor(supervisorForm);
        if (res.success && res.supervisor) {
          toast.success(`Supervisor "${res.supervisor.name}" created successfully.`);
          setSupervisors(prev => [res.supervisor, ...prev]);
          setSupervisorModalOpen(false);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save supervisor.');
    } finally {
      setSavingSupervisor(false);
    }
  };

  const handleDeleteSupervisor = (sup) => {
    setConfirmModalConfig({
      title: `Delete Supervisor ${sup.name}?`,
      message: `Are you sure you want to delete supervisor ${sup.name} (${sup.email})? Any pending reservations assigned to them will be unlinked.`,
      confirmText: 'Delete Supervisor',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await adminAPI.deleteSupervisor(sup._id);
          if (res.success) {
            toast.success(`Supervisor ${sup.name} deleted successfully.`);
            setSupervisors(prev => prev.filter(s => s._id !== sup._id));
          }
        } catch (err) {
          toast.error(err.message || 'Failed to delete supervisor.');
        } finally {
          setConfirmModalConfig(null);
        }
      }
    });
  };

  const handleToggleSupervisorStatus = async (sup) => {
    const newStatus = sup.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await adminAPI.updateSupervisor(sup._id, { status: newStatus });
      if (res.success && res.supervisor) {
        toast.success(`Supervisor ${sup.name} status updated to ${newStatus}.`);
        setSupervisors(prev => prev.map(s => s._id === sup._id ? { ...s, status: newStatus } : s));
      }
    } catch (err) {
      toast.error('Failed to update supervisor status.');
    }
  };

  // Supervisor Booking Assignment Handlers
  const handleOpenAssignModal = (b) => {
    setAssignBooking(b);
    setAssignSupervisorId(b.supervisor?._id || b.supervisor || (b.assignedSupervisor?.id || ''));
    setAssignDate(b.assignedSlot?.date || (b.slot?.date ? b.slot.date : ''));
    setAssignTimeWindow(b.assignedSlot?.timeWindow || (b.slot?.window ? b.slot.window : '10:00 AM - 12:00 PM'));
    setAssignNote(b.assignedSlot?.notes || '');
    setAssignAllowConflict(false);
    setSlotConflictWarning(null);
    setAssignModalOpen(true);
  };

  // Real-time slot availability check whenever modal is open and date/slot/supervisor changes
  useEffect(() => {
    if (!assignModalOpen || !assignDate) {
      setSlotAvailability([]);
      setSlotConflictWarning(null);
      return;
    }

    let isMounted = true;
    const fetchAvailability = async () => {
      setCheckingAvailability(true);
      try {
        const res = await adminAPI.getSupervisorSlotAvailability({
          date: assignDate,
          timeWindow: assignTimeWindow,
          excludeBookingId: assignBooking?._id
        });
        if (isMounted && res?.success && res.supervisors) {
          setSlotAvailability(res.supervisors);
          if (assignSupervisorId) {
            const currentSup = res.supervisors.find(s => s._id === assignSupervisorId);
            if (currentSup && !currentSup.isAvailableInSlot && currentSup.conflictBooking) {
              setSlotConflictWarning(currentSup.conflictBooking);
            } else {
              setSlotConflictWarning(null);
            }
          }
        }
      } catch (err) {
        console.error('[Slot Availability Check Error]:', err);
      } finally {
        if (isMounted) setCheckingAvailability(false);
      }
    };

    fetchAvailability();
    return () => { isMounted = false; };
  }, [assignModalOpen, assignDate, assignTimeWindow, assignSupervisorId, assignBooking?._id]);

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!assignSupervisorId) {
      toast.error('Please select a supervisor to assign.');
      return;
    }
    setAssigningSupervisor(true);
    try {
      const payload = {
        supervisorId: assignSupervisorId,
        assignedSlot: {
          date: assignDate,
          timeWindow: assignTimeWindow,
          notes: assignNote
        },
        allowConflict: assignAllowConflict
      };
      const res = await adminAPI.assignBookingSupervisor(assignBooking._id, payload);
      if (res.success && res.booking) {
        toast.success(res.message || 'Supervisor and slot assigned successfully!');
        setBookings(prev => prev.map(b => b._id === res.booking._id ? { ...b, ...res.booking } : b));
        if (viewBookingDetails && viewBookingDetails._id === res.booking._id) {
          setViewBookingDetails(prev => ({ ...prev, ...res.booking }));
        }
        setAssignModalOpen(false);
      }
    } catch (err) {
      if (err.conflict || err.status === 409 || err.message?.includes('Conflict')) {
        toast.error(err.message || 'Time slot conflict detected!');
        setSlotConflictWarning(err.conflictingBooking || { bookingCode: 'Conflict', timeWindow: assignTimeWindow });
      } else {
        toast.error(err.message || 'Failed to assign supervisor.');
      }
    } finally {
      setAssigningSupervisor(false);
    }
  };

  // Cloudinary Service Video Upload Handler
  const handleServiceVideoUpload = async (e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Enforce 50MB enterprise limit
    const MAX_SIZE_MB = 50;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      toast.error(`Video exceeds ${MAX_SIZE_MB}MB limit. Selected video is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Please select or compress under 50MB.`);
      e.target.value = '';
      return;
    }

    setUploadingServiceVideo(true);
    try {
      const res = await adminAPI.uploadVideo(file, 'max-housekeeping/services/videos');
      if (res && (res.url || res.data?.url)) {
        const videoUrl = res.url || res.data?.url;
        setter(prev => ({ ...prev, uploadedVideoUrl: videoUrl, videoUrl }));
        toast.success('Demonstration video uploaded to Cloudinary successfully!');
      } else {
        toast.error('Upload succeeded, but video URL was missing.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to upload video to Cloudinary.');
    } finally {
      setUploadingServiceVideo(false);
      e.target.value = '';
    }
  };

  const adminTabs = [
    { id: 'bookings', label: 'Bookings & Dispatch', icon: LuCalendar, count: bookings.length },
    { id: 'supervisors', label: 'Supervisors & Staff', icon: LuShieldCheck, count: supervisors.length },
    { id: 'services', label: 'Services & Dual-Pricing', icon: LuSparkles, count: services.length },
    { id: 'categories', label: 'Category Management', icon: LuLayers, count: categories.length },
    { id: 'cities', label: 'Cities & Regions', icon: LuMapPin, count: cities.length },
    { id: 'users', label: 'Users Database', icon: LuUsers, count: users.length },
    { id: 'testimonials', label: 'Testimonials', icon: LuStar, count: testimonials.length },
    { id: 'messages', label: 'Inquiries', icon: LuMail, count: unreadMessagesCount, isAlert: unreadMessagesCount > 0 },
    { id: 'coupons', label: 'Coupons & Promos', icon: LuTicket, count: coupons.length },
    { id: 'settings', label: 'Business Settings', icon: LuSettings }
  ];

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center p-8 text-center font-mono text-xs text-[#6B8077]">
        VERIFYING ADMIN PRIVILEGES...
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="bg-[#F4EFE6] min-h-screen">
      {/* Secondary Sticky Bar for Small Devices (Tablets & Phones) */}
      <div className="lg:hidden sticky top-16 z-30 bg-[#10231D] text-[#F4EFE6] px-4 py-3 border-b border-[#2C4A3E] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#E9A23B] text-[#10231D] flex items-center justify-center font-black text-xs">
            M
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#E9A23B]">Admin Console</div>
            <div className="text-xs font-bold text-[#F4EFE6]">
              {adminTabs.find(t => t.id === activeTab)?.label || 'Console'}
            </div>
          </div>
        </div>

        {/* Secondary Hamburger Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold transition-colors cursor-pointer"
          aria-label="Toggle Admin Sidebar"
        >
          {mobileSidebarOpen ? (
            <LuX className="w-4 h-4 text-[#E9A23B]" />
          ) : (
            <LuMenu className="w-4 h-4 text-[#E9A23B]" />
          )}
          <span>{mobileSidebarOpen ? 'Close Menu' : 'Admin Menu'}</span>
        </button>
      </div>

      {/* Mobile Slide-over Drawer Backdrop & Panel */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-[#10231D] text-[#F4EFE6] h-full shadow-2xl p-5 flex flex-col justify-between overflow-y-auto z-10 border-r border-[#2C4A3E]">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E9A23B] text-[#10231D] flex items-center justify-center font-display font-black text-sm">
                    M
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-[#F4EFE6]">Max Admin</h4>
                    <p className="text-[10px] text-[#A3B8B0]">Navigation Console</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <LuX className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Tab Items */}
              <nav className="space-y-1.5">
                {adminTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#E9A23B] text-[#10231D] shadow-md font-black'
                          : 'text-[#F4EFE6] hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#10231D]' : 'text-[#E9A23B]'}`} />
                        <span>{tab.label}</span>
                      </div>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            tab.isAlert
                              ? 'bg-[#C2512D] text-white animate-pulse'
                              : isActive
                              ? 'bg-[#10231D] text-[#E9A23B]'
                              : 'bg-white/15 text-[#F4EFE6]'
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-white/10 text-[11px] text-[#A3B8B0]">
              <p className="truncate font-medium">{user?.name}</p>
              <p className="text-[10px] truncate text-[#6B8077]">{user?.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Desktop Container with Left Sidebar */}
      <div className="container mx-auto px-4 max-w-7xl py-6 lg:py-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Desktop Left Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0 sticky top-24">
            <div className="rounded-3xl bg-[#10231D] text-[#F4EFE6] p-5 shadow-xl border border-[#2C4A3E]">
              {/* Sidebar Header */}
              <div className="pb-4 border-b border-white/10 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E9A23B] to-[#D48E28] text-[#10231D] flex items-center justify-center font-display font-black text-lg shadow-md">
                    M
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E9A23B]">
                      MANAGEMENT
                    </span>
                    <h3 className="font-display font-bold text-base text-[#F4EFE6]">
                      Admin Console
                    </h3>
                  </div>
                </div>
                <div className="mt-3 p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px]">
                  <p className="font-bold text-white truncate">{user?.name}</p>
                  <p className="text-[#A3B8B0] text-[10px] truncate">{user?.email}</p>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1.5">
                {adminTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-[#E9A23B] text-[#10231D] shadow-lg translate-x-1 font-black'
                          : 'text-[#F4EFE6] hover:bg-white/10 hover:translate-x-0.5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#10231D]' : 'text-[#E9A23B]'}`} />
                        <span>{tab.label}</span>
                      </div>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            tab.isAlert
                              ? 'bg-[#C2512D] text-white animate-pulse'
                              : isActive
                              ? 'bg-[#10231D] text-[#E9A23B]'
                              : 'bg-white/15 text-[#F4EFE6]'
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Sidebar Footer Status */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-[#A3B8B0]">
                {/* <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
                  <span>System Active</span>
                </div> */}
                {/* <span className="font-mono text-[10px] text-[#E9A23B]">Dispatch On</span> */}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 w-full">
            {/* Header Title Section (clean without wrapped tabs) */}
            <div className="pb-6 border-b border-[#E2D9C8] mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E9A23B]">
                  ADMINISTRATIVE OVERVIEW
                </span>
                <h1 className="font-display font-black text-3xl sm:text-4xl text-[#10231D]">
                  {adminTabs.find(t => t.id === activeTab)?.label || 'Control Panel'}
                </h1>
                <p className="text-xs text-[#6B8077] mt-1">
                  Automated Email Dispatch Active · Manage reservations, inventory prices, coverage, and clients.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                {/* <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#DDEBE4] text-[#10231D] text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#25D366]"></span>
                  Live Server
                </span> */}
              </div>
            </div>

            {/* Overview Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8]">
                <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#6B8077]">TOTAL ORDERS</span>
                <p className="font-display font-black text-2xl sm:text-3xl text-[#10231D] mt-1 tnum truncate">
                  {stats?.totalBookings || 0}
                </p>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8]">
                <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#6B8077]">ACTIVE CITIES</span>
                <p className="font-display font-black text-2xl sm:text-3xl text-[#E9A23B] mt-1 tnum truncate">
                  {cities.filter(c => c.status === 'active').length || cities.length}
                </p>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8]">
                <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#6B8077]">TOTAL REVENUE</span>
                <p className="font-display font-black text-2xl sm:text-3xl text-[#10231D] mt-1 tnum truncate">
                  ₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8]">
                <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#6B8077]">REGISTERED USERS</span>
                <p className="font-display font-black text-2xl sm:text-3xl text-[#10231D] mt-1 tnum truncate">
                  {users.length}
                </p>
              </div>
            </div>

        {/* ========================================================
            TAB 1: BOOKINGS MANAGEMENT
        ======================================================== */}
        {activeTab === 'bookings' && (
          <div className="p-6 rounded-3xl bg-[#ECE5D8] border border-[#E2D9C8] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h3 className="font-display font-bold text-xl text-[#10231D]">
                All Cleaning Reservations ({bookings.length})
              </h3>
              <span className="text-xs font-mono text-[#6B8077]">
                Showing {filteredBookings.length} of {bookings.length} reservations
              </span>
            </div>

            {/* Search and Filters Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 p-3 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8]">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Search input */}
                <div className="relative flex-1 min-w-[200px]">
                  <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="Search by code, customer, phone, city..."
                    className="w-full pl-9 pr-7 py-2 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] placeholder-[#6B8077] focus:outline-none focus:border-[#E9A23B]"
                  />
                  {bookingSearch && (
                    <button
                      type="button"
                      onClick={() => setBookingSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#6B8077] hover:text-[#10231D] cursor-pointer"
                    >
                      <LuX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { val: 'all', label: 'All Status' },
                    { val: 'pending', label: 'Pending' },
                    { val: 'confirmed', label: 'Confirmed' },
                    { val: 'in_progress', label: 'In Progress' },
                    { val: 'completed', label: 'Completed' },
                    { val: 'cancelled', label: 'Cancelled' }
                  ].map((st) => (
                    <button
                      key={st.val}
                      type="button"
                      onClick={() => setBookingStatusFilter(st.val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer ${
                        bookingStatusFilter === st.val
                          ? 'bg-[#10231D] text-[#F4EFE6] shadow-xs'
                          : 'bg-[#ECE5D8] text-[#3D524A] hover:bg-[#E2D9C8] border border-[#E2D9C8]'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
                {/* City Filter Dropdown */}
                <select
                  value={bookingCityFilter}
                  onChange={(e) => setBookingCityFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-bold text-[#10231D] cursor-pointer"
                >
                  <option value="all">All Cities</option>
                  {cities.map(c => (
                    <option key={c._id || c.slug} value={c.slug || c.name}>{c.name}</option>
                  ))}
                </select>

                {/* Payment Filter Dropdown */}
                <select
                  value={bookingPaymentFilter}
                  onChange={(e) => setBookingPaymentFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-bold text-[#10231D] cursor-pointer"
                >
                  <option value="all">All Payments</option>
                  <option value="cash_on_service">Cash on Service</option>
                  <option value="online_before">Online Paid</option>
                  <option value="paid">Status: Paid</option>
                  <option value="pending">Status: Pending</option>
                </select>
              </div>

              {(bookingSearch || bookingStatusFilter !== 'all' || bookingCityFilter !== 'all' || bookingPaymentFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setBookingSearch('');
                    setBookingStatusFilter('all');
                    setBookingCityFilter('all');
                    setBookingPaymentFilter('all');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#ECE5D8] hover:bg-[#E2D9C8] text-[#C2512D] text-xs font-bold transition-colors self-start md:self-auto cursor-pointer"
                >
                  <LuRotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2D9C8] text-[#6B8077] font-mono uppercase">
                    <th className="py-3 px-3">Order Code</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">City & Address</th>
                    <th className="py-3 px-3">Slot Date</th>
                    <th className="py-3 px-3">Total Payable</th>
                    <th className="py-3 px-3">Status Action</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2D9C8]/60">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-xs text-[#6B8077]">
                        No bookings match your current search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => (
                      <tr key={b._id} className="hover:bg-[#F4EFE6]/50">
                        <td className="py-3 px-3 font-mono font-bold text-[#10231D]">
                          <p>{b.bookingCode}</p>
                          {b.serviceOtp && (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-md mt-1 ${
                              b.otpVerified
                                ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              <LuKey className="w-2.5 h-2.5" />
                              <span>{b.otpVerified ? 'OTP Verified' : 'Arrival OTP Pending'}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-[#10231D]">{b.customer?.name}</p>
                          <p className="text-[#6B8077]">{b.customer?.phone}</p>
                          {b.customer?.email && (
                            <p className="text-[10px] text-[#3D524A]">{b.customer?.email}</p>
                          )}
                        </td>
                        <td className="py-3 px-3 max-w-[200px] truncate">
                          <span className="font-semibold text-[#10231D]">{b.cityName}</span>: {b.address?.line1}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#3D524A]">
                          <p>{b.assignedSlot?.date || b.slot?.date} ({b.assignedSlot?.timeWindow?.split(' ')[0] || b.slot?.window?.split(' ')[0] || 'Scheduled'})</p>
                          <div className="mt-1">
                            {b.assignedSupervisor?.name || b.supervisor?.name ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <LuShieldCheck className="w-3 h-3 text-emerald-700" />
                                <span>{b.assignedSupervisor?.name || b.supervisor?.name}</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenAssignModal(b)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-full cursor-pointer transition-colors"
                              >
                                <LuUserCheck className="w-3 h-3" />
                                <span>+ Assign Supervisor</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-black text-[#10231D] tnum">
                          ₹{(b.totals?.total ?? b.total ?? 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 min-w-[140px]">
                          <CustomSelect
                            value={b.status}
                            onChange={(val) => handleUpdateBookingStatus(b._id, val)}
                            options={[
                              { value: 'pending', label: 'Pending' },
                              { value: 'confirmed', label: 'Confirmed' },
                              { value: 'in_progress', label: 'In Progress' },
                              { value: 'completed', label: 'Completed' },
                              { value: 'cancelled', label: 'Cancelled' }
                            ]}
                            placeholder="Status..."
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(b)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                              title="Assign Supervisor & Slot"
                            >
                              <LuShieldCheck className="w-3.5 h-3.5 text-[#E9A23B]" />
                              <span>{b.assignedSupervisor?.name || b.supervisor?.name ? 'Reassign' : 'Assign'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewBookingDetails(b)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#E9A23B] hover:bg-[#D48E28] text-[#10231D] font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                              title="View Full Booking Details"
                            >
                              <LuEye className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </button>
                            {(b.assignedSupervisor?.name || b.supervisor?.name || b.assignedSupervisor || b.supervisor) && (
                              <button
                                type="button"
                                onClick={() => setTrackingBookingAdmin(b)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                title="Track Supervisor Real-Time Location & Route"
                              >
                                <LuNavigation className="w-3.5 h-3.5 text-[#25D366] animate-pulse" />
                                <span>Track Location</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setChatBooking(b)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span>Chat</span>
                              {b.messages?.length > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-[#E9A23B] text-[#10231D] text-[10px] font-black">
                                  {b.messages.length}
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBooking(b._id, b.bookingCode)}
                              title="Delete booking permanently"
                              className="p-1.5 rounded-lg border border-[#C2512D]/40 text-[#C2512D] hover:bg-[#C2512D] hover:text-white transition-colors cursor-pointer"
                            >
                              <LuTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB: FIELD SUPERVISORS & DISPATCH MANAGEMENT
        ======================================================== */}
        {activeTab === 'supervisors' && (
          <div className="p-6 rounded-3xl bg-[#ECE5D8] border border-[#E2D9C8] shadow-sm space-y-6">
            {/* Header with Title and Create Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E9A23B] bg-[#10231D] px-2.5 py-0.5 rounded-full">
                    URBAN COMPANY / PRONTO DISPATCH
                  </span>
                  <span className="text-xs font-mono text-[#6B8077]">
                    {supervisors.length} Field Personnel
                  </span>
                </div>
                <h3 className="font-display font-bold text-2xl text-[#10231D]">
                  Field Supervisors & On-Site Dispatch
                </h3>
                <p className="text-xs text-[#6B8077] mt-0.5 max-w-2xl">
                  Create secure supervisor login credentials, assign supervisors to service reservations, and monitor on-site customer OTP verifications and before/after inspection photos.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenCreateSupervisor}
                className="px-4 py-2.5 rounded-2xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] font-bold text-xs flex items-center gap-2 shadow-md transition-all self-start sm:self-auto cursor-pointer"
              >
                <LuPlus className="w-4 h-4 text-[#E9A23B]" />
                <span>+ Create Supervisor Account</span>
              </button>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-[#E2D9C8] shadow-2xs">
                <span className="text-[10px] font-mono text-[#6B8077] uppercase block mb-1">Total Supervisors</span>
                <p className="font-display text-2xl font-black text-[#10231D]">{supervisors.length}</p>
                <p className="text-[10px] text-[#6B8077] mt-0.5">Admin-authorized IDs</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E2D9C8] shadow-2xs">
                <span className="text-[10px] font-mono text-[#6B8077] uppercase block mb-1">Active On-Duty</span>
                <p className="font-display text-2xl font-black text-emerald-700">
                  {supervisors.filter(s => s.status === 'active').length}
                </p>
                <p className="text-[10px] text-emerald-600 mt-0.5">Available for dispatch</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E2D9C8] shadow-2xs">
                <span className="text-[10px] font-mono text-[#6B8077] uppercase block mb-1">Assigned Bookings</span>
                <p className="font-display text-2xl font-black text-[#10231D]">
                  {bookings.filter(b => b.assignedSupervisor?.name || b.supervisor).length}
                </p>
                <p className="text-[10px] text-[#6B8077] mt-0.5">Reservations covered</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E2D9C8] shadow-2xs">
                <span className="text-[10px] font-mono text-[#6B8077] uppercase block mb-1">OTP Verified Visits</span>
                <p className="font-display text-2xl font-black text-[#E9A23B]">
                  {bookings.filter(b => b.otpVerified).length}
                </p>
                <p className="text-[10px] text-[#6B8077] mt-0.5">Secure arrival handshakes</p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8]">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative flex-1 min-w-[200px]">
                  <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                  <input
                    type="text"
                    value={supervisorSearch}
                    onChange={(e) => setSupervisorSearch(e.target.value)}
                    placeholder="Search supervisors by name, email, phone, city..."
                    className="w-full pl-9 pr-7 py-2 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] placeholder-[#6B8077] focus:outline-none focus:border-[#E9A23B]"
                  />
                  {supervisorSearch && (
                    <button
                      type="button"
                      onClick={() => setSupervisorSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#6B8077] hover:text-[#10231D] cursor-pointer"
                    >
                      <LuX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {[
                    { val: 'all', label: 'All Status' },
                    { val: 'active', label: 'Active' },
                    { val: 'suspended', label: 'Suspended' }
                  ].map(st => (
                    <button
                      key={st.val}
                      type="button"
                      onClick={() => setSupervisorStatusFilter(st.val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer ${
                        supervisorStatusFilter === st.val
                          ? 'bg-[#10231D] text-[#F4EFE6] shadow-xs'
                          : 'bg-[#ECE5D8] text-[#3D524A] hover:bg-[#E2D9C8] border border-[#E2D9C8]'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {(supervisorSearch || supervisorStatusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSupervisorSearch('');
                    setSupervisorStatusFilter('all');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#ECE5D8] hover:bg-[#E2D9C8] text-[#C2512D] text-xs font-bold transition-colors self-start md:self-auto cursor-pointer"
                >
                  <LuRotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>

            {/* Supervisors Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2D9C8] text-[#6B8077] font-mono uppercase">
                    <th className="py-3 px-3">Supervisor Name</th>
                    <th className="py-3 px-3">Contact Email & Phone</th>
                    <th className="py-3 px-3">City Region</th>
                    <th className="py-3 px-3 text-center">Assigned Jobs</th>
                    <th className="py-3 px-3 text-center">Completed</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2D9C8]/60">
                  {filteredSupervisorsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-[#6B8077]">
                        <p className="font-bold text-[#10231D] mb-1">No supervisor accounts found.</p>
                        <p>Click "+ Create Supervisor Account" above to register field supervisors.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSupervisorsList.map((sup) => {
                      const supBookings = bookings.filter(b =>
                        String(b.supervisor?._id || b.supervisor || b.assignedSupervisor?.id) === String(sup._id)
                      );
                      const completedCount = supBookings.filter(b => b.status === 'completed').length;
                      return (
                        <tr key={sup._id} className="hover:bg-[#F4EFE6]/50">
                          <td className="py-3 px-3 font-bold text-[#10231D]">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-[#10231D] text-[#E9A23B] flex items-center justify-center font-bold text-xs shrink-0">
                                {sup.name?.charAt(0)?.toUpperCase() || 'S'}
                              </div>
                              <div>
                                <p className="font-bold text-xs text-[#10231D]">{sup.name}</p>
                                <span className="text-[10px] font-mono text-[#6B8077]">ID: {sup._id?.slice(-6)}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-medium text-[#10231D] flex items-center gap-1.5">
                              <LuMail className="w-3 h-3 text-[#E9A23B]" />
                              <span>{sup.email}</span>
                            </p>
                            {sup.phone && (
                              <p className="text-[11px] text-[#6B8077] flex items-center gap-1.5 mt-0.5">
                                <LuPhone className="w-3 h-3 text-[#6B8077]" />
                                <span>{sup.phone}</span>
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="capitalize font-mono px-2 py-0.5 rounded-full bg-white border border-[#E2D9C8] text-[#10231D] text-[10px] font-bold">
                              {sup.city || 'moradabad'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-xs text-[#10231D]">
                            {supBookings.length}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-xs text-emerald-700">
                            {completedCount}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              sup.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {sup.status || 'active'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditSupervisor(sup)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#ECE5D8] hover:bg-[#E2D9C8] text-[#10231D] font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                title="Edit supervisor details"
                              >
                                <LuSquarePen className="w-3.5 h-3.5 text-[#E9A23B]" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleSupervisorStatus(sup)}
                                className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer ${
                                  sup.status === 'active'
                                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                                    : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                                }`}
                                title="Toggle active status"
                              >
                                <LuShieldCheck className="w-3.5 h-3.5" />
                                <span>{sup.status === 'active' ? 'Suspend' : 'Activate'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSupervisor(sup)}
                                className="p-1.5 rounded-lg border border-[#C2512D]/40 text-[#C2512D] hover:bg-[#C2512D] hover:text-white transition-colors cursor-pointer"
                                title="Delete supervisor account"
                              >
                                <LuTrash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: SERVICES & DUAL-PRICING MANAGEMENT
        ======================================================== */}
        {activeTab === 'services' && (
          <div className="p-6 rounded-3xl bg-[#ECE5D8] border border-[#E2D9C8] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
              <div>
                <h3 className="font-display font-bold text-xl text-[#10231D] flex items-center gap-2">
                  <span>Shown Price (MRP) vs Offered Price Control</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#E9A23B] text-[#10231D]">
                    {services.length} Services
                  </span>
                </h3>
                <p className="text-xs text-[#6B8077] mt-0.5">
                  Update customer crossed-out strikethrough price, real payable price, and Cloudinary media photos.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateServiceModal}
                className="px-4 py-2.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#181511] font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
              >
                <LuPlus className="w-4 h-4" />
                <span>Add New Service</span>
              </button>
            </div>

            {/* Search and Filters Bar for Services */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 p-3 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8]">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Search input */}
                <div className="relative flex-1 min-w-[200px]">
                  <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="Search services by title, slug, keywords..."
                    className="w-full pl-9 pr-7 py-2 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] placeholder-[#6B8077] focus:outline-none focus:border-[#E9A23B]"
                  />
                  {serviceSearch && (
                    <button
                      type="button"
                      onClick={() => setServiceSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#6B8077] hover:text-[#10231D] cursor-pointer"
                    >
                      <LuX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <select
                  value={serviceCategoryFilter}
                  onChange={(e) => setServiceCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-bold text-[#10231D] cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c._id || c.slug} value={c._id || c.slug}>{c.name}</option>
                  ))}
                </select>

                {/* Pricing Type Filter */}
                <select
                  value={servicePricingTypeFilter}
                  onChange={(e) => setServicePricingTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-bold text-[#10231D] cursor-pointer"
                >
                  <option value="all">All Pricing Types</option>
                  <option value="normal">Standard / BHK Variants</option>
                  <option value="unit">Per Sq. Ft. / Unit Calculator</option>
                </select>

                {/* City Filter */}
                <select
                  value={serviceCityFilter}
                  onChange={(e) => setServiceCityFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-bold text-[#10231D] cursor-pointer"
                >
                  <option value="all">All Service Cities</option>
                  <option value="moradabad">Moradabad</option>
                  {cities.filter(c => c.slug !== 'moradabad').map(c => (
                    <option key={c._id || c.slug} value={c.slug || c.name.toLowerCase()}>{c.name}</option>
                  ))}
                </select>
              </div>

              {(serviceSearch || serviceCategoryFilter !== 'all' || servicePricingTypeFilter !== 'all' || serviceCityFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setServiceSearch('');
                    setServiceCategoryFilter('all');
                    setServicePricingTypeFilter('all');
                    setServiceCityFilter('all');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#ECE5D8] hover:bg-[#E2D9C8] text-[#C2512D] text-xs font-bold transition-colors self-start md:self-auto cursor-pointer"
                >
                  <LuRotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.length === 0 ? (
                <div className="col-span-full py-12 text-center text-[#6B8077]">
                  <LuSparkles className="w-8 h-8 mx-auto mb-2 text-[#E9A23B] opacity-50" />
                  <p className="text-sm font-bold text-[#10231D]">No services match your current filters</p>
                  <p className="text-xs text-[#6B8077] mt-1">Try resetting the search keyword or selecting a different category/city.</p>
                </div>
              ) : (
                filteredServices.map((svc) => {
                const savings = (svc.mrp || svc.price) - svc.price;
                const discountPct = svc.mrp ? Math.round(((svc.mrp - svc.price) / svc.mrp) * 100) : 0;

                return (
                  <div
                    key={svc._id}
                    className="p-5 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8] flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      {/* Media Image Preview / Interactive Carousel */}
                      <div className="mb-3">
                        <ServiceCarousel service={svc} mode="card" className="h-36 rounded-xl overflow-hidden bg-[#ECE5D8]" />
                      </div>

                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="flex flex-wrap gap-1">
                          {(svc.categories && svc.categories.length > 0
                            ? svc.categories
                            : (svc.categoryNames && svc.categoryNames.length > 0
                              ? svc.categoryNames.map(n => ({ name: n }))
                              : [{ name: svc.categoryName || 'Cleaning' }]
                            )
                          ).map((c, cIdx) => (
                            <span key={cIdx} className="text-[10px] font-mono uppercase text-[#10231D] bg-[#E9A23B]/20 border border-[#E9A23B]/40 px-2 py-0.5 rounded-md font-bold">
                              {c.name || c}
                            </span>
                          ))}
                        </div>
                        {discountPct > 0 && (
                          <span className="text-[11px] font-black text-[#C2512D] bg-[#F9ECE8] px-2 py-0.5 rounded-full shrink-0">
                            {discountPct}% OFF
                          </span>
                        )}
                      </div>

                      <h4 className="font-display font-bold text-lg text-[#10231D] mb-2">
                        {svc.title}
                      </h4>

                      {/* Variants Summary Badge */}
                      {svc.optionGroups?.[0]?.options?.length > 1 && (
                        <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-[#ECE5D8] border border-[#E2D9C8] flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[#10231D] flex items-center gap-1 shrink-0">
                            <LuTicket className="w-3.5 h-3.5 text-[#E9A23B]" />
                            <span>{svc.optionGroups[0].options.length} Variants</span>
                          </span>
                          <span className="text-[#6B8077] truncate max-w-[150px] text-right">
                            {svc.optionGroups[0].options.map(o => o.label).slice(0, 3).join(', ')}{svc.optionGroups[0].options.length > 3 ? '...' : ''}
                          </span>
                        </div>
                      )}

                      {/* Unit Pricing / City Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {svc.pricingType === 'unit' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#10231D] text-[#E9A23B] flex items-center gap-1 font-mono">
                            <LuRuler className="w-3 h-3" />
                            <span>Per {svc.unitLabel || 'Sq. Ft.'} Calc</span>
                          </span>
                        )}
                        {svc.cityAvailability && svc.cityAvailability.length > 0 && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            svc.cityAvailability.length === 1 && svc.cityAvailability[0] === 'moradabad'
                              ? 'bg-amber-500/15 text-amber-900 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-900 border border-emerald-500/30'
                          }`}>
                            <LuMapPin className="w-3 h-3" />
                            <span>{svc.cityAvailability.length === 1 && svc.cityAvailability[0] === 'moradabad' ? 'Moradabad Only' : `${svc.cityAvailability.length} Cities Active`}</span>
                          </span>
                        )}
                        {svc.rankingScore !== undefined && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#10231D] text-[#E9A23B] flex items-center gap-1 font-mono">
                            <span>Rank {svc.rankingScore}</span>
                          </span>
                        )}
                        {svc.rankingTier && svc.rankingTier !== 'standard' && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase font-mono ${
                            svc.rankingTier === 'bestseller'
                              ? 'bg-[#E9A23B] text-[#10231D]'
                              : svc.rankingTier === 'top_rated'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-orange-100 text-orange-900 border border-orange-300'
                          }`}>
                            {svc.rankingTier.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      {/* Scaling & SEO Tags */}
                      {Array.isArray(svc.tags) && svc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {svc.tags.slice(0, 4).map((t, tIdx) => (
                            <span key={tIdx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/80 text-[#3D524A] border border-[#E2D9C8]">
                              #{t}
                            </span>
                          ))}
                          {svc.tags.length > 4 && (
                            <span className="text-[9px] text-[#6B8077] self-center font-mono">
                              +{svc.tags.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Pricing Comparison */}
                      <div className="p-3 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] space-y-1 mb-4 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#6B8077]">Shown Price (MRP):</span>
                          <span className="font-bold line-through text-[#6B8077] tnum">
                            ₹{svc.mrp.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#10231D] font-bold">Offered Price (Payable):</span>
                          <span className="font-black text-sm text-[#10231D] tnum">
                            ₹{svc.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between text-[#C2512D] font-bold pt-1 border-t border-[#E2D9C8]">
                          <span>User Savings:</span>
                          <span className="tnum">₹{savings.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => openEditService(svc)}
                        className="flex-1 py-2.5 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                      >
                        <LuSquarePen className="w-4 h-4 text-[#E9A23B]" />
                        <span>Edit Prices & Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(svc._id, svc.title)}
                        className="p-2.5 rounded-xl bg-[#F9ECE8] hover:bg-[#F2D7D1] text-[#C2512D] border border-[#F2D7D1] transition-colors"
                        title="Delete Service"
                      >
                        <LuTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB: CATEGORY MANAGEMENT
        ======================================================== */}
        {activeTab === 'categories' && (
          <div className="p-6 rounded-3xl bg-[#ECE5D8] border border-[#E2D9C8] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="font-display font-bold text-xl text-[#10231D] flex items-center gap-2">
                  <span>Category Management</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#E9A23B] text-[#10231D]">
                    {categories.length} Categories
                  </span>
                </h3>
                <p className="text-xs text-[#6B8077] mt-0.5">
                  Organize services under multiple categories, configure URLs, descriptions, and hero banner photos.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCreateCategoryOpen}
                className="px-4 py-2.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#181511] font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-sm cursor-pointer"
              >
                <LuPlus className="w-4 h-4" />
                <span>Add New Category</span>
              </button>
            </div>

            {/* Filter Search */}
            <div className="mb-6 max-w-sm">
              <div className="relative">
                <LuSearch className="w-4 h-4 text-[#6B8077] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search categories by name, slug or description..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-xs text-[#10231D] focus:outline-none focus:border-[#E9A23B]"
                />
              </div>
            </div>

            {/* Categories Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCategories.map((cat) => (
                <div
                  key={cat._id}
                  className="p-5 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8] flex flex-col justify-between shadow-xs hover:border-[#E9A23B]/60 transition-all"
                >
                  <div>
                    {/* Category Image or Icon Header */}
                    <div className="h-36 rounded-xl overflow-hidden mb-3 bg-[#ECE5D8] relative border border-[#E2D9C8]">
                      {cat.image?.url ? (
                        <img
                          src={cat.image.url}
                          alt={cat.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#10231D]/5">
                          <LuLayers className="w-12 h-12 text-[#E9A23B]/40" />
                        </div>
                      )}
                      <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        cat.isActive ? 'bg-emerald-500/90 text-white' : 'bg-gray-500/90 text-white'
                      }`}>
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-[#10231D]/80 text-[#E9A23B] backdrop-blur-xs">
                        Order #{cat.sortOrder ?? 0}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="font-display font-bold text-base text-[#10231D]">
                        {cat.name}
                      </h4>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#ECE5D8] text-[#10231D] shrink-0">
                        {cat.serviceCount ?? 0} {cat.serviceCount === 1 ? 'service' : 'services'}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-[#E9A23B] font-semibold mb-2">
                      /{cat.slug}
                    </div>

                    {cat.tagline && (
                      <p className="text-xs text-[#6B8077] line-clamp-2 mb-3">
                        {cat.tagline}
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-[#E2D9C8] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleCategoryActive(cat)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        cat.isActive
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }`}
                    >
                      {cat.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditCategory(cat)}
                        className="p-1.5 rounded-lg bg-[#ECE5D8] hover:bg-[#E9A23B] hover:text-[#10231D] text-[#10231D] transition-colors cursor-pointer"
                        title="Edit Category"
                      >
                        <LuSquarePen className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat._id, cat.name)}
                        className="p-1.5 rounded-lg bg-red-100 hover:bg-red-500 hover:text-white text-red-700 transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <LuTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredCategories.length === 0 && (
                <div className="col-span-full py-12 text-center text-xs text-[#6B8077]">
                  No categories match your search.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: TESTIMONIALS MANAGEMENT (FORM UPLOAD & TABLE)
        ======================================================== */}
        {activeTab === 'testimonials' && (
          <div className="p-6 rounded-3xl bg-[#ECE5D8] border border-[#E2D9C8] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="font-display font-bold text-xl text-[#10231D]">
                  Customer Testimonials ({testimonials.length})
                </h3>
                <p className="text-xs text-[#6B8077] mt-0.5">
                  Manage homeowner reviews displayed on the Home Page. Upload client avatars directly via Cloudinary.
                </p>
              </div>

              <button
                type="button"
                onClick={() => openTestimonialModal()}
                className="px-5 py-2.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#181511] font-bold text-xs tracking-wide transition-all shadow-sm flex items-center gap-2 shrink-0"
              >
                <LuPlus className="w-4 h-4" />
                <span>Upload New Testimonial</span>
              </button>
            </div>

            {/* Testimonials Management Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2D9C8] text-[#6B8077] font-mono uppercase">
                    <th className="py-3 px-3">Avatar</th>
                    <th className="py-3 px-3">Client Name</th>
                    <th className="py-3 px-3">Role & City</th>
                    <th className="py-3 px-3">Rating</th>
                    <th className="py-3 px-3 max-w-[320px]">Review Quote</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2D9C8]/60">
                  {testimonials.map((test) => {
                    const initials = (test.name || 'C')
                      .split(' ')
                      .map(p => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <tr key={test._id || test.name} className="hover:bg-[#F4EFE6]/50">
                        {/* Avatar Column */}
                        <td className="py-3 px-3">
                          {test.avatar ? (
                            <img
                              src={test.avatar}
                              alt={test.name}
                              className="w-9 h-9 rounded-full object-cover border border-[#E9A23B] shadow-xs"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#10231D] text-[#E9A23B] font-bold text-xs flex items-center justify-center">
                              {initials}
                            </div>
                          )}
                        </td>

                        {/* Name Column */}
                        <td className="py-3 px-3 font-bold text-[#10231D]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{test.name}</span>
                            {test.videoUrl && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#10231D] text-[#E9A23B] text-[9px] font-mono font-bold uppercase">
                                <LuVideo className="w-2.5 h-2.5" /> VIDEO
                              </span>
                            )}
                          </div>
                          {test.serviceTitle && (
                            <span className="block text-[10px] font-medium text-[#6B8077]">
                              {test.serviceTitle}
                            </span>
                          )}
                          {test.isFeatured && (
                            <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#E9A23B] mt-0.5">
                              <LuStar className="w-2.5 h-2.5 fill-current" /> FEATURED
                            </span>
                          )}
                        </td>

                        {/* Role & City */}
                        <td className="py-3 px-3">
                          <p className="font-semibold text-[#10231D]">{test.role || 'Homeowner'}</p>
                          <p className="text-[#6B8077]">{test.city}</p>
                        </td>

                        {/* Rating */}
                        <td className="py-3 px-3 font-bold text-[#E9A23B]">
                          <div className="flex items-center gap-0.5">
                            {[...Array(test.rating || 5)].map((_, rIdx) => (
                              <LuStar key={rIdx} className="w-3.5 h-3.5 fill-current text-[#E9A23B]" />
                            ))}
                          </div>
                        </td>

                        {/* Quote Excerpt */}
                        <td className="py-3 px-3 max-w-[320px] text-[#3D524A] leading-relaxed line-clamp-2">
                          {test.quote ? `"${test.quote}"` : (test.videoUrl ? 'Video Testimonial' : '—')}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              test.isActive !== false
                                ? 'bg-[#DDEBE4] text-[#10231D]'
                                : 'bg-[#E2D9C8] text-[#6B8077]'
                            }`}
                          >
                            {test.isActive !== false ? 'Published' : 'Hidden'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openTestimonialModal(test)}
                              title="Edit Testimonial"
                              className="p-1.5 rounded-lg bg-[#F4EFE6] hover:bg-[#E2D9C8] text-[#10231D] border border-[#E2D9C8]"
                            >
                              <LuSquarePen className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleTestimonialStatus(test)}
                              title={test.isActive !== false ? 'Hide Review' : 'Publish Review'}
                              className="p-1.5 rounded-lg bg-[#F4EFE6] hover:bg-[#E2D9C8] text-[#10231D] border border-[#E2D9C8]"
                            >
                              {test.isActive !== false ? (
                                <LuEyeOff className="w-3.5 h-3.5 text-[#6B8077]" />
                              ) : (
                                <LuEye className="w-3.5 h-3.5 text-[#10231D]" />
                              )}
                            </button>
                            {test._id && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTestimonial(test._id)}
                                title="Delete Testimonial"
                                className="p-1.5 rounded-lg bg-[#F9ECE8] hover:bg-[#F2D7D1] text-[#C2512D] border border-[#F2D7D1]"
                              >
                                <LuTrash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: CONTACT INQUIRIES MANAGEMENT
        ======================================================== */}
        {activeTab === 'messages' && (
          <div className="p-6 rounded-3xl bg-[#ECE5D8] border border-[#E2D9C8] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
              <div>
                <h3 className="font-display font-bold text-xl text-[#10231D] flex items-center gap-2">
                  <span>Customer Contact Inquiries</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#E9A23B] text-[#10231D]">
                    {contactMessages.length} Total
                  </span>
                  {unreadMessagesCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500 text-white animate-pulse">
                      {unreadMessagesCount} Unread
                    </span>
                  )}
                </h3>
                <p className="text-xs text-[#6B8077] mt-0.5">
                  Submissions from the Contact Page. Emails are automatically dispatched to admin and confirmation sent to customer.
                </p>
              </div>

              {/* Inquiry Search & Status Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative min-w-[200px]">
                  <LuSearch className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B8077]" />
                  <input
                    type="text"
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    placeholder="Search sender, phone, text..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-xs text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                  />
                  {messageSearch && (
                    <button
                      type="button"
                      onClick={() => setMessageSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B8077] hover:text-[#10231D]"
                    >
                      <LuX className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="w-32">
                  <CustomSelect
                    size="sm"
                    value={messageStatusFilter}
                    onChange={(val) => setMessageStatusFilter(val)}
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'unread', label: 'Unread' },
                      { value: 'read', label: 'Read' },
                      { value: 'replied', label: 'Replied' }
                    ]}
                  />
                </div>
              </div>
            </div>

            {contactMessages.length === 0 ? (
              <div className="py-12 text-center text-[#6B8077]">
                <LuInbox className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">No contact inquiries yet.</p>
              </div>
            ) : filteredMessagesList.length === 0 ? (
              <div className="py-12 text-center text-[#6B8077]">
                <LuSearch className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">No contact inquiries match your search.</p>
                <button
                  type="button"
                  onClick={() => { setMessageSearch(''); setMessageStatusFilter('all'); }}
                  className="mt-2 text-xs text-[#E9A23B] font-bold hover:underline"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E2D9C8] text-[#6B8077] font-mono uppercase">
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Sender Name</th>
                      <th className="py-3 px-3">Phone & Email</th>
                      <th className="py-3 px-3">Subject & Inquiry</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2D9C8]/60">
                    {filteredMessagesList.map((msg) => (
                      <tr key={msg._id} className="hover:bg-[#F4EFE6]/50">
                        <td className="py-3 px-3 font-mono text-[#6B8077]">
                          {new Date(msg.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#10231D]">
                          <button
                            type="button"
                            onClick={() => handleOpenInquiryDetails(msg)}
                            className="text-left font-bold text-[#10231D] hover:text-[#E9A23B] transition-colors cursor-pointer"
                            title="Click to view inquiry details"
                          >
                            {msg.name}
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          <a
                            href={`tel:${msg.phone}`}
                            className="font-semibold text-[#10231D] hover:text-[#E9A23B] flex items-center gap-1"
                          >
                            <LuPhone className="w-3 h-3 text-[#E9A23B]" />
                            <span>{msg.phone}</span>
                          </a>
                          {msg.email && (
                            <a
                              href={`mailto:${msg.email}`}
                              className="text-[11px] text-[#6B8077] hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <LuMail className="w-3 h-3 text-[#6B8077]" />
                              <span>{msg.email}</span>
                            </a>
                          )}
                        </td>
                        <td className="py-3 px-3 max-w-[280px]">
                          <p className="font-bold text-[#10231D]">{msg.subject || 'General Inquiry'}</p>
                          <p className="text-[#3D524A] text-[11px] leading-relaxed line-clamp-2">
                            {msg.message}
                          </p>
                        </td>
                        <td className="py-3 px-3 min-w-[130px]">
                          <CustomSelect
                            value={msg.status}
                            onChange={(val) => handleUpdateMessageStatus(msg._id, val)}
                            options={[
                              { value: 'unread', label: 'Unread' },
                              { value: 'read', label: 'Read' },
                              { value: 'replied', label: 'Replied' }
                            ]}
                            placeholder="Status..."
                          />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenInquiryDetails(msg)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                              title="View Inquiry Details"
                            >
                              <LuEye className="w-3.5 h-3.5 text-[#E9A23B]" />
                              <span>View Detail</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg._id)}
                              className="p-1.5 rounded-lg bg-[#F9ECE8] hover:bg-[#F2D7D1] text-[#C2512D] border border-[#F2D7D1] transition-colors cursor-pointer"
                              title="Delete Inquiry"
                            >
                              <LuTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 5: CITIES & SERVICE REGIONS
        ======================================================== */}
        {activeTab === 'cities' && (
          <div className="p-6 rounded-3xl bg-[#ECE5D8] border border-[#E2D9C8] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
              <div>
                <h3 className="font-display font-bold text-xl text-[#10231D] flex items-center gap-2">
                  <span>Operational Cities & Regions</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#E9A23B] text-[#10231D]">
                    {cities.length} Active
                  </span>
                </h3>
                <p className="text-xs text-[#6B8077] mt-0.5">
                  Manage service delivery cities and coverage pincodes.
                </p>
              </div>

              <button
                type="button"
                onClick={() => openCityModal()}
                className="px-4 py-2.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#181511] font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
              >
                <LuPlus className="w-4 h-4" />
                <span>Add New City</span>
              </button>
            </div>

            {/* Search and Filters Bar for Cities */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 p-3 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8]">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative flex-1 min-w-[200px]">
                  <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                  <input
                    type="text"
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder="Search city by name, slug or state..."
                    className="w-full pl-9 pr-7 py-2 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] placeholder-[#6B8077] focus:outline-none focus:border-[#E9A23B]"
                  />
                  {citySearch && (
                    <button
                      type="button"
                      onClick={() => setCitySearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#6B8077] hover:text-[#10231D] cursor-pointer"
                    >
                      <LuX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={cityStatusFilter}
                  onChange={(e) => setCityStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-bold text-[#10231D] cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Service</option>
                  <option value="coming_soon">Coming Soon</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {(citySearch || cityStatusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setCitySearch('');
                    setCityStatusFilter('all');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#ECE5D8] hover:bg-[#E2D9C8] text-[#C2512D] text-xs font-bold transition-colors self-start sm:self-auto cursor-pointer"
                >
                  <LuRotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {filteredCitiesList.length === 0 ? (
              <div className="py-12 text-center text-[#6B8077]">
                <LuMapPin className="w-10 h-10 mx-auto mb-2 opacity-50 text-[#E9A23B]" />
                <p className="text-sm font-bold text-[#10231D]">No service cities match your criteria</p>
                <p className="text-xs text-[#6B8077] mt-1">Try resetting the search keyword or status filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E2D9C8] text-[#6B8077] font-mono uppercase">
                      <th className="py-3 px-3">City Name</th>
                      <th className="py-3 px-3">State & Slug</th>
                      <th className="py-3 px-3">Ranking & Tags</th>
                      <th className="py-3 px-3">Service Radius</th>
                      <th className="py-3 px-3">Covered Pincodes</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Sort Order</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2D9C8]/60">
                    {filteredCitiesList.map((city) => (
                      <tr key={city._id} className="hover:bg-[#F4EFE6]/50">
                        <td className="py-3 px-3">
                          <p className="font-bold text-sm text-[#10231D] flex items-center gap-1.5">
                            <LuMapPin className="w-3.5 h-3.5 text-[#E9A23B]" />
                            <span>{city.name}</span>
                          </p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-[#10231D] font-medium">{city.state || 'Uttar Pradesh'}</p>
                          <code className="text-[10px] text-[#6B8077] font-mono">/{city.slug}</code>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1 min-w-[140px]">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#10231D] text-[#E9A23B]">
                                Rank {city.rankingScore ?? 100}
                              </span>
                              {city.rankingTier && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-[#E9A23B]/20 text-[#10231D]">
                                  {city.rankingTier}
                                </span>
                              )}
                            </div>
                            {Array.isArray(city.tags) && city.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {city.tags.slice(0, 3).map((tag, tIdx) => (
                                  <span key={tIdx} className="text-[9px] px-1.5 py-0.2 rounded bg-white text-[#3D524A] border border-[#E2D9C8]">
                                    #{tag}
                                  </span>
                                ))}
                                {city.tags.length > 3 && (
                                  <span className="text-[9px] text-[#6B8077]">+{city.tags.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#10231D]">
                          {city.serviceRadiusKm || 25} km
                        </td>
                        <td className="py-3 px-3 max-w-[260px]">
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(city.pincodes) && city.pincodes.length > 0 ? (
                              city.pincodes.slice(0, 5).map((pin, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 rounded bg-[#F4EFE6] border border-[#E2D9C8] text-[10px] font-mono text-[#10231D]"
                                >
                                  {pin}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-[#6B8077] italic">All city areas</span>
                            )}
                            {city.pincodes?.length > 5 && (
                              <span className="text-[10px] text-[#6B8077] font-mono self-center">
                                +{city.pincodes.length - 5} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => handleToggleCityStatus(city)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                              city.status === 'active'
                                ? 'bg-[#DDEBE4] text-[#10231D] border border-[#BED6CC]'
                                : city.status === 'coming_soon'
                                ? 'bg-[#F4E4C8] text-[#8C5D17] border border-[#E6CB9D]'
                                : 'bg-[#EAE4DC] text-[#6B8077] border border-[#D5CCC0]'
                            }`}
                          >
                            {city.status || 'active'}
                          </button>
                        </td>
                        <td className="py-3 px-3 font-mono text-center text-[#10231D]">
                          {city.sortOrder || 0}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openCityModal(city)}
                              className="p-1.5 rounded-lg bg-[#F4EFE6] hover:bg-[#E2D9C8] text-[#10231D] border border-[#E2D9C8]"
                              title="Edit City Details"
                            >
                              <LuSquarePen className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCity(city._id, city.name)}
                              className="p-1.5 rounded-lg bg-[#F9ECE8] hover:bg-[#F2D7D1] text-[#C2512D] border border-[#F2D7D1]"
                              title="Delete City"
                            >
                              <LuTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 6: REGISTERED USERS DATABASE
        ======================================================== */}
        {activeTab === 'users' && (
          <div className="p-6 rounded-3xl bg-[#ECE5D8] border border-[#E2D9C8] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
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
            </div>

            {(() => {
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
                        {filteredUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-[#F4EFE6]/50">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={u.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=MH'}
                              alt={u.name}
                              className="w-8 h-8 rounded-full border border-[#E2D9C8] bg-white object-cover shrink-0"
                            />
                            <div>
                              <p className="font-bold text-[#10231D]">{u.name}</p>
                              <span className="text-[10px] text-[#6B8077] font-mono capitalize">
                                Provider: {u.authProvider || 'local'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <a
                            href={`tel:${u.phone}`}
                            className="font-semibold text-[#10231D] hover:text-[#E9A23B] flex items-center gap-1"
                          >
                            <LuPhone className="w-3 h-3 text-[#E9A23B]" />
                            <span>{u.phone}</span>
                          </a>
                          {u.email && (
                            <a
                              href={`mailto:${u.email}`}
                              className="text-[11px] text-[#6B8077] hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <LuMail className="w-3 h-3 text-[#6B8077]" />
                              <span>{u.email}</span>
                            </a>
                          )}
                        </td>
                        <td className="py-3 px-3 min-w-[140px]">
                          <CustomSelect
                            value={u.role}
                            onChange={(val) => handleUpdateUserRole(u._id, val)}
                            options={[
                              { value: 'customer', label: 'Customer' },
                              { value: 'cleaner', label: 'Cleaner Staff' },
                              { value: 'admin', label: 'Administrator' }
                            ]}
                            placeholder="Role..."
                          />
                        </td>
                        <td className="py-3 px-3 font-mono text-[#10231D]">
                          {u.addresses?.length || 0} locations
                        </td>
                        <td className="py-3 px-3 font-mono text-[#6B8077]">
                          {new Date(u.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            disabled={u._id === user?._id}
                            className="p-1.5 rounded-lg bg-[#F9ECE8] hover:bg-[#F2D7D1] disabled:opacity-40 text-[#C2512D] border border-[#F2D7D1]"
                            title={u._id === user?._id ? 'Cannot delete current logged-in user' : 'Delete user permanently'}
                          >
                            <LuTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>
    )}

        {/* ========================================================
            TAB 7: COUPONS & DISCOUNT PROMOTIONS
        ======================================================== */}
        {activeTab === 'coupons' && (
          <div className="p-6 rounded-3xl bg-[#ECE5D8] border border-[#E2D9C8] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
              <div>
                <h3 className="font-display font-bold text-xl text-[#10231D] flex items-center gap-2">
                  <span>Coupons & Discount Promotions</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#E9A23B] text-[#10231D]">
                    {coupons.length} Active Codes
                  </span>
                </h3>
                <p className="text-xs text-[#6B8077] mt-0.5">
                  Create promo codes with flat or percentage discounts, minimum booking threshold, and validity dates.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCouponModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#181511] font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
              >
                <LuPlus className="w-4 h-4" />
                <span>Create New Coupon</span>
              </button>
            </div>

            {coupons.length === 0 ? (
              <div className="py-12 text-center text-[#6B8077]">
                <LuTicket className="w-10 h-10 mx-auto mb-2 opacity-50 text-[#E9A23B]" />
                <p className="text-sm font-bold text-[#10231D]">No promotional coupons configured</p>
                <p className="text-xs text-[#6B8077] mt-1">Click "+ Create New Coupon" to publish a discount voucher code for checkout.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E2D9C8] text-[#6B8077] font-mono uppercase">
                      <th className="py-3 px-3">Promo Code</th>
                      <th className="py-3 px-3">Discount Type & Value</th>
                      <th className="py-3 px-3">Min Order</th>
                      <th className="py-3 px-3">Max Cap</th>
                      <th className="py-3 px-3">Usage</th>
                      <th className="py-3 px-3">Expiry Date</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2D9C8]/60">
                    {coupons.map((c) => (
                      <tr key={c._id} className="hover:bg-[#F4EFE6]/50">
                        <td className="py-3 px-3">
                          <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-[#10231D] text-[#E9A23B] tracking-wider">
                            {c.code}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-[#10231D]">
                          {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#3D524A]">
                          ₹{(c.minOrderValue || c.minBookingAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#3D524A]">
                          {c.maxDiscount ? `₹${c.maxDiscount}` : 'No Limit'}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#10231D]">
                          <span className="font-bold">{c.usedCount || 0}</span> / {c.usageLimit || '∞'}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#6B8077]">
                          {(c.validUntil || c.expiryDate)
                            ? new Date(c.validUntil || c.expiryDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : 'Never'}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => handleToggleCouponStatus(c)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                              c.isActive
                                ? 'bg-[#DDEBE4] text-[#10231D] border border-[#BED6CC]'
                                : 'bg-[#EAE4DC] text-[#6B8077] border border-[#D5CCC0]'
                            }`}
                          >
                            {c.isActive ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(c._id, c.code)}
                            className="p-1.5 rounded-lg bg-[#F9ECE8] hover:bg-[#F2D7D1] text-[#C2512D] border border-[#F2D7D1]"
                            title="Delete Coupon"
                          >
                            <LuTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 8: SITE & BUSINESS SETTINGS
        ======================================================== */}
        {activeTab === 'settings' && (
          <div className="p-6 rounded-3xl bg-[#ECE5D8] border border-[#E2D9C8] shadow-sm">
            <div className="mb-6">
              <h3 className="font-display font-bold text-xl text-[#10231D] flex items-center gap-2">
                <span>Business & Operational Settings</span>
              </h3>
              <p className="text-xs text-[#6B8077] mt-0.5">
                Dynamically manage online payments, separate GST on overall service, and platform charges.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">

              {/* 1. Online Payment Settings */}
              <div className="p-5 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LuCreditCard className="w-5 h-5 text-[#E9A23B]" />
                    <div>
                      <h4 className="font-display font-bold text-sm text-[#10231D]">
                        Online Payments (Razorpay)
                      </h4>
                      <p className="text-[11px] text-[#6B8077]">
                        Controls whether customers can pay online via Cards, UPI & NetBanking during booking.
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                    settingsForm.acceptOnlinePayments
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-stone-200 text-stone-700 border border-stone-300'
                  }`}>
                    {settingsForm.acceptOnlinePayments ? 'Active' : 'Cash on Service Only'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-white/70 rounded-xl border border-[#E2D9C8]">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#10231D] block">
                      Accept online payments on booking page
                    </span>
                    <p className="text-[11px] text-[#6B8077]">
                      {settingsForm.acceptOnlinePayments
                        ? 'Customers can choose to Pay Online Now (Razorpay) or Pay on Service Completion.'
                        : 'Checkout is locked to Cash / UPI on Service Completion only.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    id="acceptOnlinePaymentsToggle"
                    aria-checked={Boolean(settingsForm.acceptOnlinePayments)}
                    disabled={togglingOnlinePayments}
                    onClick={() => handleToggleOnlinePayments(!settingsForm.acceptOnlinePayments)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#E9A23B] focus:ring-offset-2 ${
                      settingsForm.acceptOnlinePayments ? 'bg-emerald-600' : 'bg-stone-300'
                    } ${togglingOnlinePayments ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        settingsForm.acceptOnlinePayments ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 2. Separate GST on Overall Service */}
              <div className="p-5 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LuPercent className="w-5 h-5 text-[#E9A23B]" />
                    <div>
                      <h4 className="font-display font-bold text-sm text-[#10231D]">
                        Separate GST on Overall Service
                      </h4>
                      <p className="text-[11px] text-[#6B8077]">
                        Add or remove a separate GST line on the overall service subtotal during customer checkout.
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                    settingsForm.gstEnabled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-stone-200 text-stone-700 border border-stone-300'
                  }`}>
                    {settingsForm.gstEnabled ? `Enabled (${settingsForm.gstPercentage ?? 18}% GST)` : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-white/70 rounded-xl border border-[#E2D9C8]">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#10231D] block">
                      Charge separate GST on overall service bill
                    </span>
                    <p className="text-[11px] text-[#6B8077]">
                      {settingsForm.gstEnabled
                        ? `Adds ${settingsForm.gstPercentage ?? 18}% GST separately on top of the service subtotal at checkout.`
                        : 'No separate GST is added to the service price at checkout.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    id="gstEnabledToggle"
                    aria-checked={Boolean(settingsForm.gstEnabled)}
                    disabled={togglingGst}
                    onClick={() => handleToggleGst(!settingsForm.gstEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#E9A23B] focus:ring-offset-2 ${
                      settingsForm.gstEnabled ? 'bg-emerald-600' : 'bg-stone-300'
                    } ${togglingGst ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        settingsForm.gstEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3.5 bg-white/70 rounded-xl border border-[#E2D9C8] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#10231D] block">
                        GST Rate (%)
                      </label>
                      <p className="text-[11px] text-[#6B8077]">
                        Standard Indian service GST rate is 18%. You can set any rate or tap a preset.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-28">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={settingsForm.gstPercentage ?? 18}
                          onChange={(e) =>
                            setSettingsForm(prev => ({
                              ...prev,
                              gstPercentage: e.target.value === '' ? '' : Number(e.target.value)
                            }))
                          }
                          className="w-full px-3 py-2 pr-7 rounded-xl border border-[#E2D9C8] bg-[#F4EFE6] text-xs font-mono font-bold text-[#10231D] focus:outline-none focus:border-[#E9A23B]"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6B8077]">
                          %
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={savingSettings}
                        onClick={handleSaveSettings}
                        className="px-3 py-2 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] text-xs font-bold cursor-pointer transition-colors"
                      >
                        Apply Rate
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-[#6B8077] uppercase mr-1">Quick Presets:</span>
                    {[5, 12, 18, 28].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setSettingsForm(prev => ({ ...prev, gstPercentage: pct }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                          Number(settingsForm.gstPercentage) === pct
                            ? 'bg-[#10231D] text-[#F4EFE6] border-[#10231D]'
                            : 'bg-[#F4EFE6] text-[#3D524A] border-[#E2D9C8] hover:border-[#E9A23B]'
                        }`}
                      >
                        {pct}% GST
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Platform Charges on Overall Service */}
              <div className="p-5 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LuCalculator className="w-5 h-5 text-[#E9A23B]" />
                    <div>
                      <h4 className="font-display font-bold text-sm text-[#10231D]">
                        Platform Charges on Overall Service
                      </h4>
                      <p className="text-[11px] text-[#6B8077]">
                        Enable or disable a flat or percentage platform fee on customer service bookings.
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                    settingsForm.platformChargeEnabled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-stone-200 text-stone-700 border border-stone-300'
                  }`}>
                    {settingsForm.platformChargeEnabled
                      ? `Enabled (${settingsForm.platformChargeType === 'percentage' ? `${settingsForm.platformChargeAmount ?? 0}%` : `₹${settingsForm.platformChargeAmount ?? 49}`})`
                      : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-white/70 rounded-xl border border-[#E2D9C8]">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#10231D] block">
                      Charge Platform Fee on customer bookings
                    </span>
                    <p className="text-[11px] text-[#6B8077]">
                      {settingsForm.platformChargeEnabled
                        ? `Adds ${settingsForm.platformChargeLabel || 'Platform Charges'} (${
                            settingsForm.platformChargeType === 'percentage'
                              ? `${settingsForm.platformChargeAmount ?? 0}%`
                              : `₹${settingsForm.platformChargeAmount ?? 49}`
                          }) to the overall service bill.`
                        : 'No platform charge is added to customer bookings.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    id="platformChargeEnabledToggle"
                    aria-checked={Boolean(settingsForm.platformChargeEnabled)}
                    disabled={togglingPlatformCharge}
                    onClick={() => handleTogglePlatformCharge(!settingsForm.platformChargeEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#E9A23B] focus:ring-offset-2 ${
                      settingsForm.platformChargeEnabled ? 'bg-emerald-600' : 'bg-stone-300'
                    } ${togglingPlatformCharge ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        settingsForm.platformChargeEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3.5 bg-white/70 rounded-xl border border-[#E2D9C8] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#10231D] block mb-1">
                        Fee Type
                      </label>
                      <select
                        value={settingsForm.platformChargeType || 'flat'}
                        onChange={(e) =>
                          setSettingsForm(prev => ({
                            ...prev,
                            platformChargeType: e.target.value
                          }))
                        }
                        className="w-full p-2.5 rounded-xl border border-[#E2D9C8] bg-[#F4EFE6] text-xs font-semibold text-[#10231D] focus:outline-none focus:border-[#E9A23B]"
                      >
                        <option value="flat">Flat Amount (₹)</option>
                        <option value="percentage">Percentage (%)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#10231D] block mb-1">
                        {settingsForm.platformChargeType === 'percentage' ? 'Platform Fee (%)' : 'Platform Fee Amount (₹)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={settingsForm.platformChargeAmount ?? 49}
                        onChange={(e) =>
                          setSettingsForm(prev => ({
                            ...prev,
                            platformChargeAmount: e.target.value === '' ? '' : Number(e.target.value)
                          }))
                        }
                        className="w-full p-2.5 rounded-xl border border-[#E2D9C8] bg-[#F4EFE6] text-xs font-mono font-bold text-[#10231D] focus:outline-none focus:border-[#E9A23B]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#10231D] block mb-1">
                        Label Shown on Bill
                      </label>
                      <input
                        type="text"
                        value={settingsForm.platformChargeLabel || 'Platform Charges'}
                        onChange={(e) =>
                          setSettingsForm(prev => ({
                            ...prev,
                            platformChargeLabel: e.target.value
                          }))
                        }
                        placeholder="Platform Charges"
                        className="w-full p-2.5 rounded-xl border border-[#E2D9C8] bg-[#F4EFE6] text-xs font-semibold text-[#10231D] focus:outline-none focus:border-[#E9A23B]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-[#6B8077] uppercase mr-1">Quick Amounts:</span>
                      {(settingsForm.platformChargeType === 'percentage' ? [2, 5, 10] : [19, 29, 49, 99]).map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSettingsForm(prev => ({ ...prev, platformChargeAmount: val }))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                            Number(settingsForm.platformChargeAmount) === val
                              ? 'bg-[#10231D] text-[#F4EFE6] border-[#10231D]'
                              : 'bg-[#F4EFE6] text-[#3D524A] border-[#E2D9C8] hover:border-[#E9A23B]'
                          }`}
                        >
                          {settingsForm.platformChargeType === 'percentage' ? `${val}%` : `₹${val}`}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={savingSettings}
                      onClick={handleSaveSettings}
                      className="px-3.5 py-2 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] text-xs font-bold cursor-pointer transition-colors"
                    >
                      Apply Platform Fee
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Live Bill Preview for Admin */}
              {(() => {
                const sampleService = 1000;
                const samplePlatform = settingsForm.platformChargeEnabled
                  ? (settingsForm.platformChargeType === 'percentage'
                      ? Math.round((sampleService * (Number(settingsForm.platformChargeAmount) || 0)) / 100)
                      : Math.round(Number(settingsForm.platformChargeAmount) || 0))
                  : 0;
                const sampleGst = settingsForm.gstEnabled
                  ? Math.round((sampleService * (Number(settingsForm.gstPercentage ?? 18) || 0)) / 100)
                  : 0;
                const sampleTotal = sampleService + samplePlatform + sampleGst;

                return (
                  <div className="p-4 rounded-2xl bg-white/80 border border-[#E2D9C8] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#10231D] uppercase tracking-wider text-[11px]">
                        Live Checkout Bill Preview (Sample ₹1,000 Service)
                      </span>
                      <span className="text-[11px] text-[#6B8077]">Updates live on Booking Page</span>
                    </div>
                    <div className="space-y-1 pt-1 border-t border-[#E2D9C8]">
                      <div className="flex justify-between text-[#3D524A]">
                        <span>Service Subtotal:</span>
                        <span className="font-mono font-semibold">₹{sampleService.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-[#3D524A]">
                        <span>{settingsForm.platformChargeLabel || 'Platform Charges'}:</span>
                        <span className={`font-mono font-semibold ${settingsForm.platformChargeEnabled ? 'text-[#10231D]' : 'text-stone-400'}`}>
                          {settingsForm.platformChargeEnabled ? `+₹${samplePlatform.toLocaleString('en-IN')}` : '₹0 (Disabled)'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#3D524A]">
                        <span>Separate GST ({settingsForm.gstPercentage ?? 18}%):</span>
                        <span className={`font-mono font-semibold ${settingsForm.gstEnabled ? 'text-[#10231D]' : 'text-stone-400'}`}>
                          {settingsForm.gstEnabled ? `+₹${sampleGst.toLocaleString('en-IN')}` : '₹0 (Disabled)'}
                        </span>
                      </div>
                      <div className="flex justify-between font-black text-sm text-[#10231D] pt-1.5 border-t border-[#E2D9C8]">
                        <span>Customer Payable Total:</span>
                        <span className="font-mono">₹{sampleTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-3 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  <LuCheck className="w-4 h-4 text-[#E9A23B]" />
                  <span>{savingSettings ? 'Saving Settings...' : 'Save All Business Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================
            MODAL 1: EDIT SERVICE DUAL-PRICING & CLOUDINARY IMAGE
        ======================================================== */}
        {editingService && (
          <Modal
            isOpen={true}
            onClose={() => setEditingService(null)}
            title={`Edit Service: ${editingService.title}`}
            subtitle="Update Service Details, Shown Price (MRP), Payable Price, and Dynamic Variants"
            maxWidth="max-w-2xl"
          >
            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Service Title:
                </label>
                <input
                  type="text"
                  value={serviceForm.title}
                  onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-sm text-[#10231D]"
                  required
                />
              </div>

              {/* Category & Service Classification Section (Primary Dropdown + Multi-Select Cards) */}
              {renderCategorySelectionSection(true)}

              {/* Cloudinary Service Multi-Image Gallery Upload */}
              {renderImageUploadSection(true)}

              {/* Service Icon (Select-Only) */}
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Service Icon:
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] flex items-center justify-center shrink-0 shadow-inner">
                    {getServiceIcon(serviceForm.icon, 'w-6 h-6 text-[#E9A23B]')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CustomSelect
                      value={serviceForm.icon}
                      onChange={(val) => setServiceForm(prev => ({ ...prev, icon: val }))}
                      options={ICON_SELECT_OPTIONS}
                      placeholder="Select Service Icon..."
                    />
                  </div>
                </div>
              </div>

              {/* Step 1 Service Type, Dynamic Unit Pricing & City Availability */}
              {renderServicePricingConfig(true)}

              {/* Dynamic Inclusions & Exclusions (Managed from Admin Panel) */}
              <div className="pt-4 border-t border-[#E2D9C8] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-[#10231D] flex items-center gap-1.5">
                    <LuCheck className="w-4 h-4 text-[#10231D]" />
                    <span>What Is Included & What Is Excluded</span>
                  </h4>
                  <span className="text-[11px] text-[#6B8077]">1 item per line</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#10231D] mb-1 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#DDEBE4] text-[#10231D] flex items-center justify-center">
                        <LuCheck className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                      <span>What Is Included:</span>
                    </label>
                    <textarea
                      rows={5}
                      placeholder={"Wall tiles descaling and grouting scrub\nWC pot, washbasin, and vanity sanitisation\nTaps, showerheads, and chrome fittings polishing\nMirror and glass partition streak-free wipe\nFloor scrub and drain trap clearing"}
                      value={serviceForm.inclusions || ''}
                      onChange={(e) => setServiceForm({ ...serviceForm, inclusions: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] font-medium leading-relaxed placeholder:text-[#6B8077]/60 focus:border-[#E9A23B] focus:outline-none"
                    />
                    <p className="text-[10px] text-[#6B8077] mt-1">Enter each included feature or task on a separate line.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#10231D] mb-1 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#F9ECE8] text-[#C2512D] flex items-center justify-center">
                        <LuX className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                      <span>What Is Excluded:</span>
                    </label>
                    <textarea
                      rows={5}
                      placeholder={"Inside locked private storage without supervisor\nShifting of exceptionally heavy architectural stonework\nRepainting or repairing water-seepage cracks"}
                      value={serviceForm.exclusions || ''}
                      onChange={(e) => setServiceForm({ ...serviceForm, exclusions: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] font-medium leading-relaxed placeholder:text-[#6B8077]/60 focus:border-[#E9A23B] focus:outline-none"
                    />
                    <p className="text-[10px] text-[#6B8077] mt-1">Enter excluded items or limitations on a separate line.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#E2D9C8]">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded-xl bg-[#ECE5D8] text-xs font-bold text-[#10231D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#181511] font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  Save Service Changes
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ========================================================
            MODAL 2: ADD / EDIT TESTIMONIAL WITH CLOUDINARY UPLOAD
        ======================================================== */}
        {testimonialModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setTestimonialModalOpen(false)}
            title={editingTestimonial ? 'Edit Home Testimonial' : 'Upload New Customer Testimonial'}
            subtitle="Display verified customer experience stories on the Home Page"
            maxWidth="max-w-xl"
          >
            <form onSubmit={handleSaveTestimonial} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Client Full Name:
                  </label>
                  <input
                    type="text"
                    value={testimonialForm.name}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, name: e.target.value })}
                    placeholder="e.g. Dr. Alok Verma"
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-bold text-[#10231D]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Role / Subtitle:
                  </label>
                  <input
                    type="text"
                    value={testimonialForm.role}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, role: e.target.value })}
                    placeholder="e.g. Civil Lines Resident, Villa Owner"
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    City (Western UP):
                  </label>
                  <input
                    type="text"
                    value={testimonialForm.city}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, city: e.target.value })}
                    placeholder="e.g. Moradabad, Rampur, Bareilly"
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-semibold text-[#10231D]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Star Rating (1-5):
                  </label>
                  <div className="flex items-center gap-1 py-1">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setTestimonialForm({ ...testimonialForm, rating: starVal })}
                        className={`p-1.5 rounded-lg text-lg transition-transform hover:scale-110 ${
                          testimonialForm.rating >= starVal
                            ? 'text-[#E9A23B]'
                            : 'text-[#D5C9B5]'
                        }`}
                      >
                        <LuStar className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-mono font-bold text-[#10231D]">
                      {testimonialForm.rating} / 5
                    </span>
                  </div>
                </div>
              </div>

              {/* Service Booked (Optional) */}
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Service Booked (Optional):
                </label>
                <input
                  type="text"
                  value={testimonialForm.serviceTitle || ''}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, serviceTitle: e.target.value })}
                  placeholder="e.g. Full Home Deep Cleaning (3 BHK), 7-Seater Sofa Shampooing"
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D]"
                />
              </div>

              {/* Cloudinary Avatar Upload Field */}
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Client Avatar / Photo (Cloudinary Image Upload):
                </label>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8]">
                  {testimonialForm.avatar ? (
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#E9A23B] shrink-0 shadow-sm">
                      <img
                        src={testimonialForm.avatar}
                        alt="Avatar Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setTestimonialForm(prev => ({ ...prev, avatar: '', avatarPublicId: '' }))}
                        className="absolute top-0 right-0 bg-black/80 text-white rounded-full p-0.5"
                        title="Remove Avatar"
                      >
                        <LuX className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#10231D] text-[#E9A23B] flex items-center justify-center shrink-0 border border-[#E2D9C8]">
                      <LuUsers className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#10231D] text-[#F4EFE6] text-xs font-bold cursor-pointer hover:bg-[#3D524A] transition-colors">
                      <LuUpload className="w-3.5 h-3.5 text-[#E9A23B]" />
                      <span>{uploadingAvatar ? 'Uploading to Cloudinary...' : 'Upload Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploadingAvatar}
                      />
                    </label>
                    <p className="text-[10px] text-[#6B8077] mt-1">
                      Optional client portrait photo. Uploaded directly to your Cloudinary storage.
                    </p>
                  </div>
                </div>
              </div>

              {/* Video Testimonial Upload or URL */}
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Video Testimonial (Upload MP4/MOV/WebM or Paste Video URL):
                </label>
                <div className="p-3 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#10231D] text-[#F4EFE6] text-xs font-bold cursor-pointer hover:bg-[#3D524A] transition-colors shrink-0">
                      <LuVideo className="w-3.5 h-3.5 text-[#E9A23B]" />
                      <span>{uploadingTestimonialVideo ? 'Uploading Video...' : 'Upload Video File'}</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/*"
                        onChange={handleTestimonialVideoUpload}
                        className="hidden"
                        disabled={uploadingTestimonialVideo}
                      />
                    </label>
                    <input
                      type="url"
                      value={testimonialForm.videoUrl || ''}
                      onChange={(e) => setTestimonialForm({ ...testimonialForm, videoUrl: e.target.value })}
                      placeholder="Or paste direct video / YouTube / Instagram Reel URL..."
                      className="flex-1 min-w-[200px] p-2 rounded-xl bg-white border border-[#E2D9C8] text-xs text-[#10231D]"
                    />
                    {testimonialForm.videoUrl && (
                      <button
                        type="button"
                        onClick={() => setTestimonialForm(prev => ({ ...prev, videoUrl: '', videoPublicId: '' }))}
                        className="px-2.5 py-2 rounded-xl bg-[#F9ECE8] text-[#C2512D] text-xs font-bold hover:bg-[#F2D7D1]"
                      >
                        Remove Video
                      </button>
                    )}
                  </div>

                  {testimonialForm.videoUrl && (
                    <div className="rounded-xl overflow-hidden bg-black border border-[#10231D]/20">
                      {/\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(testimonialForm.videoUrl) ||
                      testimonialForm.videoUrl.includes('/video/upload/') ||
                      testimonialForm.videoUrl.startsWith('data:video/') ? (
                        <video
                          src={testimonialForm.videoUrl}
                          controls
                          preload="metadata"
                          className="w-full max-h-52 object-contain bg-black"
                        />
                      ) : (
                        <div className="p-2.5 text-[11px] text-[#DDEBE4] flex items-center justify-between">
                          <span className="truncate">Linked Video: {testimonialForm.videoUrl}</span>
                          <a
                            href={testimonialForm.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#E9A23B] font-bold ml-2 shrink-0 underline"
                          >
                            Preview Link
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Review Quote Text */}
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Customer Review Quote / Feedback {testimonialForm.videoUrl ? '(Optional with Video)' : ''}:
                </label>
                <textarea
                  rows={3}
                  value={testimonialForm.quote}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, quote: e.target.value })}
                  placeholder="Describe the cleaning experience, machines used, punctuality, and overall satisfaction..."
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] leading-relaxed"
                  required={!testimonialForm.videoUrl}
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#10231D]">
                  <input
                    type="checkbox"
                    checked={testimonialForm.isFeatured}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, isFeatured: e.target.checked })}
                    className="rounded text-[#E9A23B] focus:ring-[#E9A23B]"
                  />
                  <span>Feature on Home (Golden Accent)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#10231D]">
                  <input
                    type="checkbox"
                    checked={testimonialForm.isActive}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, isActive: e.target.checked })}
                    className="rounded text-[#E9A23B] focus:ring-[#E9A23B]"
                  />
                  <span>Publish Immediately</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-[#E2D9C8]">
                <button
                  type="button"
                  onClick={() => setTestimonialModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#ECE5D8] text-xs font-bold text-[#10231D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#181511] font-bold text-xs"
                >
                  {editingTestimonial ? 'Update Testimonial' : 'Publish Testimonial'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ========================================================
            MODAL 3: BOOKING CHAT THREAD MODAL
        ======================================================== */}
        {chatBooking && (
          <Modal
            isOpen={true}
            onClose={() => setChatBooking(null)}
            title={`Booking Thread: ${chatBooking.bookingCode}`}
            subtitle={`Customer: ${chatBooking.customer?.name} (${chatBooking.customer?.phone})`}
            maxWidth="max-w-md"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DDEBE4] text-[#10231D] text-[11px] font-medium border border-[#A3B8B0]/40">
                <LuClock className="w-3.5 h-3.5 text-[#10231D] shrink-0" />
                <span>Chat history is saved for 7 days. Older messages are automatically cleared.</span>
              </div>
              <div className="h-64 overflow-y-auto p-4 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] space-y-3">
                {(!chatBooking.messages || chatBooking.messages.length === 0) ? (
                  <p className="text-center text-xs text-[#6B8077] py-8">
                    No messages in this communication thread yet.
                  </p>
                ) : (
                  chatBooking.messages.map((m, idx) => {
                    const isFromAdmin = m.sender === 'admin';
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isFromAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] text-[#6B8077] mb-0.5">
                          {m.senderName} ({new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </span>
                        <div
                          className={`max-w-[80%] p-3 rounded-xl text-xs ${
                            isFromAdmin
                              ? 'bg-[#10231D] text-[#F4EFE6] rounded-br-none'
                              : 'bg-[#E9A23B] text-[#10231D] font-medium rounded-bl-none'
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!adminReplyText.trim()) return;
                  setSendingReply(true);
                  try {
                    const res = await apiRequest(`/bookings/${chatBooking._id}/messages`, {
                      method: 'POST',
                      body: { text: adminReplyText.trim(), senderName: 'Max Admin Support' }
                    });
                    if (res.success && res.messages) {
                      const updated = { ...chatBooking, messages: res.messages };
                      setChatBooking(updated);
                      setBookings(prev => prev.map(b => b._id === chatBooking._id ? updated : b));
                      setAdminReplyText('');
                      toast.success('Reply sent to customer.');
                    }
                  } catch (err) {
                    toast.error('Failed to send reply.');
                  } finally {
                    setSendingReply(false);
                  }
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Type official reply or dispatch update..."
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={sendingReply}
                  className="px-4 py-2.5 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] text-xs font-bold"
                >
                  Send Reply
                </button>
              </form>
            </div>
          </Modal>
        )}

        {/* ========================================================
            MODAL 4: ADD / EDIT CITY IN MONGODB
        ======================================================== */}
        {cityModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setCityModalOpen(false)}
            title={editingCity ? `Edit City: ${editingCity.name}` : 'Add New Operational City'}
            subtitle="Automated URL slug, map GPS coordinates & pincode detection for map auto-select"
            maxWidth="max-w-lg"
          >
            <form onSubmit={handleSaveCity} className="space-y-4">
              {/* 1-Click Quick Auto-Fill from MongoDB Cities */}
              {cities.length > 0 && (
                <div className="p-3 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#10231D] flex items-center gap-1">
                      <LuSparkles className="w-3.5 h-3.5 text-[#E9A23B]" />
                      <span>Saved Operational Cities (Live API Auto-Fill):</span>
                    </span>
                    <span className="text-[10px] text-[#6B8077]">Fills State, GPS, Pincodes & SEO</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cities.map((cObj) => (
                      <button
                        key={cObj._id || cObj.slug || cObj.name}
                        type="button"
                        onClick={() => handleAutoDetectCityFromMap(cObj.name)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          cityForm.name.toLowerCase() === String(cObj.name || '').toLowerCase()
                            ? 'bg-[#10231D] text-[#F4EFE6] border-[#10231D]'
                            : 'bg-white text-[#3D524A] border-[#E2D9C8] hover:border-[#E9A23B]'
                        }`}
                      >
                        +{cObj.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#10231D]">
                    City Name: <span className="text-[#C2512D]">*</span>
                  </label>
                  <button
                    type="button"
                    disabled={isAutoDetectingCityGeo || !cityForm.name.trim()}
                    onClick={() => handleAutoDetectCityFromMap(cityForm.name)}
                    className="text-[11px] font-bold text-[#10231D] hover:text-[#E9A23B] bg-[#ECE5D8] hover:bg-[#E2D9C8] px-2.5 py-1 rounded-lg border border-[#D2C8B8] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <LuCompass className={`w-3.5 h-3.5 text-[#E9A23B] ${isAutoDetectingCityGeo ? 'animate-spin' : ''}`} />
                    <span>{isAutoDetectingCityGeo ? 'Detecting from Map...' : 'Auto-Fill GPS & Pincodes from Map'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Bareilly, Meerut, Sambhal (auto-generates slug & map data)"
                  value={cityForm.name}
                  onChange={(e) => handleCityNameAutoChange(e.target.value)}
                  onBlur={() => {
                    if (cityForm.name.trim() && !cityForm.pincodes.trim()) {
                      handleAutoDetectCityFromMap(cityForm.name);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-sm font-semibold text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#10231D]">
                      URL Slug:
                    </label>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Auto-Generated
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. bareilly"
                    value={cityForm.slug}
                    onChange={(e) => setCityForm({ ...cityForm, slug: toCitySlug(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-mono font-bold text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    State:
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-detected from city (e.g. Maharashtra, Uttar Pradesh)"
                    value={cityForm.state}
                    onChange={(e) => {
                      const nextState = e.target.value;
                      setCityForm(prev => {
                        const prevStateSlug = toCitySlug(prev.state);
                        const nextStateSlug = toCitySlug(nextState);
                        let nextTags = prev.tags || '';
                        if (nextStateSlug) {
                          const tagList = nextTags.split(',').map(t => t.trim()).filter(Boolean);
                          if (prevStateSlug && tagList.includes(prevStateSlug)) {
                            nextTags = tagList.map(t => (t === prevStateSlug ? nextStateSlug : t)).join(', ');
                          } else if (tagList.includes('uttar-pradesh') && nextStateSlug !== 'uttar-pradesh') {
                            nextTags = tagList.map(t => (t === 'uttar-pradesh' ? nextStateSlug : t)).join(', ');
                          } else if (!tagList.includes(nextStateSlug) && tagList.length > 0) {
                            tagList.splice(1, 0, nextStateSlug);
                            nextTags = tagList.join(', ');
                          }
                        }
                        return { ...prev, state: nextState, tags: nextTags };
                      });
                    }}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Map GPS Center Coordinates (Used by Map Auto-Select & Locate Me GPS) */}
              <div className="p-3 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#10231D] flex items-center gap-1.5">
                    <LuMapPin className="w-3.5 h-3.5 text-[#E9A23B]" />
                    <span>Map Center GPS Coordinates (For Map Auto-Select)</span>
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700">Auto-Synced</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6B8077] uppercase mb-1">
                      Latitude (North):
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={cityForm.latitude}
                      onChange={(e) => setCityForm({ ...cityForm, latitude: e.target.value })}
                      placeholder="28.8386"
                      className="w-full p-2 rounded-xl bg-white border border-[#E2D9C8] text-xs font-mono font-bold text-[#10231D]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6B8077] uppercase mb-1">
                      Longitude (East):
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={cityForm.longitude}
                      onChange={(e) => setCityForm({ ...cityForm, longitude: e.target.value })}
                      placeholder="78.7733"
                      className="w-full p-2 rounded-xl bg-white border border-[#E2D9C8] text-xs font-mono font-bold text-[#10231D]"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-[#6B8077] leading-snug">
                  <strong>How Map Identifies This City:</strong> When a customer clicks <strong>Locate Me (GPS)</strong> or moves the map pin, the system matches (1) <strong>Covered Pincodes</strong>, (2) <strong>City Name / Slug</strong> from Google/OSM reverse-geocoding, and (3) <strong>GPS Radius ({cityForm.serviceRadiusKm || 25} km)</strong> around these coordinates.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Service Radius (km):
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={150}
                    value={cityForm.serviceRadiusKm}
                    onChange={(e) => setCityForm({ ...cityForm, serviceRadiusKm: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] focus:border-[#E9A23B] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Status:
                  </label>
                  <CustomSelect
                    value={cityForm.status}
                    onChange={(val) => setCityForm({ ...cityForm, status: val })}
                    options={[
                      { value: 'active', label: 'Active (Available)' },
                      { value: 'coming_soon', label: 'Coming Soon' },
                      { value: 'inactive', label: 'Inactive' }
                    ]}
                    placeholder="Status..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Covered Pincodes (comma-separated):
                </label>
                <textarea
                  rows={2}
                  placeholder="244001, 244002, 244102"
                  value={cityForm.pincodes}
                  onChange={(e) => setCityForm({ ...cityForm, pincodes: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-mono text-[#10231D] focus:border-[#E9A23B] focus:outline-none leading-relaxed"
                />
                <p className="text-[10px] text-[#6B8077] mt-1">
                  List specific postal codes serviced by our mobile equipment vans.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    City Ranking Score (100 - 1000):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={cityForm.rankingScore ?? 100}
                    onChange={(e) => setCityForm({ ...cityForm, rankingScore: Number(e.target.value) || 100 })}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-mono font-bold text-[#10231D]"
                  />
                  <p className="text-[10px] text-[#6B8077] mt-1">
                    Higher scores rank higher in user city selection & routing.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    City Regional Tier:
                  </label>
                  <CustomSelect
                    value={cityForm.rankingTier || 'primary'}
                    onChange={(val) => setCityForm({ ...cityForm, rankingTier: val })}
                    options={[
                      { value: 'primary', label: 'Primary Hub (Headquarters)' },
                      { value: 'tier_1', label: 'Tier 1 Outstation City' },
                      { value: 'tier_2', label: 'Tier 2 Regional Outpost' },
                      { value: 'upcoming', label: 'Upcoming Expansion' }
                    ]}
                    placeholder="Regional Tier..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Tags for Scaling & Local SEO (comma-separated):
                </label>
                <input
                  type="text"
                  placeholder="e.g. headquarters, moradabad, kanth-road, full-home-cleaning, zero-dispatch-fee"
                  value={cityForm.tags || ''}
                  onChange={(e) => setCityForm({ ...cityForm, tags: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-mono text-[#10231D]"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] font-bold text-[#6B8077] self-center mr-1">Quick Add:</span>
                  {['headquarters', 'zero-dispatch-fee', 'same-day-service', 'sofa-carpet-hub', 'doorstep-dispatch', 'fast-service'].map((qt) => (
                    <button
                      key={qt}
                      type="button"
                      onClick={() => {
                        const cur = (cityForm.tags || '').split(',').map(t => t.trim()).filter(Boolean);
                        if (!cur.includes(qt)) {
                          setCityForm(prev => ({ ...prev, tags: [...cur, qt].join(', ') }));
                        }
                      }}
                      className="px-2 py-0.5 rounded-md bg-white hover:bg-[#F4EFE6] border border-[#E2D9C8] text-[10px] font-mono text-[#10231D] cursor-pointer"
                    >
                      +{qt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Sort Order:
                </label>
                <input
                  type="number"
                  value={cityForm.sortOrder}
                  onChange={(e) => setCityForm({ ...cityForm, sortOrder: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-[#E2D9C8]">
                <button
                  type="button"
                  onClick={() => setCityModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#ECE5D8] text-xs font-bold text-[#10231D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#181511] font-bold text-xs"
                >
                  {editingCity ? 'Save Changes' : 'Save City'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ========================================================
            MODAL 5: CREATE NEW SERVICE
        ======================================================== */}
        {createServiceModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setCreateServiceModalOpen(false)}
            title="Create New Cleaning Service"
            subtitle="Add a new service offering to the catalogue with dual-pricing, tiered variants and details"
            maxWidth="max-w-3xl"
          >
            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Service Title:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kitchen Chimney & Hob Deep Cleaning"
                  value={newServiceForm.title}
                  onChange={(e) => setNewServiceForm({ ...newServiceForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-sm text-[#10231D]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    URL Slug (optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. kitchen-chimney-cleaning"
                    value={newServiceForm.slug}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, slug: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-mono text-[#10231D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Service Duration:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1.5 hrs"
                    value={newServiceForm.duration}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, duration: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D]"
                  />
                </div>
              </div>

              {/* Category & Service Classification Section (Primary Dropdown + Multi-Select Cards) */}
              {renderCategorySelectionSection(false)}

              {/* Service Icon (Select-Only) */}
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Service Icon:
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] flex items-center justify-center shrink-0 shadow-inner">
                    {getServiceIcon(newServiceForm.icon, 'w-6 h-6 text-[#E9A23B]')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CustomSelect
                      value={newServiceForm.icon}
                      onChange={(val) => setNewServiceForm(prev => ({ ...prev, icon: val }))}
                      options={ICON_SELECT_OPTIONS}
                      placeholder="Select Service Icon..."
                    />
                  </div>
                </div>
              </div>

              {/* Step 1 Service Type, Dynamic Unit Pricing & City Availability */}
              {renderServicePricingConfig(false)}

              {/* Dynamic Inclusions & Exclusions (Managed from Admin Panel) */}
              <div className="pt-4 border-t border-[#E2D9C8] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-[#10231D] flex items-center gap-1.5">
                    <LuCheck className="w-4 h-4 text-[#10231D]" />
                    <span>What Is Included & What Is Excluded</span>
                  </h4>
                  <span className="text-[11px] text-[#6B8077]">1 item per line</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#10231D] mb-1 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#DDEBE4] text-[#10231D] flex items-center justify-center">
                        <LuCheck className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                      <span>What Is Included:</span>
                    </label>
                    <textarea
                      rows={5}
                      placeholder={"Wall tiles descaling and grouting scrub\nWC pot, washbasin, and vanity sanitisation\nTaps, showerheads, and chrome fittings polishing\nMirror and glass partition streak-free wipe\nFloor scrub and drain trap clearing"}
                      value={newServiceForm.inclusions || ''}
                      onChange={(e) => setNewServiceForm({ ...newServiceForm, inclusions: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] font-medium leading-relaxed placeholder:text-[#6B8077]/60 focus:border-[#E9A23B] focus:outline-none"
                    />
                    <p className="text-[10px] text-[#6B8077] mt-1">Enter each included feature or task on a separate line.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#10231D] mb-1 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#F9ECE8] text-[#C2512D] flex items-center justify-center">
                        <LuX className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                      <span>What Is Excluded:</span>
                    </label>
                    <textarea
                      rows={5}
                      placeholder={"Inside locked private storage without supervisor\nShifting of exceptionally heavy architectural stonework\nRepainting or repairing water-seepage cracks"}
                      value={newServiceForm.exclusions || ''}
                      onChange={(e) => setNewServiceForm({ ...newServiceForm, exclusions: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] font-medium leading-relaxed placeholder:text-[#6B8077]/60 focus:border-[#E9A23B] focus:outline-none"
                    />
                    <p className="text-[10px] text-[#6B8077] mt-1">Enter excluded items or limitations on a separate line.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#E2D9C8]">
                <button
                  type="button"
                  onClick={() => setCreateServiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#ECE5D8] text-xs font-bold text-[#10231D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNewService}
                  className="px-5 py-2 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#181511] font-bold text-xs"
                >
                  {savingNewService ? 'Creating Service...' : 'Create Service'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ========================================================
            MODAL 6: CREATE NEW COUPON
        ======================================================== */}
        {/* ========================================================
            MODAL 6: CREATE NEW COUPON (SMART PROMOTIONS & VOUCHERS)
        ======================================================== */}
        {couponModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setCouponModalOpen(false)}
            title="Create Smart Discount Voucher"
            subtitle="Configure targeted coupon promotions, customer redemption limits, and service restrictions"
            maxWidth="max-w-2xl"
          >
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              {/* 1-Click Quick Preset Templates */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6B8077] font-bold mb-1.5">
                  1-Click Preset Templates:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCouponForm({
                        code: 'WELCOME20',
                        description: 'Special 20% savings on your first home cleaning',
                        discountType: 'percentage',
                        discountValue: 20,
                        minOrderValue: 499,
                        maxDiscount: 300,
                        expiryDate: '',
                        usageLimit: 1000,
                        firstBookingOnly: true,
                        oncePerUser: true,
                        showInOffers: true,
                        applicableServices: []
                      });
                    }}
                    className="p-2.5 rounded-xl border border-[#E2D9C8] bg-white hover:bg-[#F4EFE6] text-left transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#10231D]">
                      <LuSparkles className="w-3.5 h-3.5 text-[#E9A23B] shrink-0" />
                      <span>New Customer</span>
                    </div>
                    <p className="text-[10px] text-[#6B8077] mt-0.5">20% off 1st visit</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCouponForm({
                        code: 'SPECIAL150',
                        description: 'Flat ₹150 instant discount on housekeeping',
                        discountType: 'flat',
                        discountValue: 150,
                        minOrderValue: 799,
                        maxDiscount: 150,
                        expiryDate: '',
                        usageLimit: 500,
                        firstBookingOnly: false,
                        oncePerUser: true,
                        showInOffers: true,
                        applicableServices: []
                      });
                    }}
                    className="p-2.5 rounded-xl border border-[#E2D9C8] bg-white hover:bg-[#F4EFE6] text-left transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#10231D]">
                      <LuGift className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Flat ₹150 Off</span>
                    </div>
                    <p className="text-[10px] text-[#6B8077] mt-0.5">1x per customer</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCouponForm({
                        code: 'SERVICE100',
                        description: 'Special promo valid on selected cleaning services',
                        discountType: 'flat',
                        discountValue: 100,
                        minOrderValue: 499,
                        maxDiscount: 100,
                        expiryDate: '',
                        usageLimit: 1000,
                        firstBookingOnly: false,
                        oncePerUser: true,
                        showInOffers: true,
                        applicableServices: services.slice(0, 2).map(s => s._id)
                      });
                    }}
                    className="p-2.5 rounded-xl border border-[#E2D9C8] bg-white hover:bg-[#F4EFE6] text-left transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#10231D]">
                      <LuTag className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Service Promo</span>
                    </div>
                    <p className="text-[10px] text-[#6B8077] mt-0.5">Specific items only</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCouponForm({
                        code: 'FESTIVE15',
                        description: 'Festive season savings across all premium services',
                        discountType: 'percentage',
                        discountValue: 15,
                        minOrderValue: 1499,
                        maxDiscount: 500,
                        expiryDate: '',
                        usageLimit: 2000,
                        firstBookingOnly: false,
                        oncePerUser: false,
                        showInOffers: true,
                        applicableServices: []
                      });
                    }}
                    className="p-2.5 rounded-xl border border-[#E2D9C8] bg-white hover:bg-[#F4EFE6] text-left transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#10231D]">
                      <LuPercent className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>VIP Festive</span>
                    </div>
                    <p className="text-[10px] text-[#6B8077] mt-0.5">15% off orders &gt; ₹1.4k</p>
                  </button>
                </div>
              </div>

              {/* Code & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Coupon Code: <span className="text-[#C2512D]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WELCOME20, DIWALI100"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E2D9C8] text-sm font-mono font-black text-[#10231D] uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Customer Display Tagline / Description:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Valid only for 1st-time bookings"
                    value={couponForm.description}
                    onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E2D9C8] text-xs font-medium text-[#10231D]"
                  />
                </div>
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Discount Type:
                  </label>
                  <CustomSelect
                    value={couponForm.discountType}
                    onChange={(val) => setCouponForm({ ...couponForm, discountType: val })}
                    options={[
                      { value: 'flat', label: 'Flat (₹ off)' },
                      { value: 'percentage', label: 'Percentage (% off)' }
                    ]}
                    placeholder="Type..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Discount Value ({couponForm.discountType === 'percentage' ? '%' : '₹'}): <span className="text-[#C2512D]">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E2D9C8] text-xs font-mono font-bold text-[#10231D]"
                    required
                  />
                </div>
              </div>

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Min Order Value (₹):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={couponForm.minOrderValue}
                    onChange={(e) => setCouponForm({ ...couponForm, minOrderValue: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E2D9C8] text-xs font-mono text-[#10231D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Max Discount Cap (₹):
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Optional (Unlimited)"
                    value={couponForm.maxDiscount || ''}
                    onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E2D9C8] text-xs font-mono text-[#10231D]"
                  />
                </div>
              </div>

              {/* Expiry & Usage Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Expiry Date (Optional):
                  </label>
                  <input
                    type="date"
                    value={couponForm.expiryDate}
                    onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E2D9C8] text-xs font-mono text-[#10231D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Total Global Usage Limit:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={couponForm.usageLimit}
                    onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E2D9C8] text-xs font-mono text-[#10231D]"
                  />
                </div>
              </div>

              {/* SMART RULES & ELIGIBILITY CHECKBOXES */}
              <div className="p-3.5 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#6B8077] font-bold block">
                  Smart Eligibility & Fraud Prevention Rules:
                </span>

                <div className="space-y-2.5">
                  {/* Checkbox 1: New User / 1st Booking Only */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-[#E2D9C8] cursor-pointer hover:border-[#E9A23B] transition-colors">
                    <input
                      type="checkbox"
                      checked={couponForm.firstBookingOnly}
                      onChange={(e) => setCouponForm({ ...couponForm, firstBookingOnly: e.target.checked })}
                      className="w-4 h-4 mt-0.5 text-[#E9A23B] rounded accent-[#E9A23B] cursor-pointer shrink-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#10231D] flex items-center gap-1.5">
                        <span>New User / 1st Booking Only</span>
                        {couponForm.firstBookingOnly && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-amber-100 text-amber-900 font-bold uppercase">
                            Enforced
                          </span>
                        )}
                      </span>
                      <p className="text-[11px] text-[#6B8077] mt-0.5 leading-snug">
                        Strictly valid only if customer has zero prior bookings across phone number, email address, or user account.
                      </p>
                    </div>
                  </label>

                  {/* Checkbox 2: Once Per User */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-[#E2D9C8] cursor-pointer hover:border-[#E9A23B] transition-colors">
                    <input
                      type="checkbox"
                      checked={couponForm.oncePerUser}
                      onChange={(e) => setCouponForm({ ...couponForm, oncePerUser: e.target.checked })}
                      className="w-4 h-4 mt-0.5 text-[#E9A23B] rounded accent-[#E9A23B] cursor-pointer shrink-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#10231D] flex items-center gap-1.5">
                        <span>Once Per Customer / Phone Number</span>
                        {couponForm.oncePerUser && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-blue-100 text-blue-900 font-bold uppercase">
                            Enforced
                          </span>
                        )}
                      </span>
                      <p className="text-[11px] text-[#6B8077] mt-0.5 leading-snug">
                        Prevents the same customer from reusing this voucher code multiple times across different reservations.
                      </p>
                    </div>
                  </label>

                  {/* Checkbox 3: Show in Offers Banner */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-[#E2D9C8] cursor-pointer hover:border-[#E9A23B] transition-colors">
                    <input
                      type="checkbox"
                      checked={couponForm.showInOffers}
                      onChange={(e) => setCouponForm({ ...couponForm, showInOffers: e.target.checked })}
                      className="w-4 h-4 mt-0.5 text-[#E9A23B] rounded accent-[#E9A23B] cursor-pointer shrink-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#10231D] flex items-center gap-1.5">
                        <span>Show in Booking Offers Carousel</span>
                        {couponForm.showInOffers && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-emerald-100 text-emerald-900 font-bold uppercase">
                            Public
                          </span>
                        )}
                      </span>
                      <p className="text-[11px] text-[#6B8077] mt-0.5 leading-snug">
                        Display this promo card publicly on the booking checkout page with 1-click apply for customers.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* RESTRICT TO SPECIFIC SERVICES CHECKBOX & MULTI-SELECT */}
              <div className="p-3.5 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={couponForm.applicableServices.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCouponForm({ ...couponForm, applicableServices: services.slice(0, 3).map(s => s._id) });
                        } else {
                          setCouponForm({ ...couponForm, applicableServices: [] });
                        }
                      }}
                      className="w-4 h-4 text-[#E9A23B] rounded accent-[#E9A23B] cursor-pointer"
                    />
                    <span className="font-bold text-xs text-[#10231D]">
                      Restrict to Specific Services ({couponForm.applicableServices.length > 0 ? `${couponForm.applicableServices.length} Selected` : 'Currently All Services'})
                    </span>
                  </label>

                  {couponForm.applicableServices.length > 0 && (
                    <div className="flex items-center gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setCouponForm({ ...couponForm, applicableServices: services.map(s => s._id) })}
                        className="font-bold text-[#E9A23B] hover:underline"
                      >
                        Select All ({services.length})
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setCouponForm({ ...couponForm, applicableServices: [] })}
                        className="font-bold text-[#6B8077] hover:underline"
                      >
                        Reset to All Services
                      </button>
                    </div>
                  )}
                </div>

                {couponForm.applicableServices.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-white border border-[#E2D9C8] max-h-40 overflow-y-auto space-y-1.5 scrollbar-thin">
                    {services.map((s) => {
                      const isChecked = couponForm.applicableServices.includes(s._id);
                      return (
                        <label
                          key={s._id}
                          className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-[#F4EFE6] border-[#E9A23B] text-[#10231D] font-bold'
                              : 'bg-white border-transparent text-[#6B8077] hover:bg-[#ECE5D8]/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const cur = couponForm.applicableServices;
                              const next = e.target.checked
                                ? [...cur, s._id]
                                : cur.filter(id => id !== s._id);
                              setCouponForm({ ...couponForm, applicableServices: next });
                            }}
                            className="w-3.5 h-3.5 text-[#E9A23B] rounded accent-[#E9A23B] cursor-pointer shrink-0"
                          />
                          <span className="truncate">{s.title}</span>
                          <span className="text-[10px] text-[#6B8077] font-mono ml-auto shrink-0">
                            ₹{s.price}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* LIVE CUSTOMER VOUCHER PREVIEW CARD */}
              <div className="p-3.5 rounded-2xl bg-[#10231D] text-[#F4EFE6] border-2 border-[#E9A23B] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#E9A23B] text-[#10231D] font-mono font-black text-xs tracking-wider">
                      {couponForm.code || 'COUPONCODE'}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {couponForm.discountType === 'percentage'
                        ? `${couponForm.discountValue || 0}% OFF`
                        : `₹${couponForm.discountValue || 0} FLAT OFF`}
                    </span>
                  </div>
                  <p className="text-xs text-[#A3B8B0]">
                    {couponForm.description || `Save on your housekeeping booking`}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[9px] font-bold">
                    {couponForm.firstBookingOnly && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[#E9A23B] border border-[#E9A23B]/30">
                        1st Booking Only
                      </span>
                    )}
                    {couponForm.oncePerUser && (
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        1x Per Customer
                      </span>
                    )}
                    {couponForm.applicableServices.length > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {couponForm.applicableServices.length} Specific Service(s)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-white/10 text-[#F4EFE6]/70">
                        All Services
                      </span>
                    )}
                    {couponForm.minOrderValue > 0 && (
                      <span className="text-[#A3B8B0] font-mono">
                        Min Order: ₹{couponForm.minOrderValue}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="px-2 py-1 rounded-full bg-white/10 text-[10px] font-mono text-[#E9A23B] border border-[#E9A23B]/30 font-bold">
                    Live Checkout Preview
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#E2D9C8]">
                <button
                  type="button"
                  onClick={() => setCouponModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#ECE5D8] hover:bg-[#E2D9C8] text-xs font-bold text-[#10231D] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCoupon}
                  className="px-5 py-2 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#181511] font-bold text-xs transition-colors cursor-pointer shadow-sm"
                >
                  {savingCoupon ? 'Creating Voucher...' : 'Publish Discount Coupon'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Category Modal (Create / Edit) */}
        {categoryModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setCategoryModalOpen(false)}
            title={editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Category'}
            subtitle="Configure Category Name, URL Slug, Tagline, Display Order and Cover Image"
            maxWidth="max-w-xl"
          >
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Category Name:
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setCategoryForm(prev => ({
                      ...prev,
                      name,
                      slug: editingCategory ? prev.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                    }));
                  }}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                  placeholder="e.g. Balcony & Terrace Cleaning"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    URL Slug:
                  </label>
                  <input
                    type="text"
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-mono text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                    placeholder="e.g. balcony-cleaning"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Display Sort Order:
                  </label>
                  <input
                    type="number"
                    value={categoryForm.sortOrder}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, sortOrder: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                    min={0}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Tagline / Subtitle:
                </label>
                <input
                  type="text"
                  value={categoryForm.tagline}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, tagline: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                  placeholder="e.g. High-pressure wash and bird protection for open balconies."
                />
              </div>

              {/* Category Photo */}
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Category Cover Photo (Cloudinary):
                </label>
                <div className="flex items-center gap-3">
                  {categoryForm.imageUrl ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#E2D9C8] shrink-0 bg-[#ECE5D8]">
                      <img
                        src={categoryForm.imageUrl}
                        alt="Category Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setCategoryForm(prev => ({ ...prev, imageUrl: '' }))}
                        className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5 cursor-pointer"
                      >
                        <LuX className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-[#E2D9C8] flex items-center justify-center text-[#6B8077] shrink-0">
                      <LuImage className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#10231D] text-[#F4EFE6] text-xs font-bold cursor-pointer hover:bg-[#3D524A] transition-colors">
                      <LuUpload className="w-3.5 h-3.5 text-[#E9A23B]" />
                      <span>{uploadingCategoryImg ? 'Uploading...' : 'Upload Image to Cloudinary'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCategoryImageUpload}
                        className="hidden"
                        disabled={uploadingCategoryImg}
                      />
                    </label>
                    <p className="text-[10px] text-[#6B8077] mt-1">
                      High-resolution cover image for category card thumbnails.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="categoryActiveToggle"
                  checked={categoryForm.isActive}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded accent-[#E9A23B] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="categoryActiveToggle" className="text-xs font-bold text-[#10231D] cursor-pointer">
                  Active and visible on public website & service filters
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E2D9C8]">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E2D9C8] text-xs font-bold text-[#10231D] hover:bg-[#ECE5D8] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="px-5 py-2.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#181511] text-xs font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {savingCategory && <div className="w-3.5 h-3.5 border-2 border-[#10231D] border-t-transparent rounded-full animate-spin" />}
                  <span>{editingCategory ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Booking Comprehensive Details Modal */}
        {viewBookingDetails && (
          <Modal
            isOpen={Boolean(viewBookingDetails)}
            onClose={() => setViewBookingDetails(null)}
            title={`Booking #${viewBookingDetails.bookingCode}`}
          >
            <div className="space-y-5 text-xs text-[#10231D]">
              {/* Header Status & Code Banner */}
              <div className="p-4 rounded-2xl bg-[#10231D] text-[#F4EFE6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-black text-[#E9A23B] tracking-wider">
                      {viewBookingDetails.bookingCode}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      viewBookingDetails.status === 'completed' ? 'bg-emerald-500 text-white' :
                      viewBookingDetails.status === 'cancelled' ? 'bg-red-500 text-white' :
                      viewBookingDetails.status === 'in_progress' ? 'bg-blue-500 text-white' :
                      'bg-[#E9A23B] text-[#10231D]'
                    }`}>
                      {viewBookingDetails.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A3B8B0]">
                    Booked on: {new Date(viewBookingDetails.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <CustomSelect
                    size="sm"
                    value={viewBookingDetails.status}
                    onChange={(val) => {
                      handleUpdateBookingStatus(viewBookingDetails._id, val);
                      setViewBookingDetails(prev => ({ ...prev, status: val }));
                    }}
                    options={[
                      { value: 'pending', label: 'Pending' },
                      { value: 'confirmed', label: 'Confirmed' },
                      { value: 'in_progress', label: 'In Progress' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'cancelled', label: 'Cancelled' }
                    ]}
                    placeholder="Update Status..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setChatBooking(viewBookingDetails);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#10231D] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <LuMessageSquare className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </button>
                </div>
              </div>

              {/* Two Column: Customer Info & Appointment Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Details */}
                <div className="p-4 rounded-2xl bg-white border border-[#E2D9C8] space-y-2">
                  <h4 className="text-[11px] font-black uppercase text-[#6B8077] tracking-wider flex items-center gap-1.5">
                    <LuUsers className="w-3.5 h-3.5 text-[#E9A23B]" />
                    <span>Customer Details</span>
                  </h4>
                  <div>
                    <p className="font-bold text-sm text-[#10231D]">{viewBookingDetails.customer?.name}</p>
                    <a
                      href={`tel:${viewBookingDetails.customer?.phone}`}
                      className="text-xs font-semibold text-[#10231D] hover:text-[#E9A23B] flex items-center gap-1.5 mt-1"
                    >
                      <LuPhone className="w-3.5 h-3.5 text-[#E9A23B]" />
                      <span>{viewBookingDetails.customer?.phone}</span>
                    </a>
                    {viewBookingDetails.customer?.email && (
                      <a
                        href={`mailto:${viewBookingDetails.customer?.email}`}
                        className="text-[11px] text-[#6B8077] hover:underline flex items-center gap-1.5 mt-1"
                      >
                        <LuMail className="w-3.5 h-3.5 text-[#6B8077]" />
                        <span>{viewBookingDetails.customer?.email}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Service Location & Scheduled Slot */}
                <div className="p-4 rounded-2xl bg-white border border-[#E2D9C8] space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase text-[#6B8077] tracking-wider flex items-center gap-1.5">
                      <LuMapPin className="w-3.5 h-3.5 text-[#E9A23B]" />
                      <span>Address & Appointment Slot</span>
                    </h4>
                    {viewBookingDetails.address?.coordinates?.lat && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Pinpoint Verified
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {viewBookingDetails.address?.houseOrFlat && (
                      <p className="font-bold text-xs text-[#10231D] bg-[#ECE5D8] px-2 py-0.5 rounded inline-block">
                        {viewBookingDetails.address.houseOrFlat}
                      </p>
                    )}
                    <p className="font-semibold text-[#10231D] leading-snug">
                      {viewBookingDetails.address?.line1} {viewBookingDetails.address?.line2 || ''}
                    </p>
                    {viewBookingDetails.address?.landmark && (
                      <p className="text-[11px] text-[#6B8077]">Landmark: {viewBookingDetails.address.landmark}</p>
                    )}
                    <p className="text-xs font-bold text-[#10231D]">
                      {viewBookingDetails.cityName} ({viewBookingDetails.address?.pincode})
                      {viewBookingDetails.address?.isTemporary && (
                        <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Temporary Address
                        </span>
                      )}
                    </p>
                    {viewBookingDetails.address?.coordinates?.lat && (
                      <p className="text-[10px] font-mono text-[#6B8077]">
                        Coordinates: {viewBookingDetails.address.coordinates.lat.toFixed(5)}, {viewBookingDetails.address.coordinates.lng.toFixed(5)}
                      </p>
                    )}
                    <div className="pt-2 mt-2 border-t border-[#E2D9C8] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <LuClock className="w-3.5 h-3.5 text-[#E9A23B]" />
                        <span>{viewBookingDetails.slot?.date}</span>
                        <span className="text-[#6B8077]">({viewBookingDetails.slot?.window})</span>
                      </div>
                      <a
                        href={
                          viewBookingDetails.address?.coordinates?.lat
                            ? `https://www.google.com/maps/dir/?api=1&destination=${viewBookingDetails.address.coordinates.lat},${viewBookingDetails.address.coordinates.lng}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                `${viewBookingDetails.address?.houseOrFlat ? viewBookingDetails.address.houseOrFlat + ', ' : ''}${viewBookingDetails.address?.line1 || ''}, ${viewBookingDetails.cityName || ''} ${viewBookingDetails.address?.pincode || ''}`
                              )}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <LuExternalLink className="w-3 h-3" />
                        <span>View on Maps</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supervisor & On-Site OTP Verification Card */}
              <div className="p-4 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#E2D9C8] gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#10231D] text-[#E9A23B] flex items-center justify-center">
                      <LuShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-[#10231D] tracking-wider">
                        Field Supervisor & Arrival Verification OTP
                      </h4>
                      <p className="text-[10px] text-[#6B8077]">
                        Urban Company / Pronto on-site handshake protocol
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenAssignModal(viewBookingDetails)}
                    className="px-3 py-1.5 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <LuShieldCheck className="w-3.5 h-3.5 text-[#E9A23B]" />
                    <span>{viewBookingDetails.assignedSupervisor?.name || viewBookingDetails.supervisor ? 'Reassign Supervisor' : 'Assign Supervisor & Slot'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Supervisor Profile */}
                  <div className="p-3 rounded-xl bg-white border border-[#E2D9C8] space-y-1">
                    <span className="text-[10px] font-mono text-[#6B8077] uppercase block">Assigned Supervisor</span>
                    {viewBookingDetails.assignedSupervisor?.name || viewBookingDetails.supervisor?.name ? (
                      <div>
                        <p className="font-bold text-sm text-[#10231D] flex items-center gap-1.5">
                          <span>{viewBookingDetails.assignedSupervisor?.name || viewBookingDetails.supervisor?.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-100 text-emerald-800 font-bold uppercase">Dispatched</span>
                        </p>
                        {(viewBookingDetails.assignedSupervisor?.phone || viewBookingDetails.supervisor?.phone) && (
                          <a
                            href={`tel:${viewBookingDetails.assignedSupervisor?.phone || viewBookingDetails.supervisor?.phone}`}
                            className="text-xs font-semibold text-[#10231D] hover:text-[#E9A23B] flex items-center gap-1.5 mt-1"
                          >
                            <LuPhone className="w-3 h-3 text-[#E9A23B]" />
                            <span>{viewBookingDetails.assignedSupervisor?.phone || viewBookingDetails.supervisor?.phone}</span>
                          </a>
                        )}
                        {(viewBookingDetails.assignedSupervisor?.email || viewBookingDetails.supervisor?.email) && (
                          <p className="text-[10px] text-[#6B8077] flex items-center gap-1.5 mt-0.5">
                            <LuMail className="w-3 h-3 text-[#6B8077]" />
                            <span>{viewBookingDetails.assignedSupervisor?.email || viewBookingDetails.supervisor?.email}</span>
                          </p>
                        )}
                        {viewBookingDetails.assignedSlot?.timeWindow && (
                          <p className="text-[10px] font-mono text-[#3D524A] mt-1 pt-1 border-t border-[#E2D9C8]/60">
                            Slot: {viewBookingDetails.assignedSlot?.date || viewBookingDetails.slot?.date} • {viewBookingDetails.assignedSlot?.timeWindow}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="py-2">
                        <p className="text-xs font-bold text-amber-800">No supervisor assigned yet</p>
                        <p className="text-[10px] text-[#6B8077] mt-0.5">Click "Assign Supervisor & Slot" to allocate this job to a supervisor.</p>
                      </div>
                    )}
                  </div>

                  {/* Customer Service Verification OTP (Confidential to Customer) */}
                  <div className="p-3 rounded-xl bg-white border border-[#E2D9C8] space-y-1.5">
                    <span className="text-[10px] font-mono text-[#6B8077] uppercase block">Customer Arrival Handshake OTP</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#10231D] px-2.5 py-1 rounded-lg bg-[#F4EFE6] border border-[#E2D9C8]">
                        •••• (Protected Customer PIN)
                      </span>
                    </div>
                    <div>
                      {viewBookingDetails.otpVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full mt-1">
                          <LuCheck className="w-3 h-3 text-emerald-700" />
                          <span>Verified at visit {viewBookingDetails.otpVerifiedAt ? new Date(viewBookingDetails.otpVerifiedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full mt-1">
                          <LuClock className="w-3 h-3 text-amber-700" />
                          <span>Pending arrival OTP verification</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#6B8077]">
                      For security, only the customer sees their OTP on their tracking page. The supervisor enters it on arrival.
                    </p>
                  </div>
                </div>
              </div>

              {/* Control Room Live Field Radar */}
              {(viewBookingDetails.assignedSupervisor || viewBookingDetails.supervisor) && (
                <div className="p-4 rounded-2xl bg-white border border-[#E2D9C8] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-900 text-blue-200 flex items-center justify-center">
                        <LuCompass className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-[#10231D] tracking-wider flex items-center gap-1.5">
                          <span>Supervisor Live Location</span>
                          {viewBookingDetails.supervisorLiveLocation?.isSharing && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          )}
                        </h4>
                        <p className="text-[10px] text-[#6B8077]">
                          See supervisor's live position on map and arrival route to customer doorstep
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAdminRadar(!showAdminRadar)}
                      className="px-3 py-1.5 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <LuCompass className="w-3.5 h-3.5 text-[#E9A23B]" />
                      <span>{showAdminRadar ? 'Hide Map' : 'View Live Map'}</span>
                    </button>
                  </div>

                  {showAdminRadar && (
                    <div className="pt-2 border-t border-[#E2D9C8] rounded-xl overflow-hidden">
                      <LiveTrackingRadar
                        bookingCode={viewBookingDetails.bookingCode}
                        initialSupervisorLocation={viewBookingDetails.supervisorLiveLocation}
                        customerLocation={viewBookingDetails.address?.coordinates}
                        destinationAddress={`${viewBookingDetails.address?.houseOrFlat ? viewBookingDetails.address.houseOrFlat + ', ' : ''}${viewBookingDetails.address?.line1 || ''}, ${viewBookingDetails.cityName}`}
                        supervisorInfo={{
                          name: viewBookingDetails.assignedSupervisor?.name || viewBookingDetails.supervisor?.name,
                          phone: viewBookingDetails.assignedSupervisor?.phone || viewBookingDetails.supervisor?.phone,
                          role: 'Field Supervisor'
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Before & After Inspection Photos Gallery */}
              <div className="p-4 rounded-2xl bg-white border border-[#E2D9C8] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2D9C8]">
                  <h4 className="text-[11px] font-black uppercase text-[#6B8077] tracking-wider flex items-center gap-1.5">
                    <LuCamera className="w-3.5 h-3.5 text-[#E9A23B]" />
                    <span>Inspection Photos: Before & After ({((viewBookingDetails.photos?.before?.length || 0) + (viewBookingDetails.photos?.after?.length || 0))})</span>
                  </h4>
                  <span className="text-[10px] font-mono text-[#6B8077]">Cloudinary Verified</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Before Service Photos */}
                  <div className="space-y-2 p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#10231D] flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span>Before Cleaning ({viewBookingDetails.photos?.before?.length || 0})</span>
                      </span>
                    </div>
                    {viewBookingDetails.photos?.before && viewBookingDetails.photos.before.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {viewBookingDetails.photos.before.map((p, idx) => (
                          <a
                            key={idx}
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square rounded-lg overflow-hidden bg-white border border-[#E2D9C8] block shadow-xs"
                          >
                            <img src={p.url} alt={`Before ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                              <LuEye className="w-3.5 h-3.5" />
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-[#6B8077] italic py-3 text-center">No "before" photos uploaded yet.</p>
                    )}
                  </div>

                  {/* After Service Photos */}
                  <div className="space-y-2 p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#10231D] flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>After Cleaning ({viewBookingDetails.photos?.after?.length || 0})</span>
                      </span>
                    </div>
                    {viewBookingDetails.photos?.after && viewBookingDetails.photos.after.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {viewBookingDetails.photos.after.map((p, idx) => (
                          <a
                            key={idx}
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square rounded-lg overflow-hidden bg-white border border-[#E2D9C8] block shadow-xs"
                          >
                            <img src={p.url} alt={`After ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                              <LuEye className="w-3.5 h-3.5" />
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-[#6B8077] italic py-3 text-center">No "after" photos uploaded yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Booked Items Breakdown Table */}
              <div className="p-4 rounded-2xl bg-white border border-[#E2D9C8] space-y-3">
                <h4 className="text-[11px] font-black uppercase text-[#6B8077] tracking-wider flex items-center gap-1.5">
                  <LuSparkles className="w-3.5 h-3.5 text-[#E9A23B]" />
                  <span>Booked Cleaning Services ({viewBookingDetails.items?.length || 0})</span>
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E2D9C8] text-[#6B8077] font-mono uppercase text-[10px]">
                        <th className="py-2 px-2">Service</th>
                        <th className="py-2 px-2">Variant / Area</th>
                        <th className="py-2 px-2 text-center">Qty</th>
                        <th className="py-2 px-2 text-right">Unit Rate</th>
                        <th className="py-2 px-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2D9C8]/60">
                      {(viewBookingDetails.items || []).map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-2 font-bold text-[#10231D]">
                            {it.titleSnapshot || 'Cleaning Service'}
                          </td>
                          <td className="py-2.5 px-2 text-[#3D524A] font-mono">
                            {it.variantSnapshot || 'Standard'}
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold font-mono">
                            {it.qty || 1}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-[#6B8077]">
                            ₹{(it.priceSnapshot || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-2 text-right font-black text-[#10231D] font-mono">
                            ₹{((it.priceSnapshot || 0) * (it.qty || 1)).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial & Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-[#E2D9C8] space-y-2">
                  <h4 className="text-[11px] font-black uppercase text-[#6B8077] tracking-wider flex items-center gap-1.5">
                    <LuCreditCard className="w-3.5 h-3.5 text-[#E9A23B]" />
                    <span>Payment Method & Status</span>
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B8077]">Mode:</span>
                      <span className="font-bold text-[#10231D] uppercase font-mono">
                        {viewBookingDetails.paymentMode?.replace(/_/g, ' ') || 'Cash on Service'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B8077]">Payment Status:</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        viewBookingDetails.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {viewBookingDetails.paymentStatus || 'Pending'}
                      </span>
                    </div>
                    {viewBookingDetails.paymentDetails?.transactionId && (
                      <div className="flex items-center justify-between pt-1 border-t border-[#E2D9C8]">
                        <span className="text-[#6B8077]">Ref / Txn ID:</span>
                        <span className="font-mono text-[10px] text-[#10231D] font-bold">
                          {viewBookingDetails.paymentDetails.transactionId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8] space-y-2">
                  <h4 className="text-[11px] font-black uppercase text-[#6B8077] tracking-wider">
                    Price Breakdown
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-[#6B8077]">
                      <span>Subtotal:</span>
                      <span className="font-mono">₹{(viewBookingDetails.totals?.subtotal || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {viewBookingDetails.totals?.outstationSurcharge > 0 && (
                      <div className="flex justify-between text-[#3D524A] font-semibold">
                        <span className="flex items-center gap-1">
                          <LuTruck className="w-3.5 h-3.5 text-[#E9A23B]" />
                          <span>Outstation Surcharge:</span>
                        </span>
                        <span className="font-mono text-[#10231D]">
                          +₹{viewBookingDetails.totals.outstationSurcharge.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    {viewBookingDetails.appliedCoupon?.code && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Coupon ({viewBookingDetails.appliedCoupon.code}):</span>
                        <span className="font-mono">-₹{(viewBookingDetails.appliedCoupon.discountAmount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {viewBookingDetails.totals?.platformChargeAmount > 0 && (
                      <div className="flex justify-between text-[#3D524A] font-semibold">
                        <span>{viewBookingDetails.totals.platformChargeLabel || 'Platform Charges'}:</span>
                        <span className="font-mono text-[#10231D]">
                          +₹{viewBookingDetails.totals.platformChargeAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    {viewBookingDetails.totals?.gstAmount > 0 && (
                      <div className="flex justify-between text-[#3D524A] font-semibold">
                        <span>GST ({viewBookingDetails.totals.gstPercentage || 18}%):</span>
                        <span className="font-mono text-[#10231D]">
                          +₹{viewBookingDetails.totals.gstAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    {viewBookingDetails.totals?.customerSaved > 0 && (
                      <div className="flex justify-between text-[#E9A23B] font-semibold text-[11px]">
                        <span>Customer Savings:</span>
                        <span className="font-mono">₹{viewBookingDetails.totals.customerSaved.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-[#E2D9C8] flex justify-between font-black text-sm text-[#10231D]">
                      <span>Total Payable:</span>
                      <span className="font-mono text-[#10231D]">
                        ₹{(viewBookingDetails.totals?.total ?? viewBookingDetails.total ?? 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Notes */}
              {viewBookingDetails.notes && (
                <div className="p-3.5 rounded-2xl bg-white border border-[#E2D9C8]">
                  <span className="text-[11px] font-bold text-[#6B8077] uppercase block mb-1">
                    Customer Special Instructions:
                  </span>
                  <p className="text-xs text-[#10231D] italic">
                    "{viewBookingDetails.notes}"
                  </p>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-3 border-t border-[#E2D9C8]">
                <button
                  type="button"
                  onClick={() => setViewBookingDetails(null)}
                  className="px-5 py-2.5 rounded-xl bg-[#10231D] text-[#F4EFE6] font-bold text-xs hover:bg-[#3D524A] transition-colors cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Customer Contact Inquiry Detail Modal */}
        {viewInquiryDetails && (
          <Modal
            isOpen={Boolean(viewInquiryDetails)}
            onClose={() => setViewInquiryDetails(null)}
            title="Customer Contact Inquiry"
            subtitle={`Submitted on ${new Date(viewInquiryDetails.createdAt).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short'
            })}`}
            maxWidth="max-w-xl"
          >
            <div className="space-y-4 text-xs text-[#10231D]">
              {/* Header Status & Sender Banner */}
              <div className="p-4 rounded-2xl bg-[#10231D] text-[#F4EFE6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display text-base font-bold text-[#F4EFE6]">
                      {viewInquiryDetails.name}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                      viewInquiryDetails.status === 'replied' ? 'bg-emerald-500 text-white' :
                      viewInquiryDetails.status === 'read' ? 'bg-sky-600 text-white' :
                      'bg-[#E9A23B] text-[#10231D]'
                    }`}>
                      {viewInquiryDetails.status || 'unread'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A3B8B0] font-mono">
                    ID: {viewInquiryDetails._id}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#A3B8B0]">Status:</span>
                  <div className="w-32">
                    <CustomSelect
                      size="sm"
                      value={viewInquiryDetails.status || 'unread'}
                      onChange={(val) => {
                        handleUpdateMessageStatus(viewInquiryDetails._id, val);
                        setViewInquiryDetails(prev => prev ? ({ ...prev, status: val }) : null);
                      }}
                      options={[
                        { value: 'unread', label: 'Unread' },
                        { value: 'read', label: 'Read' },
                        { value: 'replied', label: 'Replied' }
                      ]}
                      placeholder="Status..."
                    />
                  </div>
                </div>
              </div>

              {/* Sender Contact Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Phone */}
                <div className="p-3.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8]">
                  <span className="text-[10px] font-mono text-[#6B8077] uppercase tracking-wider block mb-1">
                    Phone Number
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={`tel:${viewInquiryDetails.phone}`}
                      className="font-bold text-sm text-[#10231D] hover:text-[#E9A23B] flex items-center gap-1.5 transition-colors"
                    >
                      <LuPhone className="w-3.5 h-3.5 text-[#E9A23B]" />
                      <span>{viewInquiryDetails.phone || 'Not provided'}</span>
                    </a>
                    {viewInquiryDetails.phone && (
                      <a
                        href={`https://wa.me/${viewInquiryDetails.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded-lg bg-[#25D366] text-white text-[10px] font-bold hover:brightness-105 transition-all shadow-xs"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="p-3.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8]">
                  <span className="text-[10px] font-mono text-[#6B8077] uppercase tracking-wider block mb-1">
                    Email Address
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    {viewInquiryDetails.email ? (
                      <a
                        href={`mailto:${viewInquiryDetails.email}?subject=Re: ${encodeURIComponent(viewInquiryDetails.subject || 'Inquiry - Max Housekeeping Service')}`}
                        className="font-bold text-sm text-[#10231D] hover:text-[#E9A23B] flex items-center gap-1.5 transition-colors truncate"
                      >
                        <LuMail className="w-3.5 h-3.5 text-[#E9A23B] shrink-0" />
                        <span className="truncate">{viewInquiryDetails.email}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-[#6B8077] italic">No email provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div className="p-3.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8]">
                <span className="text-[10px] font-mono text-[#6B8077] uppercase tracking-wider block mb-1">
                  Subject / Topic
                </span>
                <p className="font-bold text-sm text-[#10231D]">
                  {viewInquiryDetails.subject || 'General Inquiry'}
                </p>
              </div>

              {/* Message Content */}
              <div className="p-4 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] space-y-1.5">
                <span className="text-[10px] font-mono text-[#6B8077] uppercase tracking-wider block">
                  Customer Message
                </span>
                <div className="p-3.5 rounded-lg bg-[#ECE5D8] border border-[#E2D9C8] text-[#10231D] font-sans text-xs leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                  {viewInquiryDetails.message}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-[#E2D9C8]">
                <button
                  type="button"
                  onClick={() => {
                    const id = viewInquiryDetails._id;
                    setViewInquiryDetails(null);
                    handleDeleteMessage(id);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#F9ECE8] hover:bg-[#F2D7D1] text-[#C2512D] border border-[#F2D7D1] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto justify-center"
                >
                  <LuTrash2 className="w-3.5 h-3.5" />
                  <span>Delete Inquiry</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {viewInquiryDetails.phone && (
                    <a
                      href={`tel:${viewInquiryDetails.phone}`}
                      className="px-3.5 py-2 rounded-xl bg-[#ECE5D8] hover:bg-[#E2D9C8] border border-[#E2D9C8] text-[#10231D] font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <LuPhone className="w-3.5 h-3.5 text-[#E9A23B]" />
                      <span>Call Customer</span>
                    </a>
                  )}
                  {viewInquiryDetails.email && (
                    <a
                      href={`mailto:${viewInquiryDetails.email}?subject=Re: ${encodeURIComponent(viewInquiryDetails.subject || 'Inquiry - Max Housekeeping Service')}`}
                      className="px-3.5 py-2 rounded-xl bg-[#ECE5D8] hover:bg-[#E2D9C8] border border-[#E2D9C8] text-[#10231D] font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <LuMail className="w-3.5 h-3.5 text-[#E9A23B]" />
                      <span>Email Reply</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setViewInquiryDetails(null)}
                    className="px-4 py-2 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] font-bold text-xs transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Supervisor Create / Edit Modal */}
        {supervisorModalOpen && (
          <Modal
            isOpen={supervisorModalOpen}
            onClose={() => setSupervisorModalOpen(false)}
            title={editingSupervisor ? `Edit Supervisor: ${editingSupervisor.name}` : 'Create Field Supervisor ID'}
            subtitle="Authorizes supervisor login access to the dedicated supervisor dispatch console."
            maxWidth="max-w-lg"
          >
            <form onSubmit={handleSaveSupervisor} className="space-y-4 text-xs text-[#10231D]">
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Full Name: <span className="text-[#C2512D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={supervisorForm.name}
                  onChange={(e) => setSupervisorForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#E2D9C8] text-xs font-medium text-[#10231D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Login Email: <span className="text-[#C2512D]">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. supervisor.rahul@maxhousekeeping.com"
                  value={supervisorForm.email}
                  onChange={(e) => setSupervisorForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#E2D9C8] text-xs font-medium text-[#10231D]"
                />
                <p className="text-[10px] text-[#6B8077] mt-0.5">Used by supervisor to log into the /supervisor console.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  {editingSupervisor ? 'Change Password (leave blank to keep current):' : 'Password (min. 6 chars):'} {!editingSupervisor && <span className="text-[#C2512D]">*</span>}
                </label>
                <input
                  type="password"
                  placeholder={editingSupervisor ? '••••••••' : 'Enter strong password'}
                  required={!editingSupervisor}
                  value={supervisorForm.password}
                  onChange={(e) => setSupervisorForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#E2D9C8] text-xs font-medium text-[#10231D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Phone Number:
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={supervisorForm.phone}
                    onChange={(e) => setSupervisorForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E2D9C8] text-xs font-medium text-[#10231D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Operating City:
                  </label>
                  <select
                    value={supervisorForm.city}
                    onChange={(e) => setSupervisorForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E2D9C8] text-xs font-bold text-[#10231D]"
                  >
                    {cities.map(c => (
                      <option key={c._id || c.slug} value={c.slug || c.name.toLowerCase()}>{c.name}</option>
                    ))}
                    {cities.length === 0 && (
                      <option value="moradabad">Moradabad</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Account Status:
                </label>
                <select
                  value={supervisorForm.status}
                  onChange={(e) => setSupervisorForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#E2D9C8] text-xs font-bold text-[#10231D]"
                >
                  <option value="active">Active (Permitted to log in and accept jobs)</option>
                  <option value="suspended">Suspended (Access temporarily revoked)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2D9C8]">
                <button
                  type="button"
                  onClick={() => setSupervisorModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#ECE5D8] hover:bg-[#E2D9C8] text-[#10231D] font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSupervisor}
                  className="px-5 py-2 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <LuCheck className="w-3.5 h-3.5 text-[#E9A23B]" />
                  <span>{savingSupervisor ? 'Saving...' : editingSupervisor ? 'Save Updates' : 'Create Supervisor'}</span>
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Booking Supervisor Assignment & Time Slot Modal */}
        {assignModalOpen && assignBooking && (
          <Modal
            isOpen={assignModalOpen}
            onClose={() => setAssignModalOpen(false)}
            title={`Assign Supervisor & Slot (Order #${assignBooking.bookingCode})`}
            subtitle="Urban Company / Pronto style dispatch. Customer is issued a 4-digit OTP for arrival handshake."
            maxWidth="max-w-lg"
          >
            <form onSubmit={handleSaveAssignment} className="space-y-4 text-xs text-[#10231D]">
              <div className="p-3.5 rounded-xl bg-[#10231D] text-[#F4EFE6] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#E9A23B] block">CUSTOMER & CITY</span>
                  <p className="font-bold text-sm text-[#F4EFE6]">{assignBooking.customer?.name} ({assignBooking.cityName})</p>
                  <p className="text-[11px] text-[#A3B8B0]">{assignBooking.customer?.phone}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#A3B8B0] block">CURRENT STATUS</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E9A23B] text-[#10231D] uppercase">
                    {assignBooking.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Select Field Supervisor: <span className="text-[#C2512D]">*</span>
                </label>
                <select
                  required
                  value={assignSupervisorId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAssignSupervisorId(val);
                    const supAvail = slotAvailability.find(s => s._id === val);
                    if (supAvail && !supAvail.isAvailableInSlot && supAvail.conflictBooking) {
                      setSlotConflictWarning(supAvail.conflictBooking);
                    } else {
                      setSlotConflictWarning(null);
                    }
                  }}
                  className={`w-full p-2.5 rounded-xl bg-white border text-xs font-bold text-[#10231D] ${
                    slotConflictWarning ? 'border-[#C2512D] ring-2 ring-[#C2512D]/20' : 'border-[#E2D9C8]'
                  }`}
                >
                  <option value="">-- Choose an active supervisor --</option>
                  {supervisors.map(s => {
                    const avail = slotAvailability.find(a => a._id === s._id);
                    let tag = '';
                    if (avail) {
                      if (!avail.isAvailableInSlot) {
                        tag = `[BUSY in Slot: #${avail.conflictBooking?.bookingCode || 'Active Booking'}]`;
                      } else {
                        tag = `[AVAILABLE • ${avail.dayBookingsCount} job${avail.dayBookingsCount === 1 ? '' : 's'} on date]`;
                      }
                    }
                    return (
                      <option key={s._id} value={s._id} disabled={s.status === 'suspended'}>
                        {s.name} ({s.city || 'Moradabad'}) {tag} {s.status === 'suspended' ? '[Suspended]' : ''}
                      </option>
                    );
                  })}
                </select>
                {supervisors.length === 0 && (
                  <p className="text-[10px] text-[#C2512D] mt-1">
                    No supervisors registered yet. Please create a supervisor account in the Supervisors tab first.
                  </p>
                )}
              </div>

              {/* Real-time Time Slot Conflict Warning Banner */}
              {slotConflictWarning && (
                <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#F87171] text-xs text-[#991B1B] space-y-2 animate-fadeIn">
                  <div className="flex items-start gap-2">
                    <LuTriangleAlert className="w-4 h-4 text-[#C2512D] shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold block text-[#B91C1C]">Time Slot Double-Booking Conflict</strong>
                      <p className="text-[11px] leading-relaxed text-[#7F1D1D]">
                        Supervisor is already allotted to Booking <strong>#{slotConflictWarning.bookingCode}</strong> ({slotConflictWarning.serviceTitle || 'Service'}) on this date during <strong>{slotConflictWarning.timeWindow || assignTimeWindow}</strong>.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 pt-2 border-t border-[#FCA5A5] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignAllowConflict}
                      onChange={(e) => setAssignAllowConflict(e.target.checked)}
                      className="w-4 h-4 text-[#C2512D] rounded accent-[#C2512D] cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-[#991B1B]">
                      Force Overlap Override (Admin Emergency / Multi-Crew Allotment)
                    </span>
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Scheduled Date:
                  </label>
                  <input
                    type="date"
                    required
                    value={assignDate}
                    onChange={(e) => setAssignDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E2D9C8] text-xs font-mono font-bold text-[#10231D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Time Window Slot:
                  </label>
                  <select
                    value={assignTimeWindow}
                    onChange={(e) => setAssignTimeWindow(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E2D9C8] text-xs font-bold text-[#10231D]"
                  >
                    <option value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM (Early Morning)</option>
                    <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM (Morning)</option>
                    <option value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM (Noon)</option>
                    <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM (Afternoon)</option>
                    <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM (Late Afternoon)</option>
                    <option value="06:00 PM - 08:00 PM">06:00 PM - 08:00 PM (Evening)</option>
                  </select>
                </div>
              </div>

              {/* Slot Availability Helper Status */}
              <div className="flex items-center justify-between text-[11px] text-[#6B8077] px-1">
                {checkingAvailability ? (
                  <span className="flex items-center gap-1.5 text-[#E9A23B] font-mono">
                    <LuClock className="w-3.5 h-3.5 animate-spin" /> Checking slot availability...
                  </span>
                ) : slotAvailability.length > 0 ? (
                  <span>
                    Available in {assignTimeWindow}: <strong className="text-[#10231D]">{slotAvailability.filter(s => s.isAvailableInSlot).length} / {slotAvailability.length}</strong> supervisors
                  </span>
                ) : (
                  <span>Select date & time slot to check live supervisor capacity</span>
                )}
                {assignAllowConflict && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FEE2E2] text-[#B91C1C]">
                    OVERRIDE ACTIVE
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Dispatch Instructions / Equipment Notes:
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bring industrial vacuum cleaner and sofa fabric shampoo. Customer requests quiet entry."
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#E2D9C8] text-xs text-[#10231D]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-[11px] text-[#6B8077] flex items-center gap-2">
                <LuKey className="w-4 h-4 text-[#E9A23B] shrink-0" />
                <span>
                  <strong>On-Site OTP Security:</strong> A 4-digit arrival OTP is issued privately to the customer on their booking tracker. Supervisor must collect and enter this OTP on arrival before starting the job.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2D9C8]">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#ECE5D8] hover:bg-[#E2D9C8] text-[#10231D] font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigningSupervisor}
                  className="px-5 py-2 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <LuShieldCheck className="w-3.5 h-3.5 text-[#E9A23B]" />
                  <span>{assigningSupervisor ? 'Dispatching...' : 'Confirm Assignment'}</span>
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Admin Live Tracking Modal */}
        {trackingBookingAdmin && (() => {
          const supName = (trackingBookingAdmin.assignedSupervisor?.name || trackingBookingAdmin.supervisor?.name || '').trim();
          const hasAssignedSup = Boolean(
            supName ||
            trackingBookingAdmin.assignedSupervisor?.id ||
            trackingBookingAdmin.supervisor?._id ||
            (typeof trackingBookingAdmin.supervisor === 'string' && trackingBookingAdmin.supervisor.trim())
          );
          return (
            <Modal
              isOpen={Boolean(trackingBookingAdmin)}
              onClose={() => setTrackingBookingAdmin(null)}
              title={`Track Location · #${trackingBookingAdmin.bookingCode}`}
              subtitle={
                hasAssignedSup
                  ? 'Live location and route of the supervisor'
                  : 'Supervisor assignment status and service location'
              }
              maxWidth="max-w-4xl"
            >
              <div className="space-y-4">
                <LiveTrackingRadar
                  bookingCode={trackingBookingAdmin.bookingCode}
                  isSupervisorAssigned={hasAssignedSup}
                  initialSupervisorLocation={hasAssignedSup ? trackingBookingAdmin.supervisorLiveLocation : null}
                  customerLocation={trackingBookingAdmin.address?.coordinates}
                  destinationAddress={`${trackingBookingAdmin.address?.houseOrFlat ? trackingBookingAdmin.address.houseOrFlat + ', ' : ''}${trackingBookingAdmin.address?.line1 || ''}, ${trackingBookingAdmin.cityName || ''}`}
                  supervisorInfo={
                    hasAssignedSup
                      ? {
                          name: supName || 'Assigned Supervisor',
                          phone: trackingBookingAdmin.assignedSupervisor?.phone || trackingBookingAdmin.supervisor?.phone || '',
                          avatar: trackingBookingAdmin.assignedSupervisor?.avatar || trackingBookingAdmin.supervisor?.avatar || '',
                          role: 'Supervisor'
                        }
                      : null
                  }
                />
                <div className="flex items-center justify-between pt-2">
                  <a
                    href={`/track/${trackingBookingAdmin.bookingCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#E9A23B] hover:underline font-bold flex items-center gap-1"
                  >
                    <span>Open Fullscreen</span>
                    <LuExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setTrackingBookingAdmin(null)}
                    className="px-4 py-2 rounded-xl bg-[#10231D] text-[#F4EFE6] text-xs font-bold hover:bg-[#3D524A] transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </Modal>
          );
        })()}

        {/* Global Action Confirmation Modal */}
        {confirmModalConfig && (
          <ConfirmModal
            isOpen={Boolean(confirmModalConfig)}
            onClose={() => setConfirmModalConfig(null)}
            {...confirmModalConfig}
          />
        )}
          </main>
        </div>
      </div>
    </div>
  );
}
