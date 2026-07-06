'use strict';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Refs ── */
const nav      = document.getElementById('p-nav');
const backTop  = document.getElementById('back-top');
const navToggle = document.getElementById('nav-toggle');
const navLinks  = document.getElementById('nav-links');

document.body.classList.add('loaded');

if (typeof gsap !== 'undefined') {
gsap.registerPlugin(ScrollTrigger, Observer);
}

/* ── Stat counters ── */
/* These are real content, not decoration — they must always land on the
   correct value, whether GSAP is available, reduced-motion is on, or not.
   Uses IntersectionObserver rather than ScrollTrigger position math: it
   fires correctly even if the element is already in view when observed
   (e.g. a mid-page reload), which a scroll-position trigger created after
   that point would silently miss, and it isn't sensitive to mobile
   Safari's dynamic address bar changing viewport height after the fact. */
document.querySelectorAll('.stat-n').forEach(el => {
  const target = +el.dataset.target;

  if (reducedMotion || typeof gsap === 'undefined' || typeof IntersectionObserver === 'undefined') {
    el.textContent = target;
    return;
  }

  const start = +el.textContent;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      gsap.fromTo(el,
        { innerHTML: start },
        { innerHTML: target, duration: 1.6, snap: { innerHTML: 1 }, ease: 'power2.out' }
      );
      observer.disconnect();
    });
  }, { threshold: 0.2 });
  observer.observe(el);
});

