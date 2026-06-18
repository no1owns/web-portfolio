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
  .from('.hero-eyebrow',    { y: -20, opacity: 0, duration: 0.7 })
  .from('.hero-name-inner', { yPercent: 106, duration: 1.1, stagger: 0.18 }, '-=0.4')
  .from('.hero-sub',        { y: 24, opacity: 0, duration: 0.8 }, '-=0.6')
  .from('.hero-typewriter', { y: 18, opacity: 0, duration: 0.7 }, '-=0.5')
  .from('.hero-cta',        { y: 18, opacity: 0, duration: 0.7 }, '-=0.5')
  .from('.hero-scroll',     { y: 12, opacity: 0, duration: 0.6 }, '-=0.3');

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
  onEnter: els => gsap.from(els, { y: 44, opacity: 0, duration: 0.85, stagger: 0.08, ease: 'power3.out' }),
  start: 'top 88%'
});
ScrollTrigger.batch('.reveal-l', {
  onEnter: els => gsap.from(els, { x: -56, opacity: 0, duration: 0.85, stagger: 0.08, ease: 'power3.out' }),
  start: 'top 88%'
});
ScrollTrigger.batch('.reveal-r', {
  onEnter: els => gsap.from(els, { x: 56, opacity: 0, duration: 0.85, stagger: 0.08, ease: 'power3.out' }),
  start: 'top 88%'
});
ScrollTrigger.batch('.reveal-s', {
  onEnter: els => gsap.from(els, { scale: 0.86, opacity: 0, duration: 0.85, stagger: 0.1, ease: 'back.out(1.4)' }),
  start: 'top 88%'
});

