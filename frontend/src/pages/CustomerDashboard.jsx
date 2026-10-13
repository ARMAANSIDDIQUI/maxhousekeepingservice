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
  LuPlus
} from 'react-icons/lu';
import { FaWhatsapp } from 'react-icons/fa6';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
    } catch (err) {
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
        setBookings(prev => prev.map(b => b._id === res.booking._id ? res.booking : b));
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
        setBookings(prev => prev.map(b => b._id === messagingBooking._id ? updated : b));
        setNewMessage('');
        toast.success('Message sent to Max Housekeeping team.');
      }
    } catch (err) {
      toast.error('Failed to send message.');
    } finally {
      setSendingMsg(false);
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-3 py-1 rounded-full bg-[#DDEBE4] text-[#10231D] font-bold text-xs">Approved</span>;
      case 'paid':
        return <span className="px-3 py-1 rounded-full bg-[#DDEBE4] text-[#10231D] font-bold text-xs">Paid</span>;
      case 'in_progress':
        return <span className="px-3 py-1 rounded-full bg-[#E9A23B]/20 text-[#10231D] font-bold text-xs">In-Progress</span>;
      case 'completed':
        return <span className="px-3 py-1 rounded-full bg-[#10231D] text-[#F4EFE6] font-bold text-xs">Completed</span>;
      case 'unresponsive':
        return <span className="px-3 py-1 rounded-full bg-[#F9ECE8] text-[#C2512D] font-bold text-xs">Awaiting Reply</span>;
      case 'cancelled':
        return <span className="px-3 py-1 rounded-full bg-[#F9ECE8] text-[#C2512D] font-bold text-xs">Cancelled</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-[#ECE5D8] text-[#3D524A] font-bold text-xs">Pending Review</span>;
    }
  };

  return (
    <div className="bg-[#F4EFE6] min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2D9C8] mb-8 gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E9A23B]">
              CUSTOMER DASHBOARD
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-[#10231D]">
              My Cleaning Bookings
            </h1>
            <p className="text-xs text-[#6B8077] mt-1">
              Welcome back, {user?.name}. Track, edit details, or communicate directly with our operations team.
            </p>
          </div>

          <Link
            to="/book"
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#10231D] text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <LuPlus className="w-4 h-4" />
            <span>New Booking</span>
          </Link>
        </div>

        {/* Bookings List */}
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
                        <span>Edit Details</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[#6B8077] font-semibold block">SERVICE SCHEDULE:</span>
                    <p className="font-bold text-[#10231D] mt-0.5">{b.slot.date}</p>
                    <p className="text-[#3D524A]">{b.slot.window}</p>
                  </div>

                  <div>
                    <span className="text-[#6B8077] font-semibold block">LOCATION:</span>
                    <p className="font-bold text-[#10231D] mt-0.5">{b.address.line1}</p>
                    <p className="text-[#3D524A]">{b.cityName} ({b.address.pincode})</p>
                  </div>

                  <div>
                    <span className="text-[#6B8077] font-semibold block">PAYABLE TOTAL:</span>
                    <p className="font-display font-black text-xl text-[#10231D] mt-0.5 tnum">
                      ₹{b.totals.total.toLocaleString('en-IN')}
                    </p>
                    {b.totals.customerSaved > 0 && (
                      <p className="text-[#C2512D] font-bold text-[11px]">
                        Saved ₹{b.totals.customerSaved.toLocaleString('en-IN')}!
                      </p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="pt-3 border-t border-[#E2D9C8]/70 flex flex-wrap gap-2">
                  {b.items.map((item, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-[#F4EFE6] text-xs text-[#10231D] border border-[#E2D9C8]">
                      <strong>{item.titleSnapshot}</strong> ({item.variantSnapshot || 'Standard'} · Qty {item.qty})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 1. EDIT DETAILS MODAL */}
        {editingBooking && (
          <Modal
            isOpen={true}
            onClose={() => setEditingBooking(null)}
            title={`Edit Details: ${editingBooking.bookingCode}`}
            subtitle="Update your address, contact, or service schedule window"
            maxWidth="max-w-lg"
          >
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">Customer Name:</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">Mobile Number:</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">Street Address:</label>
                <input
                  type="text"
                  value={editForm.line1}
                  onChange={(e) => setEditForm({ ...editForm, line1: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">Pincode:</label>
                  <input
                    type="text"
                    value={editForm.pincode}
                    onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">Reschedule Date:</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">Time Window:</label>
                <select
                  value={editForm.window}
                  onChange={(e) => setEditForm({ ...editForm, window: e.target.value })}
                  className="w-full theme-select text-xs bg-[#ECE5D8]"
                >
                  <option value="Morning (8:00 AM – 11:00 AM)">Morning (8:00 AM – 11:00 AM)</option>
                  <option value="Midday (11:00 AM – 2:00 PM)">Midday (11:00 AM – 2:00 PM)</option>
                  <option value="Afternoon (2:00 PM – 5:00 PM)">Afternoon (2:00 PM – 5:00 PM)</option>
                  <option value="Evening (5:00 PM – 8:00 PM)">Evening (5:00 PM – 8:00 PM)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10231D] mb-1">Special Notes:</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="e.g. Please bring extra ladder..."
                  className="w-full p-2.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2D9C8]">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#10231D] hover:bg-[#ECE5D8]"
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

        {/* 2. COMMUNICATE WITH ADMIN CHAT THREAD MODAL */}
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
                {(!messagingBooking.messages || messagingBooking.messages.length === 0) ? (
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