if (typeof gsap !== 'undefined') {

/* ── Functional: nav scroll state + back-to-top (always active) ── */
ScrollTrigger.create({
  start: 'top -60',
  onUpdate: self => {
    nav.classList.toggle('scrolled', self.scroll() > 60);
    backTop.classList.toggle('show', self.scroll() > 400);
  }
});

if (!reducedMotion) {

/* ── Hero entrance: set initial hidden state (GSAP owns opacity, not CSS) ── */
gsap.set(['.hero-eyebrow', '.hero-sub', '.hero-typewriter', '.hero-cta', '.hero-scroll'], { opacity: 0 });

/* ── Hero entrance timeline — scroll-triggered so it's ready when hero is visible ── */
const heroTl = gsap.timeline({
  defaults: { ease: 'power3.out' },
  scrollTrigger: {
    trigger: '#hero',
    start: 'top 60%',
    once: true
  }
});
heroTl
  .from('.hero-eyebrow',         { y: -20, opacity: 0, duration: 0.7 })
  .from('.hero-name-line .n-char', {
    y: 80, opacity: 0, duration: 0.65,
    stagger: { each: 0.038, from: 'start' },
    ease: 'power4.out'
  }, '-=0.3')
  .from('.hero-sub',             { y: 24, opacity: 0, duration: 0.8 }, '-=0.2')
  .from('.hero-typewriter',      { y: 18, opacity: 0, duration: 0.7 }, '-=0.5')
  .from('.hero-cta',             { y: 18, opacity: 0, duration: 0.7 }, '-=0.5')
  .from('.hero-scroll',          { y: 12, opacity: 0, duration: 0.6 }, '-=0.3');

/* ── Hero parallax ── */
gsap.to('#hero-content', {
  yPercent: 28,
  opacity: 0,
  ease: 'none',
  scrollTrigger: {
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true
  }
});

/* ── Image parallax ── */
document.querySelectorAll('.parallax-frame').forEach(frame => {
  const img = frame.querySelector('.parallax-img');
  if (!img) return;
  gsap.fromTo(img,
    { yPercent: -8 },
    {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: {
        trigger: frame,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.5
      }
    }
  );
});

/* ── Progress bar ── */
gsap.to('#progress-bar', {
  scaleX: 1,
  ease: 'none',
  scrollTrigger: {
    trigger: document.documentElement,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0
  }
});

/* ── Scroll reveals (expo.out ease, scale, mobile-tuned stagger) ── */
const isMobile = window.matchMedia('(max-width: 768px)').matches;
const revY   = isMobile ? 16  : 44;
const revDur = isMobile ? 0.4 : 0.75;
const revStg = isMobile ? 0.05 : 0.08;

ScrollTrigger.batch('.reveal', {
  onEnter: els => gsap.from(els, {
    y: revY, scale: 0.96, opacity: 0, duration: revDur,
    stagger: revStg, ease: 'expo.out'
  }),
  start: 'top 88%', once: true
});
ScrollTrigger.batch('.reveal-l', {
  onEnter: els => gsap.from(els, {
    x: isMobile ? -24 : -56, opacity: 0, duration: revDur,
    stagger: revStg, ease: 'expo.out'
  }),
  start: 'top 88%', once: true
});
ScrollTrigger.batch('.reveal-r', {
  onEnter: els => gsap.from(els, {
    x: isMobile ? 24 : 56, opacity: 0, duration: revDur,
    stagger: revStg, ease: 'expo.out'
  }),
  start: 'top 88%', once: true
});
ScrollTrigger.batch('.reveal-s', {
  onEnter: els => gsap.from(els, {
    scale: isMobile ? 0.97 : 0.94, opacity: 0, duration: revDur,
    stagger: revStg, ease: 'expo.out'
  }),
  start: 'top 88%', once: true
});

/* ── Heading line-mask reveal ── */
function splitReveal(selector) {
  document.querySelectorAll(selector).forEach(el => {
    el.classList.add('heading-reveal');
    const nodes = [...el.childNodes];
    const lines = [[]];
    nodes.forEach(node => {
      if (node.nodeName === 'BR') lines.push([]);
      else lines[lines.length - 1].push(node.cloneNode(true));
    });
    el.innerHTML = '';
    lines.forEach(lineNodes => {
      if (!lineNodes.length) return;
      const wrap  = document.createElement('span');
      wrap.className = 'h-line';
      const inner = document.createElement('span');
      inner.className = 'h-line-inner';
      lineNodes.forEach(n => inner.appendChild(n));
      wrap.appendChild(inner);
      el.appendChild(wrap);
    });
  });
  document.querySelectorAll('.heading-reveal').forEach(el => {
    gsap.from(el.querySelectorAll('.h-line-inner'), {
      yPercent: 106,
      duration: 1.1,
      stagger: 0.085,
      ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
  });
}
splitReveal('.section-title');

} /* end !reducedMotion */
} /* end gsap guard */

/* ── AYO Reveal: scroll-driven morph A → Y → O + video clip ── */
async function initAYOReveal() {
  const section    = document.getElementById('ayo-reveal');
  const morphPath  = document.getElementById('ayo-morph-path');
  const strokePath = document.getElementById('ayo-stroke-path');
  const ayoPin     = document.querySelector('.ayo-pin');
  const videoWrap  = document.querySelector('.ayo-video-wrap');
  const videoFrame = document.querySelector('.ayo-video-frame');
  const videoEl    = document.querySelector('.ayo-video');
  if (!section || !morphPath) return;
  if (typeof opentype === 'undefined' || typeof flubber === 'undefined') return;

  let font;
  try { font = await opentype.load('./fonts/SpaceGrotesk-Bold.ttf'); }
  catch (e) { console.warn('AYO: font failed', e); return; }

  function getLetterPath(letter, vw, vh) {
    const targetH = vh * 0.70;
    const sz0 = 1000;
    const p0  = font.getPath(letter, 0, sz0 * 0.82, sz0);
    const b0  = p0.getBoundingBox();
    const h0  = b0.y2 - b0.y1;
    if (h0 <= 0) return '';
    const sz  = sz0 * (targetH / h0);
    const p1  = font.getPath(letter, 0, sz * 0.82, sz);
    const b1  = p1.getBoundingBox();
    const dx  = vw / 2 - (b1.x1 + b1.x2) / 2;
    const dy  = vh / 2 - (b1.y1 + b1.y2) / 2;
    return font.getPath(letter, dx, sz * 0.82 + dy, sz).toPathData(2);
  }

  function bigCirclePath(vw, vh) {
    const cx = vw / 2, cy = vh / 2;
    const r  = Math.hypot(vw, vh) * 0.6;
    const k  = 0.5523;
    return `M${cx} ${cy-r} C${cx+r*k} ${cy-r} ${cx+r} ${cy-r*k} ${cx+r} ${cy} C${cx+r} ${cy+r*k} ${cx+r*k} ${cy+r} ${cx} ${cy+r} C${cx-r*k} ${cy+r} ${cx-r} ${cy+r*k} ${cx-r} ${cy} C${cx-r} ${cy-r*k} ${cx-r*k} ${cy-r} ${cx} ${cy-r}Z`;
  }

  function frameRectPath(vw, vh) {
    const mobile = vw < 768;
    /* 9:16 portrait video — constrain to fit within viewport */
    const maxW = vw * (mobile ? 0.72 : 0.40);
    const maxH = vh * 0.82;
    let fw, fh;
    if (maxW * 16 / 9 <= maxH) {
      fw = maxW; fh = fw * 16 / 9;
    } else {
      fh = maxH; fw = fh * 9 / 16;
    }
    const left   = (vw - fw) / 2;
    const top    = (vh - fh) / 2;
    const right  = left + fw;
    const bottom = top  + fh;
    return `M${left},${top} L${right},${top} L${right},${bottom} L${left},${bottom} Z`;
  }

  let vw, vh, pathA, pathY, pathO, pathFull, iAY, iYO, iOF;
  let rectLeft, rectTop, rectW, rectH;

  function rebuild() {
    vw = window.innerWidth; vh = window.innerHeight;
    pathA = getLetterPath('A', vw, vh);
    pathY = getLetterPath('Y', vw, vh);
    pathO = getLetterPath('O', vw, vh);
    pathFull = frameRectPath(vw, vh);
    /* Precompute portrait frame dimensions for video animation */
    const mobile = vw < 768;
    const maxW = vw * (mobile ? 0.72 : 0.40);
    const maxH = vh * 0.82;
    if (maxW * 16 / 9 <= maxH) { rectW = maxW; rectH = rectW * 16 / 9; }
    else                        { rectH = maxH; rectW = rectH * 9 / 16; }
    rectLeft = (vw - rectW) / 2;
    rectTop  = (vh - rectH) / 2;
    iAY  = flubber.interpolate(pathA, pathY,    { maxSegmentLength: 4 });
    iYO  = flubber.interpolate(pathY, pathO,    { maxSegmentLength: 4 });
    iOF  = flubber.interpolate(pathO, pathFull, { maxSegmentLength: 8 });
    morphPath.setAttribute('d', pathA);
    if (strokePath) strokePath.setAttribute('d', pathA);
  }

  rebuild();
  window.addEventListener('resize', rebuild, { passive: true });

  ScrollTrigger.create({
    trigger: section,
    pin: ayoPin,
    pinSpacing: false,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1.2,
    invalidateOnRefresh: true,
    onUpdate(self) {
      const p = self.progress;

      /* Morph path */
      let d;
      if      (p < 0.10) { d = pathA; }
      else if (p < 0.48) { d = iAY(Math.min((p-0.10)/0.38, 1)); }
      else if (p < 0.82) { d = iYO(Math.min((p-0.48)/0.34, 1)); }
      else               { d = iOF(Math.min((p-0.82)/0.18, 1)); }
      morphPath.setAttribute('d', d);
      if (strokePath) strokePath.setAttribute('d', d);

      /* Video zoom: arc up to 1.15 at 50% progress, back to 1.0 at end */
      if (videoEl) {
        const zf = p < 0.5 ? p / 0.5 : Math.max(0, 1 - (p - 0.5) / 0.5);
        videoEl.style.transform = `scale(${1.0 + zf * 0.15})`;
      }

      /* Video frame: shrink from full-viewport to portrait rect during O→frame */
      if (videoFrame) {
        const rp = p < 0.82 ? 0 : Math.min((p - 0.82) / 0.18, 1);
        if (rp > 0) {
          videoFrame.style.position = 'absolute';
          videoFrame.style.left   = (rectLeft * rp) + 'px';
          videoFrame.style.top    = (rectTop  * rp) + 'px';
          videoFrame.style.width  = (vw + (rectW - vw) * rp) + 'px';
          videoFrame.style.height = (vh + (rectH - vh) * rp) + 'px';
          videoFrame.style.right  = 'auto';
          videoFrame.style.bottom = 'auto';
        } else {
          videoFrame.style.left   = '';
          videoFrame.style.top    = '';
          videoFrame.style.width  = '';
          videoFrame.style.height = '';
          videoFrame.style.right  = '';
          videoFrame.style.bottom = '';
        }
      }

      /* Keep pin fully visible at all scroll positions */
      if (ayoPin) ayoPin.style.opacity = 1;
    }
  });
}
initAYOReveal();

/* ── Hero line field ── */
(function initLineField() {
  const canvas = document.getElementById('hero-lines');
  if (!canvas) return;
  const ctx    = canvas.getContext('2d');
  const hero   = document.getElementById('hero');

  const SPACING      = 48;
  const LEN          = 15;
  const BASE_ALPHA   = 0.11;
  const PEAK_ALPHA   = 0.30;
  const RADIUS       = 280;
  const SPRING       = 0.10;
  const REST_SPRING  = 0.018;

  let mouse  = { x: -9999, y: -9999, active: false };
  let lines  = [];
  let rafId;

  function resize() {
    canvas.width  = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
    buildGrid();
  }

  function buildGrid() {
    lines = [];
    const cols = Math.ceil(canvas.width  / SPACING) + 1;
    const rows = Math.ceil(canvas.height / SPACING) + 1;
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const a = (Math.random() - 0.5) * Math.PI * 0.4; /* start near horizontal */
        lines.push({ x: c * SPACING, y: r * SPACING, angle: a, rest: a });
      }
    }
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function shortAngleDist(a, b) {
    let d = b - a;
    while (d >  Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 1;

    for (const l of lines) {
      const dx   = mouse.x - l.x;
      const dy   = mouse.y - l.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let target, speed;
      if (mouse.active && dist < RADIUS) {
        target = Math.atan2(dy, dx);
        speed  = SPRING * (1 - dist / RADIUS);
      } else {
        target = l.rest;
        speed  = REST_SPRING;
      }

      l.angle += shortAngleDist(l.angle, target) * speed;

      const proximity = mouse.active ? Math.max(0, 1 - dist / RADIUS) : 0;
      const alpha = lerp(BASE_ALPHA, PEAK_ALPHA, proximity * proximity);

      const cos = Math.cos(l.angle);
      const sin = Math.sin(l.angle);
      const half = LEN / 2;

      ctx.strokeStyle = `rgba(79, 189, 186, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(l.x - cos * half, l.y - sin * half);
      ctx.lineTo(l.x + cos * half, l.y + sin * half);
      ctx.stroke();
    }

    rafId = requestAnimationFrame(draw);
  }

  hero.addEventListener('mousemove', e => {
    const r  = hero.getBoundingClientRect();
    mouse.x  = e.clientX - r.left;
    mouse.y  = e.clientY - r.top;
    mouse.active = true;
  }, { passive: true });

  hero.addEventListener('mouseleave', () => { mouse.active = false; });

  /* Touch support for mobile */
  hero.addEventListener('touchmove', e => {
    const r  = hero.getBoundingClientRect();
    const t  = e.touches[0];
    mouse.x  = t.clientX - r.left;
    mouse.y  = t.clientY - r.top;
    mouse.active = true;
  }, { passive: true });

  hero.addEventListener('touchend', () => { mouse.active = false; }, { passive: true });

  window.addEventListener('resize', resize, { passive: true });
  resize();
  draw();

  /* Fade canvas out as hero scrolls away — only once GSAP is confirmed loaded */
  if (typeof gsap !== 'undefined') {
    gsap.to(canvas, {
      opacity: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: '45% top',
        scrub: true
      }
    });
  }
})();

/* ── 3D card tilt (GSAP-smoothed, hover-capable devices only) ── */
if (typeof gsap !== 'undefined' && !reducedMotion && window.matchMedia('(hover: hover)').matches) {
  function addCardTilt(card, deg, perspective, z) {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      gsap.to(card, {
        rotationY: x * deg,
        rotationX: -y * deg,
        transformPerspective: perspective,
        z,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotationY: 0, rotationX: 0, z: 0,
        duration: 0.5, ease: 'power3.out',
        overwrite: 'auto'
      });
    });
  }
  document.querySelectorAll('.proj-card').forEach(c => addCardTilt(c, 7, 900, 6));
  document.querySelectorAll('.lab-card').forEach(c => addCardTilt(c, 8, 800, 8));
}

/* ── Magnetic lag-trail cursor (fine-pointer, no reduced motion) ── */
if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
  const cursorDot  = document.createElement('div');
  const cursorRing = document.createElement('div');
  cursorDot.className  = 'cursor-dot';
  cursorRing.className = 'cursor-ring';
  document.body.appendChild(cursorDot);
  document.body.appendChild(cursorRing);

  let mx = -200, my = -200;
  let rx = -200, ry = -200;

  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

  /* Event delegation — handles dynamically shown/hidden elements.
     e.target can be `document` itself (no .closest()) when mouseenter/leave
     fires at the document boundary, so guard for a real Element first. */
  document.addEventListener('mouseenter', e => {
    if (e.target instanceof Element && e.target.closest('a, button, .proj-card, .lab-card')) {
      cursorDot.classList.add('hovering');
      cursorRing.classList.add('hovering');
    }
  }, true);
  document.addEventListener('mouseleave', e => {
    if (e.target instanceof Element && e.target.closest('a, button, .proj-card, .lab-card')) {
      cursorDot.classList.remove('hovering');
      cursorRing.classList.remove('hovering');
    }
  }, true);

  (function raf() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    cursorDot.style.transform  = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    cursorRing.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(raf);
  })();
}

/* ── Typewriter ── */
const phrases = [
  'Senior Visual Designer @ AppOmni',
  'Former Creative Director @ MongoDB',
  'Brand Architect for Modern Teams',
  'UX/UI Storyteller & Brand Architect'
];
const twEl = document.getElementById('tw-text');
let pi = 0, ci = 0, del = false;

function type() {
  const cur = phrases[pi];
  if (del) {
    twEl.textContent = cur.slice(0, --ci);
    if (ci === 0) { del = false; pi = (pi + 1) % phrases.length; setTimeout(type, 350); return; }
    setTimeout(type, 35);
  } else {
    twEl.textContent = cur.slice(0, ++ci);
    if (ci === cur.length) { del = true; setTimeout(type, 2200); return; }
    setTimeout(type, 70);
  }
}
setTimeout(type, 800);

/* ── Active nav link ── */
const sections   = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');
const activeObs  = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navAnchors.forEach(a => a.classList.remove('active'));
      const hit = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
      if (hit) hit.classList.add('active');
    }
  });
}, { threshold: 0.45 });
sections.forEach(s => activeObs.observe(s));

/* ── Back to top ── */
backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ── Smooth scroll ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  });
});

/* ── Mobile nav ── */
navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

/* ── Card click-through ── */
document.querySelectorAll('.proj-card').forEach(card => {
  const link = card.querySelector('.proj-ov-link');
  if (!link) return;
  card.addEventListener('click', e => {
    if (e.target.closest('a')) return;
    window.location.href = link.href;
  });
});

/* ── Project filter ── */
const filterBtns = document.querySelectorAll('.flt-btn');
const projCards  = document.querySelectorAll('.proj-card');

/* Fix 2: first two VISIBLE cards get the larger treatment — cards use opacity-fade
   (.faded), not display:none, so nth-child alone can't react to the active filter. */
function updateFeaturedCards() {
  const visibleCards = Array.from(projCards).filter(c => !c.classList.contains('faded'));
  projCards.forEach(c => c.classList.remove('card--featured', 'card--compact'));
  visibleCards.forEach((c, i) => c.classList.add(i < 2 ? 'card--featured' : 'card--compact'));
}
updateFeaturedCards();

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    const f = btn.dataset.f;
    projCards.forEach(card => {
      const cats = (card.dataset.cat || '').split(' ');
      const hide = f !== 'all' && !cats.includes(f);
      card.classList.toggle('faded', hide);
      gsap.to(card, { opacity: hide ? 0.25 : 1, duration: 0.3, overwrite: 'auto' });
    });
    updateFeaturedCards();
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  });
});

/* ── Lab section: live-first with expandable toggle ── */
(function initLabSection() {
  const labSection = document.getElementById('lab');
  if (!labSection) return;

  const labGrid     = labSection.querySelector('.lab-grid');
  const tabsContainer = labSection.querySelector('.lab-tabs');
  const toggleBtn    = labSection.querySelector('.lab-toggle');
  const allCards     = Array.from(labSection.querySelectorAll('.lab-card'));
  const liveCards    = allCards.filter(c => c.dataset.status === 'live');
  const nonLiveCards = allCards.filter(c => c.dataset.status !== 'live');
  const tabs         = tabsContainer ? Array.from(tabsContainer.querySelectorAll('.lab-tab')) : [];

  if (!toggleBtn) return;

  let isExpanded = false;

  function fadeIn(card) {
    card.style.display = '';
    card.style.opacity = '0';
    card.style.transform = 'translateY(8px)';
    requestAnimationFrame(() => {
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    });
  }

  function resetCardStyles(card) {
    card.style.display = 'none';
    card.style.opacity = '';
    card.style.transform = '';
    card.style.transition = '';
  }

  /* Category filtering (while expanded) can hide live cards too, since they may not
     match the active category — collapsing must always force live cards back to visible. */
  function showLiveCard(card) {
    card.style.display = '';
    card.style.opacity = '';
    card.style.transform = '';
    card.style.transition = '';
  }

  function updateTabHighlight(value) {
    tabs.forEach(t => {
      const active = t.dataset.lab === value;
      t.classList.toggle('on', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  /* Filters by category among already-expanded cards (tabs only visible when expanded) */
  function filterByCategory(value) {
    updateTabHighlight(value);
    allCards.forEach(card => {
      const isLive = card.dataset.status === 'live';
      const show   = value === 'all' || card.dataset.category === value;
      card.classList.toggle('lab-card--inactive', !isLive && show);
      if (show) {
        if (card.style.display === 'none') fadeIn(card);
      } else {
        card.style.display = 'none';
      }
    });
  }

  function refreshScrollTrigger() {
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  }

  /* Initial state: live cards only, no tabs, collapsed 2-up grid */
  if (labGrid) labGrid.classList.add('lab-grid--collapsed');
  nonLiveCards.forEach(c => { c.style.display = 'none'; });
  liveCards.forEach(c => c.classList.remove('lab-card--inactive'));
  if (tabsContainer) tabsContainer.style.display = 'none';
  refreshScrollTrigger();

  toggleBtn.addEventListener('click', () => {
    isExpanded = !isExpanded;

    if (isExpanded) {
      if (labGrid) labGrid.classList.remove('lab-grid--collapsed');
      if (tabsContainer) {
        tabsContainer.style.display = '';
        tabsContainer.style.opacity = '0';
        tabsContainer.style.transform = 'translateY(-8px)';
        requestAnimationFrame(() => {
          tabsContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          tabsContainer.style.opacity = '1';
          tabsContainer.style.transform = 'translateY(0)';
        });
      }
      liveCards.forEach(showLiveCard);
      nonLiveCards.forEach(c => {
        c.classList.add('lab-card--inactive');
        fadeIn(c);
      });
      toggleBtn.textContent = 'Show less ↑';
      updateTabHighlight('all');
    } else {
      if (labGrid) labGrid.classList.add('lab-grid--collapsed');
      if (tabsContainer) {
        tabsContainer.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        tabsContainer.style.opacity = '0';
        tabsContainer.style.transform = 'translateY(-8px)';
        setTimeout(() => { tabsContainer.style.display = 'none'; }, 250);
      }
      nonLiveCards.forEach(resetCardStyles);
      liveCards.forEach(c => { showLiveCard(c); c.classList.remove('lab-card--inactive'); });
      toggleBtn.textContent = "See what's coming →";
      updateTabHighlight('all');
    }

    setTimeout(refreshScrollTrigger, 320);
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterByCategory(tab.dataset.lab);
      setTimeout(refreshScrollTrigger, 320);
    });
  });

  /* Live card click-through (mirrors .proj-card behavior) */
  liveCards.forEach(card => {
    const link = card.querySelector('.lab-cta');
    if (!link) return;
    card.addEventListener('click', e => {
      if (e.target.closest('a')) return;
      window.open(link.href, link.target || '_self');
    });
  });
})();

/* Ticker and skills marquee use CSS animation (clip-path: inset(0) parent,
   translateX(-50%) on doubled strip content). Pause on hover handled in CSS. */

/* Late-loading webfonts/images and mobile Safari's dynamic address bar can
   shift layout after ScrollTrigger has already measured trigger positions,
   causing scroll-linked effects to fire at the wrong point (or not at all).
   One refresh once everything has actually settled is cheap insurance. */
if (typeof ScrollTrigger !== 'undefined') {
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