/* ── Image card stagger ── */
ScrollTrigger.batch('.img-rise', {
  onEnter: els => gsap.from(els, {
    y: 40, scale: 0.95, opacity: 0,
    duration: 0.9, stagger: 0.1, ease: 'power3.out'
  }),
  start: 'top 90%',
  once: true
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

/* ── Single-letter image-mask: reveal → hold → crossfade ── */
(function initMaskCanvas() {
  const canvas = document.getElementById('hero-mask-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const LETTERS = ['A', 'Y', 'O', 'K', 'N', 'T', 'I'];
  const SRCS = [
    './images/ayo_wilderness_bw.jpg',
    './images/appomni/rsa-booth.png',
    './images/ayo-music.png',
    './images/appomni/Demo_Request_Click_Linkedin_LG_NA_M3.png',
    './images/navan/hello-sustainability.jpeg',
    './images/mongodb/727a56dd-b489-4dc2-b29c-a0bb14210d81_rw_1920.png',
  ];

  /* Timing */
  const REVEAL_DUR = 2200; /* ms — mask shrinks from full-image to letter edges  */
  const HOLD_DUR   =  700; /* ms — show the letter clearly before transition      */
  const FADE_DUR   =  900; /* ms — crossfade to next image (opacity, no squish)   */
  /* At MASK_MAX the letter overflows the canvas entirely → full image visible     */
  const MASK_MAX   =  3.6;
  /* Each image zooms continuously from the moment it first appears                */
  const ZOOM_RATE  = 0.000015; /* ~1.5 % larger per second — visible on dense images */

  const imgs = SRCS.map(s => { const i = new Image(); i.src = s; return i; });
  const dpr  = Math.min(window.devicePixelRatio || 1, 2);

  let w = 0, h = 0, mouseXn = 0.5;

  /* Two off-screen canvases so we can alpha-composite two masked layers cleanly   */
  let offA = null, offB = null;

  function makeOff(pw, ph) {
    const c  = document.createElement('canvas');
    c.width  = pw; c.height = ph;
    const cx = c.getContext('2d');
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { canvas: c, ctx: cx };
  }

  /* Active letter / image state */
  let curLi = 0, curImg = 0, curImgTs = 0;
  let nxtLi = 1, nxtImg = 1, nxtImgTs = 0;

  /* Phase state machine */
  let phase = 'reveal', phaseStart = 0, maskScale = MASK_MAX, fadeT = 0;

  function letterFs(letter) {
    ctx.font = `700 100px "Space Grotesk", sans-serif`;
    const byW = Math.floor(w * 0.88 / ctx.measureText(letter).width * 100);
    const byH = Math.floor(h / 0.74);
    return Math.min(byW, byH);
  }

  function resize() {
    const cw = canvas.offsetWidth || window.innerWidth;
    const ch = Math.round(Math.min(window.innerHeight * 0.48, 560));
    w = cw; h = ch;
    const pw = Math.round(cw * dpr), ph = Math.round(ch * dpr);
    canvas.width = pw; canvas.height = ph;
    canvas.style.height = ch + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    offA = makeOff(pw, ph);
    offB = makeOff(pw, ph);
  }

  /* Draw one masked layer onto an off-screen context */
  function renderLayer(off, img, imgTs, ts, mScale, letter) {
    const oc = off.ctx;
    oc.clearRect(0, 0, w + 1, h + 1);
    if (!img?.complete || !img.naturalWidth) return;

    /* Continuous per-image zoom — never pauses or resets within a display cycle */
    const zoom = 1.0 + Math.max(0, ts - imgTs) * ZOOM_RATE;
    const px   = (mouseXn - 0.5) * w * 0.12;
    const s    = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    oc.drawImage(img,
      (w - img.naturalWidth  * s) / 2 + px,
      (h - img.naturalHeight * s) / 2,
      img.naturalWidth * s, img.naturalHeight * s);

    /* Letter silhouette mask — scale around canvas centre */
    oc.save();
    oc.translate(w / 2, h / 2);
    oc.scale(mScale, mScale);
    oc.translate(-w / 2, -h / 2);
    oc.globalCompositeOperation = 'destination-in';
    oc.font = `700 ${letterFs(letter)}px "Space Grotesk", sans-serif`;
    oc.textAlign = 'center'; oc.textBaseline = 'middle';
    oc.fillStyle = '#000';
    oc.fillText(letter, w / 2, h / 2);
    oc.restore();
  }

  function frame(ts) {
    if (!offA || !offB) { requestAnimationFrame(frame); return; }
    const elapsed = ts - phaseStart;

    /* ── State machine ── */
    if (phase === 'reveal') {
      /* ease-out-quad: letter edges appear quickly then settle */
      const t = Math.min(elapsed / REVEAL_DUR, 1);
      const e = 1 - (1 - t) * (1 - t);
      maskScale = MASK_MAX + (1.0 - MASK_MAX) * e;
      if (t >= 1) { maskScale = 1.0; phase = 'hold'; phaseStart = ts; }

    } else if (phase === 'hold') {
      maskScale = 1.0;
      if (elapsed >= HOLD_DUR) {
        phase = 'fade'; phaseStart = ts;
        nxtLi = (curLi + 1) % LETTERS.length;
        nxtImg = (curImg + 1) % imgs.length;
        nxtImgTs = ts; /* next image starts zooming from zero */
      }

    } else if (phase === 'fade') {
      /* smooth crossfade — no squish, just opacity */
      fadeT = Math.min(elapsed / FADE_DUR, 1);
      if (fadeT >= 1) {
        curLi = nxtLi; curImg = nxtImg; curImgTs = nxtImgTs;
        phase = 'reveal'; phaseStart = ts; maskScale = MASK_MAX; fadeT = 0;
      }
    }

    /* ── Composite ── */
    ctx.clearRect(0, 0, w, h);

    if (phase !== 'fade') {
      renderLayer(offA, imgs[curImg % imgs.length], curImgTs, ts, maskScale, LETTERS[curLi]);
      ctx.drawImage(offA.canvas, 0, 0, w, h);

    } else {
      /* Outgoing: letter at 1.0 scale, fading out */
      renderLayer(offA, imgs[curImg % imgs.length], curImgTs, ts, 1.0, LETTERS[curLi]);
      /* Incoming: starts at MASK_MAX (full image visible), fading in */
      renderLayer(offB, imgs[nxtImg % imgs.length], nxtImgTs, ts, MASK_MAX, LETTERS[nxtLi]);

      ctx.globalAlpha = 1 - fadeT;
      ctx.drawImage(offA.canvas, 0, 0, w, h);
      ctx.globalAlpha = fadeT;
      ctx.drawImage(offB.canvas, 0, 0, w, h);
      ctx.globalAlpha = 1;
    }

    requestAnimationFrame(frame);
  }

  const hero = document.getElementById('hero');
  if (hero) {
    hero.addEventListener('mousemove', e => { mouseXn = e.clientX / window.innerWidth; }, { passive: true });
    hero.addEventListener('touchmove', e => { mouseXn = e.touches[0].clientX / window.innerWidth; }, { passive: true });
  }
  window.addEventListener('resize', resize, { passive: true });

  document.fonts.ready.then(() => {
    resize();
    curImgTs = performance.now();
    phaseStart = performance.now();
    requestAnimationFrame(frame);
  });
})();

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
  'Visual Storyteller for 15+ Years'
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
      card.classList.toggle('faded', f !== 'all' && !cats.includes(f));
    });
  });
});
