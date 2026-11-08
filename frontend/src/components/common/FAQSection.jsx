import React, { useState, useMemo } from 'react';
import {
  LuChevronDown,
  LuSearch,
  LuCircleHelp,
  LuSparkles,
  LuCalendar,
  LuCreditCard,
  LuShieldCheck,
  LuClock
} from 'react-icons/lu';

export const FAQ_DATA = [
  // 1. Booking & Scheduling
  {
    id: 'book-process',
    category: 'Booking & Slots',
    question: 'How do I book a cleaning service on Max Housekeeping?',
    answer: 'Booking is completely effortless: 1) Browse our services catalog or select your required cleaning from the home page. 2) Enter your service address or tap "Locate Me" to pinpoint your exact doorstep on the map. 3) Choose your preferred date from available days and select a convenient 3-hour arrival window (Morning, Midday, Afternoon, or Evening). 4) Choose to pay online via Razorpay or Pay on Service Completion (Cash/UPI). You will immediately receive a booking confirmation code and live tracking access.'
  },
  {
    id: 'closed-dates',
    category: 'Booking & Slots',
    question: 'What does it mean when a date says "Sorry, completely booked!" or is disabled in the date selector?',
    answer: 'To guarantee pristine cleaning quality and dedicated supervisor attention, Max Housekeeping enforces strict daily crew capacity limits. When all supervisor squads are allotted for a specific date, or during major public festivals or operations breaks, the date is marked closed by operations. Closed dates are prominently highlighted in the booking notice banner and disabled in the date dropdown. Simply select the next upcoming available date to secure your slot.'
  },
  {
    id: 'time-windows',
    category: 'Booking & Slots',
    question: 'What time slots are available for doorstep cleaning arrival?',
    answer: 'We operate 7 days a week across 5 daily appointment slots: Slot 1 (9:30 AM), Slot 2 (12:30 PM), Slot 3 (2:30 PM), Slot 4 (5:30 PM), and Slot 5 (6:30 PM). Your allocated supervisor will coordinate 15–30 minutes before arrival.'
  },
  {
    id: 'reschedule-policy',
    category: 'Booking & Slots',
    question: 'Can I reschedule or change my booked date and time window?',
    answer: 'Yes! You can reschedule your booking anytime before the crew arrives. Simply log into your Customer Dashboard, navigate to "Active Bookings", click "Edit Details", and select a new available date and time window. Note that you cannot reschedule to dates that are marked completely booked.'
  },

  // 2. Pricing & Payments
  {
    id: 'pricing-transparency',
    category: 'Pricing & Payment',
    question: 'Are prices transparent? Are there any hidden extra charges?',
    answer: 'Our pricing is 100% upfront and transparent. Within our home base Moradabad (pincodes 244001–244104), there is strictly zero outstation travel fee. For nearby cities (Rampur, Sambhal, Amroha, Chandausi, Kashipur), nominal outstation travel fees are clearly itemized in your live checkout bill before you confirm. Any separate GST (18%) or nominal platform fee configured by operations is clearly displayed line-by-line.'
  },
  {
    id: 'payment-modes',
    category: 'Pricing & Payment',
    question: 'What payment modes are supported?',
    answer: 'We provide complete flexibility: 1) Cash on Service Completion: Pay cash or scan supervisor UPI QR code only after the cleaning is finished and you inspect the results. 2) Secure Online Payment: Pay securely at checkout using Credit/Debit Cards, UPI (GPay, PhonePe, Paytm), or NetBanking powered by Razorpay.'
  },
  {
    id: 'cancellation-refund',
    category: 'Pricing & Payment',
    question: 'What is your cancellation and refund policy?',
    answer: 'You can cancel any booking before the cleaning team begins service with zero hassle. If you prepaid online, the refund is initiated immediately and returned to your original payment method within 5–7 business days per banking standards.'
  },

  // 3. Supervisor & Live Tracking
  {
    id: 'live-tracking-radar',
    category: 'Supervisor & Tracking',
    question: 'How does live supervisor tracking work?',
    answer: 'Every booking is assigned a verified operations supervisor. Once the supervisor is en route to your location, open your booking tracking link or the Customer Dashboard to view the live GPS Tracking Radar. The map automatically refreshes every 3 seconds with high-precision coordinates, estimated arrival time (ETA), supervisor profile photo, and a direct one-tap call button.'
  },
  {
    id: 'supervisor-role',
    category: 'Supervisor & Tracking',
    question: 'Why does a dedicated supervisor accompany every cleaning job?',
    answer: 'Unlike unorganized maid services, Max Housekeeping places a trained supervisor on every site. The supervisor conducts a pre-cleaning inspection, oversees industrial equipment operation, manages safety protocols, and performs a 20-point quality audit with you before concluding the job.'
  },

  // 4. Quality & Safety
  {
    id: 'staff-verification',
    category: 'Quality & Safety',
    question: 'Are your cleaning professionals background-checked and verified?',
    answer: 'Yes, 100%. Every technician and supervisor undergoes thorough background checks, government identity verification, and professional training on high-grade machinery before being deployed to customer homes or corporate sites.'
  },
  {
    id: 'chemicals-safety',
    category: 'Quality & Safety',
    question: 'Are the cleaning chemicals safe for infants, pets, and senior citizens?',
    answer: 'Absolutely. We strictly use Diversey / Taski professional-grade formulations that are non-hazardous, biodegradable, and pH-balanced. They eliminate 99.9% of bacteria and grime without leaving corrosive residues or harsh chemical fumes.'
  },
  {
    id: 'equipment-used',
    category: 'Quality & Safety',
    question: 'What equipment and tools does the team bring?',
    answer: 'Our squads arrive fully equipped with German-engineered wet & dry vacuum extractors, high-pressure steam degreasers, single-disc floor scrubbers, microfiber color-coded cloths, and telescopic glass applicators. You do not need to provide any supplies.'
  },

  // 5. Account & Security
  {
    id: 'account-otp',
    category: 'Account & Security',
    question: 'How does the 6-digit email verification code work during sign up or forgot password?',
    answer: 'To protect your personal data and addresses, we use single-use 6-digit verification codes sent directly to your registered email address. During signup or password reset, enter the 6-digit code within 10 minutes. Our system automatically formats and validates your code for rapid, secure account recovery.'
  }
];

