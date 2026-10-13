# Design System & Aesthetic Specification: Max House Keeping Service

**Document**: \`docs/DESIGN.md\`  
**Design Concept**: *"Fresh-Pressed"*  
**Philosophy**: A warm, tactile, high-craft editorial identity. Inspired by premium laundry-and-linen ateliers and independent architectural magazines, completely avoiding generic SaaS templates, AI gradient blobs, and cookie-cutter component libraries.

---

## 1. Color System & Design Tokens

Strictly defined in the Tailwind CSS theme. Pure white (\`#FFFFFF\`) and pure black (\`#000000\`) are strictly prohibited in the UI palette.

\`\`\`css
:root {
  /* Core Foundation Tokens */
  --color-paper: #F4EFE6;         /* Primary canvas background (warm off-white) */
  --color-paper-subtle: #ECE5D8;  /* Elevated card & container surface */
  --color-paper-deep: #E2D9C8;    /* Borders, dividers, subtle outlines */
  
  --color-ink: #10231D;           /* Primary text & deep brand elements (forest green-black) */
  --color-ink-muted: #3D524A;     /* Secondary editorial body copy */
  --color-ink-faint: #6B8077;     /* Metadata, placeholders, caption text */
  
  /* Brand Accent Tokens */
  --color-brass: #E9A23B;         /* Sharp accent, highlights, star ratings, CTA glow */
  --color-brass-hover: #D48E28;   /* Interactive hover state for brass */
  --color-brass-light: #FBF1E2;   /* Soft warm badge background */
  
  --color-lather: #DDEBE4;        /* Soft fresh surface, interactive chips, tag backgrounds */
  --color-lather-deep: #BED6CC;   /* Active chip border, focused inputs */
  
  --color-rust: #C2512D;          /* High-visibility discount badges, alerts, deletions */
  --color-rust-faint: #F9ECE8;    /* Discount badge pill backgrounds */
}
\`\`\`

### Tailwind Theme Mapping (\`index.css\`)
\`\`\`css
@theme {
  --color-paper: #F4EFE6;
  --color-paper-subtle: #ECE5D8;
  --color-paper-deep: #E2D9C8;

  --color-ink: #10231D;
  --color-ink-muted: #3D524A;
  --color-ink-faint: #6B8077;

  --color-brass: #E9A23B;
  --color-brass-hover: #D48E28;
  --color-brass-light: #FBF1E2;

  --color-lather: #DDEBE4;
  --color-lather-deep: #BED6CC;

  --color-rust: #C2512D;
  --color-rust-faint: #F9ECE8;

  --font-display: 'Bricolage Grotesque', serif, system-ui;
  --font-sans: 'Instrument Sans', sans-serif, system-ui;
  --font-mono: 'JetBrains Mono', monospace;
}
\`\`\`

---

## 2. Typography Hierarchy

Fonts are self-hosted under \`/client/public/fonts/\` to eliminate external Google Fonts latency and layout shifts.

- **Display Headline Face**: **Bricolage Grotesque** (characterful, soft grotesque with optical weight balance).
- **Body & Interface Face**: **Instrument Sans** (crisp, human, effortless legibility on mid-range Android screens).
- **Tabular Numerals**: Forced via \`font-feature-settings: 'tnum' 1\` for all prices and quantities to avoid jitter during number tweens.

| Element | Font Face | Desktop Size / Leading | Mobile Size / Leading | Weight | Tracking |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Hero** | Bricolage Grotesque | 72px / 1.05 | 42px / 1.1 | 800 (ExtraBold) | -0.03em |
| **Section H1 / H2** | Bricolage Grotesque | 48px / 1.15 | 32px / 1.2 | 700 (Bold) | -0.02em |
| **Card / H3** | Bricolage Grotesque | 24px / 1.25 | 20px / 1.3 | 600 (SemiBold) | -0.01em |
| **Lead Paragraph** | Instrument Sans | 20px / 1.5 | 17px / 1.5 | 400 (Regular) | 0 |
| **Body Text** | Instrument Sans | 16px / 1.6 | 15px / 1.55 | 400 (Regular) | 0 |
| **Small / Caption** | Instrument Sans | 13px / 1.4 | 12px / 1.4 | 500 (Medium) | +0.01em |
| **Price Hero** | Bricolage Grotesque | 36px / 1.0 | 28px / 1.0 | 800 (tnum) | -0.02em |

---

## 3. Tactile Texture: Paper-Grain SVG Filter

To avoid flat digital sterility, a subtle procedural noise grain is embedded globally via inline SVG:

\`\`\`svg
<svg class="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.035] mix-blend-multiply" aria-hidden="true">
  <filter id="paper-grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
    <feColorMatrix type="matrix" values="0 0 0 0 0.06   0 0 0 0 0.14   0 0 0 0 0.11   0 0 0 1 0" />
  </filter>
  <rect width="100%" height="100%" filter="url(#paper-grain)" />
</svg>
\`\`\`

---

## 4. Motion Specification & Easing

- **Animation Framework**: Framer Motion (\`motion\` package).
- **Smooth Scroll**: Lenis (\`@studio-freight/lenis\` or \`lenis\`) with anchor link synchronization.
- **Shared Master Easing**: \`cubic-bezier(0.22, 1, 0.36, 1)\` (editorial ease-out, fast snappy onset with gentle organic deceleration).
- **Durations**:
  - Micro-interactions (hover, focus, button press): \`200ms - 300ms\`
  - Card entry & reveal transitions: \`500ms - 600ms\`
  - Page transitions & Squeegee wipe: \`700ms - 800ms\`
- **Reduced Motion Protocol**:
  \`@media (prefers-reduced-motion: reduce)\` disables all continuous transforms, wipes, and video loops, defaulting to instantaneous opacity crossfades.

---

## 5. Signature Interactions

### 1. Squeegee Hero Wipe Reveal
- **Concept**: The page loads with a soft "fogged glass" overlay. A diagonal squeegee line sweeps smoothly across the viewport (\`clip-path: polygon(...)\`), clearing the condensation and revealing the sharp, spotless living room interior underneath.
- **Execution**: The headline reveals line-by-line using masked transforms synchronized with the wipe.
- **Frequency**: Plays once per browser session (\`sessionStorage\`); skippable with a subtle *"Skip"* click; reduced-motion safe.

### 2. Room-Map Custom SVG Floor Plan Service Finder
- **Concept**: An architectural top-down 2D floor plan of a home:
  - Living Room (sofa, coffee table, rug)
  - Kitchen (chimney, quartz counter, sink)
  - Master Bedroom (bed, wardrobes, windows)
  - Bathroom (shower glass, tiles, fixtures)
  - Balcony / Utility Area (water tank, air conditioning unit)
  - Home Office / Study
- **Interaction**:
  - Hovering over a room highlights it with warm lather fill and brass boundary.
  - Floating tooltip displays matching services and starting prices (e.g. *Kitchen -> "Kitchen Deep Cleaning from ₹2,500"*).
  - Clicking deep-links to \`/services?category=:slug\`.
  - Accessible keyboard navigation with tab index + plain interactive list fallback for mobile screens (<640px).

### 3. Before/After Drag Slider
- **Location**: Service detail pages.
- **Interaction**: Two stacked full-width photos with a vertical brass dividing handle. Dragging left/right adjusts the \`clip-path: inset(0 0 0 X%)\` reveals.
- **Integrity Rule**: Displays a clearly marked *"Sample Demonstration"* label until real client photos are uploaded via the Admin panel.

### 4. Perforated Receipt "Job Ticket"
- **Location**: Sticky sidebar on desktop, collapsible bottom drawer on mobile.
- **Visuals**: Styled like a crisp dry-cleaner paper receipt with zig-zag perforated edges (\`mask-image\` SVG pattern), dotted dividers, and monospace metadata.
- **Dynamic Action**:
  - Whenever services, variants, quantities, or coupons change, prices animate smoothly via a React tabular number tween.
  - Live savings callout: *"You save ₹X! (Y% OFF)"* in rust badge pill.

### 5. Brand Logo Marquee & Micro-Interactions
- Smooth infinite logo marquee of the 15 enterprise clients that pauses on hover and focus.
- Stats count-up on scroll using \`useInView\` and Framer Motion.
- Subtle magnetic pull on primary buttons.
- Editorial animated underline on text links (\`background-size\` transition).

### 6. Seamless Route Transitions
- Short, elegant wipe transition on route navigation with scroll reset and instant Lenis synchronization.

---

## 6. Component Inventory

1. **Button Primitive (\`Button.jsx\`)**:
   - \`primary\`: Brass background, ink text, brass-hover state, magnetic physics.
   - \`secondary\`: Paper-subtle surface with ink border and lather hover.
   - \`outline\`: Paper-deep 1px border, ink text, clean tactile press.
   - \`ghost\`: Clean typography with hover background reveal.
2. **Badge Primitive (\`Badge.jsx\`)**:
   - \`discount\`: Rust text on rust-faint pill (\`7% OFF\`).
   - \`category\`: Lather pill with dark green icon and ink text.
   - \`status\`: Color-coded indicator for booking states (pending, confirmed, completed).
3. **Modal & Drawer Primitives (\`Modal.jsx\`, \`Drawer.jsx\`)**:
   - Accessible focus-trapped dialogs with backdrop blur and smooth entrance.
4. **Interactive Form Fields**:
   - Floating label inputs, single unified address picker with saved address dropdown and "use temporary address" toggle.
   - Dropdown variant picker with struck-through MRP and offered price.

---

## 7. Responsive Rules & Tier-2 Network Mobile-First Strategy

1. **Mobile Experience (< 768px)**:
   - Sticky bottom action bar with:
     * **Book Now** (Primary Action)
     * **Call 98977 66002** (Direct Phone link with icon)
     * **WhatsApp** (Direct WhatsApp pre-filled chat link with icon)
   - Minimum touch target: **48px x 48px**.
   - Floor plan SVG collapses to an intuitive room selector carousel on screens under 640px.
2. **Tablet Experience (768px - 1024px)**:
   - 2-column asymmetric layouts; collapsible sidebar filters.
3. **Desktop Experience (> 1024px)**:
   - Full editorial 3-column asymmetric grid; sticky Job Ticket docking at top 96px.
4. **Performance Budgets**:
   - Zero heavy UI frameworks.
   - Initial JS bundle target: <150KB gzipped.
   - Fast image delivery via Cloudinary \`f_auto,q_auto\`.
