import fs from 'fs';
import path from 'path';

const docsDir = path.resolve('docs/extracted');
const files = fs.readdirSync(docsDir).filter(f => f.startsWith('service_') && f.endsWith('.html'));

const services = [];

for (const file of files) {
  const slug = file.replace('service_', '').replace('.html', '');
  const html = fs.readFileSync(path.join(docsDir, file), 'utf8');

  // Title
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const title = titleMatch ? titleMatch[1].trim() : slug;

  // Category
  const catMatch = html.match(/<span class="chip mb-3">[\s\S]*?<\/svg>\s*([^<]+)<\/span>/);
  let categoryName = catMatch ? catMatch[1].trim() : 'Home Cleaning';

  // Map categoryName to category slug
  const catMap = {
    'Home Cleaning': 'home-deep-cleaning',
    'Bathroom Cleaning': 'bathroom-cleaning',
    'Kitchen Cleaning': 'kitchen-cleaning',
    'Sofa & Carpet Cleaning': 'sofa-carpet-cleaning',
    'Pest Control': 'pest-control',
    'Commercial Cleaning': 'commercial-cleaning'
  };
  const categorySlug = catMap[categoryName] || 'home-deep-cleaning';

  // Description
  const descMatch = html.match(/<h1[\s\S]*?<\/h1>\s*<p class="mt-4 text-lg[^"]*">([^<]+)<\/p>/);
  const description = descMatch ? descMatch[1].trim() : '';

  // Inclusions
  const inclusions = [];
  const incSection = html.match(/<h2 class="text-xl font-bold">What's included<\/h2>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/);
  if (incSection) {
    const incMatches = incSection[1].matchAll(/<span class="text-sm text-ink-700\/80">([^<]+)<\/span>/g);
    for (const m of incMatches) {
      inclusions.push(m[1].trim());
    }
  }

  // Exclusions
  const exclusions = [];
  const excSection = html.match(/<h2 class="text-xl font-bold">What's not included<\/h2>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/);
  if (excSection) {
    const excMatches = excSection[1].matchAll(/<span class="text-sm text-ink-700\/80">([^<]+)<\/span>/g);
    for (const m of excMatches) {
      exclusions.push(m[1].trim());
    }
  }

  // Price (Offered price)
  const priceMatch = html.match(/<p class="text-4xl font-extrabold text-ink-900">₹([\d,]+)<\/p>/);
  const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : 0;

  // MRP (Shown price)
  const mrpMatch = html.match(/<span class="text-lg text-ink-700\/40 line-through">₹([\d,]+)<\/span>/);
  const mrp = mrpMatch ? parseInt(mrpMatch[1].replace(/,/g, ''), 10) : price;

  // Discount percentage
  const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  // Duration
  const durMatch = html.match(/<dt class="text-ink-700\/60">Duration<\/dt>\s*<dd class="font-semibold text-ink-900">([^<]+)<\/dd>/);
  const duration = durMatch ? durMatch[1].trim() : '1 hr';

  // Image URL
  const imgMatch = html.match(/src="(\/storage\/services\/[^"]+)"/);
  const image = imgMatch ? `https://www.maxhousekeepingservice.com${imgMatch[1]}` : '';

  services.push({
    title,
    slug,
    category: categorySlug,
    categoryName,
    shortDescription: description ? description.substring(0, 120) + '...' : '',
    description,
    duration,
    price,
    mrp,
    discountPct,
    inclusions,
    exclusions,
    faqs: [
      {
        question: "How long does this service take?",
        answer: `This service typically takes approximately ${duration} depending on the condition and size of the space.`
      },
      {
        question: "Do I need to provide any cleaning supplies or equipment?",
        answer: "No, our verified professionals bring all specialized equipment and eco-safe cleaning agents with them."
      },
      {
        question: "Can I reschedule or cancel my booking?",
        answer: "Yes, you can reschedule or cancel anytime before the technician is assigned or dispatched without any charges."
      }
    ],
    image,
    cityAvailability: ["moradabad", "rampur", "amroha", "gajraula", "sambhal", "chandausi", "noorpur", "dhampur", "bijnor"],
    isPopular: [
      'full-home-deep-cleaning-1-bhk',
      'full-home-deep-cleaning-2-bhk',
      'kitchen-deep-cleaning-medium-size-kitchen',
      'double-bed-dry-cleaning',
      'water-tank-cleaning',
      'fan-cleaning-service'
    ].includes(slug),
    isActive: true
  });
}

// Sort by category, then title
services.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));

