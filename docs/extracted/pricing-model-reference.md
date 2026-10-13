# Pricing Model Reference & Architecture

*Reference: Max House Keeping Service live pricing structure (as instructed, focusing exclusively on maxhousekeepingservice.com).*

---

## 1. Core Pricing Philosophy: Shown Price vs. Offered Price

Every service and variant on Max House Keeping Service operates on a transparent dual-price structure:

1. **Shown Price (\`mrp\`)**:
   - The standard or market price displayed struck-through (e.g., \`₹2,999\`).
   - Configurable directly from the Admin Panel per service or variant.
2. **Offered Price (\`price\` / \`effectivePrice\`)**:
   - The actual discounted price payable by the customer (e.g., \`₹2,800\`).
   - Also configurable directly from the Admin Panel.
3. **Computed Discount & Savings (\`discountPct\`)**:
   - Computed dynamically: \`discountPct = Math.round(((mrp - price) / mrp) * 100)\`.
   - Never stored manually; recomputed automatically upon save.
   - Displayed to the customer via high-contrast savings badges:
     * \`7% OFF · You save ₹199\`
     * \`33% OFF · You save ₹300\`

---

## 2. Option Dimensions & Service Variant Families

Live analysis of the 37 services reveals natural variant groupings across specific dimensions:

| Family | Category | Option Dimension | Example Options | Shown Price (MRP) | Offered Price | Duration |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Full Home Deep Cleaning** | Home Cleaning | Home Size (\`bhk\`) | 1 BHK<br>2 BHK<br>3 BHK<br>4 BHK | ₹2,999<br>₹7,499<br>₹10,500<br>₹15,000 | ₹2,800<br>₹6,000<br>₹9,500<br>₹12,500 | 4-5 hrs<br>5-7 hrs<br>7-9 hrs<br>2 Days |
| **Bed Dry Cleaning** | Home Cleaning | Bed Size | Single Bed<br>Double Bed | ₹900<br>₹1,499 | ₹600<br>₹1,000 | 1 hr<br>1 hr |
| **Kitchen Deep Cleaning** | Kitchen Cleaning | Kitchen Size | Medium Size<br>Big Size Home<br>Big Size Hotel | ₹3,000<br>₹8,999<br>₹14,999 | ₹2,500<br>₹6,500<br>₹10,000 | 4-5 hrs<br>4-5 hrs<br>4-5 hrs |
| **Sofa Dry Cleaning** | Sofa & Carpet | Seat Count | Per Seat / 5-Seater<br>7-Seater<br>9-Seater<br>12-Seater | ₹1,999.98<br>₹2,500<br>₹3,500<br>₹4,500 | ₹1,750<br>₹2,450<br>₹3,150<br>₹4,200 | Varies by seat count |
| **Carpet Cleaning** | Sofa & Carpet | Carpet Area | Up to 50 Sq Ft<br>50–100 Sq Ft<br>100–150 Sq Ft<br>150–200 Sq Ft | ₹699<br>₹799<br>₹999<br>₹1,499 | ₹499<br>₹649<br>₹799<br>₹949 | 1-2 hrs |
| **Water Tank Cleaning** | Commercial / Home | Tank Capacity | 500L<br>750L<br>1,000L<br>1,500L<br>2,000L<br>3,000L<br>5,000L | ₹499<br>₹699<br>₹1,000<br>₹1,200<br>₹1,700<br>₹2,200<br>₹3,000 | ₹400<br>₹500<br>₹700<br>₹1,000<br>₹1,500<br>₹2,000<br>₹2,500 | 1 hr each |
| **Swimming Pool Cleaning** | Commercial Cleaning | Pool Volume | Up to 5,000L<br>Up to 10,000L<br>Up to 15,000L<br>Up to 20,000L | ₹3,000<br>₹7,000<br>₹9,999<br>₹15,000 | ₹2,500<br>₹5,000<br>₹7,500<br>₹10,000 | Variable |
| **Bathroom Tiles / Marble** | Bathroom Cleaning | Size & Finish | Medium Floor & Wall<br>Medium Marble<br>Large Tile<br>Large Marble | ₹700<br>₹1,000<br>₹1,000<br>₹1,500 | ₹550<br>₹699<br>₹750<br>₹1,350 | 1-2 hrs |
| **Chair Dry Cleaning** | Home Cleaning | Quantity | Up to 4 Chairs<br>Up to 6 Chairs<br>Up to 9 Chairs<br>Up to 12 Chairs | ₹900<br>₹1,500<br>₹1,800<br>₹2,500 | ₹700<br>₹1,200<br>₹1,500<br>₹2,000 | 1-2 hrs |

---

## 3. Pricing Modes in Data Engine

To support both simple and consolidated services:

1. **\`fixed\` Mode**: Single service without variants (e.g., Fan Cleaning: MRP ₹150, Offered ₹100).
2. **\`tiered\` Mode**: Service with named packages (e.g., Standard vs. Intensive vs. Move-In).
3. **\`combination\` / \`variant\` Mode**: Service with an option dimension (e.g., Home Size -> 1 BHK, 2 BHK, etc.), where each option row specifies:
   - \`optionKey\`: e.g. \`1-bhk\`
   - \`label\`: e.g. \`1 BHK\`
   - \`mrp\`: Shown Price
   - \`price\`: Offered Price
   - \`duration\`: Estimated duration string or minutes

---

## 4. Multi-Item Cart & Discount Resolution Engine

When a customer builds a booking:

\`\`\`
Line Item Calculation:
  For each item:
    Variant Price = Matrix Row Offered Price
    Variant MRP   = Matrix Row Shown Price
    Item Subtotal = Variant Price * Quantity
    Item MRP Total = Variant MRP * Quantity

Cart Totals:
  Cart Subtotal = Sum(Item Subtotal)
  Cart MRP Total = Sum(Item MRP Total)

Pricing Rules & Coupons:
  If Coupon Applied:
    Validate minimum cart value, expiry, and city eligibility
    Discount Amount = Flat deduction OR (Percent * Cart Subtotal)
    Capped at maxDiscount

Final Payable:
  Total Payable = Math.max(0, Cart Subtotal - Discount Amount)
  Total Customer Savings = (Cart MRP Total - Total Payable)
\`\`\`

---

## 5. Admin Panel Pricing Controls

As requested by the user, the Admin Panel provides intuitive controls for:
1. **Shown Price (MRP)**: The crossed-out standard price to display to users.
2. **Offered Price**: The actual promotional / discounted price payable by users.
3. **Live Preview Badge**: Automatically shows the calculated discount percentage (e.g., \`20% OFF\`) and net savings.
4. **City Overrides**: Optional per-city price multiplier or explicit custom offered price.
5. **Coupons & Promo Rules**: Code, discount type (percentage/flat), expiry, min order value.
