const puppeteer = require('puppeteer');
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT_DIR = '/home/user/web-portfolio/images/dribbble';
fs.mkdirSync(OUT_DIR, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(dest); });
    }).on('error', err => { fs.unlink(dest, () => {}); reject(err); });
  });
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--ignore-certificate-errors']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  console.log('Loading Dribbble profile...');
  await page.goto('https://dribbble.com/aakintilo', { waitUntil: 'networkidle2', timeout: 30000 });
  
  // Wait for shots to load
  await page.waitForSelector('li.shot-thumbnail', { timeout: 10000 }).catch(() => console.log('selector timeout, trying anyway'));
  
  // Scroll to load more
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise(r => setTimeout(r, 1500));
  }

  const shots = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('li.shot-thumbnail, .shot-thumbnail').forEach(el => {
      const img = el.querySelector('img[src], img[data-src]');
      const link = el.querySelector('a[href*="/shots/"]');
      if (img) {
        const src = img.src || img.dataset.src || '';
        const alt = img.alt || '';
        const href = link ? link.href : '';
        if (src && src.startsWith('http')) items.push({ src, alt, href });
      }
    });
    return items;
  });

  console.log(`Found ${shots.length} shots`);
  
  if (shots.length === 0) {
    // Dump page title and some HTML for debugging
    const title = await page.title();
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
    console.log('Page title:', title);
    console.log('Body preview:', bodyText);
  }

  await browser.close();

  const results = [];
  for (let i = 0; i < Math.min(shots.length, 24); i++) {
    const s = shots[i];
    // Use highest quality - replace small size params
    const highRes = s.src.replace(/\/\d+x\d+\//, '/400x300/').replace('_1x.', '_2x.').replace('normal', 'full');
    const ext = highRes.split('?')[0].split('.').pop().split('/').pop() || 'jpg';
    const fname = `shot-${String(i+1).padStart(2,'0')}.${ext}`;
    const dest = path.join(OUT_DIR, fname);
    try {
      await download(highRes, dest);
      const stat = fs.statSync(dest);
      console.log(`✓ ${fname} (${Math.round(stat.size/1024)}kb) — ${s.alt}`);
      results.push({ file: fname, alt: s.alt, href: s.href, src: highRes });
    } catch(e) {
      console.log(`✗ ${fname}: ${e.message}`);
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'shots.json'), JSON.stringify(results, null, 2));
  console.log(`\nSaved ${results.length} images to ${OUT_DIR}`);
})();