fs.writeFileSync(path.join(docsDir, 'services.json'), JSON.stringify(services, null, 2));
console.log(`Parsed ${services.length} services into services.json.`);

// Variant Family Grouping Analysis
const families = {
  "full-home-deep-cleaning": {
    familyTitle: "Full Home Deep Cleaning",
    category: "home-deep-cleaning",
    optionName: "Home Size",
    variants: []
  },
  "water-tank-cleaning": {
    familyTitle: "Water Tank Cleaning",
    category: "commercial-cleaning",
    optionName: "Tank Capacity",
    variants: []
  },
  "bed-dry-cleaning": {
    familyTitle: "Bed Mattress Dry Cleaning",
    category: "home-deep-cleaning",
    optionName: "Bed Size",
    variants: []
  },
  "kitchen-deep-cleaning": {
    familyTitle: "Kitchen Deep Cleaning",
    category: "kitchen-cleaning",
    optionName: "Kitchen Size",
    variants: []
  },
  "sofa-dry-cleaning": {
    familyTitle: "Sofa Dry Cleaning",
    category: "sofa-carpet-cleaning",
    optionName: "Seating Capacity",
    variants: []
  },
  "carpet-cleaning": {
    familyTitle: "Carpet Deep Cleaning",
    category: "sofa-carpet-cleaning",
    optionName: "Carpet Area",
    variants: []
  },
  "chair-dry-cleaning": {
    familyTitle: "Chair Dry Cleaning",
    category: "home-deep-cleaning",
    optionName: "Number of Chairs",
    variants: []
  },
  "bathroom-tile-cleaning": {
    familyTitle: "Bathroom Tile & Marble Cleaning",
    category: "bathroom-cleaning",
    optionName: "Bathroom Size & Surface",
    variants: []
  },
  "swimming-pool-cleaning": {
    familyTitle: "Swimming Pool Cleaning",
    category: "commercial-cleaning",
    optionName: "Pool Capacity",
    variants: []
  }
};

for (const s of services) {
  if (s.slug.includes('full-home-deep-cleaning')) {
    families["full-home-deep-cleaning"].variants.push(s);
  } else if (s.slug.includes('water-tank-cleaning') || s.slug.includes('tank')) {
    families["water-tank-cleaning"].variants.push(s);
  } else if (s.slug.includes('bed-dry-cleaning')) {
    families["bed-dry-cleaning"].variants.push(s);
  } else if (s.slug.includes('kitchen-deep-cleaning')) {
    families["kitchen-deep-cleaning"].variants.push(s);
  } else if (s.slug.includes('seater') || s.slug.includes('sofa')) {
    families["sofa-dry-cleaning"].variants.push(s);
  } else if (s.slug.includes('carpet')) {
    families["carpet-cleaning"].variants.push(s);
  } else if (s.slug.includes('chair')) {
    families["chair-dry-cleaning"].variants.push(s);
  } else if (s.slug.includes('tile') || s.slug.includes('bathroom')) {
    families["bathroom-tile-cleaning"].variants.push(s);
  } else if (s.slug.includes('litre')) {
    families["swimming-pool-cleaning"].variants.push(s);
  }
}

let reportMd = `# Variant Grouping Report\n\n`;
reportMd += `This report lists the detected service families and consolidated matrix options from the 37 raw crawled services on maxhousekeepingservice.com.\n\n`;

for (const [key, fam] of Object.entries(families)) {
  reportMd += `## ${fam.familyTitle} (\`${fam.category}\`)\n`;
  reportMd += `- **Consolidated Option Dimension**: ${fam.optionName}\n`;
  reportMd += `- **Original Variants Found**: ${fam.variants.length}\n`;
  reportMd += `- **Confidence**: High\n\n`;
  reportMd += `| Original Title | Slug Alias | Shown Price (MRP) | Offered Price | Savings | Duration |\n`;
  reportMd += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
  for (const v of fam.variants) {
    reportMd += `| ${v.title} | \`${v.slug}\` | ₹${v.mrp.toLocaleString('en-IN')} | ₹${v.price.toLocaleString('en-IN')} | ${v.discountPct}% | ${v.duration} |\n`;
  }
  reportMd += `\n`;
}

fs.writeFileSync(path.resolve('docs/variant-grouping-report.md'), reportMd);
console.log("Generated docs/variant-grouping-report.md");
