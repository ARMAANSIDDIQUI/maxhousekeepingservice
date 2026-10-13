# Live Site Audit Report (https://www.maxhousekeepingservice.com/)

**Audit Date**: October 2026  
**Auditor**: Full-Stack Engineering & UX Team  
**Scope**: Full Crawl & Architecture Inspection of Max House Keeping Service

---

## 1. Discovered Routes & Sitemap

| Route Pattern | Type | Status / Notes |
| :--- | :--- | :--- |
| \`/\` | Public Page | Home page with hero, categories, popular services, brand marquee, steps, testimonials, cities |
| \`/services\` | Catalog | Full catalog with category tabs and search query parameter |
| \`/services?category=:slug\` | Filtered Catalog | Filters catalog to 6 categories: \`home-deep-cleaning\`, \`bathroom-cleaning\`, \`kitchen-cleaning\`, \`sofa-carpet-cleaning\`, \`pest-control\`, \`commercial-cleaning\` |
| \`/services/:slug\` | Detail Page | 37 distinct service URLs (detailed in \`services.json\`) |
| \`/about\` | Public Page | Company mission, story, 4 core values, stats, testimonials |
| \`/contact\` | Public Page | Contact form, phone, email, address, working hours |
| \`/book\` | Multi-step Flow | Booking flow with services cart, calendar, customer inputs, job ticket |
| \`/book/:slug\` | Multi-step Flow | Pre-populates booking ticket with requested service |
| \`/login\` | Auth Page | User authentication endpoint |
| \`/zone/detect\` | API Endpoint | POST endpoint for geolocation lat/lng to zone resolution |
| \`/zone/set\` | API Endpoint | POST endpoint to set selected zone ID in session |
| \`/coupon/validate\` | API Endpoint | POST endpoint to validate promotional coupon codes |
| \`/coming-soon\` | Static Page | Fallback landing page for unserved locations |

---

## 2. Content Gaps

1. **Pest Control Category (0 Services)**:
   - On the live site, the Pest Control category exists in the navbar, category grid, and footer, but returns **0 services**.
   - *Resolution*: In the new MERN application, render a designed "Coming Soon" empty state with a direct phone/WhatsApp booking CTA rather than a blank or broken layout. Make it fully editable from the Admin panel so services can be added without code changes.
2. **City Landing Pages Missing**:
   - The live site lacks individual dedicated landing pages per city (e.g. \`/cleaning-services-in-moradabad\`, \`/cleaning-services-in-rampur\`).
   - *Resolution*: Implement dynamic SEO landing pages for each of the 9 active cities with localized schema, headings, and city-tailored pricing.

---

## 3. Content Errors & Unverifiable Claims

1. **Testimonial Reference to Competitor ("SafSafaiwala")**:
   - Testimonial by *Sneha Patil* states: *"The sofa shampooing was fantastic — stains I thought were permanent are gone. Highly recommend SafSafaiwala."*
   - **Audit Decision**: **FLAGGED — DO NOT IMPORT**. "SafSafaiwala" is a completely different cleaning brand. This was likely copied from an external source during original development. Excluded from \`testimonials.json\`.
2. **About Page Location Inconsistency ("Pune")**:
   - The story text states: *"What began as a small team in Pune has grown into a network..."*
   - Yet Max House Keeping Service is rooted in Moradabad and Western Uttar Pradesh (Kanth Road, Moradabad).
   - **Audit Decision**: **FLAGGED FOR OWNER REVIEW**. Corrected in editable seed settings to Western Uttar Pradesh while keeping the field dynamic in Admin Settings.
3. **Unverifiable Claims**:
   - Claim 1: *"Rated 4.9/5 by 10,000+ happy homes"*
   - Claim 2: *"500+ Trained pros"*
   - Claim 3: *"100% Satisfaction guarantee"*
   - **Audit Decision**: Maintained as editable fields in the \`Settings\` model/admin panel rather than hardcoded marketing claims, so the owner can adjust them to accurate verified metrics.
4. **Multiple Phone Numbers**:
   - Footer & Hero CTA: \`+91 98977 66002\`
   - Service Detail Page "Talk to an expert": \`+91 82105 23309\`
   - **Audit Decision**: Added primary phone (\`+91 98977 66002\`) and alternate phone (\`+91 82105 23309\`) into Settings.

---

## 4. Third-Party Credits & Copyright

- **Footer Credit**: *"Built with Love · By Kwacko Solutions Private Limited"*
- **Audit Decision**: **FLAGGED FOR OWNER DECISION**. In the new architecture, make the footer credit an editable setting toggle in the Admin Settings doc (\`showAgencyCredit\`, \`agencyCreditText\`, \`agencyCreditUrl\`), defaulting to off or customized per client agreement.

---

## 5. Technical, SEO & Performance Audit

1. **Client-Rendered / SPA Issues**:
   - The legacy site relied on Alpine.js with inline scripts. Dynamic meta tags were static.
   - *Resolution*: Implement \`react-helmet-async\` on all routes + server-side meta/JSON-LD injection in Express for social crawlers (Googlebot, WhatsApp, Facebook preview).
2. **Structured Data (JSON-LD)**:
   - Missing \`LocalBusiness\`, \`Service\`, and \`FAQPage\` schemas.
   - *Resolution*: Standardized JSON-LD schemas generated dynamically from MongoDB documents.
3. **Images & Media**:
   - Legacy images were stored locally under \`/storage/services/\` without responsive srcsets, WebP optimization, or explicit dimensions, causing layout shifts.
   - *Resolution*: Migrate to Cloudinary with \`f_auto,q_auto\`, blur-up placeholders, and WebP format.

---

## 6. Action Items Summary

| Item | Priority | Assigned Phase |
| :--- | :--- | :--- |
| Exclude SafSafaiwala testimonial | High (Done) | Phase 0 (Extracted) |
| Consolidate variant services (37 -> 9 families) | High (Done) | Phase 0 & Phase 3 (Seed) |
| Add Pest Control designed empty state | Medium | Phase 4 (UI) |
| Make claims and agency credit editable in Settings | High | Phase 2 & 7 (Admin) |
| Implement dynamic city landing pages | High | Phase 5 (SEO/Pages) |
| Dual pricing (Shown Price vs Offered Price) in Admin | High | Phase 2 & 7 (Admin) |
