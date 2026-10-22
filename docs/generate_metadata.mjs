import fs from 'fs';
import path from 'path';

const docsDir = path.resolve('docs/extracted');
const assetsDir = path.resolve('docs/extracted/assets');
fs.mkdirSync(assetsDir, { recursive: true });

// 1. Categories
const categories = [
  {
    name: "Home Cleaning",
    slug: "home-deep-cleaning",
    tagline: "Spotless, sanitised homes",
    serviceCount: 18,
    iconKey: "PiHouseLine"
  },
  {
    name: "Bathroom Cleaning",
    slug: "bathroom-cleaning",
    tagline: "Sparkling, germ-free bathrooms",
    serviceCount: 4,
    iconKey: "PiBathtub"
  },
  {
    name: "Kitchen Cleaning",
    slug: "kitchen-cleaning",
    tagline: "Grease-free, hygienic kitchens",
    serviceCount: 3,
    iconKey: "PiCookingPot"
  },
  {
    name: "Sofa & Carpet Cleaning",
    slug: "sofa-carpet-cleaning",
    tagline: "Fresh upholstery, like new",
    serviceCount: 8,
    iconKey: "PiArmchair"
  },
  {
    name: "Pest Control",
    slug: "pest-control",
    tagline: "Safe, lasting protection",
    serviceCount: 0,
    iconKey: "PiBug"
  },
  {
    name: "Commercial Cleaning",
    slug: "commercial-cleaning",
    tagline: "Professional spaces, professionally clean",
    serviceCount: 11,
    iconKey: "PiBuildingOffice"
  }
];
fs.writeFileSync(path.join(docsDir, 'categories.json'), JSON.stringify(categories, null, 2));

// 2. Cities
const cities = [
  { id: 3, name: "Moradabad", slug: "moradabad", state: "Uttar Pradesh", coordinates: { lat: 28.8386, lng: 78.7733 }, active: true, sortOrder: 1 },
  { id: 4, name: "Rampur", slug: "rampur", state: "Uttar Pradesh", coordinates: { lat: 28.8093, lng: 79.0267 }, active: true, sortOrder: 2 },
  { id: 5, name: "Amroha", slug: "amroha", state: "Uttar Pradesh", coordinates: { lat: 28.9044, lng: 78.4674 }, active: true, sortOrder: 3 },
  { id: 6, name: "Gajraula", slug: "gajraula", state: "Uttar Pradesh", coordinates: { lat: 28.8475, lng: 78.2372 }, active: true, sortOrder: 4 },
  { id: 7, name: "Sambhal", slug: "sambhal", state: "Uttar Pradesh", coordinates: { lat: 28.5835, lng: 78.5714 }, active: true, sortOrder: 5 },
  { id: 8, name: "Chandausi", slug: "chandausi", state: "Uttar Pradesh", coordinates: { lat: 28.4554, lng: 78.7766 }, active: true, sortOrder: 6 },
  { id: 9, name: "Noorpur", slug: "noorpur", state: "Uttar Pradesh", coordinates: { lat: 29.1557, lng: 78.4069 }, active: true, sortOrder: 7 },
  { id: 10, name: "Dhampur", slug: "dhampur", state: "Uttar Pradesh", coordinates: { lat: 29.3087, lng: 78.5085 }, active: true, sortOrder: 8 },
  { id: 12, name: "Bijnor", slug: "bijnor", state: "Uttar Pradesh", coordinates: { lat: 29.3724, lng: 78.1358 }, active: true, sortOrder: 9 }
];
fs.writeFileSync(path.join(docsDir, 'cities.json'), JSON.stringify(cities, null, 2));

