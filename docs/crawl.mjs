import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://www.maxhousekeepingservice.com';
const DELAY_MS = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPage(url) {
  console.log(`Fetching: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    if (!res.ok) {
      console.warn(`Failed ${url}: status ${res.status}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.error(`Error fetching ${url}: ${err.message}`);
    return null;
  }
}

async function run() {
  const docsDir = path.resolve('docs/extracted');
  const assetsDir = path.resolve('docs/extracted/assets');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.mkdirSync(assetsDir, { recursive: true });

  // 1. Fetch /services
  const servicesHtml = await fetchPage(`${BASE_URL}/services`);
  await sleep(DELAY_MS);

  // 2. Fetch /about
  const aboutHtml = await fetchPage(`${BASE_URL}/about`);
  await sleep(DELAY_MS);

  // 3. Fetch /contact
  const contactHtml = await fetchPage(`${BASE_URL}/contact`);
  await sleep(DELAY_MS);

  // Save raw HTMLs for analysis
  if (servicesHtml) fs.writeFileSync(path.join(docsDir, 'raw_services.html'), servicesHtml);
  if (aboutHtml) fs.writeFileSync(path.join(docsDir, 'raw_about.html'), aboutHtml);
  if (contactHtml) fs.writeFileSync(path.join(docsDir, 'raw_contact.html'), contactHtml);

  // Extract all service links from services page
  const serviceRegex = /href=["']https:\/\/www\.maxhousekeepingservice\.com\/services\/([a-zA-Z0-9_-]+)["']/g;
  const serviceSlugs = new Set();
  let match;
  while ((match = serviceRegex.exec(servicesHtml || '')) !== null) {
    serviceSlugs.add(match[1]);
  }
  console.log(`Discovered ${serviceSlugs.size} unique service slugs:`, Array.from(serviceSlugs));

  // Fetch each service detail page
  const serviceDetails = {};
  for (const slug of serviceSlugs) {
    const detailHtml = await fetchPage(`${BASE_URL}/services/${slug}`);
    if (detailHtml) {
      serviceDetails[slug] = detailHtml;
      fs.writeFileSync(path.join(docsDir, `service_${slug}.html`), detailHtml);
    }
    await sleep(DELAY_MS);
  }

  console.log(`Finished fetching ${Object.keys(serviceDetails).length} service pages.`);
}

run();
