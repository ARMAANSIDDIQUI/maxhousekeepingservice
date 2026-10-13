import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://www.maxhousekeepingservice.com';
const categories = [
  'home-deep-cleaning',
  'bathroom-cleaning',
  'kitchen-cleaning',
  'sofa-carpet-cleaning',
  'pest-control',
  'commercial-cleaning'
];

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
  const allServiceSlugs = new Set();
  const serviceRegex = /href=["']https:\/\/www\.maxhousekeepingservice\.com\/services\/([a-zA-Z0-9_-]+)["']/g;

  // Read existing discovered slugs
  const files = fs.readdirSync(docsDir);
  for (const f of files) {
    if (f.startsWith('service_') && f.endsWith('.html')) {
      const slug = f.replace('service_', '').replace('.html', '');
      allServiceSlugs.add(slug);
    }
  }

  for (const cat of categories) {
    let page = 1;
    while (page <= 5) {
      const url = `${BASE_URL}/services?category=${cat}&page=${page}`;
      const html = await fetchPage(url);
      await sleep(500);
      if (!html) break;

      let foundOnPage = 0;
      let match;
      const localSlugs = [];
      while ((match = serviceRegex.exec(html)) !== null) {
        if (!allServiceSlugs.has(match[1])) {
          allServiceSlugs.add(match[1]);
          localSlugs.push(match[1]);
          foundOnPage++;
        }
      }

      console.log(`Cat: ${cat}, Page: ${page}, New slugs found: ${foundOnPage}`);
      if (foundOnPage === 0 && page > 1) {
        break; // no more pages
      }
      // Check if page has pagination links
      if (!html.includes(`page=${page + 1}`)) {
        break;
      }
      page++;
    }
  }

  // Also check without category, pages 2, 3, 4
  for (let page = 2; page <= 5; page++) {
    const url = `${BASE_URL}/services?page=${page}`;
    const html = await fetchPage(url);
    await sleep(500);
    if (!html) break;
    let match;
    let found = 0;
    while ((match = serviceRegex.exec(html)) !== null) {
      if (!allServiceSlugs.has(match[1])) {
        allServiceSlugs.add(match[1]);
        found++;
      }
    }
    console.log(`All services, Page: ${page}, New slugs found: ${found}`);
    if (found === 0) break;
  }

  console.log(`Total unique service slugs discovered: ${allServiceSlugs.size}`);
  console.log(Array.from(allServiceSlugs));

  // Now fetch the HTML for any newly found slugs
  for (const slug of allServiceSlugs) {
    const filePath = path.join(docsDir, `service_${slug}.html`);
    if (!fs.existsSync(filePath)) {
      const detailHtml = await fetchPage(`${BASE_URL}/services/${slug}`);
      if (detailHtml) {
        fs.writeFileSync(filePath, detailHtml);
      }
      await sleep(500);
    }
  }
}

run();