// 3. Brands
const brands = [
  { name: "Bank Of Baroda", logoUrl: "https://www.maxhousekeepingservice.com/storage/brands/R5HP4To9sxORLfWGcR7KUCXjYWTGUqRd72KpYNaK.jpg", sortOrder: 1, active: true },
  { name: "Geetanjali Salon", logoUrl: "https://www.maxhousekeepingservice.com/storage/brands/hsEPUpXw8mraJcqNXrToai3oD4bhbJ5KUqRHKHpA.jpg", sortOrder: 2, active: true },
  { name: "Kundans", logoUrl: "https://www.maxhousekeepingservice.com/storage/brands/LHoHm9e0BpZxt9sVwA0NflQzNr4z3fMho0tBaHC3.jpg", sortOrder: 3, active: true },
  { name: "redtape", logoUrl: "https://www.maxhousekeepingservice.com/storage/brands/5NhJcSTRvLDGs1COGBT0JIdHf9TSdKaJBmZTbYx4.jpg", sortOrder: 4, active: true },
  { name: "Punjab National Bank", logoUrl: "https://www.maxhousekeepingservice.com/storage/brands/g8CqZZDLjlEXKxGyR1GGYxc9QJLujQVeeWrEETZd.jpg", sortOrder: 5, active: true },
  { name: "Subway", logoUrl: "https://www.maxhousekeepingservice.com/storage/brands/acyLzulQRCEQpJJhk2txwwRxSTL6lt8eRGL96Cpw.jpg", sortOrder: 6, active: true },
  { name: "Temptations", logoUrl: "https://www.maxhousekeepingservice.com/storage/brands/jtAZIixa52nqy5d46axYIRBWJx1YifyjuZmRd3Qo.jpg", sortOrder: 7, active: true },
  { name: "V-Mart", logoUrl: "https://www.maxhousekeepingservice.com/storage/brands/C8jk82QYxnYnOg1MCx8fz1Ro6tBsqiGCEmrjWCR5.jpg", sortOrder: 8, active: true },
  { name: "Tanishq", logoUrl: "https://www.maxhousekeepingservice.com/storage/brands/r6lmxs7SzS6SyubCOWDHL02oXI8VaOwteLYjMlWJ.jpg", sortOrder: 9, active: true },
  { name: "metro", logoUrl: "https://www.maxhousekeepingservice.com/storage/brands/Ph470P7YI7DVuufiloJezR20jaLbPI3edR0FmFle.jpg", sortOrder: 10, active: true },
  { name: "bikanervala", logoUrl: "https://www.maxhousekeepingservice.com/storage/brands/PY9rQIj6iaG8AkNHtk9q6xmEM6hVpDcUZwRV0wcW.jpg", sortOrder: 11, active: true },
  { name: "gajraula", logoUrl: "https://www.maxhousekeepingservice.com/storage/brands/Uh2UwFkF2KOa4AY3DtaIM9p4qhPx7zs60wtLtNDV.jpg", sortOrder: 12, active: true },
  { name: "goldGym", logoUrl: "https://www.maxhousekeepingservice.com/storage/brands/GPKNA54hMvcnv6QF5f9NKgBT0JFid2Ga767VkDOA.jpg", sortOrder: 13, active: true },
  { name: "mooga", logoUrl: "https://www.maxhousekeepingservice.com/storage/brands/faN06d3YYXm77qOCjm1UFHdxKLR35w30krr32w6k.jpg", sortOrder: 14, active: true },
  { name: "ngm", logoUrl: "https://www.maxhousekeepingservice.com/storage/brands/YakZxr2q5lDBCPY6GhSaPiqDzMdUQnVYPLEm2Hgw.jpg", sortOrder: 15, active: true }
];
fs.writeFileSync(path.join(docsDir, 'brands.json'), JSON.stringify(brands, null, 2));

// 4. Testimonials (excluding the SafSafaiwala error)
const testimonials = [
  {
    name: "Aarav Mehta",
    role: "Homeowner",
    city: "Amroha, U.P",
    quote: "Booked a 2BHK deep cleaning and the team was punctual, professional and thorough. My house has never looked this good!",
    rating: 5,
    isActive: true
  },
  {
    name: "Rahul Verma",
    role: "Homeowner",
    city: "Sambhal, U.P",
    quote: "Quick booking, transparent pricing and a polite crew. The bathroom looks brand new after their deep clean.",
    rating: 5,
    isActive: true
  },
  {
    name: "Priya Nair",
    role: "Interior Designer",
    city: "Moradabad, U.P",
    quote: "I use them for all my client move-ins. Reliable, well-equipped and consistently great results.",
    rating: 5,
    isActive: true
  },
  {
    name: "Imran Khan",
    role: "Restaurant Owner",
    city: "Amroha, U.P",
    quote: "Their commercial kitchen cleaning kept us audit-ready. Good machines and trained staff.",
    rating: 4,
    isActive: true
  },
  {
    name: "Kavya Reddy",
    role: "Homeowner",
    city: "Chandausi, U.P",
    quote: "AC jet service was smooth and affordable. The technician explained everything. Will book again.",
    rating: 5,
    isActive: true
  }
];
fs.writeFileSync(path.join(docsDir, 'testimonials.json'), JSON.stringify(testimonials, null, 2));

