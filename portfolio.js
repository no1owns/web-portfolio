'use strict';

/* ── Refs ── */
const nav      = document.getElementById('p-nav');
const backTop  = document.getElementById('back-top');
const navToggle = document.getElementById('nav-toggle');
const navLinks  = document.getElementById('nav-links');

document.body.classList.add('loaded');

if (typeof gsap !== 'undefined') {
gsap.registerPlugin(ScrollTrigger, Observer);

/* ── Hero entrance timeline ── */
const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
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

/* ── Nav scroll state + back-to-top ── */
ScrollTrigger.create({
  start: 'top -60',
  onUpdate: self => {
    nav.classList.toggle('scrolled', self.scroll() > 60);
    backTop.classList.toggle('show', self.scroll() > 400);
  }
});

/* ── Scroll reveals ── */
ScrollTrigger.batch('.reveal', {
  onEnter: els => gsap.from(els, { y: 44, opacity: 0, duration: 0.75, ease: 'power3.out' }),
  start: 'top 88%', once: true
});
ScrollTrigger.batch('.reveal-l', {
  onEnter: els => gsap.from(els, { x: -56, opacity: 0, duration: 0.75, ease: 'power3.out' }),
  start: 'top 88%', once: true
});
ScrollTrigger.batch('.reveal-r', {
  onEnter: els => gsap.from(els, { x: 56, opacity: 0, duration: 0.75, ease: 'power3.out' }),
  start: 'top 88%', once: true
});
ScrollTrigger.batch('.reveal-s', {
  onEnter: els => gsap.from(els, { scale: 0.94, opacity: 0, duration: 0.75, ease: 'power3.out' }),
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

/* ── Stat counters ── */
document.querySelectorAll('.stat-n').forEach(el => {
  const target = +el.dataset.target;
  const start  = +el.textContent;
  ScrollTrigger.create({
    trigger: el,
    start: 'top 80%',
    once: true,
    onEnter: () => gsap.fromTo(el,
      { innerHTML: start },
      { innerHTML: target, duration: 1.6, snap: { innerHTML: 1 }, ease: 'power2.out' }
    )
  });
});

} /* end gsap guard */

/* ── AYO Reveal: scroll-driven morph A → Y → O + video clip ── */
async function initAYOReveal() {
  const section   = document.getElementById('ayo-reveal');
  const morphPath  = document.getElementById('ayo-morph-path');
  const strokePath = document.getElementById('ayo-stroke-path');
  const ayoPin     = document.querySelector('.ayo-pin');
  const videoWrap  = document.querySelector('.ayo-video-wrap');
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

  function videoWrapRectPath() {
    if (!videoWrap) return null;
    const r = videoWrap.getBoundingClientRect();
    if (r.width <= 0) return null;
    return `M${r.left},${r.top} L${r.right},${r.top} L${r.right},${r.bottom} L${r.left},${r.bottom} Z`;
  }

  let vw, vh, pathA, pathY, pathO, pathFull, iAY, iYO, iOF;

  function rebuild() {
    vw = window.innerWidth; vh = window.innerHeight;
    pathA = getLetterPath('A', vw, vh);
    pathY = getLetterPath('Y', vw, vh);
    pathO = getLetterPath('O', vw, vh);
    pathFull = videoWrapRectPath() || bigCirclePath(vw, vh);
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
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1.2,
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

      /* Video zoom: 1.25 → 1.40 push (CSS base already 1.25x, so no render upscaling) */
      if (videoEl) videoEl.style.transform = `scale(${1.25 + p * 0.15})`;

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

      ctx.strokeStyle = `rgba(160, 96, 16, ${alpha})`;
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

/* ── 3D card tilt (GSAP-smoothed) ── */
if (typeof gsap !== 'undefined') {
  document.querySelectorAll('.proj-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      gsap.to(card, {
        rotationY: x * 7,
        rotationX: -y * 7,
        transformPerspective: 900,
        z: 6,
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
  });
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
  });
});

/* ── Client name tickertape (scrollLeft — works on iOS Safari) ── */
(function () {
  var ticker = document.querySelector('.name-ticker');
  var strip  = ticker && ticker.querySelector('.name-ticker-strip');
  if (!ticker || !strip) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var speed = 0.55, paused = false, half = 0;

  ticker.addEventListener('mouseenter', function () { paused = true; });
  ticker.addEventListener('mouseleave', function () { paused = false; });
  ticker.addEventListener('touchstart', function () { paused = true; }, { passive: true });
  ticker.addEventListener('touchend',   function () { setTimeout(function () { paused = false; }, 1200); }, { passive: true });

  function tick() {
    if (!paused) {
      ticker.scrollLeft += speed;
      if (ticker.scrollLeft >= half) ticker.scrollLeft -= half;
    }
    requestAnimationFrame(tick);
  }

  function start() {
    half = strip.scrollWidth / 2;
    if (half > 0) { requestAnimationFrame(tick); }
    else { setTimeout(start, 250); }
  }

  if (document.readyState === 'complete') { start(); }
  else { window.addEventListener('load', start); }
})();

/* ── Skills Marquee (scrollLeft — works on iOS Safari) ── */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var strips = Array.from(document.querySelectorAll('.sm-strip'));
  if (!strips.length) return;

  /* speed px/frame, reverse flag, fractional start offset within half-width */
  var configs = [
    { speed: 0.5,  reverse: false, startFrac: 0 },
    { speed: 0.35, reverse: true,  startFrac: 0.33 },
    { speed: 0.28, reverse: false, startFrac: 0.66 }
  ];

  function initRow(row, cfg) {
    var half = row.scrollWidth / 2;
    if (half <= 0) { setTimeout(function () { initRow(row, cfg); }, 250); return; }

    row.scrollLeft = half * cfg.startFrac;
    var paused = false;

    row.addEventListener('mouseenter', function () { paused = true; });
    row.addEventListener('mouseleave', function () { paused = false; });
    row.addEventListener('touchstart', function () { paused = true; }, { passive: true });
    row.addEventListener('touchend',   function () { setTimeout(function () { paused = false; }, 1200); }, { passive: true });

    function tick() {
      if (!paused) {
        if (cfg.reverse) {
          row.scrollLeft -= cfg.speed;
          if (row.scrollLeft <= 0) row.scrollLeft += half;
        } else {
          row.scrollLeft += cfg.speed;
          if (row.scrollLeft >= half) row.scrollLeft -= half;
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function init() {
    strips.forEach(function (strip, i) {
      initRow(strip.parentElement, configs[i] || configs[0]);
    });
  }

  if (document.readyState === 'complete') { init(); }
  else { window.addEventListener('load', init); }
})();
