/**
 * Portfolio scraper — Dribbble + Behance
 * Usage: node scrape-portfolio.js [dribbble|behance|all]
 *
 * Outputs:
 *   images/dribbble/   + images/dribbble/shots.json
 *   images/behance/    + images/behance/projects.json
 */

const puppeteer = require('puppeteer');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const DRIBBBLE_USER = 'aakintilo';
const BEHANCE_USER  = 'ayodejiakintilo';
const MAX_ITEMS     = 30;

const DRIBBBLE_DIR = path.join(__dirname, 'images/dribbble');
const BEHANCE_DIR  = path.join(__dirname, 'images/behance');

fs.mkdirSync(DRIBBBLE_DIR, { recursive: true });
fs.mkdirSync(BEHANCE_DIR,  { recursive: true });

// ─── helpers ──────────────────────────────────────────────────────────────────

function download(imgUrl, dest, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (redirects <= 0) return reject(new Error('Too many redirects'));
    const parsed = url.parse(imgUrl);
    const lib = parsed.protocol === 'https:' ? https : http;
    const file = fs.createWriteStream(dest);
    lib.get(imgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': parsed.hostname.includes('behance') ? 'https://www.behance.net/' : 'https://dribbble.com/',
      }
    }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        file.destroy();
        fs.unlink(dest, () => {});
        return download(res.headers.location, dest, redirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.destroy();
        fs.unlink(dest, () => {});
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(dest); });
    }).on('error', err => { file.destroy(); fs.unlink(dest, () => {}); reject(err); });
  });
}

function ext(imgUrl) {
  const clean = imgUrl.split('?')[0].split('#')[0];
  const e = path.extname(clean).replace('.', '') || 'jpg';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(e) ? e : 'jpg';
}

function makeBrowser() {
  return puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--ignore-certificate-errors',
    ],
    defaultViewport: { width: 1440, height: 900 },
  });
}

async function autoScroll(page, times = 5, delay = 1800) {
  for (let i = 0; i < times; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.5));
    await new Promise(r => setTimeout(r, delay));
  }
}

// ─── Dribbble ─────────────────────────────────────────────────────────────────

async function scrapeDribbble(browser) {
  console.log('\n── Dribbble ────────────────────────────────');
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

  const profileUrl = `https://dribbble.com/${DRIBBBLE_USER}`;
  console.log(`Loading ${profileUrl}`);
  await page.goto(profileUrl, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});

  await page.waitForSelector('li.shot-thumbnail, .shot-thumbnail, [data-thumbnail]', { timeout: 12000 })
    .catch(() => console.log('  ⚠ shot selector timed out, scrolling anyway'));

  await autoScroll(page, 5, 1500);

  const shots = await page.evaluate(() => {
    const items = [];
    const seen = new Set();
    // Try multiple selector strategies Dribbble has used over the years
    const candidates = [
      ...document.querySelectorAll('li.shot-thumbnail'),
      ...document.querySelectorAll('[class*="shot-thumbnail"]'),
      ...document.querySelectorAll('[data-thumbnail]'),
    ];
    candidates.forEach(el => {
      const img = el.querySelector('img[src], img[data-src], img[data-lazy-src]');
      const link = el.querySelector('a[href*="/shots/"]') || el.closest('a[href*="/shots/"]');
      if (!img) return;
      const src = img.src || img.dataset.src || img.dataset.lazySrc || '';
      if (!src || !src.startsWith('http')) return;
      if (seen.has(src)) return;
      seen.add(src);
      items.push({
        src,
        alt: img.alt || img.title || '',
        href: link ? link.href : '',
      });
    });
    return items;
  });

  console.log(`  Found ${shots.length} shots`);

  if (shots.length === 0) {
    const title = await page.title();
    const preview = await page.evaluate(() => document.body.innerText.slice(0, 400));
    console.log('  Page title:', title);
    console.log('  Preview:', preview);
    await page.close();
    return [];
  }

  const results = [];
  const limit = Math.min(shots.length, MAX_ITEMS);
  for (let i = 0; i < limit; i++) {
    const s = shots[i];
    // Prefer larger variant: replace size tokens in CDN URLs
    const hiRes = s.src
      .replace(/\/\d+x\d+\//g, '/400x300/')
      .replace(/_1x\./, '_2x.')
      .replace(/normal/, 'full');
    const fname = `shot-${String(i + 1).padStart(2, '0')}.${ext(hiRes)}`;
    const dest  = path.join(DRIBBBLE_DIR, fname);
    try {
      await download(hiRes, dest);
      const kb = Math.round(fs.statSync(dest).size / 1024);
      console.log(`  ✓ ${fname} (${kb}kb)  ${s.alt || '(no alt)'}`);
      results.push({ file: fname, alt: s.alt, href: s.href, src: hiRes });
    } catch (e) {
      // Fallback to original URL
      try {
        await download(s.src, dest);
        const kb = Math.round(fs.statSync(dest).size / 1024);
        console.log(`  ✓ ${fname} [orig] (${kb}kb)  ${s.alt || ''}`);
        results.push({ file: fname, alt: s.alt, href: s.href, src: s.src });
      } catch (e2) {
        console.log(`  ✗ ${fname}: ${e2.message}`);
      }
    }
  }

  fs.writeFileSync(path.join(DRIBBBLE_DIR, 'shots.json'), JSON.stringify(results, null, 2));
  console.log(`  Saved ${results.length} images → images/dribbble/`);
  await page.close();
  return results;
}