// 5. Settings
const settings = {
  brandName: "Max Housekeeping Service",
  tagline: "A spotless home, without lifting a finger.",
  heroCopy: "Book trained, background-verified cleaning professionals for your home or office. Deep cleaning, sofa, bathroom, kitchen, AC & pest control — all in one place.",
  phone: "+91 98977 66002",
  phoneRaw: "9897766002",
  alternatePhone: "",
  alternatePhoneRaw: "",
  whatsappNumber: "+91 98977 66002",
  whatsappRaw: "919897766002",
  email: "contactmaxhousekeepingservice@gmail.com",
  address: "Kanth road, Behind Asian Vivekanand Hospital, Moradabad, Uttar Pradesh 244001",
  workingHours: "Mon–Sun · 10:00 AM – 6:00 PM",
  heroStats: [
    { label: "Homes cleaned", value: 10000, suffix: "+" },
    { label: "Trained pros", value: 500, suffix: "+" },
    { label: "Cities served", value: 9, suffix: "" },
    { label: "Would recommend", value: 98, suffix: "%" }
  ],
  trustBadges: [
    "Background-verified pros",
    "Eco-safe products",
    "Transparent pricing",
    "100% satisfaction guarantee",
    "All equipment included",
    "Pay after service"
  ],
  stepByStep: [
    { step: 1, title: "Choose a service", description: "Pick from our menu of home & commercial cleaning services and select your city." },
    { step: 2, title: "Pick a time slot", description: "Tell us your address and choose a date & time that works for you." },
    { step: 3, title: "Relax & enjoy", description: "Our verified pros arrive on time with everything needed. Sit back and relax." }
  ],
  thirdPartyCredits: "Kwacko Solutions Private Limited (flagged for owner decision)",
  ratingClaim: "4.9 / 5.0 from 10k+ reviews (editable setting, flagged for owner verification)"
};
fs.writeFileSync(path.join(docsDir, 'settings.json'), JSON.stringify(settings, null, 2));

// 6. Pages
const pages = {
  about: {
    title: "We make clean effortless.",
    subtitle: "Max Housekeeping Service is on a mission to make professional, reliable cleaning accessible to every home and business in India.",
    storyHeading: "Built on trust, powered by people.",
    storyParagraphs: [
      "We started Max Housekeeping Service with a simple belief — that a clean space changes how you feel. What began as a dedicated team has grown into a network of trained, background-verified professionals serving thousands of homes and offices across Western Uttar Pradesh.",
      "Every booking is backed by transparent pricing, eco-safe products and a 100% satisfaction guarantee. No surprises, no shortcuts — just consistently spotless results."
    ],
    values: [
      { title: "Trust first", description: "Verified, trained and uniformed professionals you can welcome home." },
      { title: "Eco-conscious", description: "Safe, biodegradable products that protect your family and the planet." },
      { title: "Quality obsessed", description: "We sweat the small stuff so every corner shines." },
      { title: "Customer love", description: "Friendly support and a satisfaction guarantee on every booking." }
    ]
  },
  contact: {
    title: "Let's get in touch.",
    subtitle: "Questions, custom quotes or bulk bookings — our team is here to help.",
    reachDirectlySubtitle: "Prefer to talk? Call or message us — we usually respond within a few hours.",
    phone: "+91 98977 66002",
    email: "contactmaxhousekeepingservice@gmail.com",
    serviceAreas: "Moradabad · Amroha · Rampur · Gajraula · Sambhal · Chandausi · Noorpur · Dhampur · Bijnor",
    workingHours: "Mon–Sun · 10:00 AM – 6:00 PM"
  }
};
fs.writeFileSync(path.join(docsDir, 'pages.json'), JSON.stringify(pages, null, 2));

console.log("Saved core metadata files.");