export const CATEGORIES = [
  'All',
  'Booking & Slots',
  'Pricing & Payment',
  'Supervisor & Tracking',
  'Quality & Safety',
  'Account & Security'
];

export default function FAQSection({
  title = 'Frequently Asked Questions',
  subtitle = 'Find clear, accurate answers about our verified cleaning services, pricing, scheduling, and live supervisor tracking.',
  className = '',
  defaultCategory = 'All',
  showCategories = true
}) {
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState(['book-process', 'closed-dates']);

  const toggleAccordion = (id) => {
    setOpenIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter(item => {
      const matchCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      const qLower = item.question.toLowerCase();
      const aLower = item.answer.toLowerCase();
      const query = searchQuery.trim().toLowerCase();
      const matchSearch = !query || qLower.includes(query) || aLower.includes(query);
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section className={`py-12 ${className}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9A23B]/15 text-[#10231D] text-xs font-bold font-mono tracking-wider uppercase mb-3 border border-[#E9A23B]/30">
            <LuCircleHelp className="w-3.5 h-3.5 text-[#E9A23B]" />
            <span>Got Questions? We Have Answers</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#10231D] tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-[#3D524A] max-w-2xl mx-auto mt-2">
              {subtitle}
            </p>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-6 max-w-xl mx-auto">
          <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
          <input
            type="text"
            placeholder="Search questions (e.g. pricing, closed dates, supervisor, chemicals)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] placeholder-[#6B8077] focus:outline-none focus:border-[#E9A23B] transition-colors shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6B8077] hover:text-[#10231D]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        {showCategories && (
          <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#10231D] text-[#F4EFE6] shadow-sm'
                    : 'bg-[#ECE5D8] text-[#3D524A] hover:bg-[#E2D9C8]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* FAQ Accordion List */}
        {filteredFaqs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] text-center text-sm text-[#6B8077]">
            No matching questions found for "{searchQuery}". Try a different keyword or browse all categories.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const isOpen = openIds.includes(faq.id);
              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'bg-white border-[#E9A23B]/60 shadow-xs'
                      : 'bg-white/80 border-[#E2D9C8] hover:border-[#D2C8B8]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer select-none"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E9A23B] shrink-0" />
                      <span className="font-bold text-sm sm:text-base text-[#10231D] leading-snug">
                        {faq.question}
                      </span>
                    </div>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center bg-[#F4EFE6] text-[#10231D] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 bg-[#10231D] text-[#F4EFE6]' : ''
                      }`}
                    >
                      <LuChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-sm text-[#3D524A] leading-relaxed border-t border-[#F4EFE6]">
                      <p>{faq.answer}</p>
                      <span className="inline-block mt-3 px-2 py-0.5 rounded-md bg-[#F4EFE6] text-[#6B8077] text-[10px] font-mono uppercase tracking-wider font-semibold">
                        {faq.category}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Support Help Badge */}
        <div className="mt-8 p-4 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#3D524A]">
          <div className="flex items-center gap-2">
            <LuSparkles className="w-4 h-4 text-[#E9A23B] shrink-0" />
            <span>Still have questions about a unique cleaning requirement or commercial contract?</span>
          </div>
          <a
            href="tel:+919897766002"
            className="px-4 py-2 rounded-xl bg-[#10231D] text-[#F4EFE6] font-bold hover:bg-[#3D524A] transition-colors shrink-0 shadow-xs"
          >
            Call Operations (+91 98977 66002)
          </a>
        </div>
      </div>
    </section>
  );
}

