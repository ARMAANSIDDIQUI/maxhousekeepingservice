# Full Rebuild Master Plan: Max House Keeping Service

**Document**: \`docs/PLAN.md\`  
**Status**: Pending Client/Owner Approval (Phase 1 Gate)  
**Target Domain**: \`https://www.maxhousekeepingservice.com\`  
**Target Architecture**: MERN Stack Monorepo (\`/client\`, \`/server\`, \`/docs\`)

---

## 1. System Architecture & Monorepo Structure

The project is structured as a clean, modular JavaScript monorepo without TypeScript, adhering to all standing rules:

\`\`\`
maxhousekeeping/
├── client/                     # Frontend Application (Vite + React 18)
│   ├── public/                 # Static assets, favicon, robots.txt
│   │   └── fonts/              # Self-hosted webfonts (Bricolage Grotesque, Instrument Sans)
│   ├── src/
│   │   ├── assets/             # SVGs, paper-grain filters, official logo
│   │   ├── components/         # Reusable UI primitives and sections
│   │   │   ├── common/         # Button, Modal, Card, Badge, Drawer, Input, Checkbox
│   │   │   ├── layout/         # Header, Footer, MobileStickyBar, PageShell, AdminLayout
│   │   │   ├── motion/         # Reveal, PageTransition, SqueegeeSweep, NumberTween
│   │   │   ├── booking/        # ServiceSelector, VariantDropdown, JobTicket, AddressPicker
│   │   │   ├── pricing/        # PriceCalculator, TierCards, OptionStepper
│   │   │   ├── location/       # LocationCard, CityModal, PincodeChecker
│   │   │   └── interactive/    # RoomMap, BeforeAfterSlider, BrandMarquee
│   │   ├── context/            # AuthContext, CartContext, LocationContext
│   │   ├── hooks/              # usePricingQuote, useGeolocation, useMediaQuery, useLenis
│   │   ├── pages/              # Public, Customer, and Admin page routes
│   │   │   ├── Home.jsx
│   │   │   ├── Services.jsx
│   │   │   ├── ServiceDetail.jsx
│   │   │   ├── CategoryLanding.jsx
│   │   │   ├── CityLanding.jsx (/cleaning-services-in-:city)
│   │   │   ├── Book.jsx
│   │   │   ├── BookingSuccess.jsx
│   │   │   ├── BookingLookup.jsx
│   │   │   ├── About.jsx
│   │   │   ├── Contact.jsx
│   │   │   ├── Login.jsx       # Single unified login page
│   │   │   ├── MyBookings.jsx
│   │   │   ├── NotFound.jsx
│   │   │   └── admin/          # Admin Dashboard, Services, Bookings, Cities, Media, Settings
│   │   ├── services/           # API clients using Axios / fetch
│   │   ├── utils/              # Currency formatting (₹ en-IN), helpers, validation
│   │   ├── App.jsx             # Route definitions with Suspense & React Router v6
│   │   ├── index.css           # Tailwind v4 import & theme directives
│   │   └── main.jsx
│   ├── jsconfig.json           # Path alias (@/* -> src/*)
│   ├── package.json
│   ├── vite.config.js          # Vite config with @tailwindcss/vite
│   └── .env.example
│
├── server/                     # Backend Application (Node 20 + Express)
│   ├── src/
│   │   ├── config/             # DB connection, Cloudinary, Nodemailer transporter
│   │   ├── constants/          # Roles, SlotWindows, BookingStatuses
│   │   ├── controllers/        # auth, service, booking, city, pricing, location, admin, media
│   │   ├── middleware/         # authGuard, roleGuard, errorHandler, rateLimiter, sanitizer
│   │   ├── models/             # Mongoose Models (User, Service, Booking, City, Media, etc.)
│   │   ├── routes/             # v1 REST endpoints
│   │   ├── services/
│   │   │   ├── pricing/        # Pure pricing engine (engine.js) with test suite
│   │   │   ├── location/       # IP detection, GeoJSON haversine resolver, Pincode matcher
│   │   │   ├── email/          # Nodemailer with Gmail App Password OTP delivery
│   │   │   ├── cloudinary/     # Signature generator, asset destruction
│   │   │   └── seo/            # Server-side HTML meta & JSON-LD injection for bots
│   │   ├── utils/              # AsyncHandler, APIResponse, BookingCodeGenerator
│   │   ├── app.js              # Express app setup with Helmet, CORS, Compression
│   │   └── server.js           # Server listen & graceful shutdown
│   ├── scripts/
│   │   ├── seed.js             # Loads extracted data into MongoDB with idempotent upserts
│   │   ├── upload-media.js     # Uploads generated & extracted assets to Cloudinary
│   │   ├── makeAdmin.js        # CLI utility to promote users to admin
│   │   └── testPricing.js      # Unit test runner for pricing engine
│   ├── jsconfig.json           # Path alias (@/* -> src/*)
│   ├── package.json
│   └── .env.example
│
└── docs/                       # Project Documentation & Extracted Content
    ├── PLAN.md                 # This master plan
    ├── DESIGN.md               # Design tokens, typography, motion, component specs
    ├── variant-grouping-report.md # Variant consolidation mapping (37 raw -> 9 families)
    ├── media-manifest.json     # Cloudinary media mapping
    └── extracted/              # Phase 0 JSON datasets and audit reports
        ├── categories.json
        ├── services.json
        ├── cities.json
        ├── brands.json
        ├── testimonials.json
        ├── settings.json
        ├── pages.json
        ├── booking-flow.md
        ├── site-audit.md
        ├── pricing-model-reference.md
        └── assets/             # Brand logos & official company logo
\`\`\`

---

## 2. Data Models Specification

All schemas use strict Mongoose schema definitions with indexes on frequently queried fields (\`slug\`, \`category\`, \`city\`, \`isActive\`, \`user\`, \`status\`).

### 1. User Model (\`User\`)
\`\`\`javascript
{
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, index: true },
  email: { type: String, trim: true, lowercase: true, sparse: true, index: true },
  passwordHash: { type: String }, // Optional when user signs in via Google OAuth
  role: { type: String, enum: ['customer', 'cleaner', 'admin'], default: 'customer', index: true },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  avatarUrl: { type: String }, // Google photo or generated head+shoulder person avatar
  emailVerified: { type: Boolean, default: false },
  otpSecret: {
    code: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 }
  },
  addresses: [{
    label: { type: String, enum: ['Home', 'Office', 'Other'], default: 'Home' },
    line1: { type: String, required: true },
    landmark: { type: String },
    city: { type: String, required: true },
    state: { type: String, default: 'Uttar Pradesh' },
    pincode: { type: String, required: true },
    coordinates: { lat: Number, lng: Number },
    isDefault: { type: Boolean, default: false }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
\`\`\`

### 2. Service Model (\`Service\`)
\`\`\`javascript
{
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  aliases: [{ type: String, index: true }], // Legacy variant slugs (e.g. 'full-home-deep-cleaning-1-bhk')
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  shortDescription: { type: String },
  description: { type: String, required: true },
  duration: { type: String }, // e.g. "4-5 hrs"
  
  // Pricing Mode & Dual-Price Controls (Shown Price vs Offered Price)
  pricingMode: { type: String, enum: ['fixed', 'tiered', 'combination'], default: 'combination' },
  price: { type: Number, required: true }, // Offered price (discounted)
  mrp: { type: Number, required: true },   // Shown price (regular / crossed-out)
  discountPct: { type: Number },           // Computed virtual/hook: Math.round(((mrp - price)/mrp)*100)
  
  // Dynamic Option Groups & Variants
  optionGroups: [{
    key: { type: String, required: true },       // e.g. 'size'
    label: { type: String, required: true },     // e.g. 'Home Size'
    type: { type: String, enum: ['single', 'multi', 'stepper', 'toggle'], default: 'single' },
    options: [{
      key: { type: String, required: true },     // e.g. '1-bhk'
      label: { type: String, required: true },   // e.g. '1 BHK'
      priceDelta: { type: Number, default: 0 },
      mrpDelta: { type: Number, default: 0 },
      duration: { type: String },
      isDefault: { type: Boolean, default: false }
    }]
  }],
  
  // Explicit Matrix Rows for Combinations
  matrix: [{
    selection: { type: Map, of: String },        // { size: '2-bhk' }
    price: { type: Number, required: true },     // Offered price
    mrp: { type: Number, required: true },       // Shown price
    duration: { type: String },
    isActive: { type: Boolean, default: true }
  }],
  
  // City Custom Pricing Overrides
  cityOverrides: [{
    city: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
    priceOverride: { type: Number },
    mrpOverride: { type: Number },
    multiplier: { type: Number, default: 1.0 },
    isActive: { type: Boolean, default: true }
  }],
  
  inclusions: [String],
  exclusions: [String],
  faqs: [{ question: String, answer: String }],
  media: {
    hero: { publicId: String, url: String, alt: String },
    gallery: [{ publicId: String, url: String, alt: String }]
  },
  sampleBeforeAfter: {
    beforeUrl: String,
    afterUrl: String,
    isSample: { type: Boolean, default: true }
  },
  isPopular: { type: Boolean, default: false, index: true },
  isActive: { type: Boolean, default: true, index: true },
  sortOrder: { type: Number, default: 0 },
  seo: { title: String, description: String, keywords: [String] }
}
\`\`\`

### 3. City Model (\`City\`)
\`\`\`javascript
{
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  state: { type: String, default: 'Uttar Pradesh' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [lng, lat] for 2dsphere index
  },
  serviceRadiusKm: { type: Number, default: 25 },
  pincodes: [{ type: String, index: true }],
  status: { type: String, enum: ['active', 'coming_soon', 'inactive'], default: 'active', index: true },
  sortOrder: { type: Number, default: 0 },
  contactOverrides: { phone: String, whatsapp: String },
  slotWindowsOverride: [String],
  seo: { title: String, description: String }
}
// 2dsphere index: { location: '2dsphere' }
\`\`\`

### 4. Booking Model (\`Booking\`)
\`\`\`javascript
{
  bookingCode: { type: String, required: true, unique: true, index: true }, // e.g. MH-2026-8921
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // Optional (Guest allowed)
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    email: { type: String }
  },
  items: [{
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    titleSnapshot: { type: String, required: true },
    variantSnapshot: { type: String }, // e.g. "1 BHK"
    selections: { type: Map, of: String },
    priceSnapshot: { type: Number, required: true }, // Offered price charged
    mrpSnapshot: { type: Number, required: true },   // Shown price baseline
    qty: { type: Number, default: 1 }
  }],
  city: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  address: {
    line1: { type: String, required: true },
    landmark: { type: String },
    cityText: { type: String, required: true },
    stateText: { type: String, default: 'Uttar Pradesh' },
    pincode: { type: String, required: true },
    isTemporary: { type: Boolean, default: false } // True if user checked temporary address
  },
  slot: {
    date: { type: String, required: true }, // YYYY-MM-DD
    window: { type: String, required: true } // "Morning (8:00 AM – 11:00 AM)"
  },
  notes: { type: String },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  totals: {
    subtotal: { type: Number, required: true },
    mrpTotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    customerSaved: { type: Number, required: true }
  },
  appliedCoupon: { code: String, discountAmount: Number },
  priceVersion: { type: String, default: 'v1' },
  paymentMode: { type: String, enum: ['cash_on_service', 'razorpay'], default: 'cash_on_service' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  createdAt: { type: Date, default: Date.now, index: true }
}
\`\`\`

### 5. Supporting Models
- **Category**: \`name\`, \`slug\`, \`tagline\`, \`iconKey\`, \`image\`, \`sortOrder\`, \`isActive\`
- **PricingRule**: \`title\`, \`type\` (percent/flat), \`target\` (service/category/cart/city), \`condition\`, \`discountValue\`, \`minCartValue\`, \`validFrom\`, \`validTo\`, \`isActive\`
- **Coupon**: \`code\` (unique uppercase), \`discountType\`, \`discountValue\`, \`minOrderValue\`, \`maxDiscount\`, \`usageLimit\`, \`usedCount\`, \`expiryDate\`, \`isActive\`
- **Brand**: \`name\`, \`logoUrl\`, \`sortOrder\`, \`isActive\`
- **Testimonial**: \`name\`, \`role\`, \`city\`, \`quote\`, \`rating\`, \`isActive\`
- **ContactMessage**: \`name\`, \`phone\`, \`email\`, \`subject\`, \`message\`, \`status\` (unread/read/replied)
- **WaitlistRequest**: \`name\`, \`phone\`, \`cityText\`, \`serviceInterest\`, \`createdAt\`
- **Settings**: Single document holding primary & alternate phones, WhatsApp number, email, address, working hours, hero statistics, trust badges, step-by-step copy, GST toggle, and agency credits.
- **AuditLog**: \`action\`, \`modelName\`, \`recordId\`, \`performedBy\`, \`beforeState\`, \`afterState\`, \`timestamp\`

---

## 3. Authentication & Security Strategy

### Unified Single Login System
As required by the user, there is **one single login entry point** (\`/login\`), not separate login portals for admin and customers.

\`\`\`
                          ┌────────────────────────┐
                          │   Unified Login Page   │
                          │        (/login)        │
                          └───────────┬────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
      [Email & Password / OTP]                      [Google OAuth]
                 │                                         │
                 ▼                                         ▼
   bcryptjs hash verification                Google ID token verified
   (or 6-digit Email OTP via Nodemailer)     (extract profile picture)
                 │                                         │
                 └────────────────────┬────────────────────┘
                                      │
                                      ▼
                        Issue JWT (httpOnly Cookie)
                                      │
                        Check User Role in Token
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
        If role === 'admin'                      If role === 'customer'
        Redirect to Admin Dashboard              Redirect to My Bookings / Cart
\`\`\`

1. **Email Authentication**:
   - **Password Login**: Passwords hashed with \`bcryptjs\` with cost factor 12. Password inputs sanitized against timing-attacks.
   - **Email OTP Verification**: User enters email -> \`POST /api/v1/auth/request-otp\` -> Nodemailer sends a cryptographically random 6-digit OTP using Gmail App Password. Valid for 10 minutes, max 3 attempts.
   - **Default Avatar**: When signing up/logging in via Email, the backend creates a distinctive head+shoulder person avatar (custom SVG duotone portrait adhering to the warm paper/ink palette).
2. **Google OAuth**:
   - Integrated via Google OAuth 2.0. Client sends credential token -> server verifies -> extracts name, email, and Google profile picture as \`avatarUrl\`.
3. **Session & Token Management**:
   - Signed JWT stored in \`httpOnly\`, \`secure\`, \`sameSite: 'strict'\` cookies to prevent XSS.
   - Dual-token strategy: Access token (15-minute expiry) + Refresh token (7-day expiry).
4. **Security Hardening**:
   - \`helmet\` for HTTP headers (CSP, HSTS, X-Frame-Options).
   - \`express-rate-limit\`: 10 requests per minute on \`/api/v1/auth/*\` and \`/api/v1/bookings\`.
   - \`express-mongo-sanitize\` to prevent NoSQL query injections.
   - \`hpp\` to prevent HTTP parameter pollution.
   - Strict CORS: only accepts requests from \`FRONTEND_URL\`.

---

## 4. Booking Flow & Address Management

### Address Saving Feature (User Specification)
The booking flow provides a streamlined address selector:
1. **Returning/Logged-in Users**:
   - **Saved Address Dropdown**: Populated directly from the user's saved addresses (\`addresses[]\`). Selecting an address auto-fills Line 1, Landmark, City, State, and Pincode.
   - **"Add New Address" Option**: Selecting this reveals input fields to add a permanent address, which is saved to their profile on booking completion.
2. **"Use Temporary Address" Checkbox**:
   - A clear checkbox labeled: **"Use a temporary address for this booking"**.
   - When checked:
     - The saved address dropdown is hidden.
     - A clean manual text area & address fields appear.
     - The address is flagged \`isTemporary: true\` on the Booking and is **not** saved to the user's permanent address book.
3. **Geolocation Assist**:
   - "Use my current location" button triggers reverse-geocoding to auto-fill address and detect the serviceable city.

### Service Selection Section ("1. Services")
Mirrors the live site design:
1. **Added Services Cart**:
   - List of added services with thumbnail and title.
   - **Interactive Variant Dropdown**: For services with options (e.g. 1 BHK vs 2 BHK), an inline dropdown selector allows switching variants on the fly. Shows variant label, struck-through MRP, and offered price.
   - **Remove Button**: Instant deletion with animated exit.
2. **"Add a Service" Popover Picker**:
   - Real-time search filter input (*"Search services…"*).
   - Categorized service list showing thumbnail, title, and *"from ₹X"*.
   - One-click addition to cart.

---

## 5. Dynamic Pricing Engine & Admin Dual-Price Controls

### Admin Panel Dual-Price Option (User Specification)
In the Admin Panel for every service, tier, and combination matrix row:
- **Shown Price (MRP)**: The standard anchor price crossed out to users (e.g., ₹2,999).
- **Offered Price**: The actual discounted price charged to users (e.g., ₹2,800).
- **Live Discount Preview**: Displays calculated percentage discount (\`7% OFF\`) and customer savings (\`₹199\`).

### Pure Core Engine (\`/server/src/services/pricing/engine.js\`)
\`\`\`javascript
// Pure, deterministic function with no database queries inside
export function calculateQuote({ items, cityId, coupon, settings }) {
  // 1. Resolve matrix prices for each line item (Offered Price & MRP)
  // 2. Compute Item Subtotal, Item MRP Total, Line Savings
  // 3. Apply City Multipliers / Overrides if configured
  // 4. Validate and apply Coupon discount (Percentage or Flat, capped at maxDiscount)
  // 5. Compute Grand Total, Net Customer Savings, and Duration
  // Return lineItems, appliedRules, subtotal, mrpTotal, discount, total, customerSaved
}
\`\`\`
Both \`POST /api/v1/pricing/quote\` and \`POST /api/v1/bookings\` use this exact same engine. Client totals are completely recomputed server-side; tampered totals are rejected immediately.

---

## 6. Location Architecture: Non-Blocking Smart Resolution

1. **Non-Blocking Inline Card**:
   - Displayed above the price calculator on service pages: *"Check availability in your area"*. Browsing is never blocked.
2. **Resolution Hierarchy**:
   1. Saved user selection in localStorage / user profile.
   2. IP suggestion: \`GET /api/v1/location/detect\` -> Displays *"Looks like you are in Moradabad. Confirm?"* with one-click change.
   3. Precise geolocation: Browser Geolocation API -> \`POST /api/v1/location/resolve\` with MongoDB \`$geoNear\` against city coordinates.
   4. Pincode lookup: \`GET /api/v1/location/pincode/:pin\`.
   5. Manual city picker modal.
3. **9 Active Service Cities in Western UP**:
   - Moradabad, Rampur, Amroha, Gajraula, Sambhal, Chandausi, Noorpur, Dhampur, Bijnor.
4. **Unserved Areas**:
   - Designed friendly "Coming Soon" card with nearby serviceable cities and a Waitlist submission form (\`WaitlistRequest\` model).

---

## 7. Media & Cloudinary Pipeline

1. **Cloudinary Asset Storage**:
   - Structured folders: \`max-housekeeping/services/\`, \`max-housekeeping/categories/\`, \`max-housekeeping/site/\`, \`max-housekeeping/brands/\`.
   - Signed server uploads; secrets never reach the client.
2. **Incorporation of Official Assets**:
   - Official 3D Logo (\`official-logo.png\`) used in Header, Footer, and OpenGraph cards.
   - Real Uniform Imagery (\`uniform-team-reference.jpg\` and generated worker service photos) showing technicians in black polo shirts with red collar trim, blue nitrile gloves, and industrial cleaning tools.

---

## 8. API Specification (REST, \`/api/v1\`)

### Public Endpoints
- \`GET /api/v1/cities\` — Active cities with coordinates & status
- \`GET /api/v1/categories\` — Categories with service counts
- \`GET /api/v1/services\` — Catalog with category, search, city filter, pagination
- \`GET /api/v1/services/:slug\` — Service details with pricing matrix & inclusions
- \`GET /api/v1/brands\` — Brand partner logos for marquee
- \`GET /api/v1/testimonials\` — Verified testimonials
- \`GET /api/v1/settings\` — Public contact info, phones, WhatsApp, stats
- \`GET /api/v1/location/detect\` — IP-based city suggestion
- \`POST /api/v1/location/resolve\` — Lat/lng to nearest active city
- \`GET /api/v1/location/pincode/:pin\` — Pincode city resolver
- \`POST /api/v1/pricing/quote\` — Pure pricing quote calculator
- \`POST /api/v1/bookings\` — Create guest or authenticated booking
- \`GET /api/v1/bookings/status?code=MH-...&phone=...\` — Track booking status
- \`POST /api/v1/contact\` — Submit contact inquiry
- \`POST /api/v1/waitlist\` — Join unserved area waitlist

### Unified Authentication Endpoints
- \`POST /api/v1/auth/login\` — Email & password login
- \`POST /api/v1/auth/request-otp\` — Send 6-digit Email OTP via Nodemailer
- \`POST /api/v1/auth/verify-otp\` — Verify OTP and login/register
- \`POST /api/v1/auth/google\` — Google OAuth credential exchange
- \`POST /api/v1/auth/logout\` — Clear JWT httpOnly cookie
- \`GET /api/v1/auth/me\` — Current authenticated user profile

### Customer Endpoints (Authenticated)
- \`GET /api/v1/customer/bookings\` — Customer booking history
- \`POST /api/v1/customer/bookings/:id/cancel\` — Cancel pending booking
- \`POST /api/v1/customer/addresses\` — Add saved address
- \`DELETE /api/v1/customer/addresses/:id\` — Delete saved address

### Admin Endpoints (Role: \`admin\` Guarded)
- \`GET /api/v1/admin/dashboard\` — KPI counts (bookings, revenue, users, inquiries)
- \`GET /api/v1/admin/bookings\` — Filterable booking management
- \`PATCH /api/v1/admin/bookings/:id/status\` — Update status & assign crew
- \`CRUD /api/v1/admin/services\` — Full CRUD with Shown Price (MRP) & Offered Price
- \`CRUD /api/v1/admin/categories\` — Category management
- \`CRUD /api/v1/admin/cities\` — City CRUD with GeoJSON & service availability matrix
- \`CRUD /api/v1/admin/coupons\` — Coupon & discount rules
- \`CRUD /api/v1/admin/brands\` — Brand partners management
- \`CRUD /api/v1/admin/testimonials\` — Customer review management
- \`GET/PUT /api/v1/admin/settings\` — Site phone numbers, stats, and text copy
- \`POST /api/v1/admin/media/sign\` — Cloudinary signed upload signature
- \`DELETE /api/v1/admin/media/:id\` — Delete asset from Cloudinary and DB
- \`GET /api/v1/admin/audit-logs\` — Price change and content update audit history

---

## 9. SEO, Social & Server-Side Crawler Injection

1. **Client-Side Head Management**: \`react-helmet-async\` providing unique meta titles, descriptions, and canonical tags per page.
2. **Server-Side Meta Injection (for Web Crawlers & Social Previews)**:
   - In \`/server/src/services/seo/injector.js\`: When requests originate from social crawlers (Googlebot, WhatsApp, Facebook, Twitter, LinkedIn) targeting \`/services/:slug\` or \`/cleaning-services-in-:city\`, Express dynamically reads the document from MongoDB and replaces \`<title>\`, \`<meta name="description">\`, and JSON-LD schema in the static \`index.html\` before streaming.
3. **JSON-LD Schema Hierarchy**:
   - Home Page: \`LocalBusiness\` with address, phone, geolocation, and opening hours.
   - Service Detail: \`Service\` schema with \`offers\` (Offered Price, MRP, INR currency).
   - Detail Pages with FAQs: \`FAQPage\` schema.
4. **Dynamic Sitemap & Robots.txt**:
   - \`GET /sitemap.xml\` generated dynamically from active services, categories, and cities.

---

## 10. Open Questions & Recommended Defaults

| Question / Ambiguity | Recommended Default | Rationale |
| :--- | :--- | :--- |
| **GST Taxation Toggle** | Kept disabled by default; toggleable in Admin Settings. | Small service marketplace initial operations in tier-2 cities often start below GST threshold or bundle taxes. Configurable with 1 click. |
| **Cancellation Policy** | Cancellations permitted free of charge up to 2 hours before scheduled slot or until "Assigned" status. | Protects operations from dispatched team travel costs while remaining customer-friendly. |
| **Offline Booking Lead Time** | 2 hours minimum advance booking window. | Allows operations team sufficient time to assign and dispatch technicians. |
| **Pest Control 0 Services Gap** | Render custom designed "Coming Soon" card with direct Phone & WhatsApp consultation CTA. | Prevents broken or empty layouts while capturing customer leads immediately. |
| **Third-Party Agency Credit** | Configurable toggle in Admin Settings (\`showAgencyCredit: false\`). | Gives full business ownership to Max House Keeping Service while allowing attribution if desired. |

---

## 11. Phase Checklist & Acceptance Criteria

### Phase 2: Backend Foundation
- [ ] Mongoose models established with indexes and validation.
- [ ] Single unified auth system (Email OTP + Password + Google OAuth) with bcryptjs and JWT.
- [ ] Pure pricing engine (\`engine.js\`) implemented with unit tests.
- [ ] Address saving & temporary address logic verified.
- [ ] REST API v1 endpoints scaffolded with central error handling.

### Phase 3: Seed & Media Upload Scripts
- [ ] \`seed.js\` loads all extracted categories, 37 services consolidated into 9 families, 9 cities, 15 brands, testimonials, and settings.
- [ ] Idempotent upserts by slug, dry-run mode, and reset capability.
- [ ] \`upload-media.js\` uploads media assets to Cloudinary and generates \`media-manifest.json\`.

### Phase 4: Frontend Foundation & Design System
- [ ] Tailwind theme configured with paper, ink, brass, lather, and rust tokens.
- [ ] Self-hosted typography (Bricolage Grotesque & Instrument Sans) configured.
- [ ] Lenis smooth scroll and Framer Motion shared easing implemented.
- [ ] Design primitives created: Button, Badge, Modal, Input, Checkbox, Ticket, Reveal, Marquee.

### Phase 5: Public Pages & Signature Interactions
- [ ] Squeegee sweep hero reveal with line-by-line headline reveal.
- [ ] Custom SVG Room-map floor plan service finder with deep links and mobile list fallback.
- [ ] Dynamic services carousel with Embla + Framer Motion.
- [ ] Non-blocking location detection card and 9 city landing pages.
- [ ] Service detail page with before/after slider and price calculator.

### Phase 6: Booking Flow & Customer Portal
- [ ] Live multi-step booking flow mirroring live field set.
- [ ] "1. Services" section with live variant dropdown, "Add service" popover picker, and live job ticket.
- [ ] Address picker with saved address dropdown and "use temporary address" checkbox.
- [ ] Guest and authenticated booking creation with server-recomputed prices.
- [ ] Booking confirmation with animated confetti and tracking code.

### Phase 7: Admin Panel
- [ ] Single login redirect to Admin Panel for admin role.
- [ ] Service editor with dual-price controls (Shown Price MRP vs Offered Price).
- [ ] City management with GeoJSON radius and availability matrix.
- [ ] Booking status manager, coupon manager, and settings editor.

### Phase 8: Verification & Production Polish
- [ ] Lighthouse mobile score 85+.
- [ ] Responsive testing at 390px, 768px, and 1440px.
- [ ] Reduced-motion safety verified.
- [ ] ESLint passes with zero errors; no emojis anywhere.
