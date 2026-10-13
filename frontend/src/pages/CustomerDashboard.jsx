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
  LuUser
} from 'react-icons/lu';
import { FaWhatsapp } from 'react-icons/fa6';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';

export default function CustomerDashboard() {
  const { user, changePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'security'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Require auth
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user]);

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

    try {
      const res = await apiRequest(`/bookings/${editingBooking._id}/edit`, {
        method: 'PUT',
        body: {
          customer: {
            name: editForm.name.trim(),
            phone: editForm.phone.trim()
          },
          address: {
            line1: editForm.line1.trim(),
            pincode: editForm.pincode.trim()
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

  return (
    <div className="bg-[#F4EFE6] min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2D9C8] mb-6 gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E9A23B]">
              CUSTOMER DASHBOARD
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-[#10231D]">
              {activeTab === 'bookings' ? 'My Cleaning Bookings' : 'Account & Security'}
            </h1>
            <p className="text-xs text-[#6B8077] mt-1">
              Welcome back, {user?.name}. Manage your appointments, profile, and account security.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsChangePasswordModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-[#10231D] bg-[#ECE5D8] hover:bg-[#E2D9C8] text-[#10231D] text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <LuKey className="w-4 h-4 text-[#E9A23B]" />
              <span>Change Password</span>
            </button>

            <Link
              to="/book"
              className="px-4 py-2.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#10231D] text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <LuPlus className="w-4 h-4" />
              <span>New Booking</span>
            </Link>
          </div>
        </div>

        {/* Dashboard Sub-Tabs */}
        <div className="flex items-center gap-2 mb-8 border-b border-[#E2D9C8] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
                {bookings.map((b) => (
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

                      <div className="flex items-center gap-2">
                        {/* Communicate with Admin Button */}
                        <button
                          type="button"
                          onClick={() => setMessagingBooking(b)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F4EFE6] hover:bg-[#E2D9C8] border border-[#E2D9C8] text-xs font-bold text-[#10231D] transition-colors"
                        >
                          <LuMessageSquare className="w-3.5 h-3.5 text-[#E9A23B]" />
                          <span>Chat with Admin</span>
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
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] text-xs font-bold transition-colors"
                          >
                            <LuSquarePen className="w-3.5 h-3.5 text-[#E9A23B]" />
                            <span>Edit Booking</span>
                          </button>
                        )}
                      </div>
                    </div>

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
                            {b.slot?.date ? new Date(b.slot.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Flexible'}
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

                    {/* Footer Row: Total Price + Live Tracking Action */}
                    <div className="pt-3 border-t border-[#E2D9C8] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-[#6B8077] block text-[11px]">Total Payable:</span>
                          <span className="font-mono font-black text-base text-[#10231D]">
                            ₹{Number(b.totals?.total || b.total || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span className="text-[#6B8077]">•</span>
                        <div>
                          <span className="text-[#6B8077] block text-[11px]">Payment Mode:</span>
                          <span className="font-semibold text-[#10231D] capitalize">
                            {b.paymentMode === 'cash_on_service' ? 'Cash on Service' : b.paymentMode}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* WhatsApp support */}
                        <a
                          href={`https://wa.me/919897766002?text=Hello%20Max%20Housekeeping,%20inquiry%20regarding%20booking%20${b.bookingCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                        >
                          <FaWhatsapp className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Live Tracking Link */}
                        <Link
                          to={`/track/${b.bookingCode}`}
                          className="px-4 py-2 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] font-bold text-xs shadow-xs"
                        >
                          Live Tracking
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: ACCOUNT & SECURITY (Change Password Form)
        ======================================================== */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Profile Card */}
            <div className="bg-[#ECE5D8] p-6 rounded-3xl border border-[#E2D9C8] shadow-sm space-y-4">
              <div className="text-center">
                <img
                  src={user?.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=MH&backgroundColor=10231D&textColor=F4EFE6'}
                  alt={user?.name}
                  className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-[#10231D] mb-3"
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
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Customer Name:
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">
                  Contact Mobile Number:
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
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

              <div className="grid grid-cols-2 gap-3">
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
                    value={editForm.pincode}
                    onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
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
      </div>
    </div>
  );
}
