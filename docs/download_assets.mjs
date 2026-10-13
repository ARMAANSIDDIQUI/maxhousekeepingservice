import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('docs/extracted/assets');
fs.mkdirSync(assetsDir, { recursive: true });

const brands = JSON.parse(fs.readFileSync(path.resolve('docs/extracted/brands.json'), 'utf8'));

async function downloadAssets() {
  const manifest = [];
  for (const b of brands) {
    const filename = `${b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.jpg`;
    const targetPath = path.join(assetsDir, filename);
    console.log(`Downloading ${b.name} logo from ${b.logoUrl}...`);
    try {
      const res = await fetch(b.logoUrl);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(targetPath, buffer);
        manifest.push({
          name: b.name,
          originalUrl: b.logoUrl,
          localFile: filename,
          bytes: buffer.length
        });
      } else {
        console.warn(`Failed downloading ${b.name}: status ${res.status}`);
      }
    } catch (err) {
      console.error(`Error downloading ${b.name}: ${err.message}`);
    }
  }

  fs.writeFileSync(path.join(assetsDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Downloaded ${manifest.length} brand logos to docs/extracted/assets/`);
}

downloadAssets();