// ─── Behance ──────────────────────────────────────────────────────────────────

async function scrapeBehance(browser) {
  console.log('\n── Behance ─────────────────────────────────');
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

  // Intercept and block heavy non-image resources to speed up load
  await page.setRequestInterception(true);
  page.on('request', req => {
    const type = req.resourceType();
    if (['font', 'media'].includes(type)) req.abort();
    else req.continue();
  });

  const profileUrl = `https://www.behance.net/${BEHANCE_USER}`;
  console.log(`Loading ${profileUrl}`);

  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});

  // Behance may redirect to a login wall or show a cookie consent overlay; dismiss if present
  await page.evaluate(() => {
    const cookieBtn = document.querySelector('[data-testid="cookie-accept"], button[title*="Accept"], button[aria-label*="Accept"]');
    if (cookieBtn) cookieBtn.click();
  }).catch(() => {});

  // Wait for the project grid
  const gridSel = [
    '.rf-project-cover',
    '.ProjectCoverNeue',
    '[class*="ProjectCover"]',
    'a[href*="/gallery/"]',
  ].join(', ');

  await page.waitForSelector(gridSel, { timeout: 20000 })
    .catch(() => console.log('  ⚠ project grid selector timed out, scrolling anyway'));

  await autoScroll(page, 6, 2000);

  const projects = await page.evaluate(() => {
    const items = [];
    const seen = new Set();

    // Strategy 1: project cover wrappers with embedded image + title
    const covers = document.querySelectorAll([
      '.rf-project-cover',
      '.ProjectCoverNeue-root',
      '[class*="ProjectCoverNeue"]',
      '[class*="project-cover"]',
    ].join(', '));

    covers.forEach(el => {
      const link = el.querySelector('a[href*="/gallery/"]') || el.closest('a[href*="/gallery/"]');
      const img  = el.querySelector('img[src], img[data-src]');
      const titleEl = el.querySelector('[class*="Title"], [class*="title"], h3, h4');
      if (!img) return;
      const src = img.src || img.dataset.src || '';
      if (!src.startsWith('http')) return;
      if (seen.has(src)) return;
      seen.add(src);
      items.push({
        src,
        title: titleEl ? titleEl.textContent.trim() : (img.alt || ''),
        href: link ? link.href : '',
      });
    });

    // Strategy 2: fallback — any gallery link that contains an image
    if (items.length === 0) {
      document.querySelectorAll('a[href*="/gallery/"]').forEach(link => {
        const img = link.querySelector('img[src], img[data-src]');
        if (!img) return;
        const src = img.src || img.dataset.src || '';
        if (!src.startsWith('http')) return;
        if (seen.has(src)) return;
        seen.add(src);
        items.push({
          src,
          title: img.alt || '',
          href: link.href,
        });
      });
    }

    return items;
  });

  console.log(`  Found ${projects.length} projects`);

  if (projects.length === 0) {
    const title = await page.title();
    const preview = await page.evaluate(() => document.body.innerText.slice(0, 500));
    console.log('  Page title:', title);
    console.log('  Preview:', preview);
    await page.close();
    return [];
  }

  const results = [];
  const limit = Math.min(projects.length, MAX_ITEMS);
  for (let i = 0; i < limit; i++) {
    const p = projects[i];
    // Behance CDN: replace size suffix for higher res
    const hiRes = p.src
      .replace(/\/\d+x\d+\//g, '/1400x1050/')
      .replace(/max_\d+/g, 'max_1200')
      .replace(/ph_\d+/g, 'ph_1200');
    const fname = `project-${String(i + 1).padStart(2, '0')}.${ext(hiRes)}`;
    const dest  = path.join(BEHANCE_DIR, fname);
    try {
      await download(hiRes, dest);
      const kb = Math.round(fs.statSync(dest).size / 1024);
      console.log(`  ✓ ${fname} (${kb}kb)  ${p.title || '(no title)'}`);
      results.push({ file: fname, title: p.title, href: p.href, src: hiRes });
    } catch (e) {
      try {
        await download(p.src, dest);
        const kb = Math.round(fs.statSync(dest).size / 1024);
        console.log(`  ✓ ${fname} [orig] (${kb}kb)  ${p.title || ''}`);
        results.push({ file: fname, title: p.title, href: p.href, src: p.src });
      } catch (e2) {
        console.log(`  ✗ ${fname}: ${e2.message}`);
      }
    }
  }

  fs.writeFileSync(path.join(BEHANCE_DIR, 'projects.json'), JSON.stringify(results, null, 2));
  console.log(`  Saved ${results.length} images → images/behance/`);
  await page.close();
  return results;
}

// ─── main ─────────────────────────────────────────────────────────────────────

(async () => {
  const target = (process.argv[2] || 'all').toLowerCase();
  const browser = await makeBrowser();
  try {
    if (target === 'dribbble' || target === 'all') await scrapeDribbble(browser);
    if (target === 'behance'  || target === 'all') await scrapeBehance(browser);
  } finally {
    await browser.close();
    console.log('\nDone.');
  }
})();
