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
  LuMail
} from 'react-icons/lu';
import {
  apiRequest,
  adminAPI,
  FALLBACK_STATS,
  FALLBACK_SERVICES,
  FALLBACK_TESTIMONIALS
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { getServiceIcon, AVAILABLE_ICONS } from '../../utils/iconHelper';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'services' | 'testimonials' | 'messages'
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState(FALLBACK_SERVICES);
  const [testimonials, setTestimonials] = useState(FALLBACK_TESTIMONIALS);
  const [contactMessages, setContactMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Edit Service Dual-Pricing Modal State
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    title: '',
    slug: '',
    icon: 'Sparkles',
    price: 0, // Offered Price
    mrp: 0,   // Shown Price (regular)
    duration: '',
    matrix: [],
    imageUrl: ''
  });
  const [uploadingServiceImage, setUploadingServiceImage] = useState(false);

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

  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Guard: if not admin, redirect
  useEffect(() => {
    if (!isAdmin) {
      toast.error('Admin authentication required.');
      navigate('/login');
    }
  }, [isAdmin]);

  // Load All Admin Data
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, bookingsRes, servicesRes, testsRes, msgsRes] = await Promise.allSettled([
        apiRequest('/admin/stats'),
        apiRequest('/admin/bookings?limit=50'),
        apiRequest('/admin/services'),
        adminAPI.getTestimonials(),
        adminAPI.getContactMessages()
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
      if (testsRes.status === 'fulfilled' && testsRes.value?.testimonials?.length > 0) {
        setTestimonials(testsRes.value.testimonials);
      }
      if (msgsRes.status === 'fulfilled' && msgsRes.value?.messages) {
        setContactMessages(msgsRes.value.messages);
      }
    } catch (err) {
      console.warn('Failed loading live admin data, using cached fallback data:', err);
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

  // Open Edit Service Modal
  const openEditService = (service) => {
    setEditingService(service);
    setServiceForm({
      title: service.title,
      slug: service.slug || '',
      icon: service.icon || 'Sparkles',
      price: service.price,
      mrp: service.mrp,
      duration: service.duration || '1 hr',
      matrix: (service.matrix || []).map(r => ({
        selection: r.selection instanceof Map ? Object.fromEntries(r.selection) : r.selection,
        price: r.price,
        mrp: r.mrp,
        duration: r.duration || ''
      })),
      imageUrl: service.media?.hero?.url || ''
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

  // Save Service Dual-Pricing Updates
  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      const payload = {
        title: serviceForm.title,
        slug: serviceForm.slug,
        icon: serviceForm.icon,
        price: Number(serviceForm.price),
        mrp: Number(serviceForm.mrp),
        duration: serviceForm.duration,
        matrix: serviceForm.matrix
      };

      if (serviceForm.imageUrl) {
        payload.media = {
          hero: {
            url: serviceForm.imageUrl,
            alt: `${serviceForm.title} deep cleaning`
          }
        };
      }

      const res = await apiRequest(`/admin/services/${editingService._id}`, {
        method: 'PUT',
        body: payload
      });

      if (res.success && res.service) {
        toast.success(`Updated details and pricing for ${res.service.title}`);
        setServices(prev => prev.map(s => s._id === res.service._id ? res.service : s));
        setEditingService(null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update service pricing.');
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
  const handleDeleteTestimonial = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer testimonial?')) return;
    try {
      const res = await adminAPI.deleteTestimonial(id);
      if (res.success) {
        toast.success('Testimonial deleted successfully.');
        setTestimonials(prev => prev.filter(t => t._id !== id));
      }
    } catch (err) {
      toast.error('Failed to delete testimonial.');
    }
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
  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Delete this contact inquiry permanently?')) return;
    try {
      const res = await adminAPI.deleteContactMessage(id);
      if (res.success) {
        toast.success('Contact inquiry removed.');
        setContactMessages(prev => prev.filter(m => m._id !== id));
      }
    } catch (err) {
      toast.error('Failed to delete contact inquiry.');
    }
  };

  const unreadMessagesCount = contactMessages.filter(m => m.status === 'unread').length;

  return (
    <div className="bg-[#F4EFE6] min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-[#E2D9C8] mb-8 gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E9A23B]">
              MANAGEMENT CONSOLE
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-[#10231D]">
              Admin Control Panel
            </h1>
            <p className="text-xs text-[#6B8077] mt-1">
              Logged in as {user?.name} ({user?.email}) · Automated Email Dispatch Active
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap rounded-xl bg-[#ECE5D8] p-1 border border-[#E2D9C8] gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'bookings'
                  ? 'bg-[#10231D] text-[#F4EFE6] shadow'
                  : 'text-[#10231D] hover:bg-[#E2D9C8]'
              }`}
            >
              <LuCalendar className="w-3.5 h-3.5 text-[#E9A23B]" />
              <span>Bookings & Dispatch</span>
              {bookings.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#E9A23B]/30 text-[#10231D]">
                  {bookings.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'services'
                  ? 'bg-[#10231D] text-[#F4EFE6] shadow'
                  : 'text-[#10231D] hover:bg-[#E2D9C8]'
              }`}
            >
              <LuSparkles className="w-3.5 h-3.5 text-[#E9A23B]" />
              <span>Services & Dual-Pricing</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('testimonials')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'testimonials'
                  ? 'bg-[#10231D] text-[#F4EFE6] shadow'
                  : 'text-[#10231D] hover:bg-[#E2D9C8]'
              }`}
            >
              <LuStar className="w-3.5 h-3.5 text-[#E9A23B]" />
              <span>Home Testimonials</span>
              {testimonials.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#E9A23B]/30 text-[#10231D]">
                  {testimonials.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('messages')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'messages'
                  ? 'bg-[#10231D] text-[#F4EFE6] shadow'
                  : 'text-[#10231D] hover:bg-[#E2D9C8]'
              }`}
            >
              <LuMail className="w-3.5 h-3.5 text-[#E9A23B]" />
              <span>Contact Inquiries</span>
              {unreadMessagesCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#C2512D] text-white font-bold animate-pulse">
                  {unreadMessagesCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 4 Overview Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="p-5 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8]">
            <span className="text-[11px] font-mono font-bold text-[#6B8077]">TOTAL ORDERS</span>
            <p className="font-display font-black text-3xl text-[#10231D] mt-1 tnum">
              {stats?.totalBookings || 0}
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8]">
            <span className="text-[11px] font-mono font-bold text-[#6B8077]">PENDING CREW</span>
            <p className="font-display font-black text-3xl text-[#C2512D] mt-1 tnum">
              {stats?.pendingBookings || 0}
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8]">
            <span className="text-[11px] font-mono font-bold text-[#6B8077]">TOTAL REVENUE</span>
            <p className="font-display font-black text-3xl text-[#10231D] mt-1 tnum">
              ₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8]">
            <span className="text-[11px] font-mono font-bold text-[#6B8077]">ACTIVE TESTIMONIALS</span>
            <p className="font-display font-black text-3xl text-[#E9A23B] mt-1 tnum">
              {testimonials.filter(t => t.isActive !== false).length}
            </p>
          </div>
        </div>

        {/* ========================================================
            TAB 1: BOOKINGS MANAGEMENT
        ======================================================== */}
        {activeTab === 'bookings' && (
          <div className="p-6 rounded-3xl bg-[#ECE5D8] border border-[#E2D9C8] shadow-sm">
            <h3 className="font-display font-bold text-xl text-[#10231D] mb-4">
              All Cleaning Reservations ({bookings.length})
            </h3>

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
                    <th className="py-3 px-3">Messages</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2D9C8]/60">
                  {bookings.map((b) => (
                    <tr key={b._id} className="hover:bg-[#F4EFE6]/50">
                      <td className="py-3 px-3 font-mono font-bold text-[#10231D]">
                        {b.bookingCode}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-[#10231D]">{b.customer.name}</p>
                        <p className="text-[#6B8077]">{b.customer.phone}</p>
                        {b.customer.email && (
                          <p className="text-[10px] text-[#3D524A]">{b.customer.email}</p>
                        )}
                      </td>
                      <td className="py-3 px-3 max-w-[200px] truncate">
                        <span className="font-semibold text-[#10231D]">{b.cityName}</span>: {b.address.line1}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#3D524A]">
                        {b.slot.date} ({b.slot.window.split(' ')[0]})
                      </td>
                      <td className="py-3 px-3 font-black text-[#10231D] tnum">
                        ₹{b.totals.total.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={b.status}
                          onChange={(e) => handleUpdateBookingStatus(b._id, e.target.value)}
                          className="bg-[#F4EFE6] border border-[#E2D9C8] rounded-lg px-2.5 py-1 text-xs font-bold text-[#10231D] focus:outline-none"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => setChatBooking(b)}
                          className="px-2.5 py-1 rounded-lg bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] font-bold text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <span>Chat</span>
                          {b.messages?.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-[#E9A23B] text-[#10231D] text-[10px] font-black">
                              {b.messages.length}
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
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
                <h3 className="font-display font-bold text-xl text-[#10231D]">
                  Shown Price (MRP) vs Offered Price Control
                </h3>
                <p className="text-xs text-[#6B8077] mt-0.5">
                  Update customer crossed-out strikethrough price, real payable price, and Cloudinary media photos.
                </p>
              </div>
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
                      {/* Media Image Preview */}
                      {svc.media?.hero?.url && (
                        <div className="h-32 rounded-xl overflow-hidden mb-3 bg-[#ECE5D8]">
                          <img
                            src={svc.media.hero.url}
                            alt={svc.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono uppercase text-[#E9A23B] font-bold">
                          {svc.categoryName}
                        </span>
                        {discountPct > 0 && (
                          <span className="text-[11px] font-black text-[#C2512D] bg-[#F9ECE8] px-2 py-0.5 rounded-full">
                            {discountPct}% OFF
                          </span>
                        )}
                      </div>

                      <h4 className="font-display font-bold text-lg text-[#10231D] mb-3">
                        {svc.title}
                      </h4>

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

                    <button
                      type="button"
                      onClick={() => openEditService(svc)}
                      className="w-full py-2.5 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <LuSquarePen className="w-4 h-4 text-[#E9A23B]" />
                      <span>Edit Prices & Photo</span>
                    </button>
                  </div>
                );
              })}
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
                        <td className="py-3 px-3">
                          <select
                            value={msg.status}
                            onChange={(e) => handleUpdateMessageStatus(msg._id, e.target.value)}
                            className="bg-[#F4EFE6] border border-[#E2D9C8] rounded-lg px-2.5 py-1 text-xs font-bold text-[#10231D] focus:outline-none"
                          >
                            <option value="unread">Unread</option>
                            <option value="read">Read</option>
                            <option value="replied">Replied</option>
                          </select>
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
            MODAL 1: EDIT SERVICE DUAL-PRICING & CLOUDINARY IMAGE
        ======================================================== */}
        {editingService && (
          <Modal
            isOpen={true}
            onClose={() => setEditingService(null)}
            title={`Edit Service: ${editingService.title}`}
            subtitle="Update Shown Price (MRP), Offered Price, and Cloudinary Media Photo"
            maxWidth="max-w-xl"
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

              {/* Cloudinary Service Image Upload */}
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Service Cover Photo (Cloudinary Upload):
                </label>
                <div className="flex items-center gap-3">
                  {serviceForm.imageUrl ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#E2D9C8] shrink-0 bg-[#ECE5D8]">
                      <img
                        src={serviceForm.imageUrl}
                        alt="Service Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setServiceForm(prev => ({ ...prev, imageUrl: '' }))}
                        className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5"
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
                      <span>{uploadingServiceImage ? 'Uploading...' : 'Upload Image to Cloudinary'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleServiceImageUpload}
                        className="hidden"
                        disabled={uploadingServiceImage}
                      />
                    </label>
                    <p className="text-[10px] text-[#6B8077] mt-1">
                      JPEG, PNG, WebP or AVIF. High-res photo for service details page.
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Icon */}
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Service Icon:
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] flex items-center justify-center shrink-0 shadow-inner">
                    {getServiceIcon(serviceForm.icon, 'w-5 h-5 text-[#E9A23B]')}
                  </div>
                  <input
                    type="text"
                    value={serviceForm.icon}
                    onChange={(e) => setServiceForm({ ...serviceForm, icon: e.target.value })}
                    className="flex-1 p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-sm text-[#10231D] font-mono"
                    required
                  />
                </div>
                {/* Quick Icon Selector Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {AVAILABLE_ICONS.map((ic) => (
                    <button
                      key={ic.key}
                      type="button"
                      onClick={() => setServiceForm({ ...serviceForm, icon: ic.key })}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                        serviceForm.icon === ic.key
                          ? 'bg-[#10231D] text-[#F4EFE6]'
                          : 'bg-[#ECE5D8] text-[#10231D] hover:bg-[#E2D9C8] border border-[#E2D9C8]'
                      }`}
                    >
                      {getServiceIcon(ic.key, 'w-3 h-3')}
                      <span>{ic.key}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Shown Price (MRP) */}
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Shown Price (MRP Crossed Out):
                  </label>
                  <input
                    type="number"
                    value={serviceForm.mrp}
                    onChange={(e) => setServiceForm({ ...serviceForm, mrp: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-sm font-bold text-[#10231D] tnum"
                    required
                  />
                </div>

                {/* Offered Price */}
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Offered Price (Payable):
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

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded-xl bg-[#ECE5D8] text-xs font-bold text-[#10231D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#181511] font-bold text-xs"
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
            <div className="space-y-4">
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
      </div>
    </div>
  );
}
