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
  LuChevronDown
} from 'react-icons/lu';
import {
  apiRequest,
  adminAPI,
  FALLBACK_CATEGORIES
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useBooking } from '../../context/BookingContext';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import CustomSelect from '../../components/common/CustomSelect';
import { getServiceIcon, AVAILABLE_ICONS } from '../../utils/iconHelper';
import ServiceCarousel from '../../components/common/ServiceCarousel';

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
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
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
    discountType: 'flat',
    discountValue: 100,
    minOrderValue: 499,
    maxDiscount: 500,
    expiryDate: '',
    usageLimit: 1000
  });
  const [savingCoupon, setSavingCoupon] = useState(false);

  const [settingsForm, setSettingsForm] = useState({
    brandName: 'Max House Keeping Service',
    tagline: 'A spotless home, without lifting a finger.',
    phone: '+91 98977 66002',
    alternatePhone: '+91 82105 23309',
    whatsappNumber: '+91 98977 66002',
    email: 'vikasmax321@gmail.com',
    address: 'Kanth road, Behind Asian Vivekanand Hospital, Moradabad, Uttar Pradesh 244001',
    workingHours: '8:00 AM – 8:00 PM (Monday – Sunday)',
    gstEnabled: false,
    gstPercentage: 18,
    ratingClaim: 'Rated 4.9/5 by 10,000+ happy homes',
    acceptOnlinePayments: false,
    paymentGatewayProvider: 'razorpay',
    razorpayKeyId: '',
    razorpayKeySecret: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const [createServiceModalOpen, setCreateServiceModalOpen] = useState(false);
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
  });
  const [uploadingServiceImage, setUploadingServiceImage] = useState(false);

  // City Modal & Form State
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [cityForm, setCityForm] = useState({
    name: '',
    slug: '',
    state: 'Uttar Pradesh',
    serviceRadiusKm: 25,
    pincodes: '',
    status: 'active',
    sortOrder: 0
  });

  // Testimonial Modal & Form State
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [testimonialForm, setTestimonialForm] = useState({
    name: '',
    role: 'Homeowner',
    city: 'Moradabad',
    quote: '',
    rating: 5,
    avatar: '',
    avatarPublicId: '',
    isFeatured: false,
    isActive: true
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Chat Communication Thread State
  const [chatBooking, setChatBooking] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

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
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E9A23B] text-[#10231D]">
                      ★ Primary
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

                <div className="p-1.5 bg-white text-[10px] font-bold text-[#6B8077] truncate text-center border-t border-[#ECE5D8]">
                  {idx === 0 ? '★ Primary Cover' : `Gallery Photo #${idx + 1}`}
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

  // Load All Admin Data
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, bookingsRes, servicesRes, categoriesRes, citiesRes, usersRes, testsRes, msgsRes, couponsRes, settingsRes] = await Promise.allSettled([
        apiRequest('/admin/stats'),
        apiRequest('/admin/bookings?limit=50'),
        apiRequest('/admin/services'),
        adminAPI.getCategories(),
        adminAPI.getCities(),
        adminAPI.getUsers(),
        adminAPI.getTestimonials(),
        adminAPI.getContactMessages(),
        adminAPI.getCoupons(),
        adminAPI.getSettings()
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

    setServiceForm({
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
      inclusions: Array.isArray(service.inclusions) ? service.inclusions.join('\n') : (service.inclusions || ''),
      exclusions: Array.isArray(service.exclusions) ? service.exclusions.join('\n') : (service.exclusions || '')
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

      const payload = {
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

      const payload = {
        title: newServiceForm.title.trim(),
        slug: newServiceForm.slug.trim() || newServiceForm.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        categories: selectedCats,
        price: Number(newServiceForm.price),
        mrp: Number(newServiceForm.mrp),
        duration: newServiceForm.duration || '1.5 hrs',
        icon: newServiceForm.icon || 'Sparkles',
        shortDescription: newServiceForm.shortDescription,
        description: newServiceForm.description || newServiceForm.shortDescription || `${newServiceForm.title} by Max House Keeping Service.`,
        variantGroupLabel: newServiceForm.variantGroupLabel || 'Apartment / House Size',
        variantGroupKey: newServiceForm.variantGroupKey || 'size',
        variants: newServiceForm.variants || [],
        inclusions: parseList(newServiceForm.inclusions),
        exclusions: parseList(newServiceForm.exclusions)
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
          exclusions: ''
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
        discountType: couponForm.discountType,
        discountValue: Number(couponForm.discountValue),
        minOrderValue: Number(couponForm.minOrderValue) || 0,
        minBookingAmount: Number(couponForm.minOrderValue) || 0,
        maxDiscount: couponForm.discountType === 'percentage' && couponForm.maxDiscount ? Number(couponForm.maxDiscount) : undefined,
        usageLimit: Number(couponForm.usageLimit) || 1000,
        expiryDate: couponForm.expiryDate ? new Date(couponForm.expiryDate) : undefined,
        validUntil: couponForm.expiryDate ? new Date(couponForm.expiryDate) : undefined,
        isActive: true
      };
      const res = await adminAPI.createCoupon(payload);
      if (res.success && res.coupon) {
        toast.success(`Coupon "${res.coupon.code}" created successfully!`);
        setCoupons(prev => [res.coupon, ...prev]);
        setCouponModalOpen(false);
        setCouponForm({
          code: '',
          discountType: 'flat',
          discountValue: 100,
          minOrderValue: 499,
          maxDiscount: 500,
          expiryDate: '',
          usageLimit: 1000
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
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await adminAPI.updateSettings(settingsForm);
      if (res.success) {
        toast.success('Business settings and contact configuration saved successfully!');
        if (res.settings) {
          setSettingsForm(prev => ({ ...prev, ...res.settings }));
        }
        if (typeof refreshSettings === 'function') {
          refreshSettings();
        }
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
        quote: item.quote || '',
        rating: item.rating || 5,
        avatar: item.avatar || '',
        avatarPublicId: item.avatarPublicId || '',
        isFeatured: Boolean(item.isFeatured),
        isActive: item.isActive !== false
      });
    } else {
      setEditingTestimonial(null);
      setTestimonialForm({
        name: '',
        role: 'Homeowner',
        city: 'Moradabad',
        quote: '',
        rating: 5,
        avatar: '',
        avatarPublicId: '',
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

  // Save Testimonial (Create or Update)
  const handleSaveTestimonial = async (e) => {
    e.preventDefault();
    if (!testimonialForm.name.trim() || !testimonialForm.quote.trim()) {
      toast.error('Client name and review quote are required.');
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
          toast.success('New testimonial added to Home Page!');
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
      }
    } catch (err) {
      toast.error('Failed to update message status.');
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

  // Open City Modal
  const openCityModal = (city = null) => {
    if (city) {
      setEditingCity(city);
      setCityForm({
        name: city.name || '',
        slug: city.slug || '',
        state: city.state || 'Uttar Pradesh',
        serviceRadiusKm: city.serviceRadiusKm || 25,
        pincodes: Array.isArray(city.pincodes) ? city.pincodes.join(', ') : '',
        status: city.status || 'active',
        sortOrder: city.sortOrder || 0
      });
    } else {
      setEditingCity(null);
      setCityForm({
        name: '',
        slug: '',
        state: 'Uttar Pradesh',
        serviceRadiusKm: 25,
        pincodes: '',
        status: 'active',
        sortOrder: cities.length + 1
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

    const payload = {
      name: cityForm.name.trim(),
      slug: cityForm.slug.trim() || cityForm.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      state: cityForm.state.trim() || 'Uttar Pradesh',
      serviceRadiusKm: Number(cityForm.serviceRadiusKm) || 25,
      pincodes: pincodesArray,
      status: cityForm.status,
      sortOrder: Number(cityForm.sortOrder) || 0
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
    if (!q) return true;
    return (
      c.name?.toLowerCase().includes(q) ||
      c.slug?.toLowerCase().includes(q) ||
      c.tagline?.toLowerCase().includes(q)
    );
  });

  const adminTabs = [
    { id: 'bookings', label: 'Bookings & Dispatch', icon: LuCalendar, count: bookings.length },
    { id: 'services', label: 'Services & Dual-Pricing', icon: LuSparkles, count: services.length },
    { id: 'categories', label: 'Category Management', icon: LuLayers, count: categories.length },
    { id: 'cities', label: 'Cities & Regions', icon: LuMapPin, count: cities.length },
    { id: 'users', label: 'Users Database', icon: LuUsers, count: users.length },
    { id: 'testimonials', label: 'Testimonials', icon: LuStar, count: testimonials.length },
    { id: 'messages', label: 'Inquiries', icon: LuMail, count: unreadMessagesCount, isAlert: unreadMessagesCount > 0 },
    { id: 'coupons', label: 'Coupons & Promos', icon: LuTicket, count: coupons.length },
    { id: 'settings', label: 'Business Settings', icon: LuSettings }
  ];

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
    return matchesSearch && matchesStatus;
  });

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
              </div>

              {(bookingSearch || bookingStatusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setBookingSearch('');
                    setBookingStatusFilter('all');
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
                          {b.bookingCode}
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
                          {b.slot?.date} ({b.slot?.window?.split(' ')[0] || 'Scheduled'})
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((svc) => {
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
              })}
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
                          {test.name}
                          {test.isFeatured && (
                            <span className="block text-[10px] font-mono font-bold text-[#E9A23B]">
                              ★ FEATURED
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
                            {'★'.repeat(test.rating || 5)}
                          </div>
                        </td>

                        {/* Quote Excerpt */}
                        <td className="py-3 px-3 max-w-[320px] text-[#3D524A] leading-relaxed line-clamp-2">
                          "{test.quote}"
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
              <div>
                <h3 className="font-display font-bold text-xl text-[#10231D]">
                  Customer Contact Inquiries ({contactMessages.length})
                </h3>
                <p className="text-xs text-[#6B8077] mt-0.5">
                  Submissions from the Contact Page. Emails are automatically dispatched to admin and confirmation sent to customer.
                </p>
              </div>
            </div>

            {contactMessages.length === 0 ? (
              <div className="py-12 text-center text-[#6B8077]">
                <LuInbox className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">No contact inquiries yet.</p>
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
                      <th className="py-3 px-3 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2D9C8]/60">
                    {contactMessages.map((msg) => (
                      <tr key={msg._id} className="hover:bg-[#F4EFE6]/50">
                        <td className="py-3 px-3 font-mono text-[#6B8077]">
                          {new Date(msg.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#10231D]">
                          {msg.name}
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
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg._id)}
                            className="p-1.5 rounded-lg bg-[#F9ECE8] hover:bg-[#F2D7D1] text-[#C2512D] border border-[#F2D7D1]"
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

            {cities.length === 0 ? (
              <div className="py-12 text-center text-[#6B8077]">
                <LuMapPin className="w-10 h-10 mx-auto mb-2 opacity-50 text-[#E9A23B]" />
                <p className="text-sm font-bold text-[#10231D]">No service cities found</p>
                <p className="text-xs text-[#6B8077] mt-1">Click "+ Add New City" to register an active service location.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E2D9C8] text-[#6B8077] font-mono uppercase">
                      <th className="py-3 px-3">City Name</th>
                      <th className="py-3 px-3">State & Slug</th>
                      <th className="py-3 px-3">Service Radius</th>
                      <th className="py-3 px-3">Covered Pincodes</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Sort Order</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2D9C8]/60">
                    {cities.map((city) => (
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
            </div>

            {users.length === 0 ? (
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
                    {users.map((u) => (
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
            )}
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
                Manage GST billing percentage and online payment gateway options.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">

              {/* GST & Invoicing Settings */}
              <div className="p-5 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8] space-y-4">
                <h4 className="font-display font-bold text-sm text-[#10231D] flex items-center gap-2">
                  <LuDollarSign className="w-4 h-4 text-[#E9A23B]" />
                  <span>GST Billing & Invoicing</span>
                </h4>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="gstEnabled"
                    checked={Boolean(settingsForm.gstEnabled)}
                    onChange={(e) => setSettingsForm({ ...settingsForm, gstEnabled: e.target.checked })}
                    className="rounded text-[#E9A23B] focus:ring-[#E9A23B] w-4 h-4"
                  />
                  <label htmlFor="gstEnabled" className="text-xs font-bold text-[#10231D] cursor-pointer">
                    Enable GST on Customer Bookings
                  </label>
                </div>

                {settingsForm.gstEnabled && (
                  <div className="w-48">
                    <label className="block text-xs font-bold text-[#10231D] mb-1">
                      GST Percentage (%):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={28}
                      value={settingsForm.gstPercentage || 18}
                      onChange={(e) => setSettingsForm({ ...settingsForm, gstPercentage: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-mono font-bold text-[#10231D]"
                    />
                  </div>
                )}
              </div>

              {/* Online Payment Settings */}
              <div className="p-5 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-[#10231D] flex items-center gap-2">
                    <LuCreditCard className="w-4 h-4 text-[#E9A23B]" />
                    <span>Online Payments (Razorpay)</span>
                  </h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                    settingsForm.acceptOnlinePayments
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-stone-200 text-stone-700 border border-stone-300'
                  }`}>
                    {settingsForm.acceptOnlinePayments ? 'Active' : 'Cash on Service Only'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="acceptOnlinePaymentsToggle"
                    checked={Boolean(settingsForm.acceptOnlinePayments)}
                    onChange={(e) => setSettingsForm({ ...settingsForm, acceptOnlinePayments: e.target.checked })}
                    className="rounded text-[#E9A23B] focus:ring-[#E9A23B] w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="acceptOnlinePaymentsToggle" className="text-xs font-bold text-[#10231D] cursor-pointer">
                    Accept online payments through website (Cards, UPI, NetBanking)
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-3 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
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

              {/* Base Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Base Shown Price (MRP Crossed Out):
                  </label>
                  <input
                    type="number"
                    value={serviceForm.mrp}
                    onChange={(e) => setServiceForm({ ...serviceForm, mrp: e.target.value })}
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
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-sm font-black text-[#10231D] tnum"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Service Variants & Tiered Rates (N Variants) */}
              <div className="pt-4 border-t border-[#E2D9C8]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="font-display font-bold text-sm text-[#10231D] flex items-center gap-1.5">
                      <LuTicket className="w-4 h-4 text-[#E9A23B]" />
                      <span>Service Variants & Tiered Rates ({serviceForm.variants?.length || 0})</span>
                    </h4>
                    <p className="text-[11px] text-[#6B8077]">
                      Add 1, 2, 3, 4, 5+ BHK variants or custom sizes with individual rates & MRPs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newIdx = (serviceForm.variants?.length || 0) + 1;
                      setServiceForm(prev => {
                        const newVar = {
                          key: `variant-${newIdx}`,
                          label: `${newIdx} BHK`,
                          price: (prev.price || 2800) + (newIdx * 1000),
                          mrp: (prev.mrp || 2999) + (newIdx * 1500),
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
                    value={serviceForm.variantGroupLabel || ''}
                    placeholder="e.g. Apartment / House Size"
                    onChange={(e) => setServiceForm({ ...serviceForm, variantGroupLabel: e.target.value })}
                    className="w-full p-2 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-semibold text-[#10231D]"
                  />
                </div>

                {/* List of Dynamic Variants */}
                {(!serviceForm.variants || serviceForm.variants.length === 0) ? (
                  <div className="p-4 rounded-xl border-2 border-dashed border-[#E2D9C8] bg-[#ECE5D8]/40 text-center">
                    <p className="text-xs text-[#6B8077]">
                      No variants added. This service currently uses a single flat rate.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setServiceForm(prev => ({
                            ...prev,
                            variantGroupLabel: 'Apartment / House Size',
                            variantGroupKey: 'size',
                            price: 2800,
                            mrp: 2999,
                            duration: '4-5 hrs',
                            variants: [
                              { key: '1-bhk', label: '1 BHK', price: 2800, mrp: 2999, duration: '4-5 hrs', isDefault: true },
                              { key: '2-bhk', label: '2 BHK', price: 6000, mrp: 7499, duration: '5-7 hrs', isDefault: false },
                              { key: '3-bhk', label: '3 BHK', price: 9500, mrp: 10500, duration: '7-9 hrs', isDefault: false },
                              { key: '4-bhk', label: '4 BHK', price: 12500, mrp: 15000, duration: '2 Days', isDefault: false },
                              { key: 'villa', label: 'Villa / Kothi (5+ BHK)', price: 18000, mrp: 22000, duration: '2-3 Days', isDefault: false }
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
                          setServiceForm(prev => ({
                            ...prev,
                            variantGroupLabel: 'Seating Configuration',
                            variantGroupKey: 'seats',
                            price: 1750,
                            mrp: 1999,
                            duration: '2-3 hrs',
                            variants: [
                              { key: '5-seater', label: '5 Seater (3+1+1)', price: 1750, mrp: 1999, duration: '2-3 hrs', isDefault: true },
                              { key: '7-seater', label: '7 Seater (3+2+2)', price: 2450, mrp: 2500, duration: '3-4 hrs', isDefault: false },
                              { key: '9-seater', label: '9 Seater (L-Shape / Sectional)', price: 3150, mrp: 3500, duration: '4-5 hrs', isDefault: false },
                              { key: '12-seater', label: '12 Seater Grand Royal', price: 4200, mrp: 4500, duration: '5-6 hrs', isDefault: false }
                            ]
                          }));
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#10231D] bg-[#ECE5D8] border border-[#E2D9C8] px-3 py-1.5 rounded-lg hover:bg-[#E2D9C8] transition-colors"
                      >
                        <LuPlus className="w-3.5 h-3.5" />
                        <span>Load Sofa Seats Preset</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setServiceForm(prev => ({
                            ...prev,
                            variantGroupLabel: 'Water Tank Capacity',
                            variantGroupKey: 'capacity',
                            price: 400,
                            mrp: 499,
                            duration: '1-1.5 hrs',
                            variants: [
                              { key: '500l', label: 'Up to 500 Liters', price: 400, mrp: 499, duration: '1-1.5 hrs', isDefault: true },
                              { key: '750l', label: '500L – 750 Liters', price: 500, mrp: 699, duration: '1.5-2 hrs', isDefault: false },
                              { key: '1000l', label: '750L – 1,000 Liters', price: 700, mrp: 1000, duration: '2-2.5 hrs', isDefault: false },
                              { key: '1500l', label: '1,000L – 1,500 Liters', price: 900, mrp: 1300, duration: '2.5-3 hrs', isDefault: false }
                            ]
                          }));
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#10231D] bg-[#ECE5D8] border border-[#E2D9C8] px-3 py-1.5 rounded-lg hover:bg-[#E2D9C8] transition-colors"
                      >
                        <LuPlus className="w-3.5 h-3.5" />
                        <span>Load Water Tank Preset</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {serviceForm.variants.map((v, vIdx) => {
                      const discount = v.mrp > v.price ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0;

                      return (
                        <div
                          key={vIdx}
                          className="p-3 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] space-y-2 transition-colors hover:border-[#10231D]/30"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-[#10231D] text-[#F4EFE6] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                                {vIdx + 1}
                              </span>
                              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[#10231D]">
                                <input
                                  type="radio"
                                  name="defaultVariantRadio"
                                  checked={Boolean(v.isDefault)}
                                  onChange={() => {
                                    setServiceForm(prev => ({
                                      ...prev,
                                      price: v.price,
                                      mrp: v.mrp,
                                      duration: v.duration,
                                      variants: prev.variants.map((varItem, i) => ({
                                        ...varItem,
                                        isDefault: i === vIdx
                                      }))
                                    }));
                                  }}
                                  className="text-[#E9A23B] focus:ring-[#E9A23B] cursor-pointer"
                                />
                                <span>Default Selection</span>
                              </label>
                            </div>

                            <div className="flex items-center gap-2">
                              {discount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1B5E20]/15 text-[#1B5E20]">
                                  {discount}% OFF
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setServiceForm(prev => ({
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
                                  setServiceForm(prev => {
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
                                    setServiceForm(prev => {
                                      const updated = [...prev.variants];
                                      updated[vIdx] = { ...updated[vIdx], price: val };
                                      return { ...prev, variants: updated };
                                    });
                                  }}
                                  className="w-full p-2 pl-6 rounded-lg bg-[#F4EFE6] border border-[#E2D9C8] font-black text-[#10231D] tnum"
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
                                    setServiceForm(prev => {
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
                                setServiceForm(prev => {
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
                      <span className="w-4 h-4 rounded-full bg-[#DDEBE4] text-[#10231D] text-[10px] font-bold flex items-center justify-center">✓</span>
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
                      <span className="w-4 h-4 rounded-full bg-[#F9ECE8] text-[#C2512D] text-[10px] font-bold flex items-center justify-center">✕</span>
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
                        ★
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-mono font-bold text-[#10231D]">
                      {testimonialForm.rating} / 5
                    </span>
                  </div>
                </div>
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

              {/* Review Quote Text */}
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Customer Review Quote / Feedback:
                </label>
                <textarea
                  rows={3}
                  value={testimonialForm.quote}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, quote: e.target.value })}
                  placeholder="Describe the cleaning experience, professional equipment used, punctuality, and overall satisfaction..."
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] leading-relaxed"
                  required
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
            subtitle="Manage service delivery city and covered pincodes"
            maxWidth="max-w-md"
          >
            <form onSubmit={handleSaveCity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  City Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bareilly, Meerut, Sambhal"
                  value={cityForm.name}
                  onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    URL Slug:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. bareilly"
                    value={cityForm.slug}
                    onChange={(e) => setCityForm({ ...cityForm, slug: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-mono text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    State:
                  </label>
                  <input
                    type="text"
                    value={cityForm.state}
                    onChange={(e) => setCityForm({ ...cityForm, state: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                    required
                  />
                </div>
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

              {/* Base Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Base Shown Price (MRP Crossed Out):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newServiceForm.mrp}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, mrp: e.target.value })}
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
                    value={newServiceForm.price}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-sm font-black text-[#10231D] tnum"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Service Variants & Tiered Rates (N Variants) */}
              <div className="pt-4 border-t border-[#E2D9C8]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="font-display font-bold text-sm text-[#10231D] flex items-center gap-1.5">
                      <LuTicket className="w-4 h-4 text-[#E9A23B]" />
                      <span>Service Variants & Tiered Rates ({newServiceForm.variants?.length || 0})</span>
                    </h4>
                    <p className="text-[11px] text-[#6B8077]">
                      Add 1, 2, 3, 4, 5+ BHK variants, sofa seats, or custom sizes with individual rates & MRPs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newIdx = (newServiceForm.variants?.length || 0) + 1;
                      setNewServiceForm(prev => {
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
                    value={newServiceForm.variantGroupLabel || ''}
                    placeholder="e.g. Apartment / House Size"
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, variantGroupLabel: e.target.value })}
                    className="w-full p-2 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-semibold text-[#10231D]"
                  />
                </div>

                {/* List of Dynamic Variants */}
                {(!newServiceForm.variants || newServiceForm.variants.length === 0) ? (
                  <div className="p-4 rounded-xl border-2 border-dashed border-[#E2D9C8] bg-[#ECE5D8]/40 text-center space-y-2">
                    <p className="text-xs text-[#6B8077]">
                      No variants added. This service will use a single flat rate unless variants are added.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setNewServiceForm(prev => ({
                            ...prev,
                            variantGroupLabel: 'Apartment / House Size',
                            variantGroupKey: 'size',
                            price: 2800,
                            mrp: 2999,
                            duration: '4-5 hrs',
                            variants: [
                              { key: '1-bhk', label: '1 BHK', price: 2800, mrp: 2999, duration: '4-5 hrs', isDefault: true },
                              { key: '2-bhk', label: '2 BHK', price: 6000, mrp: 7499, duration: '5-7 hrs', isDefault: false },
                              { key: '3-bhk', label: '3 BHK', price: 9500, mrp: 10500, duration: '7-9 hrs', isDefault: false },
                              { key: '4-bhk', label: '4 BHK', price: 12500, mrp: 15000, duration: '2 Days', isDefault: false },
                              { key: 'villa', label: 'Villa / Kothi (5+ BHK)', price: 18000, mrp: 22000, duration: '2-3 Days', isDefault: false }
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
                          setNewServiceForm(prev => ({
                            ...prev,
                            variantGroupLabel: 'Seating Configuration',
                            variantGroupKey: 'seats',
                            price: 1750,
                            mrp: 1999,
                            duration: '2-3 hrs',
                            variants: [
                              { key: '5-seater', label: '5 Seater (3+1+1)', price: 1750, mrp: 1999, duration: '2-3 hrs', isDefault: true },
                              { key: '7-seater', label: '7 Seater (3+2+2)', price: 2450, mrp: 2500, duration: '3-4 hrs', isDefault: false },
                              { key: '9-seater', label: '9 Seater (L-Shape / Sectional)', price: 3150, mrp: 3500, duration: '4-5 hrs', isDefault: false },
                              { key: '12-seater', label: '12 Seater Grand Royal', price: 4200, mrp: 4500, duration: '5-6 hrs', isDefault: false }
                            ]
                          }));
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#10231D] bg-[#ECE5D8] border border-[#E2D9C8] px-3 py-1.5 rounded-lg hover:bg-[#E2D9C8] transition-colors"
                      >
                        <LuPlus className="w-3.5 h-3.5" />
                        <span>Load Sofa Seats Preset</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setNewServiceForm(prev => ({
                            ...prev,
                            variantGroupLabel: 'Water Tank Capacity',
                            variantGroupKey: 'capacity',
                            price: 400,
                            mrp: 499,
                            duration: '1-1.5 hrs',
                            variants: [
                              { key: '500l', label: 'Up to 500 Liters', price: 400, mrp: 499, duration: '1-1.5 hrs', isDefault: true },
                              { key: '750l', label: '500L – 750 Liters', price: 500, mrp: 699, duration: '1.5-2 hrs', isDefault: false },
                              { key: '1000l', label: '750L – 1,000 Liters', price: 700, mrp: 1000, duration: '2-2.5 hrs', isDefault: false },
                              { key: '1500l', label: '1,000L – 1,500 Liters', price: 900, mrp: 1300, duration: '2.5-3 hrs', isDefault: false }
                            ]
                          }));
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#10231D] bg-[#ECE5D8] border border-[#E2D9C8] px-3 py-1.5 rounded-lg hover:bg-[#E2D9C8] transition-colors"
                      >
                        <LuPlus className="w-3.5 h-3.5" />
                        <span>Load Water Tank Preset</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {newServiceForm.variants.map((v, vIdx) => {
                      const discount = v.mrp > v.price ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0;

                      return (
                        <div
                          key={vIdx}
                          className="p-3 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] space-y-2 transition-colors hover:border-[#10231D]/30"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-[#10231D] text-[#F4EFE6] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                                {vIdx + 1}
                              </span>
                              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[#10231D]">
                                <input
                                  type="radio"
                                  name="newServiceDefaultVariantRadio"
                                  checked={Boolean(v.isDefault)}
                                  onChange={() => {
                                    setNewServiceForm(prev => ({
                                      ...prev,
                                      price: v.price,
                                      mrp: v.mrp,
                                      duration: v.duration,
                                      variants: prev.variants.map((varItem, i) => ({
                                        ...varItem,
                                        isDefault: i === vIdx
                                      }))
                                    }));
                                  }}
                                  className="text-[#E9A23B] focus:ring-[#E9A23B] cursor-pointer"
                                />
                                <span>Default Selection</span>
                              </label>
                            </div>

                            <div className="flex items-center gap-2">
                              {discount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1B5E20]/15 text-[#1B5E20]">
                                  {discount}% OFF
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setNewServiceForm(prev => ({
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
                                  setNewServiceForm(prev => {
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
                                    setNewServiceForm(prev => {
                                      const updated = [...prev.variants];
                                      updated[vIdx] = { ...updated[vIdx], price: val };
                                      return { ...prev, variants: updated };
                                    });
                                  }}
                                  className="w-full p-2 pl-6 rounded-lg bg-[#F4EFE6] border border-[#E2D9C8] font-black text-[#10231D] tnum"
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
                                    setNewServiceForm(prev => {
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
                                setNewServiceForm(prev => {
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

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Short Description:
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary shown on service cards..."
                  value={newServiceForm.shortDescription}
                  onChange={(e) => setNewServiceForm({ ...newServiceForm, shortDescription: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D]"
                />
              </div>

              {/* Cloudinary Service Multi-Image Gallery Upload */}
              {renderImageUploadSection(false)}

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
                      <span className="w-4 h-4 rounded-full bg-[#DDEBE4] text-[#10231D] text-[10px] font-bold flex items-center justify-center">✓</span>
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
                      <span className="w-4 h-4 rounded-full bg-[#F9ECE8] text-[#C2512D] text-[10px] font-bold flex items-center justify-center">✕</span>
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
        {couponModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setCouponModalOpen(false)}
            title="Create New Discount Coupon"
            subtitle="Configure a voucher code redeemable during booking checkout"
            maxWidth="max-w-md"
          >
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Coupon Code:
                </label>
                <input
                  type="text"
                  placeholder="e.g. MAXCLEAN20, DIWALI100"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-sm font-mono font-black text-[#10231D] uppercase"
                  required
                />
              </div>

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
                    Discount Value ({couponForm.discountType === 'percentage' ? '%' : '₹'}):
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-mono font-bold text-[#10231D]"
                    required
                  />
                </div>
              </div>

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
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-mono text-[#10231D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Max Discount Cap (₹):
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Optional"
                    value={couponForm.maxDiscount || ''}
                    onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-mono text-[#10231D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Expiry Date:
                  </label>
                  <input
                    type="date"
                    value={couponForm.expiryDate}
                    onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-mono text-[#10231D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Usage Limit:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={couponForm.usageLimit}
                    onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-mono text-[#10231D]"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#E2D9C8]">
                <button
                  type="button"
                  onClick={() => setCouponModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#ECE5D8] text-xs font-bold text-[#10231D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCoupon}
                  className="px-5 py-2 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#181511] font-bold text-xs"
                >
                  {savingCoupon ? 'Creating...' : 'Create Coupon'}
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
