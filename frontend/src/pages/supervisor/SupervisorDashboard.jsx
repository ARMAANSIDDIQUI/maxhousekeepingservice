import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuShieldCheck,
  LuCalendar,
  LuClock,
  LuMapPin,
  LuPhone,
  LuMail,
  LuCheck,
  LuTriangleAlert,
  LuCamera,
  LuUpload,
  LuTrash2,
  LuSearch,
  LuRotateCcw,
  LuCircleCheck,
  LuX,
  LuExternalLink,
  LuSparkles,
  LuMessageSquare,
  LuSend,
  LuChevronRight,
  LuChevronLeft,
  LuLayoutGrid,
  LuEye,
  LuLogOut,
  LuUser
} from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supervisorAPI } from '../../api';
import SEO from '../../components/common/SEO';
import Modal from '../../components/common/Modal';

function formatToday() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function SupervisorDashboard() {
  const { user, isSupervisor, isAdmin, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalAssigned: 0,
    todayBookings: 0,
    inProgress: 0,
    completed: 0,
    pendingOtp: 0
  });

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'today' | 'pending_otp' | 'in_progress' | 'completed'
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Booking Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('otp'); // 'otp' | 'before_photos' | 'after_photos' | 'details' | 'chat'

  // OTP Verification state
  const [otpInput, setOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Photo Upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoNotes, setPhotoNotes] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);

  // Chat state
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Status update state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  // Daily Time Slot Allotment Run-Sheet & Schedule State (Urban Company / Pronto Dispatch)
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'cards'
  const [scheduleDate, setScheduleDate] = useState(formatToday());
  const [scheduleData, setScheduleData] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Fetch Supervisor Daily Schedule
  const loadSchedule = async (date = scheduleDate) => {
    setLoadingSchedule(true);
    try {
      const res = await supervisorAPI.getSchedule(date);
      if (res?.success) {
        setScheduleData(res);
      }
    } catch (err) {
      console.error('[Supervisor Schedule Fetch Error]:', err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleShiftDate = (days) => {
    const parts = scheduleDate.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const newDateStr = `${year}-${month}-${day}`;
    setScheduleDate(newDateStr);
  };

  // Fetch Stats & Bookings
  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        supervisorAPI.getStats(),
        supervisorAPI.getBookings({ filter: activeFilter }),
        loadSchedule(scheduleDate)
      ]);

      if (statsRes?.success && statsRes.stats) {
        setStats(statsRes.stats);
      }
      if (bookingsRes?.success && bookingsRes.bookings) {
        setBookings(bookingsRes.bookings);
      }
    } catch (err) {
      console.error('[Supervisor Dashboard Fetch Error]:', err);
      toast.error('Failed to load supervisor assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupervisor && !isAdmin) {
      navigate('/login');
      return;
    }
    loadData();
  }, [activeFilter, isSupervisor, isAdmin]);

  useEffect(() => {
    if (isSupervisor || isAdmin) {
      loadSchedule(scheduleDate);
    }
  }, [scheduleDate]);

  // Open modal and sync latest details
  const handleOpenBooking = async (b) => {
    setSelectedBooking(b);
    setOtpInput('');
    setPhotoNotes('');
    setActiveModalTab(b.otpVerified ? 'before_photos' : 'otp');
    setModalOpen(true);

    try {
      const res = await supervisorAPI.getBookingDetails(b._id);
      if (res?.success && res.booking) {
        setSelectedBooking(res.booking);
      }
    } catch {
      // keep local snapshot
    }
  };

  // 1. Verify OTP with Enterprise Urban Company Standards
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpInput.trim()) {
      toast.error('Please enter the 4-digit verification code.');
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await supervisorAPI.verifyOtp(selectedBooking._id, otpInput.trim());
      if (res?.success && res.booking) {
        toast.success('Customer OTP Verified! Service is now In-Progress.');
        setSelectedBooking(res.booking);
        setBookings(prev => prev.map(b => b._id === res.booking._id ? res.booking : b));
        setOtpInput('');
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Invalid verification OTP. Please re-check with customer.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // 2. Upload Photo (Before or After) with strict validation
  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict 10MB size constraint validation
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error(`Photo exceeds 10MB limit. Current file: ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
      e.target.value = '';
      return;
    }

    // Type validation
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.mimetype)) {
      toast.error('Only JPEG, PNG, and WebP images are supported.');
      e.target.value = '';
      return;
    }

    setUploadingPhoto(true);
    try {
      const res = await supervisorAPI.uploadPhoto(selectedBooking._id, file, type, photoNotes);
      if (res?.success) {
        toast.success(`${type === 'before' ? 'Before' : 'After'} inspection photo uploaded!`);
        setSelectedBooking(prev => ({
          ...prev,
          photos: res.photos
        }));
        setBookings(prev => prev.map(b => b._id === selectedBooking._id ? { ...b, photos: res.photos } : b));
        setPhotoNotes('');
      }
    } catch (err) {
      toast.error(err.message || 'Photo upload failed. Please try again.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  // 3. Delete Photo
  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this inspection photo?')) return;
    try {
      const res = await supervisorAPI.deletePhoto(selectedBooking._id, photoId);
      if (res?.success) {
        toast.info('Photo removed.');
        setSelectedBooking(prev => ({
          ...prev,
          photos: res.photos
        }));
        setBookings(prev => prev.map(b => b._id === selectedBooking._id ? { ...b, photos: res.photos } : b));
      }
    } catch (err) {
      toast.error('Failed to remove photo.');
    }
  };

  // 4. Update Status (In Progress or Completed)
  const handleUpdateStatus = async (newStatus) => {
    if (newStatus === 'completed' && !selectedBooking.otpVerified) {
      const proceed = window.confirm(
        'Warning: Customer OTP has not been verified yet! Urban Company safety protocol requires OTP verification. Do you still want to mark this booking as Completed?'
      );
      if (!proceed) return;
    }

    setUpdatingStatus(true);
    try {
      const res = await supervisorAPI.updateStatus(selectedBooking._id, newStatus, statusNote);
      if (res?.success && res.booking) {
        toast.success(`Booking status marked as ${newStatus.replace('_', ' ').toUpperCase()}`);
        setSelectedBooking(res.booking);
        setBookings(prev => prev.map(b => b._id === res.booking._id ? res.booking : b));
        setStatusNote('');
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // 5. Send Chat Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    setSendingMessage(true);
    try {
      const res = await supervisorAPI.sendMessage(selectedBooking._id, chatMessage.trim());
      if (res?.success) {
        setSelectedBooking(prev => ({
          ...prev,
          messages: res.messages
        }));
        setChatMessage('');
      }
    } catch (err) {
      toast.error('Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Filter Bookings by search term
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;
      return (
        b.bookingCode?.toLowerCase().includes(q) ||
        b.customer?.name?.toLowerCase().includes(q) ||
        b.customer?.phone?.includes(q) ||
        b.cityName?.toLowerCase().includes(q) ||
        b.address?.line1?.toLowerCase().includes(q)
      );
    });
  }, [bookings, searchTerm]);

  const todayStr = formatToday();

  return (
    <div className="bg-[#F4EFE6] min-h-screen pb-16">
      <SEO
        title="Supervisor Operations Dashboard | Max Housekeeping"
        description="Field supervisor command console for on-site verification, inspection photo documentation, and job tracking."
      />

      {/* Top Operations Header */}
      <div className="bg-[#10231D] text-[#F4EFE6] border-b border-[#2C4A3E] px-4 py-4 sm:px-8">
        <div className="container mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E9A23B] text-[#10231D] flex items-center justify-center font-black text-lg shadow-md">
              <LuShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-[#E9A23B]/20 text-[#E9A23B] px-2 py-0.5 rounded-full border border-[#E9A23B]/30 font-bold">
                  FIELD OPERATIONS CONSOLE
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active on Duty
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-display font-black text-[#F4EFE6] mt-0.5">
                Supervisor Portal • {user?.name || 'Operations Lead'}
              </h1>
            </div>
          </div>

          {/* Quick Actions & Profile */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#F4EFE6] transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Refresh Assignments"
            >
              <LuRotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-[#E9A23B] transition-colors"
              >
                Admin Panel
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LuLogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-8 mt-6 max-w-7xl">
        {/* Enterprise Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {/* Total Assigned */}
          <div className="p-4 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] shadow-xs">
            <div className="flex items-center justify-between text-[#6B8077] mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Total Assigned</span>
              <LuCalendar className="w-4 h-4 text-[#10231D]" />
            </div>
            <div className="text-2xl sm:text-3xl font-display font-black text-[#10231D]">
              {stats.totalAssigned}
            </div>
            <p className="text-[10px] text-[#6B8077] mt-0.5">Lifetime assigned visits</p>
          </div>

          {/* Today's Schedule */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-[#E9A23B] shadow-xs">
            <div className="flex items-center justify-between text-[#E9A23B] mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Today's Visits</span>
              <LuClock className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-display font-black text-[#10231D]">
              {stats.todayBookings}
            </div>
            <p className="text-[10px] text-[#8C4F00] font-bold mt-0.5">Scheduled for today</p>
          </div>

          {/* Pending OTP Verification */}
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-300 shadow-xs">
            <div className="flex items-center justify-between text-red-700 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Pending OTP</span>
              <LuTriangleAlert className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-display font-black text-red-700">
              {stats.pendingOtp}
            </div>
            <p className="text-[10px] text-red-600 mt-0.5">Awaiting customer PIN</p>
          </div>

          {/* In Progress */}
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-200 shadow-xs">
            <div className="flex items-center justify-between text-blue-800 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold">In-Progress</span>
              <LuSparkles className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-display font-black text-blue-900">
              {stats.inProgress}
            </div>
            <p className="text-[10px] text-blue-700 mt-0.5">Active cleaning jobs</p>
          </div>

          {/* Completed */}
          <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-200 shadow-xs">
            <div className="flex items-center justify-between text-emerald-800 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Completed</span>
              <LuCircleCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-display font-black text-emerald-900">
              {stats.completed}
            </div>
            <p className="text-[10px] text-emerald-700 mt-0.5">Verified & closed visits</p>
          </div>
        </div>

        {/* Filter Tabs, View Switcher & Search Bar */}
        <div className="p-4 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-xs">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Jobs' },
              { id: 'today', label: "Today's Schedule" },
              { id: 'pending_otp', label: 'Pending OTP' },
              { id: 'in_progress', label: 'In-Progress' },
              { id: 'completed', label: 'Completed' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveFilter(tab.id);
                  if (tab.id === 'today') setViewMode('timeline');
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-[#10231D] text-[#E9A23B] shadow-sm'
                    : 'text-[#6B8077] hover:text-[#10231D] hover:bg-white/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-white/70 p-1 rounded-xl border border-[#E2D9C8] shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-[#10231D] text-[#E9A23B] shadow-xs'
                    : 'text-[#6B8077] hover:text-[#10231D]'
                }`}
                title="Daily Time Slot Run-Sheet"
              >
                <LuClock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Slot Run-Sheet</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  viewMode === 'cards'
                    ? 'bg-[#10231D] text-[#E9A23B] shadow-xs'
                    : 'text-[#6B8077] hover:text-[#10231D]'
                }`}
                title="Cards Grid View"
              >
                <LuLayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards Grid</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px] sm:min-w-[260px] flex-1">
              <LuSearch className="w-4 h-4 text-[#6B8077] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search code, customer, city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#E2D9C8] text-xs font-medium text-[#10231D] placeholder-[#6B8077] focus:outline-none focus:border-[#E9A23B]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6B8077] hover:text-[#10231D]"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* VIEW 1: DAILY TIME SLOT RUN-SHEET TIMELINE */}
        {viewMode === 'timeline' && (
          <div className="space-y-4 mb-8">
            {/* Date Navigator Header */}
            <div className="p-4 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShiftDate(-1)}
                  className="p-2 rounded-xl bg-white border border-[#E2D9C8] hover:bg-[#F4EFE6] text-[#10231D] font-bold text-xs flex items-center gap-1 cursor-pointer"
                  title="Previous Day"
                >
                  <LuChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev Day</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleDate(formatToday())}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    scheduleDate === formatToday()
                      ? 'bg-[#10231D] text-[#E9A23B] border-[#10231D] shadow-xs'
                      : 'bg-white text-[#10231D] border-[#E2D9C8] hover:bg-[#F4EFE6]'
                  }`}
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => handleShiftDate(1)}
                  className="p-2 rounded-xl bg-white border border-[#E2D9C8] hover:bg-[#F4EFE6] text-[#10231D] font-bold text-xs flex items-center gap-1 cursor-pointer"
                  title="Next Day"
                >
                  <span className="hidden sm:inline">Next Day</span>
                  <LuChevronRight className="w-4 h-4" />
                </button>

                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E2D9C8] text-xs font-mono font-bold text-[#10231D]"
                />
              </div>

              {/* Daily Allotment Summary */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-white border border-[#E2D9C8] text-[#10231D] font-bold">
                  Allotted: <strong className="text-[#E9A23B] font-mono">{scheduleData?.totalJobs || 0}</strong> visits
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                  Completed: <strong className="font-mono">{scheduleData?.completedJobs || 0}</strong>
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                  Pending OTP: <strong className="font-mono">{scheduleData?.pendingOtpJobs || 0}</strong>
                </span>
              </div>
            </div>

            {/* Time Slot Timeline Cards */}
            {loadingSchedule ? (
              <div className="py-16 text-center font-mono text-xs text-[#6B8077] bg-[#ECE5D8] rounded-3xl border border-[#E2D9C8]">
                <div className="w-8 h-8 rounded-full border-2 border-[#E9A23B] border-t-transparent animate-spin mx-auto mb-3" />
                FETCHING TIME SLOT DISPATCH RUN-SHEET...
              </div>
            ) : (
              <div className="space-y-3">
                {scheduleData?.schedule?.map((slotItem) => {
                  const isSlotBooked = slotItem.bookingsCount > 0;

                  return (
                    <div
                      key={slotItem.timeWindow}
                      className={`rounded-2xl border transition-all ${
                        isSlotBooked
                          ? 'bg-white border-[#E9A23B] shadow-sm ring-1 ring-[#E9A23B]/20'
                          : 'bg-white/60 border-dashed border-[#E2D9C8] opacity-75 hover:opacity-100'
                      } p-4`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2D9C8]/60">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isSlotBooked ? 'bg-[#10231D] text-[#E9A23B]' : 'bg-[#ECE5D8] text-[#6B8077]'
                          }`}>
                            <LuClock className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-mono font-black text-sm text-[#10231D]">
                              {slotItem.timeWindow}
                            </span>
                            <span className="text-[11px] text-[#6B8077] ml-2 font-medium">
                              {slotItem.timeWindow.includes('08:00 AM') ? 'Early Morning Slot' :
                               slotItem.timeWindow.includes('10:00 AM') ? 'Morning Slot' :
                               slotItem.timeWindow.includes('12:00 PM') ? 'Noon Slot' :
                               slotItem.timeWindow.includes('02:00 PM') ? 'Afternoon Slot' :
                               slotItem.timeWindow.includes('04:00 PM') ? 'Late Afternoon Slot' : 'Evening Slot'}
                            </span>
                          </div>
                        </div>

                        <div>
                          {isSlotBooked ? (
                            <span className="px-2.5 py-1 rounded-full bg-[#10231D] text-[#E9A23B] text-[10px] font-mono font-bold uppercase">
                              {slotItem.bookingsCount} Allotted Job{slotItem.bookingsCount === 1 ? '' : 's'}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold uppercase border border-emerald-200">
                              ✓ Free / Open Slot
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bookings inside this slot */}
                      {isSlotBooked ? (
                        <div className="mt-3 space-y-3">
                          {slotItem.bookings.map((b) => (
                            <div
                              key={b._id}
                              className="p-3.5 rounded-xl bg-[#F4EFE6]/70 border border-[#E2D9C8] flex flex-col md:flex-row md:items-center justify-between gap-3"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-black text-[#10231D]">
                                    #{b.bookingCode}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                    b.status === 'completed'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : b.status === 'in_progress'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-900'
                                  }`}>
                                    {b.status?.replace('_', ' ')}
                                  </span>
                                  {b.otpVerified ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center gap-1">
                                      <LuCircleCheck className="w-3 h-3 text-emerald-600" />
                                      OTP Verified
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[9px] font-bold flex items-center gap-1">
                                      <LuTriangleAlert className="w-3 h-3 text-amber-700" />
                                      Arrival OTP Pending
                                    </span>
                                  )}
                                </div>

                                <h4 className="font-bold text-xs text-[#10231D]">
                                  {b.serviceTitle || 'Professional Housekeeping Service'}
                                </h4>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#6B8077]">
                                  <span className="font-medium text-[#10231D]">
                                    {b.customer?.name}
                                  </span>
                                  {b.customer?.phone && (
                                    <a
                                      href={`tel:${b.customer.phone}`}
                                      className="font-mono text-[#10231D] hover:underline flex items-center gap-1 font-bold"
                                    >
                                      <LuPhone className="w-3 h-3 text-[#E9A23B]" />
                                      {b.customer.phone}
                                    </a>
                                  )}
                                  <span className="flex items-center gap-1 line-clamp-1">
                                    <LuMapPin className="w-3 h-3 text-[#E9A23B] shrink-0" />
                                    {b.address?.line1 || b.address?.line2 || 'Customer address'}, {b.cityName || ''}
                                  </span>
                                </div>

                                {b.assignedSlot?.notes && (
                                  <p className="text-[10px] text-[#E9A23B] font-mono italic">
                                    Dispatch Note: "{b.assignedSlot.notes}"
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenBooking(b)}
                                  className="px-4 py-2 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                  <span>Manage Visit</span>
                                  <LuChevronRight className="w-3.5 h-3.5 text-[#E9A23B]" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-[11px] text-[#6B8077] italic">
                          No appointments allotted for this window. Supervisor is available for urgent or on-demand dispatches.
                        </p>
                      )}
                    </div>
                  );
                })}

                {/* Custom or Non-Standard Slots */}
                {scheduleData?.customSlots?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#E2D9C8]">
                    <h4 className="text-xs font-mono font-bold text-[#10231D] uppercase mb-2">
                      Custom / Flexible Scheduled Appointments
                    </h4>
                    <div className="space-y-2">
                      {scheduleData.customSlots.map((cs, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-white border border-[#E2D9C8] flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-xs text-[#E9A23B] block">
                              {cs.window} • #{cs.booking.bookingCode}
                            </span>
                            <p className="text-xs font-bold text-[#10231D]">{cs.booking.customer?.name} ({cs.booking.serviceTitle})</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenBooking(cs.booking)}
                            className="px-3 py-1.5 rounded-xl bg-[#10231D] text-[#F4EFE6] text-xs font-bold cursor-pointer"
                          >
                            Open
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: ASSIGNED BOOKINGS CARDS GRID */}
        {viewMode === 'cards' && (
          loading ? (
            <div className="py-20 text-center font-mono text-xs text-[#6B8077] bg-[#ECE5D8] rounded-3xl border border-[#E2D9C8]">
              <div className="w-8 h-8 rounded-full border-2 border-[#E9A23B] border-t-transparent animate-spin mx-auto mb-3" />
              LOADING ASSIGNED SERVICE VISITS...
            </div>
          ) : filteredBookings.length === 0 ? (
          <div className="py-20 text-center bg-[#ECE5D8] rounded-3xl border border-[#E2D9C8] p-6">
            <LuCalendar className="w-12 h-12 text-[#6B8077] mx-auto mb-3 opacity-60" />
            <h3 className="font-display font-bold text-lg text-[#10231D]">No Assigned Bookings Found</h3>
            <p className="text-xs text-[#6B8077] mt-1 max-w-sm mx-auto">
              {activeFilter === 'today'
                ? "You have no bookings scheduled for today. Great job! Check other tabs for upcoming visits."
                : "No cleaning bookings match your current filter or search criteria."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBookings.map((b) => {
              const isToday = (b.assignedSlot?.date || b.slot?.date) === todayStr;
              const beforeCount = b.photos?.before?.length || 0;
              const afterCount = b.photos?.after?.length || 0;

              return (
                <div
                  key={b._id}
                  className={`p-5 rounded-2xl bg-white border transition-all hover:shadow-lg flex flex-col justify-between ${
                    isToday ? 'border-[#E9A23B] ring-2 ring-[#E9A23B]/20' : 'border-[#E2D9C8]'
                  }`}
                >
                  <div>
                    {/* Top Header: Code, Badges */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-[#10231D]">
                            {b.bookingCode}
                          </span>
                          {isToday && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono text-[9px] font-black uppercase">
                              TODAY
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#6B8077]">
                          Booked on: {new Date(b.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          b.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {b.status?.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Customer & Call Section */}
                    <div className="p-3 rounded-xl bg-[#ECE5D8]/60 border border-[#E2D9C8]/70 mb-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#10231D]">{b.customer?.name}</span>
                        <a
                          href={`tel:${b.customer?.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 rounded-lg bg-[#10231D] text-[#E9A23B] text-[11px] font-bold flex items-center gap-1 hover:bg-[#3D524A] transition-colors"
                        >
                          <LuPhone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      </div>
                      <p className="text-[11px] text-[#6B8077] font-mono">{b.customer?.phone}</p>
                    </div>

                    {/* Address & Slot */}
                    <div className="space-y-1.5 text-xs text-[#10231D] mb-4">
                      <div className="flex items-start gap-1.5">
                        <LuMapPin className="w-3.5 h-3.5 text-[#E9A23B] shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-[11px] leading-tight">
                          {b.address?.line1}, {b.cityName} ({b.address?.pincode})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#6B8077]">
                        <LuClock className="w-3.5 h-3.5 text-[#E9A23B] shrink-0" />
                        <span>{b.assignedSlot?.date || b.slot?.date} • {b.assignedSlot?.timeWindow || b.slot?.window}</span>
                      </div>

                      {b.assignedSlot?.notes && (
                        <p className="text-[10px] text-[#E9A23B] line-clamp-1 italic font-mono">
                          Note: {b.assignedSlot.notes}
                        </p>
                      )}
                    </div>

                    {/* OTP & Photo Indicators (Urban Company Quality Gates) */}
                    <div className="pt-3 border-t border-[#E2D9C8] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      {/* OTP Verification Pill */}
                      {b.otpVerified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <LuCircleCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>OTP Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <LuTriangleAlert className="w-3.5 h-3.5 text-amber-600" />
                          <span>Verify OTP on Site</span>
                        </span>
                      )}

                      {/* Photo Counts */}
                      <span className="text-[#6B8077] text-[10px] font-mono flex items-center gap-1">
                        <LuCamera className="w-3 h-3 text-[#10231D]" />
                        <span>{beforeCount} Before / {afterCount} After</span>
                      </span>
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenBooking(b)}
                    className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Inspect & Manage Visit</span>
                    <LuChevronRight className="w-4 h-4 text-[#E9A23B]" />
                  </button>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>

      {/* DETAIL & OPERATIONS MODAL (URBAN COMPANY / PRONTO STYLE) */}
      {selectedBooking && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Service Visit: ${selectedBooking.bookingCode}`}
          subtitle={`${selectedBooking.customer?.name} • ${selectedBooking.cityName}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-[#E2D9C8] pb-2 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveModalTab('otp')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'otp'
                    ? 'bg-[#10231D] text-[#E9A23B]'
                    : 'text-[#6B8077] hover:bg-[#ECE5D8]'
                }`}
              >
                <LuShieldCheck className="w-3.5 h-3.5" />
                <span>OTP Verification</span>
                {selectedBooking.otpVerified && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('before_photos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'before_photos'
                    ? 'bg-[#10231D] text-[#E9A23B]'
                    : 'text-[#6B8077] hover:bg-[#ECE5D8]'
                }`}
              >
                <LuCamera className="w-3.5 h-3.5" />
                <span>Before Photos ({selectedBooking.photos?.before?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('after_photos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'after_photos'
                    ? 'bg-[#10231D] text-[#E9A23B]'
                    : 'text-[#6B8077] hover:bg-[#ECE5D8]'
                }`}
              >
                <LuSparkles className="w-3.5 h-3.5" />
                <span>After Photos ({selectedBooking.photos?.after?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('details')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'details'
                    ? 'bg-[#10231D] text-[#E9A23B]'
                    : 'text-[#6B8077] hover:bg-[#ECE5D8]'
                }`}
              >
                <LuCalendar className="w-3.5 h-3.5" />
                <span>Job Details</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('chat')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'chat'
                    ? 'bg-[#10231D] text-[#E9A23B]'
                    : 'text-[#6B8077] hover:bg-[#ECE5D8]'
                }`}
              >
                <LuMessageSquare className="w-3.5 h-3.5" />
                <span>Messages ({selectedBooking.messages?.length || 0})</span>
              </button>
            </div>

            {/* TAB 1: OTP VERIFICATION ON VISIT */}
            {activeModalTab === 'otp' && (
              <div className="space-y-4">
                {selectedBooking.otpVerified ? (
                  <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
                      <LuCheck className="w-6 h-6 stroke-[3]" />
                    </div>
                    <h4 className="font-display font-bold text-lg text-emerald-950">
                      Customer Service OTP Verified!
                    </h4>
                    <p className="text-xs text-emerald-800 max-w-md mx-auto">
                      This service visit has been authenticated on-site with the customer’s security code.
                    </p>
                    {selectedBooking.otpVerifiedAt && (
                      <p className="text-[11px] font-mono text-emerald-700">
                        Verified at: {new Date(selectedBooking.otpVerifiedAt).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] space-y-4">
                    <div className="text-center max-w-md mx-auto">
                      <div className="w-10 h-10 rounded-full bg-[#10231D] text-[#E9A23B] flex items-center justify-center mx-auto mb-2 shadow-xs">
                        <LuShieldCheck className="w-5 h-5" />
                      </div>
                      <h4 className="font-display font-black text-lg text-[#10231D]">
                        Enter Customer Verification OTP
                      </h4>
                      <p className="text-xs text-[#6B8077] mt-1">
                        Ask the customer for the 4-digit Service OTP shown on their booking confirmation or mobile dashboard upon arrival.
                      </p>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="max-w-xs mx-auto space-y-3">
                      <div>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="● ● ● ●"
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                          className="w-full text-center tracking-[0.5em] text-2xl font-mono font-black p-3 rounded-xl bg-white border-2 border-[#10231D] text-[#10231D] focus:outline-none focus:border-[#E9A23B]"
                          autoFocus
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={verifyingOtp || !otpInput.trim()}
                        className="w-full py-3 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#10231D] font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md"
                      >
                        {verifyingOtp ? 'Verifying with System...' : 'Verify OTP & Authorize Visit'}
                      </button>
                    </form>

                    <p className="text-center text-[11px] text-[#6B8077]">
                      Enterprise Policy: Cleaning crews cannot complete jobs without customer verification code.
                    </p>
                  </div>
                )}

                {/* Quick Status Advancement */}
                <div className="p-4 rounded-xl bg-white border border-[#E2D9C8] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-xs text-[#10231D]">Update Service Visit Status</h5>
                    <p className="text-[11px] text-[#6B8077]">
                      Current: <span className="font-bold uppercase text-[#E9A23B]">{selectedBooking.status}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('in_progress')}
                      disabled={updatingStatus || selectedBooking.status === 'in_progress'}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-40 transition-colors"
                    >
                      Mark In-Progress
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('completed')}
                      disabled={updatingStatus || selectedBooking.status === 'completed'}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-40 transition-colors"
                    >
                      Mark Completed
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BEFORE SERVICE PHOTOS */}
            {activeModalTab === 'before_photos' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8]">
                  <div>
                    <h4 className="font-bold text-xs text-[#10231D]">Pre-Cleaning Inspection Proof</h4>
                    <p className="text-[10px] text-[#6B8077]">
                      Take photos of dusty/dirty areas before starting work.
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10231D] text-[#E9A23B] text-xs font-bold hover:bg-[#3D524A] transition-colors cursor-pointer shadow-xs shrink-0">
                    <LuUpload className="w-3.5 h-3.5" />
                    <span>{uploadingPhoto ? 'Uploading...' : 'Add Before Photo'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handlePhotoUpload(e, 'before')}
                      disabled={uploadingPhoto}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Photo Gallery Grid */}
                {selectedBooking.photos?.before?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedBooking.photos.before.map((p, idx) => (
                      <div
                        key={p._id || idx}
                        className="relative group rounded-xl overflow-hidden border border-[#E2D9C8] bg-black aspect-square cursor-pointer"
                        onClick={() => setLightboxImage(p.url)}
                      >
                        <img
                          src={p.url}
                          alt={`Before service photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePhoto(p._id);
                            }}
                            className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700"
                            title="Delete photo"
                          >
                            <LuTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-white">
                          {new Date(p.uploadedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center rounded-2xl bg-white border border-dashed border-[#E2D9C8]">
                    <LuCamera className="w-8 h-8 text-[#6B8077] mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold text-[#10231D]">No Before Photos Added Yet</p>
                    <p className="text-[11px] text-[#6B8077] mt-0.5">
                      Upload high quality proof of initial condition before starting work.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: AFTER SERVICE PHOTOS */}
            {activeModalTab === 'after_photos' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8]">
                  <div>
                    <h4 className="font-bold text-xs text-[#10231D]">Post-Cleaning Work Proof</h4>
                    <p className="text-[10px] text-[#6B8077]">
                      Capture shiny, cleaned surfaces and spotless detailing after completion.
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 transition-colors cursor-pointer shadow-xs shrink-0">
                    <LuSparkles className="w-3.5 h-3.5 text-[#E9A23B]" />
                    <span>{uploadingPhoto ? 'Uploading...' : 'Add After Photo'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handlePhotoUpload(e, 'after')}
                      disabled={uploadingPhoto}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Photo Gallery Grid */}
                {selectedBooking.photos?.after?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedBooking.photos.after.map((p, idx) => (
                      <div
                        key={p._id || idx}
                        className="relative group rounded-xl overflow-hidden border border-[#E2D9C8] bg-black aspect-square cursor-pointer"
                        onClick={() => setLightboxImage(p.url)}
                      >
                        <img
                          src={p.url}
                          alt={`After service photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePhoto(p._id);
                            }}
                            className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700"
                            title="Delete photo"
                          >
                            <LuTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-white">
                          {new Date(p.uploadedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center rounded-2xl bg-white border border-dashed border-[#E2D9C8]">
                    <LuSparkles className="w-8 h-8 text-[#6B8077] mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold text-[#10231D]">No After Photos Added Yet</p>
                    <p className="text-[11px] text-[#6B8077] mt-0.5">
                      Snap finished work photos to guarantee quality standards.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: JOB DETAILS & LOCATION */}
            {activeModalTab === 'details' && (
              <div className="space-y-4 text-xs">
                {/* Customer & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-white border border-[#E2D9C8] space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#6B8077] font-bold">Customer Contact</span>
                    <p className="font-bold text-sm text-[#10231D]">{selectedBooking.customer?.name}</p>
                    <div className="pt-1 flex items-center gap-3">
                      <a
                        href={`tel:${selectedBooking.customer?.phone}`}
                        className="text-[#E9A23B] font-bold flex items-center gap-1 hover:underline"
                      >
                        <LuPhone className="w-3.5 h-3.5" />
                        <span>{selectedBooking.customer?.phone}</span>
                      </a>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#E2D9C8] space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#6B8077] font-bold">Address & Navigation</span>
                    <p className="font-semibold text-[#10231D] leading-tight">
                      {selectedBooking.address?.line1}
                    </p>
                    <p className="text-[11px] text-[#6B8077]">
                      {selectedBooking.cityName} ({selectedBooking.address?.pincode})
                    </p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${selectedBooking.address?.line1}, ${selectedBooking.cityName}, ${selectedBooking.address?.pincode}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#10231D] bg-[#ECE5D8] px-2.5 py-1 rounded-lg hover:bg-[#E2D9C8]"
                    >
                      <LuExternalLink className="w-3 h-3 text-[#E9A23B]" />
                      <span>Open in Google Maps</span>
                    </a>
                  </div>
                </div>

                {/* Items Booked */}
                <div className="p-3.5 rounded-xl bg-white border border-[#E2D9C8]">
                  <span className="text-[10px] font-mono uppercase text-[#6B8077] font-bold block mb-2">
                    Service Items Breakdown
                  </span>
                  <div className="space-y-2">
                    {(selectedBooking.items || []).map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between pb-1.5 border-b border-[#E2D9C8]/40 last:border-0 last:pb-0">
                        <div>
                          <p className="font-bold text-[#10231D]">{it.titleSnapshot}</p>
                          <p className="text-[11px] text-[#6B8077]">Variant: {it.variantSnapshot || 'Standard'}</p>
                        </div>
                        <span className="font-mono font-bold text-[#10231D]">Qty: {it.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scheduled Slot & Payment */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white border border-[#E2D9C8]">
                    <span className="text-[10px] font-mono uppercase text-[#6B8077] block">Scheduled Slot</span>
                    <p className="font-bold text-[#10231D]">{selectedBooking.assignedSlot?.date || selectedBooking.slot?.date}</p>
                    <p className="text-[11px] text-[#6B8077]">{selectedBooking.assignedSlot?.timeWindow || selectedBooking.slot?.window}</p>
                    {selectedBooking.assignedSlot?.notes && (
                      <p className="text-[10px] text-[#E9A23B] mt-1 font-mono italic">
                        Dispatch: {selectedBooking.assignedSlot.notes}
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#E2D9C8]">
                    <span className="text-[10px] font-mono uppercase text-[#6B8077] block">Payment Info</span>
                    <p className="font-bold text-[#10231D]">
                      ₹{(selectedBooking.totals?.total || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[11px] font-bold uppercase text-[#E9A23B]">
                      {selectedBooking.paymentMode?.replace('_', ' ')} • {selectedBooking.paymentStatus}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: MESSAGES / FIELD CHAT */}
            {activeModalTab === 'chat' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-white border border-[#E2D9C8] h-64 overflow-y-auto space-y-2.5">
                  {(selectedBooking.messages || []).length > 0 ? (
                    selectedBooking.messages.map((m, idx) => {
                      const isMe = m.sender === 'supervisor';
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`p-2.5 rounded-xl max-w-[85%] text-xs ${
                              isMe
                                ? 'bg-[#10231D] text-[#F4EFE6]'
                                : 'bg-[#ECE5D8] text-[#10231D]'
                            }`}
                          >
                            <p className="text-[9px] font-bold opacity-75 mb-0.5">
                              {m.senderName || m.sender} • {new Date(m.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="leading-relaxed">{m.text}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-[#6B8077]">
                      No messages in this job thread yet.
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type an update or note to customer/admin..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-white border border-[#E2D9C8] text-xs text-[#10231D] focus:outline-none focus:border-[#E9A23B]"
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !chatMessage.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] text-xs font-bold disabled:opacity-50 transition-colors flex items-center gap-1.5"
                  >
                    <LuSend className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <LuX className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Inspection high resolution preview"
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
          />
        </div>
      )}
    </div>
  );
}
