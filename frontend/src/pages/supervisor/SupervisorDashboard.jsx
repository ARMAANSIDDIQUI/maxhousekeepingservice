import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
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
  LuUser,
  LuZap,
  LuNavigation,
  LuKey,
  LuLock,
  LuSlidersHorizontal,
  LuCompass,
  LuRadio
} from 'react-icons/lu';
import { FaWhatsapp } from 'react-icons/fa6';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supervisorAPI } from '../../api';
import SEO from '../../components/common/SEO';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import LiveTrackingRadar from '../../components/common/LiveTrackingRadar';
import UserAvatar from '../../components/common/UserAvatar';
import { formatDateDMY } from '../../utils/date';
import { calculateDistanceKm, getEtaInfo } from '../../utils/geoUtils';

function formatToday() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentSlotWindow(dateObj = new Date()) {
  const h = dateObj.getHours();
  if (h >= 8 && h < 10) return '08:00 AM - 10:00 AM';
  if (h >= 10 && h < 12) return '10:00 AM - 12:00 PM';
  if (h >= 12 && h < 14) return '12:00 PM - 02:00 PM';
  if (h >= 14 && h < 16) return '02:00 PM - 04:00 PM';
  if (h >= 16 && h < 18) return '04:00 PM - 06:00 PM';
  if (h >= 18 && h < 20) return '06:00 PM - 08:00 PM';
  return null;
}

function getWhatsAppUrl(phone, customerName, bookingCode, serviceTitle) {
  const cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
  const target = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const msg = encodeURIComponent(`Hello ${customerName || 'Sir/Ma\'am'}! I am your Max Housekeeping field supervisor on my way to your location for service #${bookingCode || ''} (${serviceTitle || 'Cleaning Service'}). Please keep your 4-digit Service OTP ready for on-site verification.`);
  return `https://wa.me/${target}?text=${msg}`;
}

