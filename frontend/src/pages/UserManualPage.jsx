import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LuBookOpen,
  LuSparkles,
  LuMapPin,
  LuCalendar,
  LuClock,
  LuCreditCard,
  LuShieldCheck,
  LuNavigation,
  LuRotateCcw,
  LuCheck,
  LuPhone,
  LuMail,
  LuArrowRight,
  LuCircleAlert,
  LuBan,
  LuFileText,
  LuCompass,
  LuUser,
  LuSearch
} from 'react-icons/lu';
import SEO from '../components/common/SEO';
import FAQSection from '../components/common/FAQSection';

export default function UserManualPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [filterQuery, setFilterQuery] = useState('');

  const sections = [
    { id: 'overview', title: '1. Service Overview & City Coverage', icon: LuCompass },
    { id: 'booking-flow', title: '2. How to Book a Service Step-by-Step', icon: LuSparkles },
    { id: 'address-pinpoint', title: '3. Address Pinpoint & Locate Me', icon: LuMapPin },
    { id: 'scheduling-closed', title: '4. Scheduling & Closed/Blackout Dates', icon: LuCalendar },
    { id: 'pricing-payment', title: '5. Transparent Pricing & Payment Methods', icon: LuCreditCard },
    { id: 'live-tracking', title: '6. Live Supervisor GPS Radar Tracking', icon: LuNavigation },
    { id: 'dashboard-manage', title: '7. Customer Dashboard & Rescheduling', icon: LuRotateCcw },
    { id: 'account-otp', title: '8. Account Security & 6-Digit Email OTP', icon: LuShieldCheck },
    { id: 'safety-chemicals', title: '9. Chemicals, Machinery & Quality Guarantee', icon: LuCheck },
    { id: 'support-contacts', title: '10. Helpline & Support Escalations', icon: LuPhone }
  ];

  const scrollTo = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#10231D] pb-16">
      <SEO
        title="User Manual & Platform Guide | Max Housekeeping Service"
        description="Complete customer user manual and step-by-step guide for booking professional cleaning services, transparent doorstep pricing, live supervisor radar tracking, and account management."
      />

      {/* Hero Banner */}
      <div className="bg-[#10231D] text-[#F4EFE6] pt-12 pb-16 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#E9A23B_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-[#E9A23B] text-xs font-mono font-bold uppercase tracking-wider mb-4 border border-white/15">
            <LuBookOpen className="w-4 h-4" />
            <span>Official Platform Documentation</span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-[#F4EFE6] tracking-tight leading-tight">
            User Manual & Service Guide
          </h1>

          <p className="mt-4 text-base sm:text-lg text-[#BED6CC] max-w-3xl mx-auto leading-relaxed">
            Everything you need to know about booking verified doorstep cleaning squads, using live supervisor GPS radar tracking, managing your reservations, and enjoying spotless quality across Western Uttar Pradesh.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/book"
              className="px-6 py-3.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#10231D] font-black text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span>Book a Service Now</span>
              <LuArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/track"
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#F4EFE6] font-bold text-sm transition-all border border-white/20 flex items-center gap-2 cursor-pointer"
            >
              <LuNavigation className="w-4 h-4 text-[#E9A23B]" />
              <span>Track Live Booking</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Container with Sticky Sidebar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Quick Jump Sidebar (Sticky Desktop) */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="p-5 rounded-3xl bg-[#ECE5D8] border border-[#E2D9C8] shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#D2C8B8]">
                <span className="font-display font-bold text-sm text-[#10231D] uppercase tracking-wider">
                  Table of Contents
                </span>
                <span className="text-[11px] font-mono font-bold text-[#6B8077]">10 Chapters</span>
              </div>

              <nav className="space-y-1">
                {sections.map((sec) => {
                  const Icon = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollTo(sec.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                        isActive
                          ? 'bg-[#10231D] text-[#F4EFE6] shadow-xs'
                          : 'text-[#3D524A] hover:bg-[#F4EFE6] hover:text-[#10231D]'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#E9A23B]' : 'text-[#6B8077]'}`} />
                      <span className="truncate">{sec.title}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-5 pt-4 border-t border-[#D2C8B8] space-y-2 text-xs">
                <span className="font-bold text-[#10231D] block">Direct Operations Helpline:</span>
                <a
                  href="tel:+919897766002"
                  className="flex items-center gap-2 text-[#C2512D] font-mono font-bold hover:underline"
                >
                  <LuPhone className="w-3.5 h-3.5" />
                  <span>+91 98977 66002</span>
                </a>
                <a
                  href="mailto:contactmaxhousekeepingservice@gmail.com"
                  className="flex items-center gap-2 text-[#3D524A] font-medium hover:underline truncate"
                >
                  <LuMail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">contactmaxhousekeeping...</span>
                </a>
              </div>
            </div>
          </div>

          {/* Detailed Documentation Chapters */}
          <div className="lg:col-span-8 space-y-8">

            {/* Chapter 1: Service Overview & City Coverage */}
            <article id="overview" className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2D9C8] shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#DDEBE4] text-[#10231D] flex items-center justify-center font-bold">
                  <LuCompass className="w-5 h-5 text-[#10231D]" />
                </div>
                <div>
                  <h2 className="font-display font-black text-xl text-[#10231D]">
                    1. Service Overview & City Coverage
                  </h2>
                  <p className="text-xs text-[#6B8077]">Our operational hubs and verified coverage areas</p>
                </div>
              </div>

              <p className="text-sm text-[#3D524A] leading-relaxed">
                Max Housekeeping Service operates a managed fleet of professionally trained cleaning technicians, industrial steam machinery, and field operations supervisors across Western Uttar Pradesh.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8]">
                  <span className="font-bold text-xs text-[#10231D] block mb-1">
                    Central Operational Hub (Moradabad)
                  </span>
                  <p className="text-xs text-[#3D524A]">
                    Zero outstation travel fee across pincodes <strong>244001 to 244104</strong>. All services, including Deep Villa Cleaning, Kitchen Degreasing, Sofa Extraction, and Marble Buffing are available 7 days a week.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8]">
                  <span className="font-bold text-xs text-[#10231D] block mb-1">
                    Active Outstation City Network
                  </span>
                  <p className="text-xs text-[#3D524A]">
                    Scheduled squad visits to <strong>Rampur, Sambhal, Amroha, Chandausi, and Kashipur</strong> with nominal, upfront outstation travel distance fees clearly itemized at checkout.
                  </p>
                </div>
              </div>
            </article>

            {/* Chapter 2: How to Book Step-by-Step */}
            <article id="booking-flow" className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2D9C8] shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FEEED8] text-[#E9A23B] flex items-center justify-center font-bold">
                  <LuSparkles className="w-5 h-5 text-[#E9A23B]" />
                </div>
                <div>
                  <h2 className="font-display font-black text-xl text-[#10231D]">
                    2. How to Book a Service Step-by-Step
                  </h2>
                  <p className="text-xs text-[#6B8077]">Complete walk-through of the online reservation process</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-xs text-[#3D524A]">
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#10231D] text-[#F4EFE6] flex items-center justify-center font-mono font-bold shrink-0 text-[11px]">1</span>
                  <p className="pt-0.5 leading-relaxed">
                    <strong className="text-[#10231D]">Select Your Services:</strong> Go to the booking page or click "Book Now" on any service card. You can configure quantities (e.g. 3-Seater Sofa Wash, 2 Bathrooms, or 2000 sq ft Full Home Deep Clean).
                  </p>
                </div>

                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#10231D] text-[#F4EFE6] flex items-center justify-center font-mono font-bold shrink-0 text-[11px]">2</span>
                  <p className="pt-0.5 leading-relaxed">
                    <strong className="text-[#10231D]">Log In or Register with 6-Digit Email OTP:</strong> Signing in preserves your booking history, allows live GPS tracking, and enables 1-click address retrieval for future bookings.
                  </p>
                </div>

                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#10231D] text-[#F4EFE6] flex items-center justify-center font-mono font-bold shrink-0 text-[11px]">3</span>
                  <p className="pt-0.5 leading-relaxed">
                    <strong className="text-[#10231D]">Enter Service Address:</strong> Use your saved profile address, or type a new address with autocomplete suggestions and Google Maps pinpointing.
                  </p>
                </div>

                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#10231D] text-[#F4EFE6] flex items-center justify-center font-mono font-bold shrink-0 text-[11px]">4</span>
                  <p className="pt-0.5 leading-relaxed">
                    <strong className="text-[#10231D]">Choose Arrival Date & Time Window:</strong> Select an open date from the upcoming dropdown or calendar, and choose one of the 4 standard 3-hour arrival windows.
                  </p>
                </div>

                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#10231D] text-[#F4EFE6] flex items-center justify-center font-mono font-bold shrink-0 text-[11px]">5</span>
                  <p className="pt-0.5 leading-relaxed">
                    <strong className="text-[#10231D]">Choose Payment Mode & Confirm:</strong> Select "Pay on Service Completion (Cash/UPI)" or "Pay Online Now via Razorpay". You will receive an instant 6-character booking code (e.g. <code>#MH9842</code>).
                  </p>
                </div>
              </div>
            </article>

            {/* Chapter 3: Address Pinpoint & Locate Me */}
            <article id="address-pinpoint" className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2D9C8] shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#DDEBE4] text-[#10231D] flex items-center justify-center font-bold">
                  <LuMapPin className="w-5 h-5 text-[#10231D]" />
                </div>
                <div>
                  <h2 className="font-display font-black text-xl text-[#10231D]">
                    3. Address Pinpoint & Locate Me
                  </h2>
                  <p className="text-xs text-[#6B8077]">Ensure zero arrival confusion for your crew</p>
                </div>
              </div>

              <p className="text-sm text-[#3D524A] leading-relaxed">
                Our high-precision GPS dispatch system ensures the cleaning team arrives right at your gate without calling for directions repeatedly:
              </p>

              <div className="space-y-2 text-xs text-[#3D524A]">
                <div className="p-3 bg-[#F4EFE6] rounded-xl border border-[#E2D9C8]">
                  <strong className="text-[#10231D] block mb-0.5">Typing with Auto-Recommendations:</strong>
                  As you type your street or locality, Google Places provides dropdown recommendations. Selecting one instantly centers the map and extracts the pincode and city automatically.
                </div>
                <div className="p-3 bg-[#F4EFE6] rounded-xl border border-[#E2D9C8]">
                  <strong className="text-[#10231D] block mb-0.5">Locate Me (One-Tap GPS):</strong>
                  Tap the "Locate Me" button to retrieve your device's exact GPS coordinates. The interactive pin will drop precisely on your building and auto-fill the address fields.
                </div>
                <div className="p-3 bg-[#F4EFE6] rounded-xl border border-[#E2D9C8]">
                  <strong className="text-[#10231D] block mb-0.5">Save to Profile:</strong>
                  Check "Save this address to my profile" to keep it stored in your Customer Dashboard for 1-click repeat bookings.
                </div>
              </div>
            </article>

            {/* Chapter 4: Scheduling & Closed/Blackout Dates */}
            <article id="scheduling-closed" className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2D9C8] shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FDE8E4] text-[#C2512D] flex items-center justify-center font-bold">
                  <LuCalendar className="w-5 h-5 text-[#C2512D]" />
                </div>
                <div>
                  <h2 className="font-display font-black text-xl text-[#10231D]">
                    4. Scheduling & Closed/Blackout Dates
                  </h2>
                  <p className="text-xs text-[#6B8077]">Understanding capacity controls and date availability</p>
                </div>
              </div>

              <p className="text-sm text-[#3D524A] leading-relaxed">
                Max Housekeeping operates under a strict quality commitment: every squad must have full equipment and an assigned supervisor. To prevent overbooking, operations dynamically closes dates when squads reach maximum daily capacity.
              </p>

              <div className="p-4 rounded-2xl bg-[#FFF6E5] border border-[#E9A23B]/40 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#10231D] font-bold">
                  <LuCircleAlert className="w-4 h-4 text-[#E9A23B]" />
                  <span>How Closed Dates Appear to Customers:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[#3D524A]">
                  <li><strong>Notice Banner:</strong> If today or upcoming dates are closed, a notice banner highlights them at the top of the date picker with the reason (e.g. <em>"Sorry, completely booked!"</em> or <em>"Public Holiday / Festival"</em>).</li>
                  <li><strong>Disabled in Dropdown:</strong> Closed dates are grayed out with <code>disabled</code> state in the upcoming date dropdown so they cannot be selected.</li>
                  <li><strong>Calendar Block:</strong> If manually picked, the system alerts you and asks you to pick the nearest available open date.</li>
                  <li><strong>Expired Dates:</strong> Past dates that have already passed are automatically excluded and never shown.</li>
                </ul>
              </div>
            </article>

            {/* Chapter 5: Transparent Pricing & Payments */}
            <article id="pricing-payment" className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2D9C8] shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#DDEBE4] text-[#10231D] flex items-center justify-center font-bold">
                  <LuCreditCard className="w-5 h-5 text-[#10231D]" />
                </div>
                <div>
                  <h2 className="font-display font-black text-xl text-[#10231D]">
                    5. Transparent Pricing & Payment Methods
                  </h2>
                  <p className="text-xs text-[#6B8077]">Clear invoices, no hidden add-ons, flexible checkout</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-[#3D524A]">
                <p className="leading-relaxed">
                  Every booking displays an itemized live bill breakdown before you place the order:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] space-y-1">
                    <span className="font-bold text-[#10231D] block">Pay on Service Completion (Default)</span>
                    <p>Pay cash or scan supervisor UPI QR code directly at your doorstep after the cleaning is finished to your satisfaction.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] space-y-1">
                    <span className="font-bold text-[#10231D] block">Online Razorpay Checkout</span>
                    <p>Prepay securely with Credit/Debit Cards, UPI (GPay, PhonePe, Paytm), or NetBanking with automated digital receipt generation.</p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E2D9C8] space-y-1">
                  <strong className="text-[#10231D] block">GST & Platform Transparency:</strong>
                  <p>If separate GST (18%) or nominal platform fees are enabled in operations, they appear clearly as separate lines. Coupon discounts (e.g. <code>MAXFIRST</code>) are deducted directly from the service subtotal.</p>
                </div>
              </div>
            </article>

            {/* Chapter 6: Live Supervisor GPS Radar Tracking */}
            <article id="live-tracking" className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2D9C8] shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FEEED8] text-[#E9A23B] flex items-center justify-center font-bold">
                  <LuNavigation className="w-5 h-5 text-[#E9A23B]" />
                </div>
                <div>
                  <h2 className="font-display font-black text-xl text-[#10231D]">
                    6. Live Supervisor GPS Radar Tracking
                  </h2>
                  <p className="text-xs text-[#6B8077]">Real-time 3-second heartbeat radar and direct phone contact</p>
                </div>
              </div>

              <p className="text-sm text-[#3D524A] leading-relaxed">
                No more wondering when your cleaners will arrive. Once our dispatch team allocates an operations supervisor, you get direct live visibility:
              </p>

              <div className="space-y-2 text-xs text-[#3D524A]">
                <div className="flex items-start gap-2 p-2.5 bg-[#F4EFE6] rounded-xl border border-[#E2D9C8]">
                  <LuCheck className="w-4 h-4 text-[#E9A23B] shrink-0 mt-0.5" />
                  <p><strong>3-Second Auto-Refresh:</strong> The tracking radar continuously pulls the supervisor's active GPS coordinates every 3 seconds with zero manual reloading required.</p>
                </div>
                <div className="flex items-start gap-2 p-2.5 bg-[#F4EFE6] rounded-xl border border-[#E2D9C8]">
                  <LuCheck className="w-4 h-4 text-[#E9A23B] shrink-0 mt-0.5" />
                  <p><strong>Supervisor Contact & Identity:</strong> View your supervisor's full name, photo, allotted cleaning squad count, and tap the green call button to speak directly with them.</p>
                </div>
                <div className="flex items-start gap-2 p-2.5 bg-[#F4EFE6] rounded-xl border border-[#E2D9C8]">
                  <LuCheck className="w-4 h-4 text-[#E9A23B] shrink-0 mt-0.5" />
                  <p><strong>Mobile Optimized Layout:</strong> Full-width tracking radar with dedicated action buttons engineered to never overlap on small phone screens.</p>
                </div>
              </div>
            </article>

            {/* Chapter 7: Customer Dashboard & Rescheduling */}
            <article id="dashboard-manage" className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2D9C8] shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#DDEBE4] text-[#10231D] flex items-center justify-center font-bold">
                  <LuRotateCcw className="w-5 h-5 text-[#10231D]" />
                </div>
                <div>
                  <h2 className="font-display font-black text-xl text-[#10231D]">
                    7. Customer Dashboard & Self-Service Management
                  </h2>
                  <p className="text-xs text-[#6B8077]">Edit arrival dates, download invoices, update profile</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-[#3D524A]">
                <p className="leading-relaxed">
                  Your Customer Dashboard (<code>/dashboard</code>) gives you full control over your cleaning appointments:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-[#F4EFE6] rounded-xl border border-[#E2D9C8] space-y-1">
                    <strong className="text-[#10231D] block">Reschedule Service</strong>
                    <p>Change your appointment date or time slot up until the supervisor departs for your home.</p>
                  </div>
                  <div className="p-3 bg-[#F4EFE6] rounded-xl border border-[#E2D9C8] space-y-1">
                    <strong className="text-[#10231D] block">Download Invoices</strong>
                    <p>Access official GST receipts and digital job cards for personal records or company expense filing.</p>
                  </div>
                  <div className="p-3 bg-[#F4EFE6] rounded-xl border border-[#E2D9C8] space-y-1">
                    <strong className="text-[#10231D] block">Rate Your Crew</strong>
                    <p>Submit 5-star ratings and feedback that directly determine supervisor recognition and bonus awards.</p>
                  </div>
                </div>
              </div>
            </article>

            {/* Chapter 8: Account Security & 6-Digit Email OTP */}
            <article id="account-otp" className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2D9C8] shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FEEED8] text-[#E9A23B] flex items-center justify-center font-bold">
                  <LuShieldCheck className="w-5 h-5 text-[#E9A23B]" />
                </div>
                <div>
                  <h2 className="font-display font-black text-xl text-[#10231D]">
                    8. Account Security & 6-Digit Email OTP
                  </h2>
                  <p className="text-xs text-[#6B8077]">Seamless sign-up verification and password recovery</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-[#3D524A] leading-relaxed">
                <p>
                  To protect your account against unauthorized access, all registrations and password resets are verified via single-use 6-digit numeric codes sent directly to your registered email:
                </p>

                <div className="p-4 bg-[#F4EFE6] rounded-2xl border border-[#E2D9C8] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#10231D]">
                    <LuCheck className="w-4 h-4 text-[#E9A23B]" />
                    <span>Forgot Password Steps:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Click <strong>Forgot Password?</strong> on the login page.</li>
                    <li>Enter your registered email address and tap <strong>Send Reset Code</strong>.</li>
                    <li>Open your email inbox (or spam folder) to find your 6-digit code.</li>
                    <li>Enter the code, set your new password (minimum 6 characters), and click <strong>Reset Password</strong>.</li>
                  </ol>
                </div>
              </div>
            </article>

            {/* Chapter 9: Chemicals, Machinery & Standards */}
            <article id="safety-chemicals" className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2D9C8] shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#DDEBE4] text-[#10231D] flex items-center justify-center font-bold">
                  <LuCheck className="w-5 h-5 text-[#10231D]" />
                </div>
                <div>
                  <h2 className="font-display font-black text-xl text-[#10231D]">
                    9. Chemicals, Machinery & Quality Guarantee
                  </h2>
                  <p className="text-xs text-[#6B8077]">Hospital-grade sanitation without toxic residues</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#3D524A]">
                <div className="p-3.5 bg-[#F4EFE6] rounded-xl border border-[#E2D9C8] space-y-1">
                  <strong className="text-[#10231D] block">Diversey / Taski Formulations:</strong>
                  <p>We use Taski R1 to R9 color-coded chemicals designed specifically for bathrooms, tiles, glass, and timber floors. Zero harsh acid fumes.</p>
                </div>
                <div className="p-3.5 bg-[#F4EFE6] rounded-xl border border-[#E2D9C8] space-y-1">
                  <strong className="text-[#10231D] block">Industrial Extraction Washers:</strong>
                  <p>7-stage foam injection and deep suction extraction for sofas, mattresses, and carpets that removes embedded dust mites and allergens.</p>
                </div>
              </div>
            </article>

            {/* Chapter 10: Helpline & Support */}
            <article id="support-contacts" className="p-6 sm:p-8 rounded-3xl bg-[#10231D] text-[#F4EFE6] shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E9A23B] text-[#10231D] flex items-center justify-center font-bold">
                  <LuPhone className="w-5 h-5 text-[#10231D]" />
                </div>
                <div>
                  <h2 className="font-display font-black text-xl text-[#F4EFE6]">
                    10. Helpline & Support Escalations
                  </h2>
                  <p className="text-xs text-[#BED6CC]">Direct contact channels for urgent assistance</p>
                </div>
              </div>

              <p className="text-xs text-[#BED6CC] leading-relaxed">
                Need immediate booking adjustments, special event coordination, or corporate facility quotation? Our customer desk is active 8:00 AM – 8:00 PM every day.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <a
                  href="tel:+919897766002"
                  className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 flex items-center gap-3 transition-colors text-[#F4EFE6]"
                >
                  <LuPhone className="w-5 h-5 text-[#E9A23B] shrink-0" />
                  <div>
                    <span className="font-bold block">Phone & WhatsApp:</span>
                    <span className="font-mono text-xs text-[#E9A23B]">+91 98977 66002</span>
                  </div>
                </a>

                <a
                  href="mailto:contactmaxhousekeepingservice@gmail.com"
                  className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 flex items-center gap-3 transition-colors text-[#F4EFE6]"
                >
                  <LuMail className="w-5 h-5 text-[#E9A23B] shrink-0" />
                  <div className="truncate">
                    <span className="font-bold block">Support Email:</span>
                    <span className="text-xs text-[#BED6CC] truncate block">contactmaxhousekeepingservice@gmail.com</span>
                  </div>
                </a>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-[#BED6CC]">
                <strong className="text-[#F4EFE6] block mb-0.5">Central Hub Office:</strong>
                Kanth road Behind, Asian Vivekanand Hospital, Moradabad, Uttar Pradesh 244001
              </div>
            </article>

          </div>
        </div>

        {/* Embedded Interactive FAQ Section */}
        <div className="mt-16 pt-12 border-t border-[#D2C8B8]">
          <FAQSection
            title="Frequently Asked Questions & Answers"
            subtitle="Quickly find answers to common questions about bookings, closed dates, chemicals, and pricing."
          />
        </div>
      </div>
    </div>
  );
}

