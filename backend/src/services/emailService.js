import { getEmailTransporter } from '../config/email.js';

const BRAND_NAME = 'Max House Keeping Service';
const BRAND_COLOR = '#E9A23B';
const BRAND_DARK = '#10231D';
const BRAND_BG = '#F4EFE6';
const SUPPORT_PHONE = '+91 98977 66002';
const SUPPORT_EMAIL = 'contact@maxhousekeepingservice.com';

/**
 * Standard Email Shell Template with Brand Styling
 */
function emailShell({ title, preheader, content }) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { margin: 0; padding: 0; background-color: #ECE5D8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #10231D; }
        .container { max-width: 600px; margin: 24px auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(16, 35, 29, 0.08); }
        .header { background-color: ${BRAND_DARK}; padding: 32px 24px; text-align: center; color: #FFFFFF; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0; font-size: 13px; color: ${BRAND_COLOR}; font-weight: 600; letter-spacing: 0.5px; }
        .content { padding: 32px 28px; }
        .badge { display: inline-block; padding: 6px 14px; background-color: ${BRAND_BG}; border-radius: 999px; font-size: 12px; font-weight: 700; color: ${BRAND_DARK}; }
        .highlight-box { background-color: ${BRAND_BG}; border-left: 4px solid ${BRAND_COLOR}; padding: 16px 20px; border-radius: 8px; margin: 20px 0; }
        .table-wrap { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table-wrap th { text-align: left; padding: 10px 12px; background-color: ${BRAND_BG}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6B8077; }
        .table-wrap td { padding: 12px; border-bottom: 1px solid #ECE5D8; font-size: 14px; }
        .total-row { background-color: #FAF7F2; font-weight: bold; }
        .footer { background-color: #FAF7F2; padding: 24px; text-align: center; font-size: 12px; color: #6B8077; border-top: 1px solid #ECE5D8; }
        .footer a { color: ${BRAND_COLOR}; text-decoration: none; font-weight: 600; }
        .btn { display: inline-block; padding: 12px 28px; background-color: ${BRAND_COLOR}; color: #181511 !important; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 14px; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div style="display: none; max-height: 0px; overflow: hidden;">${preheader || title}</div>
      <div class="container">
        <div class="header">
          <h1>${BRAND_NAME}</h1>
          <p>Professional Cleaning & Housekeeping Across Western UP</p>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p style="margin: 0 0 8px;"><strong>Dispatch Hotline:</strong> <a href="tel:9897766002">${SUPPORT_PHONE}</a> · <strong>Email:</strong> <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
          <p style="margin: 0 0 8px;">Serving Moradabad, Rampur, Bareilly, Meerut, Sambhal, Amroha & neighboring cities.</p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Max Housekeeping Service. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send Booking Confirmation Email to Customer
 */
export async function sendBookingConfirmationEmail({ booking, customerEmail }) {
  const recipient = customerEmail || booking.customer?.email;
  if (!recipient) {
    console.log(`[Email Info] No customer email provided for booking ${booking.bookingCode}. Skipping customer confirmation email.`);
    return { skipped: true };
  }

  const itemsRows = (booking.items || []).map(i => `
    <tr>
      <td><strong>${i.titleSnapshot || i.title || 'Service'}</strong><br><small style="color:#6B8077;">${i.variantSnapshot || ''}</small></td>
      <td style="text-align: center;">${i.qty || 1}</td>
      <td style="text-align: right; font-weight: 700;">₹${Number(i.priceSnapshot || i.price || 0).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const total = booking.totals?.total || booking.total || 0;
  const savings = booking.totals?.customerSaved || 0;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge">Reference: ${booking.bookingCode}</span>
      <h2 style="margin: 12px 0 6px; font-size: 22px; color: ${BRAND_DARK};">Booking Confirmed!</h2>
      <p style="margin: 0; color: #3D524A; font-size: 14px;">Thank you, <strong>${booking.customer?.name}</strong>. Your service appointment is scheduled.</p>
    </div>

    <div class="highlight-box">
      <p style="margin: 0 0 6px;"><strong>Scheduled Date:</strong> ${booking.slot?.date || 'To be confirmed'}</p>
      <p style="margin: 0 0 6px;"><strong>Arrival Window:</strong> ${booking.slot?.window || 'Standard Window'}</p>
      <p style="margin: 0 0 6px;"><strong>Service Address:</strong> ${booking.address?.line1}, ${booking.address?.cityText || booking.cityName} - ${booking.address?.pincode}</p>
      <p style="margin: 0;"><strong>Payment Mode:</strong> ${booking.paymentMode === 'cash_on_service' ? 'Cash on Service' : booking.paymentMode}</p>
    </div>

    <h3 style="font-size: 15px; margin: 24px 0 8px; color: ${BRAND_DARK};">Service Summary</h3>
    <table class="table-wrap">
      <thead>
        <tr>
          <th>Service</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
        <tr class="total-row">
          <td colspan="2">Total Payable</td>
          <td style="text-align: right; font-size: 16px; color: ${BRAND_DARK};">₹${Number(total).toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>

    ${savings > 0 ? `
      <div style="background-color: #EBF7EE; color: #1E663B; padding: 10px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; text-align: center; margin-bottom: 20px;">
        🎉 You saved ₹${Number(savings).toLocaleString('en-IN')} on this booking!
      </div>
    ` : ''}

    <p style="font-size: 13px; color: #3D524A; line-height: 1.5;">
      Our verified crew will arrive equipped with specialized industrial equipment and eco-safe cleaning supplies. If you need to reschedule or speak with the supervisor, reach us anytime.
    </p>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/track/${booking.bookingCode}" class="btn">
        Track Your Booking Live
      </a>
    </div>
  `;

  const html = emailShell({
    title: `Booking Confirmation - ${booking.bookingCode}`,
    preheader: `Your cleaning service is confirmed for ${booking.slot?.date} (${booking.slot?.window})`,
    content
  });

  const mailer = getEmailTransporter();
  const subject = `Booking Confirmed: ${booking.bookingCode} - Max Housekeeping Service`;

  if (!mailer) {
    console.log(`[Email Simulator] Customer Booking Confirmation to ${recipient} | Code: ${booking.bookingCode} | Total: ₹${total}`);
    return { success: true, simulated: true };
  }

  try {
    const info = await mailer.sendMail({
      from: `"${BRAND_NAME}" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject,
      html
    });
    console.log(`[Email] Customer booking confirmation sent to ${recipient}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email Error] Failed customer booking confirmation:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send New Booking Notification to Admin
 */
export async function sendAdminNewBookingNotification({ booking }) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || SUPPORT_EMAIL;

  const itemsSummary = (booking.items || []).map(i => 
    `- ${i.titleSnapshot || i.title || 'Service'} (Qty: ${i.qty || 1}) - ₹${i.priceSnapshot || i.price || 0}`
  ).join('<br>');

  const content = `
    <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px;">
      <strong style="color: #92400E; font-size: 15px;">🚨 New Booking Received</strong>
      <p style="margin: 4px 0 0; color: #78350F; font-size: 13px;">Booking Reference: <strong>${booking.bookingCode}</strong></p>
    </div>

    <table class="table-wrap">
      <tr>
        <td style="width: 35%; color: #6B8077;"><strong>Customer</strong></td>
        <td><strong>${booking.customer?.name}</strong> (${booking.customer?.phone}) ${booking.customer?.email ? `<br><small>${booking.customer?.email}</small>` : ''}</td>
      </tr>
      <tr>
        <td style="color: #6B8077;"><strong>Location / City</strong></td>
        <td>${booking.cityName || booking.address?.cityText} (PIN: ${booking.address?.pincode})</td>
      </tr>
      <tr>
        <td style="color: #6B8077;"><strong>Full Address</strong></td>
        <td>${booking.address?.line1} ${booking.address?.landmark ? `<br>Landmark: ${booking.address?.landmark}` : ''}</td>
      </tr>
      <tr>
        <td style="color: #6B8077;"><strong>Scheduled Slot</strong></td>
        <td><strong>${booking.slot?.date}</strong> · ${booking.slot?.window}</td>
      </tr>
      <tr>
        <td style="color: #6B8077;"><strong>Total Amount</strong></td>
        <td><strong style="font-size: 16px; color: ${BRAND_DARK};">₹${Number(booking.totals?.total || 0).toLocaleString('en-IN')}</strong> (${booking.paymentMode})</td>
      </tr>
      <tr>
        <td style="color: #6B8077;"><strong>Services Booked</strong></td>
        <td>${itemsSummary}</td>
      </tr>
      ${booking.notes ? `
        <tr>
          <td style="color: #6B8077;"><strong>Customer Notes</strong></td>
          <td style="font-style: italic;">"${booking.notes}"</td>
        </tr>
      ` : ''}
    </table>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin" class="btn">
        Open Admin Panel to Assign Crew
      </a>
    </div>
  `;

  const html = emailShell({
    title: `New Booking Alert - ${booking.bookingCode}`,
    preheader: `New booking from ${booking.customer?.name} in ${booking.cityName} for ₹${booking.totals?.total}`,
    content
  });

  const mailer = getEmailTransporter();
  const subject = `[New Booking] ${booking.bookingCode} - ${booking.customer?.name} (${booking.cityName}) - ₹${booking.totals?.total}`;

  if (!mailer) {
    console.log(`[Email Simulator] Admin New Booking Alert to ${adminEmail} | Code: ${booking.bookingCode} | Customer: ${booking.customer?.name} (${booking.customer?.phone})`);
    return { success: true, simulated: true };
  }

  try {
    const info = await mailer.sendMail({
      from: `"${BRAND_NAME} System" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject,
      html
    });
    console.log(`[Email] Admin notification sent to ${adminEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email Error] Failed admin booking notification:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send Booking Status Update Email to Customer
 */
export async function sendBookingStatusUpdateEmail({ booking, previousStatus, newStatus, note, assignedCrew }) {
  const recipient = booking.customer?.email;
  if (!recipient) {
    return { skipped: true, reason: 'No customer email on record' };
  }

  const statusLabels = {
    pending: 'Pending Review',
    confirmed: 'Confirmed & Scheduled',
    in_progress: 'In Progress (Crew On Site)',
    completed: 'Service Successfully Completed',
    cancelled: 'Cancelled'
  };

  const statusColors = {
    pending: '#F59E0B',
    confirmed: '#10B981',
    in_progress: '#3B82F6',
    completed: '#059669',
    cancelled: '#EF4444'
  };

  const currentLabel = statusLabels[newStatus] || newStatus.toUpperCase();
  const badgeColor = statusColors[newStatus] || BRAND_COLOR;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge">Reference: ${booking.bookingCode}</span>
      <h2 style="margin: 12px 0 6px; font-size: 22px; color: ${BRAND_DARK};">Booking Status Updated</h2>
      <div style="display: inline-block; padding: 6px 16px; border-radius: 999px; background-color: ${badgeColor}20; color: ${badgeColor}; font-weight: 800; font-size: 14px; margin-top: 6px;">
        ● ${currentLabel}
      </div>
    </div>

    <p style="font-size: 14px; color: #3D524A; line-height: 1.5;">
      Hello <strong>${booking.customer?.name}</strong>, your booking <strong>${booking.bookingCode}</strong> has been updated.
    </p>

    <div class="highlight-box">
      <p style="margin: 0 0 6px;"><strong>Scheduled Date:</strong> ${booking.slot?.date}</p>
      <p style="margin: 0 0 6px;"><strong>Time Window:</strong> ${booking.slot?.window}</p>
      ${assignedCrew?.leadName ? `<p style="margin: 0 0 6px;"><strong>Assigned Crew Lead:</strong> ${assignedCrew.leadName} (${assignedCrew.leadPhone || 'Dispatched'})</p>` : ''}
      ${note ? `<p style="margin: 0; color: #6B8077; font-style: italic;">Update Note: "${note}"</p>` : ''}
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/track/${booking.bookingCode}" class="btn">
        View Booking Live Status
      </a>
    </div>
  `;

  const html = emailShell({
    title: `Booking Update - ${booking.bookingCode}`,
    preheader: `Your booking status is now: ${currentLabel}`,
    content
  });

  const mailer = getEmailTransporter();
  const subject = `Booking Update: ${booking.bookingCode} is now ${currentLabel}`;

  if (!mailer) {
    console.log(`[Email Simulator] Customer Status Update to ${recipient} | Code: ${booking.bookingCode} | Status: ${newStatus}`);
    return { success: true, simulated: true };
  }

  try {
    const info = await mailer.sendMail({
      from: `"${BRAND_NAME}" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject,
      html
    });
    console.log(`[Email] Status update sent to ${recipient}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email Error] Failed status update email:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send Contact Form Confirmation to Customer (User)
 */
export async function sendContactConfirmationToUser({ contact }) {
  if (!contact.email) {
    return { skipped: true, reason: 'No email provided in contact form' };
  }

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="margin: 0 0 8px; font-size: 22px; color: ${BRAND_DARK};">We've Received Your Message!</h2>
      <p style="margin: 0; color: #3D524A; font-size: 14px;">Thank you for getting in touch with Max Housekeeping Service.</p>
    </div>

    <div class="highlight-box">
      <p style="margin: 0 0 8px;"><strong>Subject:</strong> ${contact.subject || 'General Inquiry'}</p>
      <p style="margin: 0; font-style: italic; color: #3D524A;">"${contact.message}"</p>
    </div>

    <p style="font-size: 14px; color: #3D524A; line-height: 1.6;">
      Dear <strong>${contact.name}</strong>,<br><br>
      Our customer support and field dispatch team has received your inquiry. One of our supervisors will review your requirements and reach back out to you shortly via phone (<strong>${contact.phone}</strong>) or email.
    </p>

    <div style="margin-top: 24px; padding: 16px; background-color: #FAF7F2; border-radius: 8px; text-align: center; font-size: 13px;">
      Need immediate assistance? Call our direct hotline anytime at <a href="tel:9897766002" style="color: ${BRAND_COLOR}; font-weight: bold;">+91 98977 66002</a>.
    </div>
  `;

  const html = emailShell({
    title: `Inquiry Received - Max Housekeeping Service`,
    preheader: `Thank you for contacting us! Our team will reach back out shortly.`,
    content
  });

  const mailer = getEmailTransporter();
  const subject = `We've received your message - Max Housekeeping Service`;

  if (!mailer) {
    console.log(`[Email Simulator] Contact Confirmation to User ${contact.email} | Sender: ${contact.name}`);
    return { success: true, simulated: true };
  }

  try {
    const info = await mailer.sendMail({
      from: `"${BRAND_NAME}" <${process.env.EMAIL_USER}>`,
      to: contact.email,
      subject,
      html
    });
    console.log(`[Email] Contact confirmation sent to user ${contact.email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email Error] Failed contact confirmation to user:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send Contact Form Notification to Admin
 */
export async function sendContactNotificationToAdmin({ contact }) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || SUPPORT_EMAIL;

  const content = `
    <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px;">
      <strong style="color: #92400E; font-size: 15px;">📩 New Contact Inquiry Received</strong>
      <p style="margin: 4px 0 0; color: #78350F; font-size: 13px;">Submitted on ${new Date().toLocaleString('en-IN')}</p>
    </div>

    <table class="table-wrap">
      <tr>
        <td style="width: 30%; color: #6B8077;"><strong>Name</strong></td>
        <td><strong>${contact.name}</strong></td>
      </tr>
      <tr>
        <td style="color: #6B8077;"><strong>Phone</strong></td>
        <td><a href="tel:${contact.phone}" style="color: #10231D; font-weight: bold;">${contact.phone}</a></td>
      </tr>
      <tr>
        <td style="color: #6B8077;"><strong>Email</strong></td>
        <td>${contact.email ? `<a href="mailto:${contact.email}">${contact.email}</a>` : 'Not provided'}</td>
      </tr>
      <tr>
        <td style="color: #6B8077;"><strong>Subject</strong></td>
        <td>${contact.subject || 'General Inquiry'}</td>
      </tr>
      <tr>
        <td style="color: #6B8077;"><strong>Message</strong></td>
        <td style="line-height: 1.5; white-space: pre-wrap;">${contact.message}</td>
      </tr>
    </table>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin" class="btn">
        View in Admin Dashboard
      </a>
    </div>
  `;

  const html = emailShell({
    title: `New Contact Form Submission - ${contact.name}`,
    preheader: `Inquiry from ${contact.name} (${contact.phone}): ${contact.subject || contact.message.slice(0, 50)}`,
    content
  });

  const mailer = getEmailTransporter();
  const subject = `[Contact Form] ${contact.subject || 'New Message'} - from ${contact.name} (${contact.phone})`;

  if (!mailer) {
    console.log(`[Email Simulator] Admin Contact Alert to ${adminEmail} | From: ${contact.name} (${contact.phone}) | Message: "${contact.message.slice(0, 60)}..."`);
    return { success: true, simulated: true };
  }

  try {
    const info = await mailer.sendMail({
      from: `"${BRAND_NAME} System" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject,
      html
    });
    console.log(`[Email] Admin contact notification sent to ${adminEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email Error] Failed admin contact notification:`, err.message);
    return { success: false, error: err.message };
  }
}

export default {
  sendBookingConfirmationEmail,
  sendAdminNewBookingNotification,
  sendBookingStatusUpdateEmail,
  sendContactConfirmationToUser,
  sendContactNotificationToAdmin
};
