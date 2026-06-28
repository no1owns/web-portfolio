#!/usr/bin/env node
/**
 * bento-sync.js — scan image subfolders and inject new assets into case study bento grids
 * Usage: node bento-sync.js [--dry-run] [page-filter]
 *   --dry-run   Show what would change without writing files
 *   page-filter Optional substring to match against page paths (e.g. "appomni")
 */

const fs   = require('fs');
const path = require('path');

const ROOT     = __dirname;
const IMG_ROOT = path.join(ROOT, 'images');

const DRY_RUN = process.argv.includes('--dry-run');
const FILTER  = process.argv.find(a => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1]);

// Maps each case study HTML to one or more image folders (relative to images/)
const PAGES = [
  {
    html: 'brand-systems/appomni.html',
    folders: ['appomni'],
  },
  {
    html: 'brand-systems/secureframe.html',
    folders: ['secureframe'],
  },
  {
    html: 'campaign-partner/docusign-campaigns.html',
    folders: ['docusign/ads'],
  },
  {
    html: 'event-brand/apollo-summit.html',
    folders: ['apollo'],
  },
  {
    html: 'event-brand/docusign-momentum.html',
    folders: ['docusign/events'],
  },
  {
    html: 'event-brand/navan.html',
    folders: ['navan', 'navan/ads', 'navan/events'],
  },
  {
    html: 'event-brand/mongodb-world.html',
    folders: ['mongodb', 'mongodb/events'],
    stackConvert: true,  // has stack-section instead of bento-gallery
  },
  {
    html: 'linx-security/linx.html',
    folders: ['linx'],
  },
  {
    html: 'presentation-design/betterup.html',
    folders: ['betterup'],
  },
];

const MEDIA_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg', '.mp4', '.webm', '.mov']);

function spanClass(filename) {
  const base = path.basename(filename, path.extname(filename)).toLowerCase();
  const ext  = path.extname(filename).toLowerCase();

  // Full-width spans — prefix OR "Moodboard" in name (handles "Moodboard - Level X.png")
  if (/^(moodboard|full|spread)[-_ ]/.test(base) || base.includes('moodboard')) return 'span-3';

  // Wide spans: videos + wide-format image prefixes
  if (['.mp4', '.webm', '.mov'].includes(ext)) return 'span-2';
  if (/^(motion|event|wide|banner|landscape|hero)[-_]/.test(base)) return 'span-2';

  return '';  // single cell
}

function bentoItemHtml(relSrc, filename) {
  const ext    = path.extname(filename).toLowerCase();
  const span   = spanClass(filename);
  const cls    = span ? `bento-item ${span}` : 'bento-item';
  const alt    = path.basename(filename, ext).replace(/[-_]/g, ' ');
  // URL-encode the filename portion in case it contains spaces
  const parts  = relSrc.split('/');
  parts[parts.length - 1] = encodeURIComponent(parts[parts.length - 1]);
  relSrc = parts.join('/');

  if (['.mp4', '.webm', '.mov'].includes(ext)) {
    return `    <div class="${cls}"><video autoplay muted loop playsinline><source src="${relSrc}" type="video/${ext.slice(1) === 'mov' ? 'mp4' : ext.slice(1)}"></video></div>`;
  }
  return `    <div class="${cls}"><img src="${relSrc}" alt="${alt}" loading="lazy"></div>`;
}

function scanFolder(folderRel) {
  const folderAbs = path.join(IMG_ROOT, folderRel);
  if (!fs.existsSync(folderAbs)) return [];
  return fs.readdirSync(folderAbs)
    .filter(f => MEDIA_EXTS.has(path.extname(f).toLowerCase()))
    .sort()
    .map(f => ({
      file:   f,
      relSrc: `../images/${folderRel}/${f}`,
    }));
}

// Extract all src/source attribute basenames already in the HTML
function referencedBasenames(html) {
  const set = new Set();
  const re = /(?:src|srcset)="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    set.add(path.basename(m[1]));
  }
  return set;
}

function buildBentoGallery(items) {
  const inner = items.map(({ relSrc, file }) => bentoItemHtml(relSrc, file)).join('\n');
  return `  <div class="bento-gallery">\n${inner}\n  </div>`;
}

function injectIntoBentoGallery(html, newItems) {
  // Match the opening bento-gallery tag through its closing 2-space </div>
  // Pattern: captures everything up to (but not including) the gallery's closing tag
  const re = /(<div class="bento-gallery">[\s\S]*?)(  <\/div>)/;
  const match = html.match(re);
  if (!match) return null;  // no gallery found

  const newLines = newItems.map(({ relSrc, file }) => bentoItemHtml(relSrc, file)).join('\n');
  return html.replace(re, `$1${newLines}\n  </div>`);
}

function convertStackToBento(html, allItems) {
  // Find and replace the stack-section with a bento-gallery
  const stackRe = /\s*<div class="stack-section">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
  if (!stackRe.test(html)) return null;

  const galleryHtml = buildBentoGallery(allItems);
  return html.replace(stackRe, `\n\n${galleryHtml}\n`);
}

function processPage(page) {
  const htmlPath = path.join(ROOT, page.html);
  if (!fs.existsSync(htmlPath)) {
    console.warn(`  SKIP (not found): ${page.html}`);
    return;
  }

  let html = fs.readFileSync(htmlPath, 'utf8');
  const referenced = referencedBasenames(html);

  // Collect all media from all configured folders
  const allMedia = page.folders.flatMap(scanFolder);

  // Determine which files are new (not yet referenced)
  const newMedia = allMedia.filter(({ file }) => !referenced.has(file));

  const hasBento = html.includes('class="bento-gallery"');
  const hasStack = html.includes('class="stack-section"');

  if (page.stackConvert && hasStack && !hasBento) {
    // Convert stack-section to bento-gallery using all media
    if (allMedia.length === 0) {
      console.log(`  SKIP (no media files): ${page.html}`);
      return;
    }
    console.log(`  CONVERT stack→bento (${allMedia.length} items): ${page.html}`);
    allMedia.forEach(({ file }) => console.log(`    + ${file}`));

    const updated = convertStackToBento(html, allMedia);
    if (!updated) {
      console.warn(`  WARN: Could not locate stack-section in ${page.html}`);
      return;
    }
    if (!DRY_RUN) fs.writeFileSync(htmlPath, updated, 'utf8');

  } else if (hasBento) {
    if (newMedia.length === 0) {
      console.log(`  OK (no new files): ${page.html}`);
      return;
    }
    console.log(`  INJECT ${newMedia.length} new item(s): ${page.html}`);
    newMedia.forEach(({ file }) => console.log(`    + ${file}`));

    const updated = injectIntoBentoGallery(html, newMedia);
    if (!updated) {
      console.warn(`  WARN: Could not locate bento-gallery closing tag in ${page.html}`);
      return;
    }
    if (!DRY_RUN) fs.writeFileSync(htmlPath, updated, 'utf8');

  } else {
    console.log(`  SKIP (no bento-gallery or stack-section): ${page.html}`);
  }
}

// Main
console.log(DRY_RUN ? '=== DRY RUN — no files will be written ===\n' : '=== bento-sync ===\n');

const pages = FILTER
  ? PAGES.filter(p => p.html.includes(FILTER))
  : PAGES;

if (pages.length === 0) {
  console.log(`No pages matched filter: "${FILTER}"`);
  process.exit(0);
}

for (const page of pages) {
  processPage(page);
}

console.log('\nDone.');