function getMapsUrl(address, cityName) {
  if (address?.coordinates && typeof address.coordinates.lat === 'number' && typeof address.coordinates.lng === 'number') {
    return `https://www.google.com/maps/dir/?api=1&destination=${address.coordinates.lat},${address.coordinates.lng}`;
  }
  const query = `${address?.houseOrFlat ? address.houseOrFlat + ', ' : ''}${address?.line1 || ''} ${address?.line2 || ''} ${cityName || ''} ${address?.pincode || ''}`.trim();
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query || 'Moradabad')}`;
}



export default function SupervisorDashboard() {
  const { user, isSupervisor, isAdmin, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Admins are not supervisors - redirect admins to Admin Panel
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const [stats, setStats] = useState({
    totalAssigned: 0,
    todayBookings: 0,
    inProgress: 0,
    completed: 0,
    pendingOtp: 0,
    openPoolCount: 0
  });

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'today' | 'pending_otp' | 'in_progress' | 'completed' | 'pool'
  const [searchTerm, setSearchTerm] = useState('');

  // Real-Time Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Supervisor Shift Duty Status
  const [dutyStatus, setDutyStatus] = useState(() => {
    return localStorage.getItem('max_supervisor_duty') || 'active';
  });

  const handleDutyStatusChange = (status) => {
    setDutyStatus(status);
    localStorage.setItem('max_supervisor_duty', status);
    toast.success(`Duty status: ${status === 'active' ? 'Active on Duty' : status === 'onsite' ? 'On Site Inspection' : status === 'break' ? 'On Break' : 'Off Duty'}`);
  };

  // Helper to verify if a booking is assigned to the currently logged in user
  const isAssignedToMe = (b) => {
    if (!b || !user) return false;
    const currentUserId = String(user._id || user.id || '').trim();
    if (!currentUserId) return false;
    const supId = b.supervisor ? String(b.supervisor._id || b.supervisor).trim() : '';
    const assignedId = b.assignedSupervisor?.id ? String(b.assignedSupervisor.id._id || b.assignedSupervisor.id).trim() : '';
    return supId === currentUserId || assignedId === currentUserId;
  };

  // Unassigned Open Dispatches Pool
  const [poolBookings, setPoolBookings] = useState([]);
  const [loadingPool, setLoadingPool] = useState(false);
  const [claimingId, setClaimingId] = useState(null);



  // Quick Inline OTP Verification Modal
  const [quickOtpBooking, setQuickOtpBooking] = useState(null);
  const [quickOtpInput, setQuickOtpInput] = useState('');
  const [verifyingQuickOtp, setVerifyingQuickOtp] = useState(false);



  // Selected Booking Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('otp'); // 'otp' | 'before_photos' | 'after_photos' | 'details' | 'live_radar'

  // Live GPS Broadcast State for assigned field supervisors
  const [sharingBookingId, setSharingBookingId] = useState(null);
  const [sharingClosedPrompt, setSharingClosedPrompt] = useState(null);
  const [lastGpsCoords, setLastGpsCoords] = useState(null);
  const [deviceGpsCoords, setDeviceGpsCoords] = useState(null);
  const locationWatchIdRef = useRef(null);
  const lastSentGpsRef = useRef(null);
  const heartbeatTimerRef = useRef(null);

  // Background device location fix for zero-cost distance calculation (Requires high accuracy)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Reject wild cellular IP gateway readings (e.g. Meerut 200km away)
          if (pos.coords.accuracy <= 5000) {
            setDeviceGpsCoords({
              lat: Number(pos.coords.latitude.toFixed(6)),
              lng: Number(pos.coords.longitude.toFixed(6))
            });
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
  }, []);

  const effectiveSupervisorCoords = lastGpsCoords || deviceGpsCoords;

  const getBookingDistanceEta = (bookingItem) => {
    if (!effectiveSupervisorCoords || !bookingItem?.address?.coordinates?.lat) return null;
    const dist = calculateDistanceKm(
      effectiveSupervisorCoords.lat,
      effectiveSupervisorCoords.lng,
      bookingItem.address.coordinates.lat,
      bookingItem.address.coordinates.lng
    );
    return getEtaInfo(dist);
  };

  // Auto-broadcast supervisor GPS telemetry indefinitely without prompting
  const startBroadcastingGps = (booking = null) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    if (booking && (booking.status === 'completed' || booking.status === 'cancelled')) {
      return;
    }

    if (booking?._id) {
      setSharingBookingId(booking._id);
    }

    const onPosSuccess = (pos) => {
      const lat = Number(pos.coords.latitude.toFixed(6));
      const lng = Number(pos.coords.longitude.toFixed(6));
      const heading = pos.coords.heading || 0;
      const speed = pos.coords.speed || 0;
      const accuracy = pos.coords.accuracy || 10;
      const now = Date.now();

      // Reject inaccurate cellular ISP / cell tower fallback readings (e.g. Meerut gateway 200km away)
      if (accuracy > 5000) {
        console.warn(`[Supervisor GPS] Skipping inaccurate ISP / cell tower reading (${accuracy}m). High-accuracy GPS fix required.`);
        return;
      }

      const coords = { lat, lng, heading, speed, accuracy, updatedAt: new Date() };
      setLastGpsCoords(coords);
      setDeviceGpsCoords({ lat, lng });

      try {
        localStorage.setItem('max_supervisor_last_coords', JSON.stringify({ lat, lng, time: now }));
      } catch {}

      const last = lastSentGpsRef.current;
      const timeDiff = last ? now - last.time : 999999;
      let movedDistanceM = 0;
      if (last) {
        const dLat = (lat - last.lat) * 111000;
        const dLng = (lng - last.lng) * 111000 * Math.cos((lat * Math.PI) / 180);
        movedDistanceM = Math.sqrt(dLat * dLat + dLng * dLng);
      }

      // Fast, constant GPS sync: Send if first fix OR >3 seconds elapsed OR moved >3 meters
      if (!last || timeDiff >= 3000 || movedDistanceM >= 3) {
        lastSentGpsRef.current = { lat, lng, time: now };

        // 1. Send server-side broadcast command to persist location across all active bookings & supervisor profile
        supervisorAPI.broadcastLiveLocation({
          lat,
          lng,
          heading,
          speed,
          accuracy
        }).catch((err) => {
          console.warn('[Supervisor GPS broadcast notice]:', err.message);
        });

        // 2. If specific booking selected, update booking endpoint as well
        const targetBookingId = booking?._id || sharingBookingId;
        if (targetBookingId) {
          supervisorAPI.updateLiveLocation(targetBookingId, {
            lat,
            lng,
            heading,
            speed,
            accuracy,
            isSharing: true
          }).catch(() => {});
        }
      }
    };

    const onPosError = (err) => {
      console.warn('[Supervisor GPS auto-broadcast notice]:', err.message);
    };

    // Immediate fix with high accuracy
    navigator.geolocation.getCurrentPosition(onPosSuccess, onPosError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });

    // Start continuous watch if not already running
    if (locationWatchIdRef.current === null) {
      locationWatchIdRef.current = navigator.geolocation.watchPosition(onPosSuccess, onPosError, {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 15000
      });
    }

    // Active continuous heartbeat every 4 seconds to guarantee constant GPS broadcast even when stationary
    if (heartbeatTimerRef.current === null) {
      heartbeatTimerRef.current = setInterval(() => {
        if (!document.hidden && typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(onPosSuccess, onPosError, {
            enableHighAccuracy: true,
            maximumAge: 3000,
            timeout: 8000
          });
        }
      }, 4000);
    }
  };

  // Auto-start GPS broadcasting on load without asking supervisor
  useEffect(() => {
    if (!isSupervisor || typeof navigator === 'undefined' || !navigator.geolocation) return;

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted' || result.state === 'prompt') {
          startBroadcastingGps();
        }
        result.onchange = () => {
          if (result.state === 'granted') {
            startBroadcastingGps();
          }
        };
      }).catch(() => {
        startBroadcastingGps();
      });
    } else {
      startBroadcastingGps();
    }
  }, [isSupervisor]);

  // When active bookings load, ensure tracking is bound to active booking
  useEffect(() => {
    if (!bookings || bookings.length === 0) return;
    const activeBooking = bookings.find(b => isAssignedToMe(b) && !['completed', 'cancelled'].includes(b.status));
    if (activeBooking) {
      startBroadcastingGps(activeBooking);
    }
  }, [bookings]);

  const stopBroadcastingGps = (bookingId, notify = true, reason = 'manually') => {
    // Only if completed do we formally close watch
    if (reason === 'completed') {
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
      setSharingBookingId(null);
    }
    // Location sharing logic persists indefinitely on server for all active visits!
  };

  // Cleanup on unmount: DO NOT send isSharing: false so location sharing logic persists even after closing supervisor panel
  useEffect(() => {
    return () => {
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
      // Never send isSharing: false on unmount so location sharing logic persists even after closing supervisor panel
    };
  }, []);

  // OTP Verification state
  const [otpInput, setOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Photo Upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoNotes, setPhotoNotes] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);

  // Action Confirmation Modal State (replaces native window.confirm)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmVariant: 'primary',
    onConfirm: null
  });

  // Status update state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  // Daily Time Slot Allotment Run-Sheet & Schedule State
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'timeline'
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

  // Fetch Pool Bookings
  const loadPool = async () => {
    setLoadingPool(true);
    try {
      const res = await supervisorAPI.getPool();
      if (res?.success) {
        setPoolBookings(res.bookings || []);
      }
    } catch (err) {
      console.warn('Failed to load pool:', err);
    } finally {
      setLoadingPool(false);
    }
  };

  // Claim Booking from Open Pool
  const handleClaimBooking = async (bookingId) => {
    setClaimingId(bookingId);
    try {
      const res = await supervisorAPI.claimBooking(bookingId);
      if (res?.success) {
        toast.success(res.message || 'Booking claimed and added to your schedule!');
        await Promise.all([loadData(), loadPool()]);
        setActiveFilter('all');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to claim booking.');
    } finally {
      setClaimingId(null);
    }
  };



  // Quick OTP Modal Verification Submit
  const handleQuickOtpSubmit = async (e) => {
    e?.preventDefault();
    if (!quickOtpBooking || !quickOtpInput.trim()) {
      toast.error('Please enter the 4-digit verification code.');
      return;
    }
    if (!isAssignedToMe(quickOtpBooking)) {
      toast.error('Access restricted: Only the assigned supervisor can verify this customer visit OTP.');
      return;
    }
    setVerifyingQuickOtp(true);
    try {
      const res = await supervisorAPI.verifyOtp(quickOtpBooking._id, quickOtpInput.trim());
      if (res?.success) {
        toast.success(`OTP Verified! Booking #${quickOtpBooking.bookingCode} is now In-Progress.`);
        setQuickOtpBooking(null);
        setQuickOtpInput('');
        await loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Invalid verification OTP.');
    } finally {
      setVerifyingQuickOtp(false);
    }
  };

  // Direct Photo Upload Trigger from Run-Sheet
  const handleDirectPhotoUpload = async (e, bookingId, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.info(`Uploading ${type === 'before' ? 'Before' : 'After'} photo to Cloudinary...`);
      const res = await supervisorAPI.uploadPhoto(bookingId, file, type, 'Quick camera upload from field console');
      if (res?.success) {
        toast.success(`${type === 'before' ? 'Before' : 'After'} photo saved!`);
        await loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo.');
    } finally {
      e.target.value = '';
    }
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
      if (activeFilter === 'pool') {
        loadPool();
      }
    } catch (err) {
      console.error('[Supervisor Dashboard Fetch Error]:', err);
      toast.error('Failed to load supervisor assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupervisor) {
      navigate('/login');
      return;
    }
    loadData();
  }, [activeFilter, isSupervisor]);

  useEffect(() => {
    if (isSupervisor) {
      loadSchedule(scheduleDate);
    }
  }, [scheduleDate, isSupervisor]);

  // Open modal and sync latest details
  const handleOpenBooking = async (b, initialTab) => {
    setSelectedBooking(b);
    setOtpInput('');
    setPhotoNotes('');
    setActiveModalTab(initialTab || (b.otpVerified ? 'before_photos' : 'otp'));
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
    if (!isAssignedToMe(selectedBooking)) {
      toast.error('Access restricted: Only the assigned supervisor can verify this customer visit OTP.');
      return;
    }
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
    if (!isAssignedToMe(selectedBooking)) {
      toast.error('Access restricted: Only the assigned supervisor can upload inspection photos.');
      if (e?.target) e.target.value = '';
      return;
    }
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
    const fileType = file.type || '';
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(fileType)) {
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
  const handleDeletePhoto = (photoId) => {
    if (!isAssignedToMe(selectedBooking)) {
      toast.error('Access restricted: Only the assigned supervisor can delete inspection photos.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Delete Inspection Photo',
      message: 'Are you sure you want to permanently delete this inspection photo?',
      confirmText: 'Delete Photo',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
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
        } catch {
          toast.error('Failed to remove photo.');
        }
      }
    });
  };

  // 4. Update Status (In Progress or Completed)
  const executeUpdateStatus = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await supervisorAPI.updateStatus(selectedBooking._id, newStatus, statusNote);
      if (res?.success && res.booking) {
        toast.success(`Booking status marked as ${newStatus.replace('_', ' ').toUpperCase()}`);
        // As soon as booking is marked completed, automatically stop live location sharing
        if (newStatus === 'completed' && sharingBookingId === selectedBooking._id) {
          stopBroadcastingGps(selectedBooking._id, true, 'completed');
        }
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

  const handleUpdateStatus = (newStatus) => {
    if (!isAssignedToMe(selectedBooking)) {
      toast.error('Access restricted: Only the assigned supervisor can update this booking status.');
      return;
    }
    if (newStatus === 'completed' && !selectedBooking.otpVerified) {
      toast.error('Work cannot be marked completed until customer arrival OTP is verified!');
      setActiveModalTab('otp');
      return;
    }
    executeUpdateStatus(newStatus);
  };

  // 4b. One-Click Complete Service (Work Done Automation)
  const [completingId, setCompletingId] = useState(null);

  const executeMarkCompleted = async (b) => {
    if (!isAssignedToMe(b)) {
      toast.error('Access restricted: Only the assigned supervisor can complete this service visit.');
      return;
    }
    if (!b.otpVerified) {
      toast.error('Cannot mark service as completed: Customer arrival OTP must be verified first.');
      setQuickOtpBooking(b);
      setQuickOtpInput('');
      return;
    }
    setCompletingId(b._id);
    try {
      const res = await supervisorAPI.updateStatus(b._id, 'completed', `Service marked as completed by supervisor ${user?.name || ''}`);
      if (res?.success) {
        toast.success(`Booking #${b.bookingCode} marked as COMPLETED!`);
        // As soon as booking is marked completed, automatically stop live location sharing
        if (sharingBookingId === b._id) {
          stopBroadcastingGps(b._id, true, 'completed');
        }
        if (selectedBooking && selectedBooking._id === b._id) {
          setSelectedBooking(res.booking || { ...selectedBooking, status: 'completed' });
        }
        await loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to complete booking.');
    } finally {
      setCompletingId(null);
    }
  };

  const handleMarkCompleted = (b) => {
    if (!b) return;
    if (!b.otpVerified) {
      toast.error(`Cannot complete job: Customer arrival OTP for #${b.bookingCode} must be verified first!`);
      setQuickOtpBooking(b);
      setQuickOtpInput('');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Service Completion',
      message: `Confirm service completion for #${b.bookingCode}? This will mark the booking as Completed and finalize the visit.`,
      confirmText: 'Complete Job',
      confirmVariant: 'primary',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        executeMarkCompleted(b);
      }
    });
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
      <div className="bg-[#10231D] text-[#F4EFE6] border-b border-[#2C4A3E] px-4 py-3 sm:px-8">
        <div className="container mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <UserAvatar
              user={user}
              avatarUrl={user?.avatarUrl || user?.avatar}
              name={user?.name}
              size="lg"
              className="border-2 border-[#E9A23B] shadow-md shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-[#E9A23B]/20 text-[#E9A23B] px-2 py-0.5 rounded-full border border-[#E9A23B]/30 font-bold">
                  FIELD OPERATIONS CONSOLE
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {formatDateDMY(currentTime)} • {currentTime.toLocaleTimeString('en-IN')}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-display font-black text-[#F4EFE6] mt-0.5">
                Supervisor Portal • {user?.name || 'Operations Lead'}
              </h1>
            </div>
          </div>

          {/* Quick Actions & Profile */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Duty Status Selector */}
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/20">
              {[
                { id: 'active', label: 'On Duty', color: 'bg-emerald-500' },
                { id: 'onsite', label: 'On Site', color: 'bg-amber-500' },
                { id: 'break', label: 'Break', color: 'bg-blue-500' },
                { id: 'off', label: 'Off Duty', color: 'bg-stone-500' }
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleDutyStatusChange(st.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    dutyStatus === st.id
                      ? 'bg-white text-[#10231D] shadow-xs'
                      : 'text-[#F4EFE6]/70 hover:text-white'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${st.color}`} />
                  <span className="hidden sm:inline">{st.label}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => loadData()}
              disabled={loading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#F4EFE6] transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Refresh Assignments"
            >
              <LuRotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 text-xs font-bold transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LuLogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-8 mt-6 max-w-7xl">
        {/* Real-Time Live Slot & Shift Dispatch Command Banner */}
        {(() => {
          const liveSlot = getCurrentSlotWindow(currentTime);
          const isToday = scheduleDate === formatToday();
          const liveSlotData = scheduleData?.schedule?.find(s => s.timeWindow === liveSlot);
          const activeBooking = liveSlotData?.bookings?.find(b => isAssignedToMe(b));

          return (
            <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#10231D] via-[#162D25] to-[#1C3A30] text-[#F4EFE6] border border-[#2C4A3E] shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#E9A23B] text-[#10231D] flex items-center justify-center font-black shrink-0 shadow-md">
                    <LuClock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                        LIVE SHIFT · {currentTime.toLocaleTimeString('en-IN')}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E9A23B]/20 text-[#E9A23B] border border-[#E9A23B]/30 text-[10px] font-mono font-bold">
                        ACTIVE WINDOW: {liveSlot || 'After Hours / Standby'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        DUTY: {dutyStatus.toUpperCase()}
                      </span>
                    </div>

                    {activeBooking ? (
                      <div>
                        <h3 className="font-display font-bold text-base sm:text-lg text-[#F4EFE6] flex items-center gap-2">
                          <span>Active Job: #{activeBooking.bookingCode}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            activeBooking.otpVerified ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {activeBooking.otpVerified ? 'OTP Verified · In-Progress' : 'Arrival OTP Pending'}
                          </span>
                        </h3>
                        <p className="text-xs text-[#A3B8B0] mt-0.5">
                          {activeBooking.customer?.name} ({activeBooking.customer?.phone}) · {activeBooking.address?.line1}, {activeBooking.cityName}
                        </p>
                        {(() => {
                          const eta = getBookingDistanceEta(activeBooking);
                          if (!eta) return null;
                          return (
                            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-black/40 border border-[#E9A23B]/40 text-[#F4EFE6] text-xs font-bold shadow-xs">
                              <span className="w-2 h-2 rounded-full bg-[#E9A23B] animate-ping" />
                              <span className="text-[#E9A23B] uppercase tracking-wide">{eta.distanceText}</span>
                              <span className="text-[#A3B8B0]">·</span>
                              <span className="text-emerald-300 font-mono">{eta.etaText} drive</span>
                              <span className="text-[11px] text-[#A3B8B0]">({eta.statusText})</span>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-display font-bold text-sm sm:text-base text-[#F4EFE6]">
                          {liveSlot ? `Current Slot (${liveSlot}) Is Open & Free` : 'Shift Concluded / Standby'}
                        </h3>
                        <p className="text-xs text-[#A3B8B0] mt-0.5">
                          {isToday
                            ? 'Ready for urgent calls or claim available unassigned jobs from the dispatch pool.'
                            : `Inspecting schedule for ${formatDateDMY(scheduleDate)}. Switch to "Today" for live routing.`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions in Live Banner */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {activeBooking ? (
                    <>
                      {activeBooking.customer?.phone && (
                        <a
                          href={`tel:${activeBooking.customer.phone}`}
                          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#F4EFE6] text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <LuPhone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Call</span>
                        </a>
                      )}
                      {activeBooking.customer?.phone && (
                        <a
                          href={getWhatsAppUrl(activeBooking.customer.phone, activeBooking.customer?.name, activeBooking.bookingCode, activeBooking.serviceTitle)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                        >
                          <FaWhatsapp className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                      <a
                        href={getMapsUrl(activeBooking.address, activeBooking.cityName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                      >
                        <LuNavigation className="w-3.5 h-3.5" />
                        <span>Directions</span>
                      </a>
                      {isAssignedToMe(activeBooking) && activeBooking.status !== 'completed' && (
                        <div className="px-3 py-2 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-2 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Live GPS Sharing Active</span>
                        </div>
                      )}
                      {!activeBooking.otpVerified && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuickOtpBooking(activeBooking);
                            setQuickOtpInput('');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#10231D] text-xs font-black transition-all flex items-center gap-1 shadow-md cursor-pointer animate-pulse"
                        >
                          <LuKey className="w-3.5 h-3.5" />
                          <span>Enter Customer OTP</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenBooking(activeBooking)}
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#F4EFE6] text-xs font-bold transition-all cursor-pointer"
                      >
                        Manage
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilter('pool');
                          loadPool();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#10231D] text-xs font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <LuZap className="w-3.5 h-3.5" />
                        <span>Dispatch Pool ({stats.openPoolCount || 0})</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

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
              { id: 'completed', label: 'Completed' },
              { id: 'pool', label: `Dispatch Pool (${stats.openPoolCount || 0})` }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveFilter(tab.id);
                  if (tab.id === 'pool') loadPool();
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

        {/* VIEW 0: UNASSIGNED DISPATCH POOL */}
        {activeFilter === 'pool' && (
          <div className="space-y-4 mb-8">
            <div className="p-5 rounded-2xl bg-[#10231D] text-[#F4EFE6] border border-[#2C4A3E] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E9A23B] text-[#10231D] text-[10px] font-mono font-black uppercase inline-flex items-center gap-1">
                    <LuZap className="w-3 h-3 text-[#10231D]" />
                    <span>Live Dispatch Pool</span>
                  </span>
                  <span className="text-xs text-[#E9A23B] font-bold">
                    {poolBookings.length} Unclaimed Cleaning Appointment{poolBookings.length === 1 ? '' : 's'}
                  </span>
                </div>
                <h3 className="font-display font-black text-lg text-[#F4EFE6]">
                  Real-Time Open Dispatches
                </h3>
                <p className="text-xs text-[#F4EFE6]/70 max-w-xl">
                  These verified customer appointments require an on-site field supervisor. Claiming an appointment automatically assigns it to your daily run-sheet and unlocks customer OTP authentication.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={loadPool}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#F4EFE6] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LuRotateCcw className="w-3.5 h-3.5 text-[#E9A23B]" />
                  <span>Refresh Pool</span>
                </button>
              </div>
            </div>

            {loadingPool ? (
              <div className="py-20 text-center font-mono text-xs text-[#6B8077] bg-[#ECE5D8] rounded-3xl border border-[#E2D9C8]">
                <div className="w-8 h-8 rounded-full border-2 border-[#E9A23B] border-t-transparent animate-spin mx-auto mb-3" />
                SCANNING ACTIVE UNASSIGNED DISPATCH POOL...
              </div>
            ) : poolBookings.length === 0 ? (
              <div className="py-20 text-center bg-[#ECE5D8] rounded-3xl border border-[#E2D9C8] p-6 space-y-3">
                <LuZap className="w-12 h-12 text-[#E9A23B] mx-auto opacity-70" />
                <h3 className="font-display font-bold text-lg text-[#10231D]">Dispatch Pool is Clear</h3>
                <p className="text-xs text-[#6B8077] max-w-md mx-auto">
                  All verified customer appointments are currently assigned to active supervisors or completed. New customer appointments will automatically appear here for real-time dispatch.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {poolBookings.map((b) => (
                  <div
                    key={b._id}
                    className="p-5 rounded-2xl bg-white border border-[#E2D9C8] hover:border-[#E9A23B] transition-all flex flex-col justify-between shadow-xs hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-black text-[#10231D]">
                          #{b.bookingCode}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono text-[9px] font-black uppercase">
                          UNASSIGNED
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-[#10231D] mb-2">
                        {b.serviceTitle || 'Deep Cleaning Service'}
                      </h4>

                      <div className="space-y-1.5 text-xs text-[#6B8077] mb-3">
                        <div className="flex items-center gap-1.5 text-[#10231D] font-medium">
                          <span>{b.customer?.name}</span>
                          {b.customer?.phone && (
                            <span className="font-mono text-[11px] text-[#6B8077]">({b.customer.phone})</span>
                          )}
                        </div>
                        <div className="flex items-start gap-1.5">
                          <LuMapPin className="w-3.5 h-3.5 text-[#E9A23B] shrink-0 mt-0.5" />
                          <span className="line-clamp-2 text-[11px] leading-tight">
                            {b.address?.line1}, {b.cityName} ({b.address?.pincode})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <LuClock className="w-3.5 h-3.5 text-[#E9A23B] shrink-0" />
                          <span>{b.slot?.date || 'Today'} • {b.slot?.window || 'Standard Window'}</span>
                        </div>
                        <div className="pt-2 border-t border-[#E2D9C8]/60 flex items-center justify-between text-xs font-bold text-[#10231D]">
                          <span>Total Amount:</span>
                          <span className="font-mono text-[#E9A23B]">₹{(b.totals?.total || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleClaimBooking(b._id)}
                      disabled={claimingId === b._id}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#10231D] text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <LuZap className="w-4 h-4 fill-current" />
                      <span>{claimingId === b._id ? 'Claiming & Assigning...' : 'Claim & Assign to Me'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 1: DAILY TIME SLOT RUN-SHEET TIMELINE */}
        {activeFilter !== 'pool' && viewMode === 'timeline' && (
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
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold uppercase border border-emerald-200 inline-flex items-center gap-1">
                              <LuCheck className="w-3 h-3 text-emerald-700" />
                              <span>Free / Open Slot</span>
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
                                    {b.address?.houseOrFlat ? `${b.address.houseOrFlat}, ` : ''}{b.address?.line1 || b.address?.line2 || 'Customer address'}, {b.cityName || ''}
                                  </span>
                                  {b.address?.coordinates?.lat && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-mono font-bold flex items-center gap-1">
                                      <LuMapPin className="w-2.5 h-2.5 text-emerald-600" />
                                      <span>GPS Pinpoint</span>
                                    </span>
                                  )}
                                  {(() => {
                                    const eta = getBookingDistanceEta(b);
                                    if (!eta) return null;
                                    return (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[9px] font-mono font-bold flex items-center gap-1" title={`${eta.distanceText} • ${eta.etaText}`}>
                                        <LuNavigation className="w-2.5 h-2.5 text-[#E9A23B]" />
                                        <span>{eta.distanceText} · {eta.etaText}</span>
                                      </span>
                                    );
                                  })()}
                                </div>

                                {b.assignedSlot?.notes && (
                                  <p className="text-[10px] text-[#E9A23B] font-mono italic">
                                    Dispatch Note: "{b.assignedSlot.notes}"
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                {b.customer?.phone && (
                                  <a
                                    href={`tel:${b.customer.phone}`}
                                    className="p-2 rounded-xl bg-white border border-[#E2D9C8] hover:bg-[#ECE5D8] text-[#10231D] transition-colors"
                                    title="Call Customer"
                                  >
                                    <LuPhone className="w-3.5 h-3.5 text-emerald-600" />
                                  </a>
                                )}
                                {b.customer?.phone && (
                                  <a
                                    href={getWhatsAppUrl(b.customer.phone, b.customer?.name, b.bookingCode, b.serviceTitle)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] transition-colors"
                                    title="WhatsApp Customer"
                                  >
                                    <FaWhatsapp className="w-3.5 h-3.5 text-[#25D366]" />
                                  </a>
                                )}
                                <a
                                  href={getMapsUrl(b.address, b.cityName)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 transition-colors"
                                  title="Google Maps Navigation"
                                >
                                  <LuNavigation className="w-3.5 h-3.5 text-blue-600" />
                                </a>

                                {!isAssignedToMe(b) ? (
                                  <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold border border-stone-200">
                                    Lead: {b.assignedSupervisor?.name || b.supervisor?.name || 'Other Supervisor'}
                                  </span>
                                ) : !b.otpVerified ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuickOtpBooking(b);
                                      setQuickOtpInput('');
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#10231D] text-xs font-black transition-all flex items-center gap-1 shadow-xs cursor-pointer animate-pulse"
                                    title="Verify Customer Arrival OTP"
                                  >
                                    <LuKey className="w-3.5 h-3.5" />
                                    <span>Verify OTP</span>
                                  </button>
                                ) : b.status !== 'completed' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleMarkCompleted(b)}
                                    disabled={completingId === b._id}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                                    title="Mark Service as Completed"
                                  >
                                    <LuCircleCheck className="w-3.5 h-3.5 text-emerald-200" />
                                    <span>{completingId === b._id ? 'Completing...' : 'Work Done'}</span>
                                  </button>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                                    <LuCircleCheck className="w-3 h-3 text-emerald-600" />
                                    <span>Completed</span>
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleOpenBooking(b)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
                                    isAssignedToMe(b)
                                      ? 'bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6]'
                                      : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300'
                                  }`}
                                >
                                  <span>{isAssignedToMe(b) ? 'Manage' : 'View'}</span>
                                  {isAssignedToMe(b) ? <LuChevronRight className="w-3.5 h-3.5 text-[#E9A23B]" /> : <LuEye className="w-3.5 h-3.5 text-stone-600" />}
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
                          <div className="flex items-center gap-1.5 shrink-0">
                            {cs.booking.customer?.phone && (
                              <a
                                href={`tel:${cs.booking.customer.phone}`}
                                className="p-1.5 rounded-lg bg-[#ECE5D8] text-[#10231D]"
                                title="Call"
                              >
                                <LuPhone className="w-3 h-3 text-emerald-600" />
                              </a>
                            )}
                            <a
                              href={getMapsUrl(cs.booking.address, cs.booking.cityName)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700"
                              title="Directions"
                            >
                              <LuNavigation className="w-3 h-3 text-blue-600" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleOpenBooking(cs.booking)}
                              className="px-3 py-1.5 rounded-xl bg-[#10231D] text-[#F4EFE6] text-xs font-bold cursor-pointer"
                            >
                              Manage
                            </button>
                          </div>
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
        {activeFilter !== 'pool' && viewMode === 'cards' && (
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
                          Booked on: {formatDateDMY(b.createdAt)}
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

                    {/* Customer & Quick Communication Section */}
                    <div className="p-3 rounded-xl bg-[#ECE5D8]/60 border border-[#E2D9C8]/70 mb-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-[#10231D] block">{b.customer?.name}</span>
                          <span className="text-[11px] text-[#6B8077] font-mono">{b.customer?.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {b.customer?.phone && (
                            <a
                              href={`tel:${b.customer.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg bg-white border border-[#E2D9C8] hover:bg-[#ECE5D8] text-[#10231D] transition-colors"
                              title="Call Customer"
                            >
                              <LuPhone className="w-3.5 h-3.5 text-emerald-600" />
                            </a>
                          )}
                          {b.customer?.phone && (
                            <a
                              href={getWhatsAppUrl(b.customer.phone, b.customer?.name, b.bookingCode, b.serviceTitle)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] transition-colors"
                              title="WhatsApp Customer"
                            >
                              <FaWhatsapp className="w-3.5 h-3.5 text-[#25D366]" />
                            </a>
                          )}
                          <a
                            href={getMapsUrl(b.address, b.cityName)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 transition-colors"
                            title="Navigate"
                          >
                            <LuNavigation className="w-3.5 h-3.5 text-blue-600" />
                          </a>
                        </div>
                      </div>
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
                        <span>{formatDateDMY(b.assignedSlot?.date || b.slot?.date)} • {b.assignedSlot?.timeWindow || b.slot?.window}</span>
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

                  {/* Action Toolbar on Card */}
                  <div className="mt-4 pt-3 border-t border-[#E2D9C8] flex flex-wrap items-center gap-2">
                    {!isAssignedToMe(b) ? (
                      <div className="py-2 px-3 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 shrink-0">
                        <LuShieldCheck className="w-3.5 h-3.5 text-stone-500" />
                        <span>Lead: {b.assignedSupervisor?.name || b.supervisor?.name || 'Other Supervisor'}</span>
                      </div>
                    ) : b.status !== 'completed' ? (
                      !b.otpVerified ? (
                        <button
                          type="button"
                          onClick={() => {
                            setQuickOtpBooking(b);
                            setQuickOtpInput('');
                          }}
                          className="py-2.5 px-3 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#10231D] text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer animate-pulse shrink-0"
                        >
                          <LuKey className="w-3.5 h-3.5" />
                          <span>Verify OTP</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMarkCompleted(b)}
                          disabled={completingId === b._id}
                          className="py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0 disabled:opacity-50"
                        >
                          <LuCircleCheck className="w-4 h-4 text-emerald-200" />
                          <span>{completingId === b._id ? 'Completing...' : 'Work Done'}</span>
                        </button>
                      )
                    ) : (
                      <div className="py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shrink-0">
                        <LuCircleCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Completed</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenBooking(b)}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                        isAssignedToMe(b)
                          ? 'bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6]'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300'
                      }`}
                    >
                      <span>{isAssignedToMe(b) ? 'Manage Visit' : 'View Details'}</span>
                      {isAssignedToMe(b) ? <LuChevronRight className="w-4 h-4 text-[#E9A23B]" /> : <LuEye className="w-4 h-4 text-stone-600" />}
                    </button>
                  </div>
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
                onClick={() => setActiveModalTab('live_radar')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'live_radar'
                    ? 'bg-[#10231D] text-[#E9A23B]'
                    : 'text-[#6B8077] hover:bg-[#ECE5D8]'
                }`}
              >
                <LuCompass className="w-3.5 h-3.5" />
                <span>Live Route & GPS</span>
                {sharingBookingId === selectedBooking._id && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
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
                ) : !isAssignedToMe(selectedBooking) ? (
                  <div className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-300 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-500 text-[#10231D] flex items-center justify-center mx-auto shadow-sm">
                      <LuShieldCheck className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-lg text-amber-950">
                        Assigned Lead Only: Verification Locked
                      </h4>
                      <p className="text-xs text-amber-900 max-w-md mx-auto mt-1">
                        You are not assigned to this job. Only the assigned supervisor (<strong>{selectedBooking.assignedSupervisor?.name || selectedBooking.supervisor?.name || 'Assigned Lead'}</strong>) can verify the customer's on-site OTP and advance service status.
                      </p>
                    </div>
                    <div className="pt-2">
                      <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-950 text-[11px] font-mono font-bold uppercase tracking-wider">
                        View Only Access
                      </span>
                    </div>
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

                  {isAssignedToMe(selectedBooking) ? (
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
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-600 text-[11px] font-bold border border-stone-200">
                      View Only (Assigned Lead Only)
                    </span>
                  )}
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
                        {isAssignedToMe(selectedBooking) && (
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
                        )}
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

                  {isAssignedToMe(selectedBooking) ? (
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
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-600 text-[11px] font-bold border border-stone-200">
                      View Only (Assigned Lead Only)
                    </span>
                  )}
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
                        {isAssignedToMe(selectedBooking) && (
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
                        )}
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

                  <div className="p-3.5 rounded-xl bg-white border border-[#E2D9C8] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-[#6B8077] font-bold">Doorstep Navigation</span>
                      {selectedBooking.address?.coordinates?.lat && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          GPS Verified
                        </span>
                      )}
                    </div>
                    {selectedBooking.address?.houseOrFlat && (
                      <p className="font-bold text-xs text-[#10231D] bg-[#ECE5D8] px-2 py-0.5 rounded inline-block">
                        {selectedBooking.address.houseOrFlat}
                      </p>
                    )}
                    <p className="font-semibold text-[#10231D] leading-tight">
                      {selectedBooking.address?.line1} {selectedBooking.address?.line2 || ''}
                    </p>
                    <p className="text-[11px] text-[#6B8077]">
                      {selectedBooking.cityName} ({selectedBooking.address?.pincode})
                    </p>
                    {selectedBooking.address?.coordinates?.lat && (
                      <p className="text-[10px] font-mono text-[#6B8077]">
                        Pinpoint: {selectedBooking.address.coordinates.lat.toFixed(5)}, {selectedBooking.address.coordinates.lng.toFixed(5)}
                      </p>
                    )}
                    {(() => {
                      const eta = getBookingDistanceEta(selectedBooking);
                      if (!eta) return null;
                      return (
                        <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 mt-2 ${
                          eta.isArrived
                            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                            : 'bg-[#10231D] border-[#E9A23B]/40 text-[#F4EFE6]'
                        }`}>
                          <div className="flex items-center gap-2">
                            <LuNavigation className={`w-3.5 h-3.5 ${eta.isArrived ? 'text-emerald-400' : 'text-[#E9A23B]'}`} />
                            <span className="font-bold text-xs uppercase tracking-wide">{eta.distanceText}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-[#E9A23B] font-bold">
                              {eta.etaText}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#A3B8B0]">{eta.statusText}</span>
                        </div>
                      );
                    })()}
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      <a
                        href={getMapsUrl(selectedBooking.address, selectedBooking.cityName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-xl shadow-xs transition-colors"
                      >
                        <LuNavigation className="w-3.5 h-3.5" />
                        <span>Start Turn-by-Turn GPS</span>
                      </a>
                      {isAssignedToMe(selectedBooking) && (
                        selectedBooking.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl">
                            <LuCircleCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Service Completed • Sharing Ended</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Live Location Sharing Active</span>
                          </span>
                        )
                      )}
                    </div>
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
                    <p className="font-bold text-[#10231D]">{formatDateDMY(selectedBooking.assignedSlot?.date || selectedBooking.slot?.date)}</p>
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

            {/* TAB 5: LIVE ROUTE & LOCATION MAP */}
            {activeModalTab === 'live_radar' && (
              <div className="space-y-4">
                {/* Supervisor GPS Broadcast Action Banner */}
                <div className="p-4 rounded-2xl bg-stone-900 text-[#F4EFE6] border border-[#E2D9C8]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        selectedBooking.status === 'completed'
                          ? 'bg-emerald-400'
                          : 'bg-emerald-400 animate-ping'
                      }`} />
                      <h4 className="font-bold text-sm text-[#F4EFE6]">
                        {selectedBooking.status === 'completed'
                          ? 'Service Visit Completed · Location Sharing Ended'
                          : 'Live GPS Auto-Broadcasting Active'}
                      </h4>
                    </div>
                    <p className="text-xs text-[#A3B8B0]">
                      {selectedBooking.status === 'completed'
                        ? 'Job marked as completed. Real-time location sharing is closed for this visit.'
                        : `Live coordinates automatically transmitting & persisting (${lastGpsCoords ? `${lastGpsCoords.lat.toFixed(5)}, ${lastGpsCoords.lng.toFixed(5)}` : 'acquiring fix'}). Customer & office can track your arrival in real time.`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {selectedBooking.status === 'completed' ? (
                      <span className="px-3.5 py-2 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5 shadow-sm">
                        <LuCircleCheck className="w-4 h-4 text-emerald-400" />
                        <span>Completed • Sharing Ended</span>
                      </span>
                    ) : isAssignedToMe(selectedBooking) ? (
                      <span className="px-3.5 py-2 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-2 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Sharing Active Indefinitely</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-[#A3B8B0] bg-white/10 px-3 py-1.5 rounded-xl">
                        Lead: {selectedBooking.assignedSupervisor?.name || 'Other Supervisor'}
                      </span>
                    )}

                    <a
                      href={getMapsUrl(selectedBooking.address, selectedBooking.cityName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <LuNavigation className="w-3.5 h-3.5" />
                      <span>Google Maps</span>
                    </a>
                  </div>
                </div>

                {/* Live Route Map */}
                <div className="rounded-2xl overflow-hidden border border-[#E2D9C8] shadow-sm">
                  <LiveTrackingRadar
                    bookingCode={selectedBooking.bookingCode}
                    initialSupervisorLocation={selectedBooking.supervisorLiveLocation}
                    customerLocation={selectedBooking.address?.coordinates}
                    destinationAddress={`${selectedBooking.address?.houseOrFlat ? selectedBooking.address.houseOrFlat + ', ' : ''}${selectedBooking.address?.line1 || ''}, ${selectedBooking.cityName}`}
                    supervisorInfo={{
                      name: user?.name,
                      phone: user?.phone,
                      role: 'Assigned Field Supervisor'
                    }}
                  />
                </div>
              </div>
            )}



            {/* Modal Action Footer */}
            <div className="pt-4 border-t border-[#E2D9C8] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6B8077]">Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  selectedBooking.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedBooking.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  {selectedBooking.status?.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selectedBooking.status !== 'completed' && (
                  selectedBooking.otpVerified ? (
                    <button
                      type="button"
                      onClick={() => handleMarkCompleted(selectedBooking)}
                      disabled={completingId === selectedBooking._id}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <LuCircleCheck className="w-4 h-4 text-emerald-200" />
                      <span>{completingId === selectedBooking._id ? 'Completing...' : 'Work Done (Complete)'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        toast.error('Customer arrival OTP must be verified before marking work as completed.');
                        setActiveModalTab('otp');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#ECE5D8] hover:bg-[#E2D9C8] text-[#6B8077] border border-[#E2D9C8] text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title="Customer arrival OTP must be verified before service completion"
                    >
                      <LuLock className="w-3.5 h-3.5 text-[#E9A23B]" />
                      <span>Complete Locked (OTP Required)</span>
                    </button>
                  )
                )}
                {!selectedBooking.otpVerified && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuickOtpBooking(selectedBooking);
                      setQuickOtpInput('');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#10231D] text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer animate-pulse"
                  >
                    <LuKey className="w-4 h-4" />
                    <span>Verify OTP</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-[#ECE5D8] hover:bg-[#E2D9C8] text-[#10231D] text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
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

      {/* QUICK OTP MODAL (1-TAP DIRECT FIELD VERIFICATION) */}
      {quickOtpBooking && (
        <Modal
          isOpen={Boolean(quickOtpBooking)}
          onClose={() => setQuickOtpBooking(null)}
          title="On-Site Customer OTP Verification"
          subtitle={`Booking #${quickOtpBooking.bookingCode} • ${quickOtpBooking.customer?.name || 'Customer'}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleQuickOtpSubmit} className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-[#E9A23B]/40 text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-[#10231D] text-[#E9A23B] flex items-center justify-center mx-auto mb-2 shadow-xs">
                <LuKey className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-base text-[#10231D]">
                Enter Customer's 4-Digit Security Code
              </h4>
              <p className="text-xs text-[#6B8077] max-w-sm mx-auto">
                Ask {quickOtpBooking.customer?.name} for the 4-digit verification code sent via SMS or displayed on their live Track Booking screen.
              </p>
            </div>

            <div className="flex justify-center py-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoFocus
                placeholder="••••"
                value={quickOtpInput}
                onChange={(e) => setQuickOtpInput(e.target.value.replace(/\D/g, ''))}
                className="w-48 text-center text-3xl font-mono font-black tracking-[0.4em] py-3 rounded-2xl border-2 border-[#10231D] bg-white text-[#10231D] focus:outline-none focus:border-[#E9A23B] shadow-inner"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuickOtpBooking(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E2D9C8] bg-white hover:bg-[#ECE5D8] text-xs font-bold text-[#6B8077] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={verifyingQuickOtp || quickOtpInput.length !== 4}
                className="flex-1 py-2.5 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#E9A23B] text-xs font-black disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {verifyingQuickOtp ? (
                  <span>Verifying...</span>
                ) : (
                  <>
                    <LuCheck className="w-4 h-4 text-emerald-400 stroke-[3]" />
                    <span>Verify & Start Job</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {/* Themed Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmVariant={confirmModal.confirmVariant}
        onConfirm={confirmModal.onConfirm}
      />

      {/* PERSISTENT FLOATING LOCATION SHARING SIDE BADGE FOR SUPERVISOR */}
      {sharingBookingId && (
        <aside
          aria-label="Active Location Sharing Status"
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <div className="bg-[#10231D] text-[#F4EFE6] border-2 border-emerald-500/90 p-3.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md">
            <div className="relative flex items-center justify-center shrink-0">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 block" />
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 absolute inset-0 animate-ping opacity-75" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                  <LuRadio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sharing Location</span>
                </span>
                <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1 rounded font-mono font-bold">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-[#A3B8B0] truncate">
                {lastGpsCoords
                  ? `Active • ${lastGpsCoords.lat.toFixed(4)}, ${lastGpsCoords.lng.toFixed(4)}`
                  : 'Customer can view your arrival route'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => startBroadcastingGps(selectedBooking)}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#10231D] text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1"
                title="Force high-accuracy GPS update from phone"
              >
                <LuRotateCcw className="w-3.5 h-3.5" />
                <span>Update GPS</span>
              </button>
            </div>
          </div>
        </aside>
      )}

    </div>
  );
}
