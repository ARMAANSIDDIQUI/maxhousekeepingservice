# Booking Flow Specification (Extracted & Re-architected)

Based on live observation of \`https://www.maxhousekeepingservice.com/book\` and service detail booking routes.

---

## 1. Flow Overview & Architecture

The booking flow operates as a single-page multi-step workflow paired with a sticky **Job Ticket / Booking Summary** receipt that calculates all pricing, discounts, and estimates live.

\`\`\`
[Select Service(s) & Variant(s)]
           │
           ▼
  [Schedule: Date & Slot]
           │
           ▼
[Customer Details & Geolocation Address]
           │
           ▼
[Review Job Ticket & Apply Coupon]
           │
           ▼
  [Confirm Booking (Cash on Service)]
           │
           ▼
[Success Screen + Confetti + Booking Code]
\`\`\`

---

## 2. Field-by-Field Breakdown

### Section 1: Services Selection (\`Select Service\`)
*Crucial: Matches the live implementation exactly as specified.*

1. **Active Services Cart**:
   - Renders each service added with its primary title and thumbnail.
   - **Variant Selector (Interactive Dropdown)**:
     - For services with variants (e.g., *Full Home Deep Cleaning: 1 BHK, 2 BHK, 3 BHK, 4 BHK*; *Sofa Drycleaning: 5 seater, 7 seater, 9 seater, 12 seater*; *Water Tank: 500L, 750L, 1000L, 1500L, 2000L, 3000L, 5000L*).
     - Label: \`Variant\`
     - Trigger: Displays current variant name + offered price (e.g. \`1 BHK – ₹2,800\`).
     - Dropdown menu: Shows all available variants with:
       - Variant name (e.g. \`2 BHK\`)
       - Struck-through Shown Price / MRP (e.g. \`₹7,499\`)
       - Offered Price (e.g. \`₹6,000\`)
     - Selecting a variant updates the item in place and recomputes the quote immediately.
   - **Remove Button**: Trash / remove icon button (\`react-icons/lu\`) to remove the service from the ticket.

2. **Add a Service Picker**:
   - Button trigger: \`Add a service\` -> \`Choose a service to add…\`
   - Interactive popover with instant real-time search input (\`Search services…\`).
   - Scrollable list of all catalog services displaying:
     - Thumbnail image
     - Service title & Category
     - Struck-through Shown Price (MRP)
     - Offered Price (\`from ₹X\`)
   - Clicking an item adds it to the active services cart with its default variant.

3. **Availability Notice**:
   - If an added service is unavailable in the selected city, an alert banner is displayed:
     *\`Certain selected services are not currently available in <City>. Please check options.\`*

---

### Section 2: Schedule

1. **Preferred Date (\`scheduled_date\`)**:
   - Input: \`type="date"\`
   - Constraints: Minimum date is today (\`min=YYYY-MM-DD\`). Configurable lead time from Settings (e.g., minimum 2 hours in advance).
   - Validation: Required, no past dates allowed.

2. **Preferred Time Slot (\`scheduled_time\`)**:
   - Input: \`<select>\` dropdown
   - Slot Windows:
     - \`Morning (8:00 AM – 11:00 AM)\`
     - \`Afternoon (12:00 PM – 3:00 PM)\`
     - \`Evening (4:00 PM – 7:00 PM)\`
   - Validation: Required.

---

### Section 3: Customer Details & Service Address

1. **Full Name (\`name\`)**: Text input, required, minimum 2 characters.
2. **Phone Number (\`phone\`)**: Tel input, required, 10-digit Indian mobile number validation (\`/^[6-9]\d{9}$/\`).
3. **Email (\`email\`)**: Email input, optional.
4. **Address (\`address\`)**:
   - Textarea (2 rows), placeholder: *"Floor, House/Apartment number, Building name, Street"*.
   - **Use My Current Location** action:
     - Invokes browser Geolocation API.
     - Reverse-geocodes coordinates into Street, City, State, and Pincode.
     - Displays feedback status (*"Locating…"* / *"Address updated"*).
5. **Landmark (\`landmark\`)**: Text input, optional, placeholder: *"Near park, mall, hospital, etc."*.
6. **City (\`city\`)**: Text input / Dropdown synchronized with chosen active city.
7. **State (\`state\`)**: Dropdown of Indian states, defaults to *"Uttar Pradesh"*.
8. **Pincode (\`pincode\`)**: 6-digit numeric input, formatted automatically, validated against city service zones.
9. **Notes (\`notes\`)**: Textarea, optional: *"Special instructions for the cleaning team"*.

---

### Section 4: Sticky Job Ticket (Booking Summary)

Perforated editorial receipt component that docks stickily on desktop and updates with smooth animations:

1. **Header**: Service thumbnail or icon + *"Booking summary"*.
2. **Line Items List**:
   - Service name & selected variant label.
   - Estimated duration (e.g. \`4-5 hrs\`).
   - Struck-through Shown Price (MRP) + bold Offered Price.
3. **Subtotal Breakdown**:
   - Subtotal of all offered prices.
   - Struck-through regular total showing initial MRP sum.
4. **Coupon System**:
   - Input field with uppercase auto-transform + \`Apply\` button.
   - Validates via \`POST /api/v1/pricing/quote\` or coupon engine.
   - On success: Shows \`− ₹X\` discount row and green chip with \`Remove\` option.
   - On failure: Displays clear error message (*"Invalid code"*, *"Expired"*, or *"Min cart value not met"*).
5. **Total Payable**:
   - Prominently styled in theme ink/brass color with rupee symbol: **₹X,XXX**.
6. **Live Savings Callout**:
   - Dynamic banner: **You save ₹X! (Y% OFF)** computed from total MRP minus total payable.
7. **Payment Mode**:
   - Version 1: **Cash on Service / Pay After Service**.
   - Note: *"No advance payment needed — pay safely after inspection and completion."*
8. **Action Button**:
   - **Confirm Booking** (Magnetic primary button).

---

### Section 5: Confirmation & Success State

1. **Server Validation**:
   - Recomputes all prices, discounts, and coupons server-side.
   - Rejects tampered totals.
   - Generates human-readable booking code: \`MH-YYYY-XXXX\` (e.g. \`MH-2026-8921\`).
2. **Success Screen**:
   - Confetti celebration effect (\`canvas-confetti\`).
   - Booking Code badge with copy button.
   - Scheduled date, slot window, and assigned service summary.
   - Pro arrival note (*"Technician will call 30 minutes before arrival"*).
   - WhatsApp updates opt-in CTA and Track Booking link.
