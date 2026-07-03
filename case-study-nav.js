/**
 * case-study-nav.js
 * Auto-populates the "Next Project" section on every case study page.
 *
 * To add a new case study: add one entry to PROJECTS in the desired order.
 * Every page's next-project link updates automatically — no other edits needed.
 */
const PROJECTS = [
  { title: 'MongoDB World',         url: 'event-brand/mongodb-world.html' },
  { title: 'Navan',                 url: 'event-brand/navan.html' },
  { title: 'DocuSign Momentum',     url: 'event-brand/docusign-momentum.html' },
  { title: 'DocuSign Campaigns',    url: 'campaign-partner/docusign-campaigns.html' },
  { title: 'AppOmni',              url: 'brand-systems/appomni.html' },
  { title: 'Secureframe',           url: 'brand-systems/secureframe.html' },
  { title: 'Apollo Summit',         url: 'event-brand/apollo-summit.html' },
  { title: 'BetterUp',             url: 'presentation-design/betterup.html' },
  { title: 'Linx Security',         url: 'linx-security/linx.html' },
  { title: 'MongoDB IPO Launch',    url: 'technical-developer/mongodb-ipo.html' },
  { title: 'MongoDB Dream Big',     url: 'brand-character/mongodb-dream-big.html' },
  { title: 'MongoDB Beliefs',       url: 'brand-character/mongodb-values.html' },
];

(function () {
  // Extract "folder/file.html" from any deployment path
  const parts = window.location.pathname.split('/').filter(Boolean);
  const key   = parts.length >= 2 ? parts.slice(-2).join('/') : '';

  const idx  = PROJECTS.findIndex(p => p.url === key);
  if (idx === -1) return;

  const label     = document.getElementById('cs-next-label');
  const linkEls   = document.querySelectorAll('.cs-next-link-auto');
  const titleEl   = document.getElementById('cs-next-title');

  if (!linkEls.length || !titleEl) return;

  const isLast = idx === PROJECTS.length - 1;
  const next   = isLast ? null : PROJECTS[idx + 1];

  // All case study pages are one directory deep, so ../ always reaches root
  const href   = next ? ('../' + next.url) : '../portfolio.html';
  const text   = next ? (next.title + ' →') : 'All Projects →';
  const lbl    = next ? 'Next Project' : 'Back to';

  if (label)   label.textContent = lbl;
  titleEl.textContent = text;
  linkEls.forEach(el => { el.href = href; });
})();

/**
 * Gallery: hero + masonry layout, built from filename convention.
 * - Any .bento-item whose media filename contains "hero" is featured at the top.
 * - Everything else flows into a CSS-columns masonry grid below.
 * - Auto-initializes on every .bento-gallery found on the page — no per-page config.
 */
(function () {
  function altFromFilename(src) {
    const name = (src || '').split('/').pop()
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\d{4,}\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : '';
  }

  function getMediaEl(item) {
    return item.querySelector('img, video');
  }

  function getSrc(mediaEl) {
    if (!mediaEl) return '';
    if (mediaEl.tagName === 'IMG') return mediaEl.getAttribute('src') || '';
    const source = mediaEl.querySelector('source');
    return (source && source.getAttribute('src')) || '';
  }

  function buildGallery(gallery) {
    const items = Array.from(gallery.querySelectorAll(':scope > .bento-item'));
    if (!items.length) return;

    items.forEach(item => {
      item.classList.remove('span-2', 'span-3');
      const mediaEl = getMediaEl(item);
      if (mediaEl && mediaEl.tagName === 'IMG') {
        const alt = altFromFilename(getSrc(mediaEl).split('/').pop());
        if (alt) mediaEl.setAttribute('alt', alt);
      }
    });

    const heroes = items.filter(item => {
      const filename = getSrc(getMediaEl(item)).split('/').pop().toLowerCase();
      return filename.indexOf('hero') !== -1;
    });
    const supporting = items.filter(item => heroes.indexOf(item) === -1);

    gallery.innerHTML = '';

    if (heroes.length > 0) {
      const heroSection = document.createElement('div');
      heroSection.className = 'gallery-heroes';

      if (heroes.length === 1) {
        heroSection.classList.add('gallery-heroes--single');
        heroSection.appendChild(heroes[0]);
      } else {
        const firstWrap = document.createElement('div');
        firstWrap.className = 'gallery-hero-full';
        firstWrap.appendChild(heroes[0]);
        heroSection.appendChild(firstWrap);

        const heroRow = document.createElement('div');
        heroRow.className = 'gallery-hero-row';
        heroes.slice(1).forEach(item => heroRow.appendChild(item));
        heroSection.appendChild(heroRow);
      }

      gallery.appendChild(heroSection);
    }

    if (supporting.length > 0) {
      const masonry = document.createElement('div');
      masonry.className = 'gallery-masonry';
      supporting.forEach(item => {
        item.classList.add('gallery-masonry__item');
        masonry.appendChild(item);
      });
      gallery.appendChild(masonry);
    }

    gallery.classList.add('gallery-built');
  }

  function initLightbox(gallery) {
    const entries = Array.from(gallery.querySelectorAll('.bento-item'))
      .map(item => {
        const mediaEl = getMediaEl(item);
        return mediaEl && mediaEl.tagName === 'IMG' ? mediaEl : null;
      })
      .filter(Boolean);

    if (!entries.length) return;

    let currentIndex = 0;

    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML =
      '<button class="lightbox-close" aria-label="Close">&times;</button>' +
      '<button class="lightbox-prev" aria-label="Previous image">&lsaquo;</button>' +
      '<img class="lightbox-img" src="" alt="">' +
      '<button class="lightbox-next" aria-label="Next image">&rsaquo;</button>';
    document.body.appendChild(overlay);

    const lightboxImg = overlay.querySelector('.lightbox-img');

    function render() {
      const img = entries[currentIndex];
      lightboxImg.src = img.getAttribute('src') || img.src;
      lightboxImg.alt = img.getAttribute('alt') || '';
    }

    function open(index) {
      currentIndex = index;
      render();
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    function navigate(dir) {
      currentIndex = (currentIndex + dir + entries.length) % entries.length;
      render();
    }

    entries.forEach((img, i) => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => open(i));
    });

    overlay.querySelector('.lightbox-close').addEventListener('click', close);
    overlay.querySelector('.lightbox-prev').addEventListener('click', () => navigate(-1));
    overlay.querySelector('.lightbox-next').addEventListener('click', () => navigate(1));
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => {
      if (!overlay.classList.contains('active')) return;
      if (e.key === 'Escape')     close();
      if (e.key === 'ArrowLeft')  navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    });
  }

  document.querySelectorAll('.bento-gallery').forEach(gallery => {
    buildGallery(gallery);
    initLightbox(gallery);
  });
})();
