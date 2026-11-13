import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LuReceipt,
  LuDownload,
  LuFileArchive,
  LuPrinter,
  LuLock,
  LuTriangleAlert,
  LuRefreshCw,
  LuCalendar,
  LuCircleCheck,
  LuClock
} from 'react-icons/lu';
import { useToast } from '../../context/ToastContext';
import { adminAPI } from '../../api';
import { printCombinedGstBills, downloadGstBillsZip } from '../../utils/printReceipt';

function getTodayIstString() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

function getMonthStartIstString() {
  const today = getTodayIstString();
  return `${today.slice(0, 7)}-01`;
}

function formatIstDateTime(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(d);
}

function formatINR(val) {
  return `₹${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function AdminGstBillingSection({ settings = {} }) {
  const toast = useToast();
  const [startDate, setStartDate] = useState(getMonthStartIstString);
  const [endDate, setEndDate] = useState(getTodayIstString);
  const [dateField, setDateField] = useState('slot.date');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [billStatus, setBillStatus] = useState('all');

  const [bills, setBills] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [startSerial, setStartSerial] = useState('1');
  const [serialTouched, setSerialTouched] = useState(false);
  const [nextSuggestedSerial, setNextSuggestedSerial] = useState(1);
  const [totalUsedBills, setTotalUsedBills] = useState(0);
  const [istNow, setIstNow] = useState('');

  const [downloadMode, setDownloadMode] = useState('single'); // 'single' (default) | 'zip'
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [conflictInfo, setConflictInfo] = useState(null);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    setConflictInfo(null);
    try {
      const res = await adminAPI.getBills({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        dateField,
        paymentStatus,
        billStatus
      });
      const list = Array.isArray(res?.bookings) ? res.bookings : [];
      setBills(list);
      setSelectedIds(list.map((b) => b._id));
      const suggested = Number(res?.nextSuggestedSerial || 1);
      setNextSuggestedSerial(suggested);
      setTotalUsedBills(Number(res?.totalUsedBills || 0));
      setIstNow(res?.istNow || '');
      if (!serialTouched) {
        setStartSerial(String(suggested));
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to load GST billing records.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, dateField, paymentStatus, billStatus, serialTouched]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const parsedSerial = Number(startSerial);
  const isSerialValid = Number.isInteger(parsedSerial) && parsedSerial >= 1;

  // Compute live preview of bill numbers for selected unbilled bookings
  const previewMap = useMemo(() => {
    const map = {};
    if (!isSerialValid) return map;
    let cursor = parsedSerial;
    for (const b of bills) {
      if (!selectedIds.includes(b._id)) continue;
      if (b.billNumber != null) {
        map[b._id] = { number: b.billNumber, isExisting: true };
      } else {
        map[b._id] = { number: cursor, isExisting: false };
        cursor += 1;
      }
    }
    return map;
  }, [bills, selectedIds, parsedSerial, isSerialValid]);

  const selectedStats = useMemo(() => {
    const selectedBookings = bills.filter((b) => selectedIds.includes(b._id));
    let unbilledCount = 0;
    let alreadyBilledCount = 0;
    let totalAmount = 0;
    let totalGst = 0;

    for (const b of selectedBookings) {
      if (b.billNumber != null) alreadyBilledCount += 1;
      else unbilledCount += 1;
      totalAmount += Number(b.totals?.total ?? b.total ?? 0);
      totalGst += Number(b.totals?.gstAmount ?? 0);
    }

    return {
      totalSelected: selectedBookings.length,
      unbilledCount,
      alreadyBilledCount,
      totalAmount,
      totalGst
    };
  }, [bills, selectedIds]);

  const toggleSelectAll = () => {
    if (selectedIds.length === bills.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(bills.map((b) => b._id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleGenerateAndDownload = async () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one booking to generate bills.');
      return;
    }
    if (!isSerialValid) {
      toast.error('Please enter a valid positive whole number for "Serial number to start from".');
      return;
    }

    setGenerating(true);
    setConflictInfo(null);
    try {
      const res = await adminAPI.assignBillNumbers({
        bookingIds: selectedIds,
        startSerial: parsedSerial
      });

      const finalBookings = Array.isArray(res?.bookings) ? res.bookings : [];
      if (finalBookings.length === 0) {
        toast.error('No billable bookings returned.');
        return;
      }

      if (res.nextSuggestedSerial) {
        setNextSuggestedSerial(res.nextSuggestedSerial);
        setStartSerial(String(res.nextSuggestedSerial));
        setSerialTouched(false);
      }

      toast.success(res.message || 'Bill numbers verified & locked.');

      if (downloadMode === 'zip') {
        await downloadGstBillsZip(finalBookings, settings);
        toast.success(`Downloaded ZIP with ${finalBookings.length} GST bill(s).`);
      } else {
        await printCombinedGstBills(finalBookings, settings);
      }

      await fetchBills();
    } catch (err) {
      if (err?.status === 409 || err?.data?.conflictingNumbers) {
        const conflictingNumbers = err?.data?.conflictingNumbers || [];
        const suggested = err?.data?.nextSuggestedSerial || nextSuggestedSerial;
        setConflictInfo({
          message: err?.message || 'Bill number collision detected.',
          conflictingNumbers,
          nextSuggestedSerial: suggested
        });
        toast.error('Bill number already used! Numbers cannot be repeated.');
      } else {
        toast.error(err?.message || 'Failed to generate GST bills.');
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#10231D] text-[#F4EFE6] rounded-2xl p-6 border border-[#2C4A3E] shadow-lg flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E9A23B]/15 border border-[#E9A23B]/30 text-[#E9A23B] text-[11px] font-bold uppercase tracking-wider mb-2">
            <LuClock className="w-3.5 h-3.5" />
            IST · Asia/Kolkata (UTC+05:30) {istNow ? `· ${istNow}` : ''}
          </div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <LuReceipt className="w-6 h-6 text-[#E9A23B]" />
            GST Billing &amp; Sequential Bill Generator
          </h2>
          <p className="text-xs text-[#A3B8AE] mt-1 max-w-2xl">
            Filter bookings by IST date range, assign non-repeating sequential GST bill numbers starting from your chosen serial number, and download as a single combined A4 PDF/Print document or a ZIP archive. Issued bill numbers are permanently locked and can never be repeated.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="bg-[#17332A] border border-[#2C4A3E] rounded-xl px-4 py-2.5 text-center min-w-[130px]">
            <div className="text-[10px] uppercase tracking-wider text-[#A3B8AE] font-semibold">Next Available</div>
            <div className="text-xl font-black text-[#E9A23B]">#{nextSuggestedSerial}</div>
          </div>
          <div className="bg-[#17332A] border border-[#2C4A3E] rounded-xl px-4 py-2.5 text-center min-w-[130px]">
            <div className="text-[10px] uppercase tracking-wider text-[#A3B8AE] font-semibold">Total Issued</div>
            <div className="text-xl font-black text-[#F4EFE6]">{totalUsedBills}</div>
          </div>
        </div>
      </div>

      {/* Filters & Controls Card */}
      <div className="bg-white rounded-2xl border border-[#E2DDD5] p-5 shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A6E66] mb-1.5">
              From Date (IST)
            </label>
            <div className="relative">
              <LuCalendar className="w-4 h-4 text-[#6B8077] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D8D3C9] text-sm font-medium text-[#10231D] focus:outline-none focus:border-[#E9A23B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A6E66] mb-1.5">
              To Date (IST)
            </label>
            <div className="relative">
              <LuCalendar className="w-4 h-4 text-[#6B8077] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D8D3C9] text-sm font-medium text-[#10231D] focus:outline-none focus:border-[#E9A23B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A6E66] mb-1.5">
              Date Filter Basis
            </label>
            <select
              value={dateField}
              onChange={(e) => setDateField(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D8D3C9] text-sm font-medium text-[#10231D] bg-white focus:outline-none focus:border-[#E9A23B]"
            >
              <option value="slot.date">Booking Service Date (IST)</option>
              <option value="paidAt">Payment Date (IST)</option>
              <option value="createdAt">Booking Created Date (IST)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A6E66] mb-1.5">
              Payment Status
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D8D3C9] text-sm font-medium text-[#10231D] bg-white focus:outline-none focus:border-[#E9A23B]"
            >
              <option value="paid">Only Paid Ones (Default)</option>
              <option value="all">All (Paid + Pending)</option>
              <option value="pending">Pending Payment Only</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A6E66] mb-1.5">
              Bill Status
            </label>
            <select
              value={billStatus}
              onChange={(e) => setBillStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D8D3C9] text-sm font-medium text-[#10231D] bg-white focus:outline-none focus:border-[#E9A23B]"
            >
              <option value="all">All Bookings</option>
              <option value="unbilled">Unbilled Only</option>
              <option value="billed">Already Billed Only</option>
            </select>
          </div>
        </div>

        {/* Serial Number Input + Download Mode + Action */}
        <div className="pt-4 border-t border-[#ECE7DF] grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#10231D] mb-1.5">
              Serial Number to Start From <span className="text-[#E9A23B]">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                step="1"
                value={startSerial}
                onChange={(e) => {
                  setStartSerial(e.target.value);
                  setSerialTouched(true);
                  setConflictInfo(null);
                }}
                placeholder={`e.g. ${nextSuggestedSerial}`}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold text-[#10231D] focus:outline-none ${
                  isSerialValid ? 'border-[#D8D3C9] focus:border-[#10231D]' : 'border-red-400 bg-red-50'
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  setStartSerial(String(nextSuggestedSerial));
                  setSerialTouched(false);
                  setConflictInfo(null);
                }}
                className="px-3 py-2.5 rounded-xl border border-[#D8D3C9] text-xs font-bold text-[#10231D] hover:bg-[#F4EFE6] whitespace-nowrap"
                title="Use next available unused serial number"
              >
                Auto #{nextSuggestedSerial}
              </button>
            </div>
            <p className="text-[11px] text-[#6B8077] mt-1">
              Applies to {selectedStats.unbilledCount} unbilled booking(s). {selectedStats.alreadyBilledCount} already-billed booking(s) keep their locked number.
            </p>
          </div>

          <div className="lg:col-span-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A6E66] mb-1.5">
              Download Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDownloadMode('single')}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition ${
                  downloadMode === 'single'
                    ? 'bg-[#10231D] text-[#F4EFE6] border-[#10231D]'
                    : 'bg-white text-[#10231D] border-[#D8D3C9] hover:bg-[#F4EFE6]'
                }`}
              >
                <LuPrinter className="w-4 h-4" />
                Single Page (Default)
              </button>
              <button
                type="button"
                onClick={() => setDownloadMode('zip')}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition ${
                  downloadMode === 'zip'
                    ? 'bg-[#10231D] text-[#F4EFE6] border-[#10231D]'
                    : 'bg-white text-[#10231D] border-[#D8D3C9] hover:bg-[#F4EFE6]'
                }`}
              >
                <LuFileArchive className="w-4 h-4" />
                ZIP Archive
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 flex items-center gap-2">
            <button
              type="button"
              onClick={fetchBills}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl border border-[#D8D3C9] text-[#10231D] hover:bg-[#F4EFE6] text-xs font-bold flex items-center gap-1.5"
            >
              <LuRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleGenerateAndDownload}
              disabled={generating || selectedIds.length === 0 || !isSerialValid}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#E9A23B] hover:bg-[#d8922c] disabled:opacity-50 disabled:cursor-not-allowed text-[#10231D] text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm transition"
            >
              <LuDownload className="w-4 h-4" />
              {generating
                ? 'Locking & Preparing...'
                : downloadMode === 'zip'
                ? `Download ZIP (${selectedStats.totalSelected})`
                : `Download Single PDF (${selectedStats.totalSelected})`}
            </button>
          </div>
        </div>

        {/* Collision / Security Alert */}
        {conflictInfo && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2.5 text-red-800">
              <LuTriangleAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <div>
                <div className="text-xs font-black uppercase tracking-wide">Duplicate Bill Number Blocked</div>
                <div className="text-xs mt-0.5">{conflictInfo.message}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setStartSerial(String(conflictInfo.nextSuggestedSerial));
                setSerialTouched(false);
                setConflictInfo(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 shrink-0"
            >
              Switch to #{conflictInfo.nextSuggestedSerial}
            </button>
          </div>
        )}
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-[#E2DDD5] p-3.5">
          <div className="text-[11px] font-semibold text-[#6B8077]">Selected Bookings</div>
          <div className="text-lg font-black text-[#10231D]">{selectedStats.totalSelected} / {bills.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-[#E2DDD5] p-3.5">
          <div className="text-[11px] font-semibold text-[#6B8077]">New Bills to Assign</div>
          <div className="text-lg font-black text-[#E9A23B]">{selectedStats.unbilledCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-[#E2DDD5] p-3.5">
          <div className="text-[11px] font-semibold text-[#6B8077]">Total GST (Selected)</div>
          <div className="text-lg font-black text-[#10231D]">{formatINR(selectedStats.totalGst)}</div>
        </div>
        <div className="bg-white rounded-xl border border-[#E2DDD5] p-3.5">
          <div className="text-[11px] font-semibold text-[#6B8077]">Grand Total (Selected)</div>
          <div className="text-lg font-black text-emerald-700">{formatINR(selectedStats.totalAmount)}</div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-[#E2DDD5] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F6F1] border-b border-[#E2DDD5] text-[11px] font-bold uppercase tracking-wider text-[#5A6E66]">
                <th className="p-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={bills.length > 0 && selectedIds.length === bills.length}
                    onChange={toggleSelectAll}
                    className="rounded border-[#D8D3C9] text-[#10231D] focus:ring-0"
                  />
                </th>
                <th className="p-3.5">Bill No.</th>
                <th className="p-3.5">Booking ID</th>
                <th className="p-3.5">Service Date (IST)</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5 text-right">GST</th>
                <th className="p-3.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#6B8077] font-semibold">
                    Loading IST billing records...
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#6B8077] font-semibold">
                    No billable bookings found for the selected IST date range and filters.
                  </td>
                </tr>
              ) : (
                bills.map((b) => {
                  const isSelected = selectedIds.includes(b._id);
                  const preview = previewMap[b._id];
                  const isPaid = b.paymentStatus === 'paid';
                  return (
                    <tr key={b._id} className={`hover:bg-[#FAF8F4] transition ${isSelected ? 'bg-[#FDFBF7]' : ''}`}>
                      <td className="p-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(b._id)}
                          className="rounded border-[#D8D3C9] text-[#10231D] focus:ring-0"
                        />
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {b.billNumber != null ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-[11px]">
                            <LuLock className="w-3 h-3" />
                            #{b.billNumber}
                          </span>
                        ) : preview ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px]">
                            Next: #{preview.number}
                          </span>
                        ) : (
                          <span className="text-[#9CA3AF] font-medium">Unbilled</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-[#10231D]">
                        {b.bookingCode}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-semibold text-[#10231D]">{b.slot?.date || '—'}</div>
                        <div className="text-[10px] text-[#6B8077]">
                          {b.billIssuedAt ? `Issued: ${formatIstDateTime(b.billIssuedAt)}` : `Created: ${formatIstDateTime(b.createdAt)}`}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-[#10231D]">{b.customer?.name || 'Customer'}</div>
                        <div className="text-[11px] text-[#6B8077]">{b.customer?.phone || '—'}</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isPaid && <LuCircleCheck className="w-3 h-3" />}
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-semibold text-[#5A6E66]">
                        {formatINR(b.totals?.gstAmount || 0)}
                      </td>
                      <td className="p-3.5 text-right font-black text-[#10231D]">
                        {formatINR(b.totals?.total ?? b.total ?? 0)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
