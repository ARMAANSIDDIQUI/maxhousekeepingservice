import { formatDateDMY } from './date';

let cachedLogoDataUrl = null;

/**
 * Fetches /logo.png and converts to base64 Data URL so the browser print / PDF engine
 * renders both the header logo and centered watermark immediately without network race conditions.
 */
async function getLogoDataUrl() {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  const fallbackUrl = `${window.location.origin}/logo.png`;
  try {
    const resp = await fetch(fallbackUrl);
    if (!resp.ok) return fallbackUrl;
    const blob = await resp.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        cachedLogoDataUrl = reader.result || fallbackUrl;
        resolve(cachedLogoDataUrl);
      };
      reader.onerror = () => resolve(fallbackUrl);
      reader.readAsDataURL(blob);
    });
  } catch {
    return fallbackUrl;
  }
}

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatINR(val) {
  const num = Number(val || 0);
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

/**
 * Generates an A4-sized PDF-ready Service Bill / Official Receipt with Logo & Watermark
 * and triggers the native Print / Save as PDF dialog cleanly via an isolated iframe.
 */
export async function printBookingReceipt(booking, settings = {}) {
  if (!booking) return;

  const logoSrc = await getLogoDataUrl();

  const businessName = settings?.businessName || 'Max Housekeeping Service';
  const businessTagline = settings?.tagline || 'Professional Home, Sofa, Kitchen & Commercial Deep Cleaning';
  const businessPhone = settings?.phone || settings?.whatsappNumber || '+91 98977 66002';
  const businessEmail = settings?.supportEmail || settings?.email || 'support@maxhousekeeping.in';
  const businessAddress = settings?.officeAddress || 'Civil Lines, Moradabad, Uttar Pradesh 244001';
  const gstNumber = settings?.gstNumber || '';

  const bookingCode = booking.bookingCode || 'MH-BOOKING';
  const invoiceNo = `INV-${bookingCode}`;
  const createdDate = booking.createdAt ? formatDateDMY(booking.createdAt) : formatDateDMY(new Date());
  const serviceDate = booking.assignedSlot?.date || booking.slot?.date
    ? formatDateDMY(booking.assignedSlot?.date || booking.slot?.date)
    : 'Flexible Schedule';
  const serviceWindow = booking.assignedSlot?.timeWindow || booking.slot?.window || 'Scheduled Slot';

  const customerName = booking.customer?.name || 'Valued Customer';
  const customerPhone = booking.customer?.phone || 'N/A';
  const customerEmail = booking.customer?.email || '';

  const addrParts = [
    booking.address?.houseOrFlat,
    booking.address?.line1,
    booking.address?.landmark ? `Near ${booking.address.landmark}` : '',
    booking.cityName || booking.address?.cityText,
    booking.address?.stateText || 'Uttar Pradesh',
    booking.address?.pincode
  ].filter(Boolean);
  const fullAddress = addrParts.join(', ') || 'Address on file';

  const items = Array.isArray(booking.items) ? booking.items : [];
  const totals = booking.totals || {};

  const mrpTotal = Number(totals.mrpTotal ?? items.reduce((s, it) => s + Number(it.mrpSnapshot || it.priceSnapshot || it.price || 0) * Number(it.qty || 1), 0));
  const subtotal = Number(totals.subtotal ?? items.reduce((s, it) => s + Number(it.priceSnapshot || it.price || 0) * Number(it.qty || 1), 0));
  const packageDiscount = Math.max(0, mrpTotal - subtotal);
  const outstationSurcharge = Number(totals.outstationSurcharge || 0);
  const couponDiscount = Number(totals.couponDiscount || booking.appliedCoupon?.discountAmount || 0);
  const couponCode = booking.appliedCoupon?.code || '';
  const platformChargeAmount = Number(totals.platformChargeAmount || 0);
  const platformChargeLabel = totals.platformChargeLabel || 'Platform & Hygiene Charges';
  const gstAmount = Number(totals.gstAmount || 0);
  const gstPercentage = Number(totals.gstPercentage || 18);
  const grandTotal = Number(totals.total ?? booking.total ?? subtotal);
  const customerSaved = Number(totals.customerSaved ?? (packageDiscount + couponDiscount));

  const isPaid = booking.paymentStatus === 'paid' || booking.status === 'paid';
  const paymentModeLabel =
    booking.paymentMode === 'cash_on_service'
      ? 'Cash / UPI on Service'
      : booking.paymentMode === 'razorpay' || booking.paymentMode === 'online_before'
      ? 'Online Payment (Razorpay)'
      : booking.paymentMode === 'online_after'
      ? 'Online After Service'
      : (booking.paymentMode || 'Cash on Service');

  const txId = booking.paymentDetails?.transactionId || booking.paymentDetails?.receipt || '';
  const paidAtStr = booking.paymentDetails?.paidAt ? formatDateDMY(booking.paymentDetails.paidAt) : '';

  const supName = booking.assignedSupervisor?.name || booking.supervisor?.name || booking.assignedCrew?.name || '';
  const supPhone = booking.assignedSupervisor?.phone || booking.supervisor?.phone || booking.assignedCrew?.phone || '';

  const statusText = String(booking.status || 'pending').replace('_', ' ').toUpperCase();

  const itemRowsHtml = items
    .map((it, idx) => {
      const qty = Number(it.qty || 1);
      const unitRate = Number(it.priceSnapshot ?? it.price ?? 0);
      const unitMrp = Number(it.mrpSnapshot ?? unitRate);
      const lineTotal = unitRate * qty;
      const lineSavings = Math.max(0, (unitMrp - unitRate) * qty);
      const variantLabel = it.variantSnapshot || 'Standard Package';

      return `
        <tr>
          <td class="col-num">${idx + 1}</td>
          <td class="col-desc">
            <div class="item-title">${esc(it.titleSnapshot || it.title || 'Housekeeping Service')}</div>
            <div class="item-sub">${esc(variantLabel)}</div>
          </td>
          <td class="col-qty">${qty}</td>
          <td class="col-rate">
            ${unitMrp > unitRate ? `<span class="mrp-strike">${formatINR(unitMrp)}</span> ` : ''}
            <span>${formatINR(unitRate)}</span>
          </td>
          <td class="col-amt">
            <div class="amt-val">${formatINR(lineTotal)}</div>
            ${lineSavings > 0 ? `<div class="amt-save">Saved ${formatINR(lineSavings)}</div>` : ''}
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Receipt_${esc(bookingCode)}_${esc(businessName.replace(/\s+/g, '_'))}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body {
      width: 210mm;
      min-height: 297mm;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #10231D;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
      font-size: 11px;
      line-height: 1.45;
    }
    .a4-page {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      padding: 13mm 15mm 14mm 15mm;
      background: #ffffff;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    /* Top and bottom subtle executive accent bars */
    .top-accent-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5mm;
      background: linear-gradient(90deg, #10231D 0%, #10231D 72%, #E9A23B 72%, #E9A23B 100%);
    }
    .bottom-accent-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3mm;
      background: linear-gradient(90deg, #E9A23B 0%, #E9A23B 28%, #10231D 28%, #10231D 100%);
    }

    /* WATERMARK LAYER (LOGO + DIAGONAL TEXT) */
    .watermark-layer {
      position: fixed;
      inset: 0;
      width: 210mm;
      height: 297mm;
      pointer-events: none;
      z-index: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .watermark-logo {
      width: 108mm;
      height: 108mm;
      object-fit: contain;
      opacity: 0.055;
      filter: grayscale(20%);
    }
    .watermark-diagonal {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-34deg);
      font-size: 32px;
      font-weight: 900;
      letter-spacing: 6px;
      text-transform: uppercase;
      color: rgba(16, 35, 29, 0.045);
      white-space: nowrap;
      user-select: none;
    }
    .watermark-status-stamp {
      position: absolute;
      top: 56%;
      right: 22mm;
      transform: rotate(-18deg);
      border: 3px solid ${isPaid ? 'rgba(5, 150, 105, 0.18)' : 'rgba(217, 119, 6, 0.16)'};
      color: ${isPaid ? 'rgba(5, 150, 105, 0.22)' : 'rgba(217, 119, 6, 0.20)'};
      padding: 4px 14px;
      border-radius: 8px;
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 3px;
      text-transform: uppercase;
    }

    /* MAIN CONTENT LAYER ABOVE WATERMARK */
    .content-layer {
      position: relative;
      z-index: 2;
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    /* HEADER */
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-top: 3mm;
      padding-bottom: 5mm;
      border-bottom: 1.5px solid #E2D9C8;
      margin-bottom: 5mm;
    }
    .brand-box {
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 58%;
    }
    .brand-logo {
      width: 54px;
      height: 54px;
      object-fit: contain;
      border-radius: 10px;
      border: 1px solid #E2D9C8;
      background: #F4EFE6;
      padding: 4px;
    }
    .brand-name {
      font-size: 19px;
      font-weight: 900;
      color: #10231D;
      letter-spacing: -0.3px;
      margin: 0;
    }
    .brand-name span {
      color: #C7821C;
    }
    .brand-tag {
      font-size: 9.5px;
      color: #3D524A;
      margin: 2px 0 4px 0;
      font-weight: 600;
    }
    .brand-meta {
      font-size: 9px;
      color: #556B63;
      line-height: 1.35;
    }
    .invoice-meta-box {
      text-align: right;
    }
    .doc-badge {
      display: inline-block;
      background: #10231D;
      color: #E9A23B;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.4px;
      padding: 4px 11px;
      border-radius: 6px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .meta-table {
      margin-left: auto;
      border-collapse: collapse;
      font-size: 10px;
    }
    .meta-table td {
      padding: 1.5px 0;
    }
    .meta-label {
      color: #6B8077;
      padding-right: 10px !important;
      font-weight: 600;
    }
    .meta-val {
      color: #10231D;
      font-weight: 700;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    /* INFO CARDS GRID */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 5.5mm;
    }
    .info-card {
      background: #FAF8F4;
      border: 1px solid #E2D9C8;
      border-radius: 10px;
      padding: 10px 12px;
    }
    .card-heading {
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #C7821C;
      margin: 0 0 5px 0;
      border-bottom: 1px solid #EAE2D3;
      padding-bottom: 3px;
    }
    .cust-name {
      font-size: 12.5px;
      font-weight: 800;
      color: #10231D;
      margin-bottom: 2px;
    }
    .info-line {
      font-size: 10px;
      color: #3D524A;
      margin: 2px 0;
    }
    .info-line strong {
      color: #10231D;
    }
    .status-pill {
      display: inline-block;
      padding: 1.5px 7px;
      border-radius: 99px;
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: ${isPaid ? '#D1FAE5' : '#FEF3C7'};
      color: ${isPaid ? '#065F46' : '#92400E'};
      border: 1px solid ${isPaid ? '#6EE7B7' : '#FCD34D'};
    }

    /* SERVICE ITEMS TABLE */
    .items-section {
      margin-bottom: 5mm;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #D9CEBA;
      border-radius: 8px;
      overflow: hidden;
    }
    table.items-table thead {
      background: #10231D;
      color: #F4EFE6;
    }
    table.items-table th {
      padding: 8px 10px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      text-align: left;
    }
    table.items-table th.col-num, table.items-table td.col-num { width: 32px; text-align: center; }
    table.items-table th.col-qty, table.items-table td.col-qty { width: 46px; text-align: center; }
    table.items-table th.col-rate, table.items-table td.col-rate { width: 105px; text-align: right; }
    table.items-table th.col-amt, table.items-table td.col-amt { width: 95px; text-align: right; }

    table.items-table tbody tr {
      border-bottom: 1px solid #EBE3D5;
      background: rgba(255, 255, 255, 0.78);
    }
    table.items-table tbody tr:nth-child(even) {
      background: rgba(244, 239, 230, 0.45);
    }
    table.items-table td {
      padding: 8px 10px;
      vertical-align: top;
      font-size: 10px;
    }
    .item-title {
      font-weight: 700;
      color: #10231D;
      font-size: 10.5px;
    }
    .item-sub {
      font-size: 9px;
      color: #6B8077;
      margin-top: 1px;
    }
    .mrp-strike {
      text-decoration: line-through;
      color: #9CA3AF;
      font-size: 9px;
    }
    .amt-val {
      font-weight: 800;
      color: #10231D;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .amt-save {
      font-size: 8.5px;
      color: #059669;
      font-weight: 700;
    }

    /* BOTTOM SUMMARY + NOTES */
    .summary-row {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 14px;
      margin-bottom: 6mm;
    }
    .notes-box {
      background: #FAF8F4;
      border: 1px solid #E2D9C8;
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 9.5px;
      color: #3D524A;
    }
    .notes-box ul {
      margin: 4px 0 0 0;
      padding-left: 15px;
    }
    .notes-box li {
      margin-bottom: 2.5px;
    }
    .totals-box {
      background: #FAF8F4;
      border: 1px solid #D9CEBA;
      border-radius: 10px;
      padding: 10px 14px;
    }
    .tot-line {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      padding: 3px 0;
      color: #3D524A;
    }
    .tot-line.discount {
      color: #059669;
      font-weight: 700;
    }
    .tot-val {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-weight: 700;
      color: #10231D;
    }
    .tot-line.discount .tot-val {
      color: #059669;
    }
    .grand-total-bar {
      margin-top: 6px;
      padding-top: 7px;
      border-top: 1.5px solid #10231D;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: 900;
      color: #10231D;
    }
    .grand-total-amt {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 16px;
      color: #10231D;
    }
    .saved-banner {
      margin-top: 7px;
      padding: 4px 8px;
      border-radius: 6px;
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      color: #065F46;
      font-size: 9.5px;
      font-weight: 800;
      text-align: center;
    }

    /* SIGNATORY & FOOTER */
    .footer-sign-row {
      margin-top: auto;
      padding-top: 6mm;
      border-top: 1px dashed #D9CEBA;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .declaration {
      max-width: 60%;
      font-size: 8.5px;
      color: #6B8077;
      line-height: 1.4;
    }
    .sign-box {
      text-align: center;
      min-width: 48mm;
    }
    .seal-ring {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 1.5px solid #10231D;
      border-radius: 99px;
      padding: 4px 12px;
      margin-bottom: 5px;
      color: #10231D;
      font-size: 7.5px;
      font-weight: 800;
      letter-spacing: 0.7px;
      text-transform: uppercase;
      background: rgba(233, 162, 59, 0.10);
    }
    .sign-line {
      border-top: 1px solid #10231D;
      padding-top: 3px;
      font-size: 9px;
      font-weight: 800;
      color: #10231D;
    }
    .thank-you {
      text-align: center;
      margin-top: 5mm;
      font-size: 9.5px;
      font-weight: 700;
      color: #3D524A;
      letter-spacing: 0.3px;
    }
  </style>
</head>
<body>
  <div class="a4-page">
    <div class="top-accent-bar"></div>
    <div class="bottom-accent-bar"></div>

    <!-- Watermark Layer -->
    <div class="watermark-layer">
      <img src="${esc(logoSrc)}" alt="" class="watermark-logo" />
      <div class="watermark-diagonal">${esc(businessName.toUpperCase())}</div>
      <div class="watermark-status-stamp">${isPaid ? 'PAID IN FULL' : 'OFFICIAL BILL'}</div>
    </div>

    <!-- Foreground Content -->
    <div class="content-layer">
      <!-- Header -->
      <div class="header-row">
        <div class="brand-box">
          <img src="${esc(logoSrc)}" alt="${esc(businessName)}" class="brand-logo" />
          <div>
            <h1 class="brand-name">${esc(businessName)}</h1>
            <p class="brand-tag">${esc(businessTagline)}</p>
            <div class="brand-meta">
              <div><strong>Head Office:</strong> ${esc(businessAddress)}</div>
              <div><strong>Helpline:</strong> ${esc(businessPhone)} &nbsp;|&nbsp; <strong>Email:</strong> ${esc(businessEmail)}</div>
              ${gstNumber ? `<div><strong>GSTIN:</strong> ${esc(gstNumber)}</div>` : ''}
            </div>
          </div>
        </div>

        <div class="invoice-meta-box">
          <div class="doc-badge">${gstAmount > 0 ? 'Tax Invoice & Receipt' : 'Service Bill & Receipt'}</div>
          <table class="meta-table">
            <tr>
              <td class="meta-label">Receipt No:</td>
              <td class="meta-val">${esc(invoiceNo)}</td>
            </tr>
            <tr>
              <td class="meta-label">Booking ID:</td>
              <td class="meta-val">${esc(bookingCode)}</td>
            </tr>
            <tr>
              <td class="meta-label">Issue Date:</td>
              <td class="meta-val">${esc(createdDate)}</td>
            </tr>
            <tr>
              <td class="meta-label">Status:</td>
              <td class="meta-val">${esc(statusText)}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Billed To & Service Dispatch Info -->
      <div class="info-grid">
        <div class="info-card">
          <h3 class="card-heading">Billed To & Service Location</h3>
          <div class="cust-name">${esc(customerName)}</div>
          <div class="info-line"><strong>Phone:</strong> ${esc(customerPhone)}</div>
          ${customerEmail ? `<div class="info-line"><strong>Email:</strong> ${esc(customerEmail)}</div>` : ''}
          <div class="info-line"><strong>Address:</strong> ${esc(fullAddress)}</div>
        </div>

        <div class="info-card">
          <h3 class="card-heading">Schedule & Payment Details</h3>
          <div class="info-line"><strong>Service Date:</strong> ${esc(serviceDate)}</div>
          <div class="info-line"><strong>Arrival Slot:</strong> ${esc(serviceWindow)}</div>
          ${supName ? `<div class="info-line"><strong>Supervisor:</strong> ${esc(supName)}${supPhone ? ` (${esc(supPhone)})` : ''}</div>` : ''}
          <div class="info-line">
            <strong>Payment:</strong> <span class="status-pill">${isPaid ? 'Paid' : 'Pending'}</span>
            &nbsp;(${esc(paymentModeLabel)})
          </div>
          ${txId ? `<div class="info-line"><strong>Txn / Ref ID:</strong> <span style="font-family:monospace;">${esc(txId)}</span>${paidAtStr ? ` · ${esc(paidAtStr)}` : ''}</div>` : ''}
        </div>
      </div>

      <!-- Services Table -->
      <div class="items-section">
        <table class="items-table">
          <thead>
            <tr>
              <th class="col-num">#</th>
              <th class="col-desc">Service Description &amp; Package</th>
              <th class="col-qty">Qty</th>
              <th class="col-rate">Rate</th>
              <th class="col-amt">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemRowsHtml || `
              <tr>
                <td colspan="5" style="text-align:center; padding:16px; color:#6B8077;">No itemized services listed</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>

      <!-- Terms & Totals -->
      <div class="summary-row">
        <div class="notes-box">
          <h3 class="card-heading">Service Assurance &amp; Terms</h3>
          <ul>
            <li><strong>48-Hour Re-Clean Guarantee:</strong> Report any missed spot within 48 hours for a complimentary touch-up.</li>
            <li><strong>Eco-Safe Chemicals:</strong> Industrial Taski / Diversty hospital-grade solutions safe for kids &amp; pets.</li>
            <li><strong>OTP Verification:</strong> Service completion &amp; supervisor visit verified via customer arrival OTP.</li>
            ${booking.notes ? `<li><strong>Customer Note:</strong> "${esc(booking.notes)}"</li>` : ''}
          </ul>
        </div>

        <div class="totals-box">
          <h3 class="card-heading">Billing Summary</h3>
          ${mrpTotal > subtotal ? `
            <div class="tot-line">
              <span>Standard MRP Total</span>
              <span class="tot-val" style="text-decoration:line-through; color:#9CA3AF;">${formatINR(mrpTotal)}</span>
            </div>
            <div class="tot-line discount">
              <span>Special Offer Savings</span>
              <span class="tot-val">-${formatINR(packageDiscount)}</span>
            </div>
          ` : ''}
          <div class="tot-line">
            <span>Services Subtotal</span>
            <span class="tot-val">${formatINR(subtotal)}</span>
          </div>
          ${outstationSurcharge > 0 ? `
            <div class="tot-line">
              <span>Outstation Travel Surcharge</span>
              <span class="tot-val">+${formatINR(outstationSurcharge)}</span>
            </div>
          ` : ''}
          ${couponDiscount > 0 ? `
            <div class="tot-line discount">
              <span>Coupon Applied ${couponCode ? `(${esc(couponCode)})` : ''}</span>
              <span class="tot-val">-${formatINR(couponDiscount)}</span>
            </div>
          ` : ''}
          ${platformChargeAmount > 0 ? `
            <div class="tot-line">
              <span>${esc(platformChargeLabel)}</span>
              <span class="tot-val">+${formatINR(platformChargeAmount)}</span>
            </div>
          ` : ''}
          ${gstAmount > 0 ? `
            <div class="tot-line">
              <span>GST (${gstPercentage}%)</span>
              <span class="tot-val">+${formatINR(gstAmount)}</span>
            </div>
          ` : ''}

          <div class="grand-total-bar">
            <span>${isPaid ? 'Total Amount Paid' : 'Total Payable'}</span>
            <span class="grand-total-amt">${formatINR(grandTotal)}</span>
          </div>

          ${customerSaved > 0 ? `
            <div class="saved-banner">
              Total Customer Savings: ${formatINR(customerSaved)}
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Footer & Signatory -->
      <div>
        <div class="footer-sign-row">
          <div class="declaration">
            <strong>Declaration:</strong> This is a system-generated official bill and service receipt issued by ${esc(businessName)}. All prices and taxes shown reflect the confirmed service summary for Booking #${esc(bookingCode)}. For billing support, reach us at ${esc(businessPhone)}.
          </div>
          <div class="sign-box">
            <div class="seal-ring">
              <span>${esc(businessName)}</span>
              <span>• Verified Digital Seal •</span>
            </div>
            <div class="sign-line">Authorized Signatory</div>
          </div>
        </div>
        <div class="thank-you">
          Thank you for choosing ${esc(businessName)} — Spotless Homes. Zero Stress.
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  // Create invisible iframe for clean A4 print / Save as PDF without popup blocker issues
  const existingIframe = document.getElementById('max-print-receipt-frame');
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'max-print-receipt-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  const triggerPrint = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      console.error('Print trigger error:', err);
    }
    setTimeout(() => {
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 60000);
  };

  // Ensure images inside iframe are decoded before opening print preview
  if (iframe.contentWindow.document.readyState === 'complete') {
    setTimeout(triggerPrint, 250);
  } else {
    iframe.onload = () => setTimeout(triggerPrint, 250);
  }
}

