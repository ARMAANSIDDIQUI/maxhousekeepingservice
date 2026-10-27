import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LuCalendar,
  LuClock,
  LuMapPin,
  LuSquarePen,
  LuMessageSquare,
  LuPhone,
  LuSend,
  LuCheck,
  LuCircleAlert,
  LuPlus,
  LuLock,
  LuKey,
  LuEye,
  LuEyeOff,
  LuShieldCheck,
  LuUser,
  LuTrash2,
  LuSearch,
  LuX,
  LuRotateCcw,
  LuCamera,
  LuUpload,
  LuImage,
  LuSparkles,
  LuCreditCard,
  LuBanknote,
  LuCopy,
  LuNavigation
} from 'react-icons/lu';
import { FaWhatsapp } from 'react-icons/fa6';
import confetti from 'canvas-confetti';
import { apiRequest, bookingsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useBooking } from '../context/BookingContext';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import UserAvatar from '../components/common/UserAvatar';
import AddressPickerWithMap from '../components/common/AddressPickerWithMap';
import LiveTrackingRadar from '../components/common/LiveTrackingRadar';
import { formatDateDMY } from '../utils/date';

export default function CustomerDashboard() {
  const { user, updateProfile, changePassword, addAddress, updateAddress, deleteAddress, setDefaultAddress, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const { settings } = useBooking();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'addresses' | 'security'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);
  const [trackingModalBooking, setTrackingModalBooking] = useState(null);

  // Online Payment State for Unpaid Bookings
  const [payingBookingId, setPayingBookingId] = useState(null);

  // Address Management State
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    label: 'Home',
    line1: '',
    landmark: '',
    city: 'Moradabad',
    state: 'Uttar Pradesh',
    pincode: '',
    isDefault: false
  });

  // Edit Address State
  const [editingAddress, setEditingAddress] = useState(null);
  const [editingAddressSubmitting, setEditingAddressSubmitting] = useState(false);
  const [editAddressForm, setEditAddressForm] = useState({
    label: 'Home',
    line1: '',
    landmark: '',
    city: 'Moradabad',
    state: 'Uttar Pradesh',
    pincode: '',
    isDefault: false
  });

  // Edit Modal State
  const [editingBooking, setEditingBooking] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    line1: '',
    pincode: '',
    date: '',
    window: '',
    notes: ''
  });

  // Communication / Chat Thread Modal State
  const [messagingBooking, setMessagingBooking] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Change Password Modal & Form State
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Profile Management State
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [photoInputMode, setPhotoInputMode] = useState('upload'); // 'upload' | 'url' | 'presets'
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    avatarUrl: ''
  });

  const handleOpenEditProfile = () => {
    setProfileForm({
      name: user?.name || '',
      phone: user?.phone || '',
      avatarUrl: user?.avatarUrl || ''
    });
    setCustomPhotoUrl(user?.avatarUrl || '');
    setIsEditProfileModalOpen(true);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        setProfileForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
        toast.success('Photo ready! Click "Save Changes" to apply.');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfileForm((prev) => ({ ...prev, avatarUrl: '' }));
    setCustomPhotoUrl('');
    toast.info('Photo removed. Default geometrical avatar will be displayed.');
  };

  const handleApplyCustomUrl = () => {
    if (!customPhotoUrl.trim()) {
      toast.error('Please enter a valid image URL.');
      return;
    }
    setProfileForm((prev) => ({ ...prev, avatarUrl: customPhotoUrl.trim() }));
    toast.success('Image link attached!');
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    if (!profileForm.name.trim()) {
      toast.error('Please enter your full name.');
      return;
    }

    const cleanPhone = (profileForm.phone || '').trim().replace(/\D/g, '');
    if (cleanPhone && cleanPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    setProfileSubmitting(true);
    try {
      const res = await updateProfile({
        name: profileForm.name.trim(),
        phone: cleanPhone,
        avatarUrl: profileForm.avatarUrl
      });
      if (res?.success) {
        setIsEditProfileModalOpen(false);
      }
    } finally {
      setProfileSubmitting(false);
    }
  };

  // Require auth only after session check resolves
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate('/login');
    }
  }, [user, isAuthLoading]);

  // Load Bookings
  const loadMyBookings = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/bookings/my');
      if (res.success && res.bookings) {
        setBookings(res.bookings);
      }
    } catch {
      toast.error('Failed to load your reservations.');
    } finally {
      setLoading(false);
    }
  };

  // Cancel Booking
  const handleCancelBooking = (bookingId, bookingCode) => {
    setConfirmModalConfig({
      isOpen: true,
      title: `Cancel Booking #${bookingCode}`,
      message: 'Please provide a reason for cancelling this reservation (optional):',
      confirmText: 'Cancel Booking',
      confirmVariant: 'warning',
      inputPlaceholder: 'Reason for cancellation (e.g., schedule conflict)...',
      defaultValue: '',
      inputRequired: false,
      onConfirm: async (reason) => {
        try {
          const res = await bookingsAPI.cancelBooking(bookingId, reason || 'Cancelled by customer');
          if (res.success) {
            toast.success(`Booking #${bookingCode} has been cancelled.`);
            setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'cancelled' } : b));
          }
        } catch (err) {
          toast.error(err.message || 'Failed to cancel booking.');
        } finally {
          setConfirmModalConfig(null);
        }
      }
    });
  };

  // Delete Booking permanently from customer history
  const handleDeleteBooking = (bookingId, bookingCode) => {
    setConfirmModalConfig({
      isOpen: true,
      title: `Remove Booking #${bookingCode}`,
      message: `Are you sure you want to remove booking #${bookingCode} from your account history? This will remove it from your dashboard view.`,
      confirmText: 'Remove Booking',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          const res = await bookingsAPI.deleteBooking(bookingId);
          if (res.success) {
            toast.success(`Booking #${bookingCode} deleted from history.`);
            setBookings(prev => prev.filter(b => b._id !== bookingId));
          }
        } catch (err) {
          toast.error(err.message || 'Failed to delete booking.');
        } finally {
          setConfirmModalConfig(null);
        }
      }
    });
  };

  // Address Action Handlers
  const handleOpenAddAddress = () => {
    setNewAddressForm({
      label: 'Home',
      houseOrFlat: '',
      line1: '',
      formattedAddress: '',
      placeId: '',
      coordinates: null,
      landmark: '',
      city: 'Moradabad',
      cityText: 'Moradabad',
      state: 'Uttar Pradesh',
      stateText: 'Uttar Pradesh',
      pincode: '',
      isDefault: (!user?.addresses || user.addresses.length === 0)
    });
    setIsAddAddressModalOpen(true);
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (!newAddressForm.line1?.trim() || !newAddressForm.city?.trim() || !newAddressForm.pincode?.trim()) {
      toast.error('Street address, city, and pincode are required.');
      return;
    }
    setAddressSubmitting(true);
    try {
      const res = await addAddress(newAddressForm);
      if (res && res.success) {
        setIsAddAddressModalOpen(false);
      }
    } finally {
      setAddressSubmitting(false);
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    await setDefaultAddress(addressId);
  };

  const handleDeleteAddressConfirm = (address) => {
    setConfirmModalConfig({
      isOpen: true,
      title: `Delete Address (${address.label || 'Saved Address'})`,
      message: `Are you sure you want to delete this address? "${address.line1}, ${address.city}" will be removed from your profile.`,
      confirmText: 'Delete Address',
      confirmVariant: 'danger',
      onConfirm: async () => {
        await deleteAddress(address._id);
        setConfirmModalConfig(null);
      }
    });
  };

  const handleOpenEditAddress = (addr) => {
    setEditingAddress(addr);
    setEditAddressForm({
      label: addr.label || 'Home',
      houseOrFlat: addr.houseOrFlat || '',
      line1: addr.line1 || '',
      formattedAddress: addr.formattedAddress || addr.line1 || '',
      placeId: addr.placeId || '',
      coordinates: addr.coordinates || null,
      landmark: addr.landmark || '',
      city: addr.city || 'Moradabad',
      cityText: addr.city || 'Moradabad',
      state: addr.state || 'Uttar Pradesh',
      stateText: addr.state || 'Uttar Pradesh',
      pincode: addr.pincode || '',
      isDefault: Boolean(addr.isDefault)
    });
  };

  const handleUpdateAddressSubmit = async (e) => {
    e.preventDefault();
    if (!editAddressForm.line1.trim() || !editAddressForm.city.trim() || !editAddressForm.pincode.trim()) {
      toast.error('Street address, city, and pincode are required.');
      return;
    }
    setEditingAddressSubmitting(true);
    try {
      const res = await updateAddress(editingAddress._id, editAddressForm);
      if (res && res.success) {
        setEditingAddress(null);
      }
    } finally {
      setEditingAddressSubmitting(false);
    }
  };

  const filteredCustomerBookings = bookings.filter((b) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || (
      b.bookingCode?.toLowerCase().includes(q) ||
      b.items?.some(it => (it.titleSnapshot || it.title || '').toLowerCase().includes(q)) ||
      b.cityName?.toLowerCase().includes(q) ||
      b.address?.line1?.toLowerCase().includes(q)
    );
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = ['pending', 'approved', 'paid', 'in_progress', 'unresponsive'].includes(b.status);
    } else if (statusFilter === 'completed') {
      matchesStatus = b.status === 'completed';
    } else if (statusFilter === 'cancelled') {
      matchesStatus = b.status === 'cancelled';
    }
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    if (user) loadMyBookings();
  }, [user]);

  // Open Edit Modal
  const openEditModal = (b) => {
    setEditingBooking(b);
    setEditForm({
      name: b.customer?.name || '',
      phone: b.customer?.phone || '',
      line1: b.address?.line1 || '',
      pincode: b.address?.pincode || '',
      date: b.slot?.date || '',
      window: b.slot?.window || 'Morning (8:00 AM – 11:00 AM)',
      notes: b.notes || ''
    });
  };

  // Submit Edit Details
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingBooking) return;

    const trimmedName = editForm.name.trim();
    if (!trimmedName || !/^[a-zA-Z\s]{2,60}$/.test(trimmedName)) {
      if (/\d/.test(trimmedName)) {
        toast.error('Customer name cannot contain numbers.');
        return;
      }
      if (/[^a-zA-Z\s]/.test(trimmedName)) {
        toast.error('Customer name cannot contain symbols or special characters.');
        return;
      }
      toast.error('Customer name must be at least 2 characters long (letters and spaces only).');
      return;
    }

    const cleanPhone = editForm.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      toast.error('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    if (!editForm.line1.trim() || editForm.line1.trim().length < 5) {
      toast.error('Please enter a complete street address (minimum 5 characters).');
      return;
    }

    const cleanPincode = editForm.pincode.replace(/\D/g, '');
    if (cleanPincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode.');
      return;
    }

    try {
      const res = await apiRequest(`/bookings/${editingBooking._id}/edit`, {
        method: 'PUT',
        body: {
          customer: {
            name: trimmedName,
            phone: cleanPhone
          },
          address: {
            line1: editForm.line1.trim(),
            pincode: cleanPincode
          },
          slot: {
            date: editForm.date,
            window: editForm.window
          },
          notes: editForm.notes.trim()
        }
      });

      if (res.success && res.booking) {
        toast.success('Your booking details were updated successfully!');
        setBookings((prev) =>
          prev.map((b) => (b._id === res.booking._id ? res.booking : b))
        );
        setEditingBooking(null);
      }
    } catch (err) {
      toast.error(err.message || 'Could not update booking.');
    }
  };

  // Send Message in Thread
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !messagingBooking) return;

    setSendingMsg(true);
    try {
      const res = await apiRequest(`/bookings/${messagingBooking._id}/messages`, {
        method: 'POST',
        body: {
          text: newMessage.trim(),
          senderName: user?.name || messagingBooking.customer.name
        }
      });

      if (res.success && res.messages) {
        const updated = { ...messagingBooking, messages: res.messages };
        setMessagingBooking(updated);
        setBookings((prev) =>
          prev.map((b) => (b._id === messagingBooking._id ? updated : b))
        );
        setNewMessage('');
        toast.success('Message sent to Max Housekeeping team.');
      }
    } catch {
      toast.error('Failed to send message.');
    } finally {
      setSendingMsg(false);
    }
  };

  // Handle Online Payment for an Unpaid Booking
  const handlePayBookingOnline = async (booking) => {
    const amount = Number(booking.totals?.total || booking.total || 0);
    if (!amount || amount <= 0) {
      toast.error('Invalid booking payment amount.');
      return;
    }

    setPayingBookingId(booking._id);
    try {
      const orderRes = await apiRequest('/payments/create-order', {
        method: 'POST',
        body: {
          amount,
          bookingCode: booking.bookingCode,
          customerName: user?.name || booking.customer?.name || '',
          customerPhone: user?.phone || booking.customer?.phone || '',
          customerEmail: user?.email || booking.customer?.email || ''
        }
      });

      if (!orderRes.success) {
        throw new Error(orderRes.message || 'Could not initiate online payment order.');
      }

      if (!window.Razorpay) {
        throw new Error('Payment gateway SDK (Razorpay) is still loading. Please check your network or try again.');
      }

      // Live Razorpay Gateway Checkout
      const rzpOptions = {
        key: orderRes.keyId,
        amount: orderRes.amount,
        currency: orderRes.currency || 'INR',
        name: 'Max Housekeeping Service',
        description: `Payment for Booking #${booking.bookingCode}`,
        image: '/logo.png',
        order_id: orderRes.orderId,
        prefill: {
          name: user?.name || booking.customer?.name || '',
          contact: user?.phone || booking.customer?.phone || '',
          email: user?.email || booking.customer?.email || ''
        },
        theme: {
          color: '#10231D'
        },
        handler: async function (response) {
          await verifyBookingPayment(booking.bookingCode, {
            razorpay_order_id: response.razorpay_order_id || orderRes.orderId,
            razorpay_payment_id: response.razorpay_payment_id || `txn_${Date.now()}`,
            razorpay_signature: response.razorpay_signature || 'rzp_verified',
            method: 'online'
          });
        },
        modal: {
          ondismiss: function () {
            setPayingBookingId(null);
            toast.info('Payment was cancelled.');
          }
        }
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.on('payment.failed', function (resp) {
        setPayingBookingId(null);
        toast.error(`Payment failed: ${resp.error?.description || 'Transaction declined'}`);
      });
      rzp.open();
    } catch (err) {
      setPayingBookingId(null);
      toast.error(err.message || 'Payment initiation error.');
    }
  };

  const verifyBookingPayment = async (bookingCode, paymentPayload) => {
    try {
      const verifyRes = await apiRequest('/payments/verify', {
        method: 'POST',
        body: {
          bookingCode,
          ...paymentPayload
        }
      });

      if (verifyRes.success) {
        toast.success(`Payment verified! Booking #${bookingCode} is now marked as Paid.`);
        try {
          confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
        } catch {}

        setBookings((prev) =>
          prev.map((b) =>
            b.bookingCode === bookingCode
              ? {
                  ...b,
                  paymentStatus: 'paid',
                  paymentMode: 'online_before',
                  status: b.status === 'pending' ? 'confirmed' : b.status
                }
              : b
          )
        );
      }
    } catch (err) {
      toast.error(err.message || 'Payment verification failed.');
    } finally {
      setPayingBookingId(null);
    }
  };

  // Submit Change Password
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match. Please re-enter.');
      return;
    }

    setChangingPassword(true);
    const res = await changePassword(currentPassword, newPassword);
    setChangingPassword(false);

    if (res?.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangePasswordModalOpen(false);
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-3 py-1 rounded-full bg-[#DDEBE4] text-[#10231D] font-bold text-xs">
            Approved
          </span>
        );
      case 'paid':
        return (
          <span className="px-3 py-1 rounded-full bg-[#DDEBE4] text-[#10231D] font-bold text-xs">
            Paid
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-3 py-1 rounded-full bg-[#E9A23B]/20 text-[#10231D] font-bold text-xs">
            In-Progress
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full bg-[#10231D] text-[#F4EFE6] font-bold text-xs">
            Completed
          </span>
        );
      case 'unresponsive':
        return (
          <span className="px-3 py-1 rounded-full bg-[#F9ECE8] text-[#C2512D] font-bold text-xs">
            Awaiting Reply
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-full bg-[#F9ECE8] text-[#C2512D] font-bold text-xs">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-[#ECE5D8] text-[#3D524A] font-bold text-xs">
            Pending Review
          </span>
        );
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center p-8 text-center font-mono text-xs text-[#6B8077]">
        VERIFYING SESSION...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-[#F4EFE6] min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Missing Phone Alert Banner (Prompts Google OAuth users to add their phone number) */}
        {!user?.phone && (
          <div className="mb-6 p-4 rounded-2xl bg-[#E9A23B]/15 border-2 border-[#E9A23B] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#E9A23B] text-[#10231D] shrink-0 mt-0.5 sm:mt-0 shadow-xs">
                <LuPhone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-[#10231D] flex items-center gap-2">
                  <span>Action Needed: Add Mobile Number</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#E9A23B] text-[#10231D] rounded-full uppercase">
                    Important
                  </span>
                </h4>
                <p className="text-xs text-[#3D524A] mt-0.5 leading-relaxed">
                  You logged in with Google. Please add your 10-digit mobile number so our cleaning crew can contact you for confirmations, schedule arrivals, and society gate passes.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenEditProfile}
              className="px-4 py-2.5 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] text-xs font-black shrink-0 transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              <LuPlus className="w-3.5 h-3.5 text-[#E9A23B]" />
              <span>Add Mobile Number</span>
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2D9C8] mb-6 gap-4">
          <div className="flex items-center gap-4">
            <UserAvatar user={user} size="xl" className="shadow-md" />
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E9A23B]">
                CUSTOMER DASHBOARD
              </span>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-[#10231D]">
                {activeTab === 'bookings'
                  ? 'My Cleaning Bookings'
                  : activeTab === 'addresses'
                  ? 'Saved Service Addresses'
                  : activeTab === 'profile'
                  ? 'My Profile & Details'
                  : 'Account & Security'}
              </h1>
              <p className="text-xs text-[#6B8077] mt-0.5">
                Welcome back, {user?.name || 'Customer'}. {user?.phone ? `• +91 ${user.phone}` : '• No mobile number added'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to="/book"
              className="px-4 py-2.5 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <LuPlus className="w-4 h-4 text-[#E9A23B]" />
              <span>New Booking</span>
            </Link>
          </div>
        </div>

        {/* Dashboard Sub-Tabs */}
        <div className="flex items-center gap-2 mb-8 border-b border-[#E2D9C8] pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'bookings'
                ? 'bg-[#10231D] text-[#F4EFE6] shadow'
                : 'bg-[#ECE5D8] text-[#10231D] hover:bg-[#E2D9C8]'
            }`}
          >
            <LuCalendar className="w-4 h-4 text-[#E9A23B]" />
            <span>My Bookings ({bookings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('addresses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'addresses'
                ? 'bg-[#10231D] text-[#F4EFE6] shadow'
                : 'bg-[#ECE5D8] text-[#10231D] hover:bg-[#E2D9C8]'
            }`}
          >
            <LuMapPin className="w-4 h-4 text-[#E9A23B]" />
            <span>Saved Addresses ({user?.addresses?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setProfileForm({
                name: user?.name || '',
                phone: user?.phone || '',
                avatarUrl: user?.avatarUrl || ''
              });
              setCustomPhotoUrl(user?.avatarUrl || '');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-[#10231D] text-[#F4EFE6] shadow'
                : 'bg-[#ECE5D8] text-[#10231D] hover:bg-[#E2D9C8]'
            }`}
          >
            <LuUser className="w-4 h-4 text-[#E9A23B]" />
            <span>Profile Details</span>
            {!user?.phone && (
              <span className="w-2 h-2 rounded-full bg-[#E9A23B] animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-[#10231D] text-[#F4EFE6] shadow'
                : 'bg-[#ECE5D8] text-[#10231D] hover:bg-[#E2D9C8]'
            }`}
          >
            <LuKey className="w-4 h-4 text-[#E9A23B]" />
            <span>Account & Password</span>
          </button>
        </div>

        {/* ========================================================
            TAB 1: BOOKINGS LIST
        ======================================================== */}
        {activeTab === 'bookings' && (
          <div>
            {loading ? (
              <div className="py-20 text-center font-mono text-xs text-[#6B8077]">
                LOADING YOUR RESERVATIONS...
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-16 text-center bg-[#ECE5D8] rounded-3xl border border-[#E2D9C8] p-8">
                <h3 className="font-display font-bold text-xl text-[#10231D] mb-2">No Bookings Yet</h3>
                <p className="text-xs text-[#6B8077] max-w-md mx-auto mb-6">
                  You haven't placed any cleaning reservations yet. Choose from our 37+ specialized home and commercial packages.
                </p>
                <Link
                  to="/services"
                  className="px-5 py-3 rounded-xl bg-[#10231D] text-[#F4EFE6] font-bold text-xs"
                >
                  Browse Services
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Search & Filter Bar for Customer Bookings */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8]">
                  <div className="relative flex-1 min-w-[200px]">
                    <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search bookings by code or service..."
                      className="w-full pl-9 pr-7 py-2 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-xs text-[#10231D] placeholder-[#6B8077] focus:outline-none focus:border-[#E9A23B]"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#6B8077] hover:text-[#10231D] cursor-pointer"
                      >
                        <LuX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { val: 'all', label: 'All' },
                      { val: 'active', label: 'Active' },
                      { val: 'completed', label: 'Completed' },
                      { val: 'cancelled', label: 'Cancelled' }
                    ].map((f) => (
                      <button
                        key={f.val}
                        type="button"
                        onClick={() => setStatusFilter(f.val)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          statusFilter === f.val
                            ? 'bg-[#10231D] text-[#F4EFE6] shadow-xs'
                            : 'bg-[#F4EFE6] text-[#3D524A] hover:bg-[#E2D9C8] border border-[#E2D9C8]'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}

                    {(searchQuery || statusFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('all');
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#C2512D] hover:bg-[#E2D9C8] transition-colors cursor-pointer"
                      >
                        <LuRotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </div>

                {filteredCustomerBookings.length === 0 ? (
                  <div className="py-12 text-center bg-[#ECE5D8] rounded-2xl border border-[#E2D9C8] p-6">
                    <p className="font-display font-bold text-base text-[#10231D]">No bookings match your filter</p>
                    <p className="text-xs text-[#6B8077] mt-1">Try clearing your search or choosing another status tab.</p>
                  </div>
                ) : (
                  filteredCustomerBookings.map((b) => (
                    <div
                      key={b._id}
                      className="bg-[#ECE5D8] p-6 rounded-3xl border border-[#E2D9C8] shadow-sm space-y-4"
                    >
                      {/* Header row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2D9C8] gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-lg text-[#10231D]">
                            {b.bookingCode}
                          </span>
                          {renderStatusBadge(b.status)}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Communicate with Admin Button */}
                          <button
                            type="button"
                            onClick={() => setMessagingBooking(b)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F4EFE6] hover:bg-[#E2D9C8] border border-[#E2D9C8] text-xs font-bold text-[#10231D] transition-colors cursor-pointer"
                          >
                            <LuMessageSquare className="w-3.5 h-3.5 text-[#E9A23B]" />
                            <span>Chat</span>
                            {b.messages && b.messages.length > 0 && (
                              <span className="w-4 h-4 rounded-full bg-[#10231D] text-[#F4EFE6] text-[9px] flex items-center justify-center font-bold">
                                {b.messages.length}
                              </span>
                            )}
                          </button>

                          {/* Edit Details (Allowed for pending/approved) */}
                          {!['completed', 'cancelled', 'in_progress'].includes(b.status) && (
                            <button
                              type="button"
                              onClick={() => openEditModal(b)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] text-xs font-bold transition-colors cursor-pointer"
                            >
                              <LuSquarePen className="w-3.5 h-3.5 text-[#E9A23B]" />
                              <span>Edit</span>
                            </button>
                          )}

                          {/* Cancel Booking (Allowed when active) */}
                          {!['completed', 'cancelled'].includes(b.status) && (
                            <button
                              type="button"
                              onClick={() => handleCancelBooking(b._id, b.bookingCode)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#C2512D]/50 text-[#C2512D] hover:bg-[#C2512D] hover:text-white text-xs font-bold transition-colors cursor-pointer"
                              title="Cancel this reservation"
                            >
                              <LuX className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          )}

                          {/* Delete Booking (Allowed when completed or cancelled) */}
                          {['completed', 'cancelled'].includes(b.status) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteBooking(b._id, b.bookingCode)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#C2512D]/50 text-[#C2512D] hover:bg-[#C2512D] hover:text-white text-xs font-bold transition-colors cursor-pointer"
                              title="Delete booking from history"
                            >
                              <LuTrash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>

                    {/* CUSTOMER OTP & SUPERVISOR ASSIGNMENT (URBAN COMPANY / PRONTO STYLE) */}
                    {b.status !== 'cancelled' && (
                      <div className="space-y-2.5">
                        {/* Assigned Supervisor Card */}
                        {(b.assignedSupervisor?.name || b.supervisor?.name) ? (() => {
                          const sup = b.assignedSupervisor?.name ? b.assignedSupervisor : b.supervisor;
                          const supAvatar = sup.avatar || sup.photo;
                          return (
                            <div className="p-3.5 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                              <div className="flex items-center gap-3">
                                {supAvatar ? (
                                  <div className="relative shrink-0">
                                    <img
                                      src={supAvatar}
                                      alt={sup.name}
                                      className="w-12 h-12 rounded-2xl object-cover border-2 border-[#E9A23B] shadow-xs"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        if (e.currentTarget.nextElementSibling) {
                                          e.currentTarget.nextElementSibling.style.display = 'flex';
                                        }
                                      }}
                                    />
                                    <div
                                      style={{ display: 'none' }}
                                      className="w-12 h-12 rounded-2xl bg-[#10231D] text-[#E9A23B] items-center justify-center font-bold text-sm shadow-xs border border-[#E2D9C8]"
                                    >
                                      {sup.name?.charAt(0)?.toUpperCase() || 'S'}
                                    </div>
                                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                                      <LuCheck className="w-2 h-2 text-white" />
                                    </span>
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-2xl bg-[#10231D] text-[#E9A23B] flex items-center justify-center font-bold text-sm shrink-0 shadow-xs border border-[#E2D9C8]">
                                    <LuShieldCheck className="w-5 h-5" />
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-[#6B8077] uppercase font-bold tracking-wider">
                                      ASSIGNED FIELD SUPERVISOR
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 uppercase flex items-center gap-1">
                                      <LuCheck className="w-2.5 h-2.5" /> On Duty
                                    </span>
                                  </div>
                                  <p className="font-bold text-sm text-[#10231D]">
                                    {sup.name}
                                  </p>
                                  <p className="text-[11px] text-[#6B8077]">
                                    Scheduled Arrival: <span className="font-semibold text-[#10231D]">{formatDateDMY(b.assignedSlot?.date || b.slot?.date)} ({b.assignedSlot?.timeWindow || b.slot?.window})</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                {sup.phone && (
                                  <a
                                    href={`tel:${sup.phone}`}
                                    className="px-3.5 py-1.5 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                                  >
                                    <LuPhone className="w-3.5 h-3.5 text-[#E9A23B]" />
                                    <span>Call Supervisor</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })() : (
                          <div className="p-3 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8] flex items-center gap-2.5 text-xs text-[#6B8077]">
                            <LuClock className="w-4 h-4 text-[#E9A23B] shrink-0" />
                            <span>
                              <strong>Supervisor Dispatch:</strong> Operations is assigning a dedicated supervisor for your scheduled window ({formatDateDMY(b.slot?.date)} • {b.slot?.window}).
                            </span>
                          </div>
                        )}

                        {/* Visit Verification OTP Handshake Card */}
                        {b.serviceOtp && (
                          <div className="p-3.5 rounded-2xl bg-[#10231D] text-[#F4EFE6] border border-[#E9A23B]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-[#E9A23B] text-[10px] font-mono font-bold uppercase tracking-wider">
                                <LuKey className="w-3.5 h-3.5" />
                                <span>ON-SITE ARRIVAL OTP</span>
                              </div>
                              <p className="text-xs text-[#A3B8B0]">
                                Share this 4-digit code with your supervisor when they arrive at your doorstep
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-1 bg-white rounded-xl px-3.5 py-1.5 border-2 border-[#E9A23B] shadow-xs">
                                <span className="text-[#10231D] font-mono font-black text-xl tracking-[0.25em]">
                                  {b.serviceOtp}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(b.serviceOtp);
                                    toast.success('Verification OTP copied to clipboard!');
                                  }}
                                  className="p-1 text-[#6B8077] hover:text-[#10231D] transition-colors cursor-pointer ml-1"
                                  title="Copy OTP"
                                >
                                  <LuCopy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${
                                b.otpVerified ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-[#E9A23B]/20 text-[#E9A23B] border border-[#E9A23B]/30'
                              }`}>
                                {b.otpVerified ? (
                                  <>
                                    <LuCheck className="w-3 h-3" /> Verified on Visit
                                  </>
                                ) : (
                                  'Pending Arrival'
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* INSPECTION PHOTOS PREVIEW (IF AVAILABLE) */}
                    {((b.photos?.before?.length || 0) > 0 || (b.photos?.after?.length || 0) > 0) && (
                      <div className="p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#10231D]">
                          <LuCamera className="w-3.5 h-3.5 text-[#E9A23B]" />
                          <span>Supervisor Inspection Proof ({ (b.photos?.before?.length || 0) + (b.photos?.after?.length || 0) } Photos)</span>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                          {(b.photos?.before || []).map((p, idx) => (
                            <a
                              key={`b-${idx}`}
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#E2D9C8] shrink-0 block group"
                            >
                              <img src={p.url} alt="Before" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] font-mono text-white text-center">Before</span>
                            </a>
                          ))}
                          {(b.photos?.after || []).map((p, idx) => (
                            <a
                              key={`a-${idx}`}
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative w-14 h-14 rounded-lg overflow-hidden border border-emerald-400 shrink-0 block group"
                            >
                              <img src={p.url} alt="After" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <span className="absolute bottom-0 inset-x-0 bg-emerald-950/80 text-[8px] font-mono text-emerald-300 text-center">After</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Service Items & Slot */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Services list */}
                      <div>
                        <h4 className="text-xs font-mono font-bold text-[#6B8077] uppercase mb-2">
                          Booked Services ({b.items?.length || 0})
                        </h4>
                        <ul className="space-y-1.5">
                          {b.items?.map((it, idx) => (
                            <li key={idx} className="text-xs text-[#10231D] flex items-start gap-2">
                              <span className="text-[#E9A23B] font-bold">•</span>
                              <div>
                                <span className="font-semibold">{it.titleSnapshot || it.title}</span>
                                {it.variantSnapshot && (
                                  <span className="text-[#6B8077] ml-1">({it.variantSnapshot})</span>
                                )}
                                {it.qty > 1 && (
                                  <span className="text-[#10231D] font-mono font-bold ml-1">×{it.qty}</span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Right: Slot & Address Details */}
                      <div className="space-y-2 bg-[#F4EFE6] p-3.5 rounded-2xl border border-[#E2D9C8] text-xs">
                        <div className="flex items-center gap-2 text-[#10231D]">
                          <LuCalendar className="w-4 h-4 text-[#E9A23B] shrink-0" />
                          <span className="font-semibold">
                            {b.slot?.date ? formatDateDMY(b.slot.date) : 'Flexible'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[#3D524A]">
                          <LuClock className="w-4 h-4 text-[#E9A23B] shrink-0" />
                          <span>{b.slot?.window || 'Morning Arrival'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#3D524A]">
                          <LuMapPin className="w-4 h-4 text-[#E9A23B] shrink-0" />
                          <span className="truncate">{b.address?.line1 || 'Address on file'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Row: Total Price + Payment Status & Actions */}
                    <div className="pt-3 border-t border-[#E2D9C8] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div>
                          <span className="text-[#6B8077] block text-[11px]">Total Payable:</span>
                          <span className="font-mono font-black text-base text-[#10231D]">
                            ₹{Number(b.totals?.total || b.total || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span className="text-[#6B8077]">•</span>
                        <div>
                          <span className="text-[#6B8077] block text-[11px]">Payment:</span>
                          {b.paymentStatus === 'paid' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                              <LuCheck className="w-3 h-3 text-emerald-700" />
                              Paid Online
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                              Unpaid
                            </span>
                          )}
                        </div>
                        <span className="text-[#6B8077]">•</span>
                        <div>
                          <span className="text-[#6B8077] block text-[11px]">Mode:</span>
                          <span className="font-semibold text-[#10231D] capitalize">
                            {b.paymentMode === 'cash_on_service' ? 'Cash on Service' : b.paymentMode}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Pay Online Now Button for Unpaid Bookings */}
                        {b.paymentStatus !== 'paid' && b.status !== 'cancelled' && (
                          <button
                            type="button"
                            disabled={payingBookingId === b._id}
                            onClick={() => handlePayBookingOnline(b)}
                            className="px-4 py-2 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] disabled:opacity-50 text-[#10231D] font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                          >
                            <LuCreditCard className="w-3.5 h-3.5" />
                            <span>
                              {payingBookingId === b._id
                                ? 'Connecting...'
                                : `Pay Online · ₹${Number(b.totals?.total || b.total || 0).toLocaleString('en-IN')}`}
                            </span>
                          </button>
                        )}

                        {/* WhatsApp support */}
                        <a
                          href={`https://wa.me/${(settings?.whatsappNumber || '9897766002').replace(/[^0-9]/g, '')}?text=Hello%20Max%20Housekeeping,%20inquiry%20regarding%20booking%20${b.bookingCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                        >
                          <FaWhatsapp className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Track Location Button */}
                        <button
                          type="button"
                          onClick={() => setTrackingModalBooking(b)}
                          className="px-4 py-2 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                          title="Track Supervisor Real-Time Location & Route"
                        >
                          <LuNavigation className="w-3.5 h-3.5 text-[#E9A23B] animate-pulse" />
                          <span>Track Location</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

        {/* ========================================================
            TAB 2: SAVED SERVICE ADDRESSES
        ======================================================== */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#ECE5D8] border border-[#E2D9C8]">
              <div>
                <h3 className="font-display font-bold text-xl text-[#10231D]">
                  Saved Service Addresses
                </h3>
                <p className="text-xs text-[#6B8077] mt-1">
                  Manage your home, apartment, and office locations for fast 1-click booking checkout.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddAddress}
                className="px-4 py-2.5 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <LuPlus className="w-4 h-4 text-[#E9A23B]" />
                <span>Add New Address</span>
              </button>
            </div>

            {(!user?.addresses || user.addresses.length === 0) ? (
              <div className="py-16 text-center bg-[#ECE5D8] rounded-3xl border border-[#E2D9C8] p-8">
                <div className="w-14 h-14 rounded-2xl bg-[#10231D] text-[#E9A23B] flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <LuMapPin className="w-7 h-7" />
                </div>
                <h4 className="font-display font-bold text-lg text-[#10231D] mb-1">
                  No Saved Addresses Yet
                </h4>
                <p className="text-xs text-[#6B8077] max-w-md mx-auto mb-5">
                  Save your home, villa, or office location to quickly auto-fill checkout next time you book a deep cleaning or housekeeping service.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddAddress}
                  className="px-5 py-2.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#10231D] text-xs font-bold shadow-sm transition-transform active:scale-95 cursor-pointer inline-flex items-center gap-2"
                >
                  <LuPlus className="w-4 h-4" />
                  <span>Add First Address</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {user.addresses.map((addr) => (
                  <div
                    key={addr._id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      addr.isDefault
                        ? 'bg-[#F4EFE6] border-[#E9A23B] shadow-md ring-2 ring-[#E9A23B]/30'
                        : 'bg-[#ECE5D8] border-[#E2D9C8] hover:border-[#10231D]/40'
                    }`}
                  >
                    <div>
                      {/* Badge Header */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-lg bg-[#10231D] text-[#F4EFE6] text-[11px] font-bold tracking-wide">
                          {addr.label || 'Home'}
                        </span>
                        {addr.isDefault && (
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E9A23B]/20 text-[#10231D] border border-[#E9A23B] text-[10px] font-extrabold uppercase tracking-wider">
                            <LuCheck className="w-3 h-3 text-[#10231D]" />
                            <span>Default</span>
                          </span>
                        )}
                      </div>

                      {/* Address Text */}
                      {addr.houseOrFlat && (
                        <p className="text-xs font-bold text-[#8C4F00] bg-[#E9A23B]/20 px-2 py-0.5 rounded-md w-fit mb-1.5 border border-[#E9A23B]/40">
                          Unit: {addr.houseOrFlat}
                        </p>
                      )}
                      <p className="font-bold text-sm text-[#10231D] leading-snug">
                        {addr.line1}
                      </p>
                      {addr.landmark && (
                        <p className="text-xs text-[#6B8077] mt-1">
                          Landmark: {addr.landmark}
                        </p>
                      )}
                      <p className="text-xs font-semibold text-[#10231D] mt-2">
                        {addr.city}, {addr.state || 'Uttar Pradesh'}
                      </p>
                      <p className="text-xs font-mono text-[#6B8077] mt-0.5">
                        Pincode: <span className="font-bold text-[#10231D]">{addr.pincode}</span>
                      </p>
                      {addr.coordinates && typeof addr.coordinates.lat === 'number' && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#10231D] text-[#25D366] text-[10px] font-mono font-bold">
                          <LuMapPin className="w-3 h-3 text-[#E9A23B]" />
                          <span>Pin: {addr.coordinates.lat.toFixed(4)}, {addr.coordinates.lng.toFixed(4)}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 mt-4 border-t border-[#E2D9C8] flex items-center justify-between gap-2">
                      {!addr.isDefault ? (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr._id)}
                          className="text-[11px] font-bold text-[#10231D] hover:text-[#E9A23B] transition-colors cursor-pointer"
                        >
                          Set as Default
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#6B8077] italic font-medium">Primary location</span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditAddress(addr)}
                          className="p-1.5 rounded-lg text-[#10231D] hover:bg-[#E2D9C8] transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                          title="Edit Address"
                        >
                          <LuSquarePen className="w-3.5 h-3.5 text-[#E9A23B]" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteAddressConfirm(addr)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                          title="Delete Address"
                        >
                          <LuTrash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: MY PROFILE & PERSONAL DETAILS
        ======================================================== */}
        {activeTab === 'profile' && (
          <div className="bg-[#ECE5D8] rounded-3xl border border-[#E2D9C8] p-6 sm:p-8 shadow-sm max-w-3xl mx-auto">
            <div className="flex items-center justify-between pb-5 border-b border-[#E2D9C8] mb-6">
              <div>
                <h2 className="font-display font-bold text-xl text-[#10231D]">
                  Personal Profile & Details
                </h2>
                <p className="text-xs text-[#6B8077] mt-0.5">
                  Update your contact details, profile photo, and communication preferences.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#10231D] text-[#E9A23B] font-mono text-xs font-bold uppercase">
                {user?.authProvider === 'google' ? 'Google Account' : 'Direct Account'}
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Photo Section */}
              <div className="p-5 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8]">
                <label className="block text-xs font-bold text-[#10231D] mb-3 uppercase tracking-wider font-mono">
                  Profile Photo & Avatar
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Photo Preview with Initials Fallback */}
                  <div className="relative group shrink-0">
                    <UserAvatar
                      name={profileForm.name}
                      avatarUrl={profileForm.avatarUrl}
                      size="2xl"
                      className="shadow-md border-2 border-[#10231D]"
                    />
                    {profileForm.avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs shadow-md hover:bg-red-700 transition-colors cursor-pointer"
                        title="Remove photo & use initials"
                      >
                        <LuX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Photo Controls */}
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Hidden File Input */}
                      <input
                        type="file"
                        id="profilePhotoUploadTab"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="profilePhotoUploadTab"
                        className="px-4 py-2 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <LuUpload className="w-3.5 h-3.5 text-[#E9A23B]" />
                        <span>Upload New Photo</span>
                      </label>

                      {profileForm.avatarUrl ? (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-3.5 py-2 rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <LuTrash2 className="w-3.5 h-3.5" />
                          <span>Remove Photo</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-[#6B8077] italic">
                          Showing geometrical icon / initials as default avatar
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Name and Mobile Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Full Name:
                  </label>
                  <div className="relative">
                    <LuUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-[#6B8077] mt-1">
                    Initials for avatar: <span className="font-bold text-[#10231D] font-mono">{profileForm.name ? profileForm.name.trim().slice(0, 2).toUpperCase() : 'MH'}</span>
                  </p>
                </div>

                {/* Mobile Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#10231D]">
                      Mobile / WhatsApp Number:
                    </label>
                    {!profileForm.phone ? (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.2 rounded-full">
                        Required for Service
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.2 rounded-full flex items-center gap-1">
                        <LuCheck className="w-3 h-3 text-emerald-700" />
                        <span>Saved</span>
                      </span>
                    )}
                  </div>
                  <div className="relative flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-[#E2D9C8] bg-[#ECE5D8] text-xs font-bold text-[#10231D]">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={profileForm.phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        setProfileForm({ ...profileForm, phone: digits });
                      }}
                      placeholder="10-digit mobile number"
                      className="w-full p-2.5 rounded-r-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] font-mono focus:border-[#E9A23B] focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-[#6B8077] mt-1">
                    Crew will call this number for gate entry and appointment arrival.
                  </p>
                </div>
              </div>

              {/* Email (Readonly) */}
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Registered Email Address:
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  disabled
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8]/70 border border-[#D2C8B8] text-sm text-[#3D524A] cursor-not-allowed select-none"
                />
                <p className="text-[11px] text-[#6B8077] mt-1">
                  {user?.authProvider === 'google' ? 'Google OAuth linked account. Email cannot be modified.' : 'Primary email for invoice receipts & booking confirmations.'}
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-[#E2D9C8] flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={profileSubmitting}
                  className="px-6 py-3 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] disabled:opacity-50 text-[#10231D] font-black text-xs transition-transform active:scale-95 shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <LuCheck className="w-4 h-4" />
                  <span>{profileSubmitting ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================
            TAB 4: ACCOUNT & SECURITY (Change Password Form)
        ======================================================== */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Profile Card */}
            <div className="bg-[#ECE5D8] p-6 rounded-3xl border border-[#E2D9C8] shadow-sm space-y-4">
              <div className="text-center">
                <UserAvatar
                  user={user}
                  size="2xl"
                  className="mx-auto border-2 border-[#10231D] mb-3 shadow-md"
                />
                <h3 className="font-display font-black text-lg text-[#10231D]">
                  {user?.name}
                </h3>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-[#10231D] text-[#E9A23B] font-mono text-[10px] font-bold uppercase tracking-wider">
                  {user?.role || 'Customer'}
                </span>
              </div>

              <div className="pt-4 border-t border-[#E2D9C8] space-y-2 text-xs">
                <div>
                  <span className="text-[#6B8077] block text-[11px]">Email Address</span>
                  <span className="font-semibold text-[#10231D]">{user?.email || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-[#6B8077] block text-[11px]">Mobile Number</span>
                  <span className="font-semibold text-[#10231D] font-mono">{user?.phone || 'Not specified'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2D9C8] flex items-center gap-2 text-xs text-[#6B8077]">
                <LuShieldCheck className="w-4 h-4 text-[#10231D]" />
                <span>Account verified and active</span>
              </div>
            </div>

            {/* Change Password Form Card */}
            <div className="md:col-span-2 bg-[#ECE5D8] p-6 rounded-3xl border border-[#E2D9C8] shadow-sm">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#E2D9C8]">
                <div className="p-2 rounded-xl bg-[#10231D] text-[#E9A23B]">
                  <LuLock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-xl text-[#10231D]">
                    Change Password
                  </h3>
                  <p className="text-xs text-[#6B8077]">
                    Update your account password with a secure combination.
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Current Password:
                  </label>
                  <div className="relative">
                    <LuKey className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B8077] hover:text-[#10231D] p-1 transition-colors"
                      title={showCurrentPassword ? 'Hide password' : 'Show password'}
                    >
                      {showCurrentPassword ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#10231D] mb-1">
                      New Password (min 6 chars):
                    </label>
                    <div className="relative">
                      <LuLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B8077] hover:text-[#10231D] p-1 transition-colors"
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#10231D] mb-1">
                      Confirm New Password:
                    </label>
                    <div className="relative">
                      <LuLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B8077] hover:text-[#10231D] p-1 transition-colors"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-6 py-3 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] disabled:opacity-50 text-[#10231D] font-black text-xs transition-transform active:scale-95 shadow-sm flex items-center gap-2"
                  >
                    <span>{changingPassword ? 'Updating Password...' : 'Save New Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL 0: EDIT PROFILE MODAL (Accessible from button/banner)
        ======================================================== */}
        {isEditProfileModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsEditProfileModalOpen(false)}
            title="Edit Profile Details"
            subtitle="Update your full name, profile photo, and mobile number"
            maxWidth="max-w-lg"
          >
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar Preview & Controls */}
              <div className="p-4 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] flex items-center gap-4">
                <div className="relative group shrink-0">
                  <UserAvatar
                    name={profileForm.name}
                    avatarUrl={profileForm.avatarUrl}
                    size="2xl"
                    className="shadow-md border-2 border-[#10231D]"
                  />
                  {profileForm.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs shadow-md hover:bg-red-700 transition-colors cursor-pointer"
                      title="Remove photo & use initials"
                    >
                      <LuX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="file"
                      id="profilePhotoUploadModal"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="profilePhotoUploadModal"
                      className="px-3.5 py-1.5 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <LuUpload className="w-3.5 h-3.5 text-[#E9A23B]" />
                      <span>Upload Photo</span>
                    </label>

                    {profileForm.avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-3 py-1.5 rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <LuTrash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#6B8077]">
                    {profileForm.avatarUrl ? 'Photo loaded. Click Remove to revert to geometric default avatar.' : 'No photo uploaded. Your geometric avatar / initials will be displayed.'}
                  </p>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Full Name:
                </label>
                <div className="relative">
                  <LuUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Enter full name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                    required
                  />
                </div>
                <p className="text-[11px] text-[#6B8077] mt-1">
                  Avatar initials preview: <span className="font-bold text-[#10231D] font-mono">{profileForm.name ? profileForm.name.trim().slice(0, 2).toUpperCase() : 'MH'}</span>
                </p>
              </div>

              {/* Mobile Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#10231D]">
                    Mobile / WhatsApp Number:
                  </label>
                  {!profileForm.phone && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.2 rounded-full">
                      Required
                    </span>
                  )}
                </div>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-[#E2D9C8] bg-[#ECE5D8] text-xs font-bold text-[#10231D]">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={profileForm.phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      setProfileForm({ ...profileForm, phone: digits });
                    }}
                    placeholder="10-digit mobile number"
                    className="w-full p-2.5 rounded-r-xl bg-[#ECE5D8] border border-[#E2D9C8] text-sm text-[#10231D] font-mono focus:border-[#E9A23B] focus:outline-none"
                    required
                  />
                </div>
                <p className="text-[11px] text-[#6B8077] mt-1">
                  Required for appointment notifications and crew gate entry.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2D9C8]">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B8077] hover:bg-[#ECE5D8] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] disabled:opacity-50 text-[#10231D] text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <LuCheck className="w-4 h-4" />
                  <span>{profileSubmitting ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ========================================================
            MODAL 1: CHANGE PASSWORD MODAL (Accessible from button)
        ======================================================== */}
        {isChangePasswordModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsChangePasswordModalOpen(false)}
            title="Change Account Password"
            subtitle="Enter your current password and choose a new secure password"
            maxWidth="max-w-md"
          >
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Current Password:
                </label>
                <div className="relative">
                  <LuKey className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B8077] hover:text-[#10231D] p-1"
                  >
                    {showCurrentPassword ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  New Password (min 6 chars):
                </label>
                <div className="relative">
                  <LuLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B8077] hover:text-[#10231D] p-1"
                  >
                    {showNewPassword ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Confirm New Password:
                </label>
                <div className="relative">
                  <LuLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B8077] hover:text-[#10231D] p-1"
                  >
                    {showConfirmPassword ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2D9C8]">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B8077] hover:bg-[#ECE5D8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-5 py-2.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] disabled:opacity-50 text-[#10231D] text-xs font-bold"
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ========================================================
            MODAL 2: EDIT BOOKING MODAL
        ======================================================== */}
        {editingBooking && (
          <Modal
            isOpen={true}
            onClose={() => setEditingBooking(null)}
            title={`Edit Details: ${editingBooking.bookingCode}`}
            subtitle="Update contact phone, address, or service arrival slot"
            maxWidth="max-w-md"
          >
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#10231D]">
                    Customer Name:
                  </label>
                  <span className="text-[10px] text-[#6B8077]">Letters & spaces only</span>
                </div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value.replace(/[^a-zA-Z\s]/g, '') })}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#10231D]">
                    Contact Mobile Number:
                  </label>
                  <span className="text-[10px] text-[#6B8077]">10 digits</span>
                </div>
                <input
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-mono text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Street Address:
                </label>
                <input
                  type="text"
                  value={editForm.line1}
                  onChange={(e) => setEditForm({ ...editForm, line1: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Scheduled Date:
                  </label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Pincode:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="244001"
                    value={editForm.pincode}
                    onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs font-mono text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Arrival Window:
                </label>
                <select
                  value={editForm.window}
                  onChange={(e) => setEditForm({ ...editForm, window: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                >
                  <option value="Morning (8:00 AM – 11:00 AM)">Morning (8:00 AM – 11:00 AM)</option>
                  <option value="Afternoon (11:00 AM – 2:00 PM)">Afternoon (11:00 AM – 2:00 PM)</option>
                  <option value="Late Afternoon (2:00 PM – 5:00 PM)">Late Afternoon (2:00 PM – 5:00 PM)</option>
                  <option value="Evening (5:00 PM – 8:00 PM)">Evening (5:00 PM – 8:00 PM)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Special Notes or Entry Instructions:
                </label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2D9C8]">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B8077] hover:bg-[#ECE5D8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E9A23B] text-[#10231D] text-xs font-bold hover:bg-[#D48E28]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ========================================================
            MODAL 3: COMMUNICATE WITH ADMIN CHAT THREAD MODAL
        ======================================================== */}
        {messagingBooking && (
          <Modal
            isOpen={true}
            onClose={() => setMessagingBooking(null)}
            title={`Live Communication: ${messagingBooking.bookingCode}`}
            subtitle="Chat directly with Max Housekeeping dispatch administrators"
            maxWidth="max-w-lg"
          >
            <div className="flex flex-col h-96">
              {/* 7-day chat retention banner */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DDEBE4] text-[#10231D] text-[11px] font-medium border border-[#A3B8B0]/40 mb-3">
                <LuClock className="w-3.5 h-3.5 text-[#10231D] shrink-0" />
                <span>Chat history is saved for 7 days. Older messages are automatically cleared.</span>
              </div>
              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#F4EFE6] rounded-xl border border-[#E2D9C8] mb-3">
                {!messagingBooking.messages || messagingBooking.messages.length === 0 ? (
                  <p className="text-center text-xs text-[#6B8077] py-10">
                    No messages yet. Send a note or instruction below to our operations team.
                  </p>
                ) : (
                  messagingBooking.messages.map((m, idx) => {
                    const isAdminMsg = m.sender === 'admin';
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isAdminMsg ? 'items-start' : 'items-end'}`}
                      >
                        <span className="text-[10px] text-[#6B8077] mb-0.5">
                          {m.senderName} ({new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </span>
                        <div
                          className={`max-w-[80%] p-3 rounded-xl text-xs ${
                            isAdminMsg
                              ? 'bg-[#10231D] text-[#F4EFE6] rounded-bl-none'
                              : 'bg-[#E9A23B] text-[#10231D] font-medium rounded-br-none'
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message or inquiry to admin..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={sendingMsg}
                  className="px-4 py-2.5 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] text-xs font-bold flex items-center gap-1.5"
                >
                  <LuSend className="w-3.5 h-3.5 text-[#E9A23B]" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </Modal>
        )}

        {/* ========================================================
            MODAL: ADD NEW SAVED ADDRESS
        ======================================================== */}
        {isAddAddressModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsAddAddressModalOpen(false)}
            title="Add New Service Address"
            subtitle="Save an address to your profile for faster checkout"
            maxWidth="max-w-xl"
          >
            <form onSubmit={handleCreateAddress} className="space-y-4">
              {/* Address Label Presets */}
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1.5">
                  Address Label:
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['Home', 'Office', 'Apartment', 'Villa'].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setNewAddressForm({ ...newAddressForm, label: lbl })}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        newAddressForm.label === lbl
                          ? 'bg-[#10231D] text-[#E9A23B] shadow-xs'
                          : 'bg-[#ECE5D8] text-[#10231D] hover:bg-[#E2D9C8]'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Or custom label (e.g. Parents Home, Farmhouse)"
                  value={newAddressForm.label}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, label: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                  required
                />
              </div>

              {/* Interactive Google Autocomplete & Doorstep Pinpoint */}
              <AddressPickerWithMap
                value={newAddressForm}
                onChange={(newFields) => setNewAddressForm(prev => ({ ...prev, ...newFields }))}
                defaultCity={newAddressForm.city || 'Moradabad'}
              />

              {/* Set as Default Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addrDefaultToggle"
                  checked={Boolean(newAddressForm.isDefault)}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, isDefault: e.target.checked })}
                  className="rounded text-[#E9A23B] focus:ring-[#E9A23B] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="addrDefaultToggle" className="text-xs font-bold text-[#10231D] cursor-pointer">
                  Set as my primary default address
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2D9C8]">
                <button
                  type="button"
                  onClick={() => setIsAddAddressModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B8077] hover:bg-[#E2D9C8] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#10231D] text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {addressSubmitting ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ========================================================
            MODAL: EDIT SAVED ADDRESS
        ======================================================== */}
        {editingAddress && (
          <Modal
            isOpen={true}
            onClose={() => setEditingAddress(null)}
            title="Edit Saved Address"
            subtitle={`Update address details for "${editingAddress.label || 'Saved Location'}"`}
            maxWidth="max-w-xl"
          >
            <form onSubmit={handleUpdateAddressSubmit} className="space-y-4">
              {/* Address Label Presets */}
              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1.5">
                  Address Label:
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['Home', 'Office', 'Apartment', 'Villa'].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setEditAddressForm({ ...editAddressForm, label: lbl })}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        editAddressForm.label === lbl
                          ? 'bg-[#10231D] text-[#E9A23B] shadow-xs'
                          : 'bg-[#ECE5D8] text-[#10231D] hover:bg-[#E2D9C8]'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Custom label (e.g. Home, Office, Villa)"
                  value={editAddressForm.label}
                  onChange={(e) => setEditAddressForm({ ...editAddressForm, label: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                  required
                />
              </div>

              {/* Interactive Google Autocomplete & Doorstep Pinpoint */}
              <AddressPickerWithMap
                value={editAddressForm}
                onChange={(newFields) => setEditAddressForm(prev => ({ ...prev, ...newFields }))}
                defaultCity={editAddressForm.city || 'Moradabad'}
              />

              {/* Set as Default Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editAddrDefaultToggle"
                  checked={Boolean(editAddressForm.isDefault)}
                  onChange={(e) => setEditAddressForm({ ...editAddressForm, isDefault: e.target.checked })}
                  className="rounded text-[#E9A23B] focus:ring-[#E9A23B] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="editAddrDefaultToggle" className="text-xs font-bold text-[#10231D] cursor-pointer">
                  Set as my primary default address
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2D9C8]">
                <button
                  type="button"
                  onClick={() => setEditingAddress(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B8077] hover:bg-[#E2D9C8] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editingAddressSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#10231D] text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {editingAddressSubmitting ? 'Updating...' : 'Update Address'}
                </button>
              </div>
            </form>
          </Modal>
        )}


        {/* Track Live Location Modal */}
        {trackingModalBooking && (
          <Modal
            isOpen={Boolean(trackingModalBooking)}
            onClose={() => setTrackingModalBooking(null)}
            title={`Track Location · #${trackingModalBooking.bookingCode}`}
            subtitle="Live location and route to your address"
            maxWidth="max-w-2xl"
          >
            <div className="space-y-4">
              <LiveTrackingRadar
                bookingCode={trackingModalBooking.bookingCode}
                initialSupervisorLocation={trackingModalBooking.supervisorLiveLocation}
                customerLocation={trackingModalBooking.address?.coordinates}
                destinationAddress={`${trackingModalBooking.address?.houseOrFlat ? trackingModalBooking.address.houseOrFlat + ', ' : ''}${trackingModalBooking.address?.line1 || ''}, ${trackingModalBooking.cityName || ''}`}
                supervisorInfo={{
                  name: trackingModalBooking.assignedSupervisor?.name || trackingModalBooking.supervisor?.name || 'Field Supervisor',
                  phone: trackingModalBooking.assignedSupervisor?.phone || trackingModalBooking.supervisor?.phone || '',
                  role: 'Supervisor'
                }}
              />
              <div className="flex items-center justify-between pt-2">
                <Link
                  to={`/track/${trackingModalBooking.bookingCode}`}
                  target="_blank"
                  className="text-xs text-[#E9A23B] hover:underline font-bold flex items-center gap-1"
                >
                  <span>Open Fullscreen</span>
                  <LuNavigation className="w-3 h-3" />
                </Link>
                <button
                  type="button"
                  onClick={() => setTrackingModalBooking(null)}
                  className="px-4 py-2 rounded-xl bg-[#10231D] text-[#F4EFE6] text-xs font-bold hover:bg-[#3D524A] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Action Confirmation & Prompt Modal */}
        {confirmModalConfig && (
          <ConfirmModal
            isOpen={Boolean(confirmModalConfig)}
            onClose={() => setConfirmModalConfig(null)}
            {...confirmModalConfig}
          />
        )}
      </div>
    </div>
  );
}
