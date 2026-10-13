import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\dell\\.gemini\\antigravity-ide\\brain\\1f5d2fad-abed-45ad-8cc1-54bd89598a48';
const outDir = path.resolve('docs/generated-media');

fs.mkdirSync(path.join(outDir, 'site'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'categories'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'services'), { recursive: true });

const mappings = [
  {
    src: 'hero_clean_home_1791883786340.jpg',
    dest: 'site/hero-clean-home.jpg',
    targetSlug: 'hero',
    entityType: 'site',
    alt: 'Immaculate sunlit Indian living room with marble flooring and brass accents'
  },
  {
    src: 'cat_home_clean_1791883808486.jpg',
    dest: 'categories/home-deep-cleaning.jpg',
    targetSlug: 'home-deep-cleaning',
    entityType: 'category',
    alt: 'Master bedroom with crisp fresh linen and spotless hardwood flooring'
  },
  {
    src: 'cat_bathroom_clean_1791883826434.jpg',
    dest: 'categories/bathroom-cleaning.jpg',
    targetSlug: 'bathroom-cleaning',
    entityType: 'category',
    alt: 'Luxury sparkling bathroom with subway tile and brushed brass faucet'
  },
  {
    src: 'cat_kitchen_clean_1791883847759.jpg',
    dest: 'categories/kitchen-cleaning.jpg',
    targetSlug: 'kitchen-cleaning',
    entityType: 'category',
    alt: 'Grease-free modern kitchen with quartz countertops and stainless steel appliances'
  },
  {
    src: 'cat_sofa_carpet_1791883865237.jpg',
    dest: 'categories/sofa-carpet-cleaning.jpg',
    targetSlug: 'sofa-carpet-cleaning',
    entityType: 'category',
    alt: 'Clean textured linen sectional sofa and handwoven wool rug'
  },
  {
    src: 'cat_pest_control_1791883884437.jpg',
    dest: 'categories/pest-control.jpg',
    targetSlug: 'pest-control',
    entityType: 'category',
    alt: 'Sunlit hygienic protected home garden threshold'
  },
  {
    src: 'cat_commercial_clean_1791883904650.jpg',
    dest: 'categories/commercial-cleaning.jpg',
    targetSlug: 'commercial-cleaning',
    entityType: 'category',
    alt: 'Gleaming corporate office lobby with spotless architectural glass'
  },
  {
    src: 'service_home_worker_1791884434938.jpg',
    dest: 'services/full-home-deep-cleaning.jpg',
    targetSlug: 'full-home-deep-cleaning',
    entityType: 'service',
    alt: 'Professional Max Housekeeping technician in black and red uniform vacuuming marble living room floor'
  },
  {
    src: 'service_kitchen_worker_1791884456047.jpg',
    dest: 'services/kitchen-deep-cleaning.jpg',
    targetSlug: 'kitchen-deep-cleaning',
    entityType: 'service',
    alt: 'Max Housekeeping professional cleaner in uniform deep cleaning a kitchen chimney hood and countertop'
  },
  {
    src: 'service_bathroom_worker_1791884494646.jpg',
    dest: 'services/bathroom-tile-cleaning.jpg',
    targetSlug: 'bathroom-tile-cleaning',
    entityType: 'service',
    alt: 'Max Housekeeping professional cleaner polishing bathroom sink and ceramic tiles'
  },
  {
    src: 'service_sofa_worker_1791884516829.jpg',
    dest: 'services/sofa-dry-cleaning.jpg',
    targetSlug: 'sofa-dry-cleaning',
    entityType: 'service',
    alt: 'Max Housekeeping technician shampooing and vacuuming fabric sofa in modern living room'
  }
];

const manifest = [];

for (const m of mappings) {
  const srcPath = path.join(brainDir, m.src);
  const destPath = path.join(outDir, m.dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    const stats = fs.statSync(destPath);
    manifest.push({
      localPath: `docs/generated-media/${m.dest}`,
      targetSlug: m.targetSlug,
      entityType: m.entityType,
      alt: m.alt,
      bytes: stats.size
    });
    console.log(`Copied ${m.src} -> ${m.dest}`);
  } else {
    console.warn(`Source not found: ${srcPath}`);
  }
}

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Saved manifest with ${manifest.length} items to docs/generated-media/manifest.json`);
