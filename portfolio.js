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

/* ── Single-letter image-mask with squish→bloom morph ── */
(function initMaskCanvas() {
  const canvas = document.getElementById('hero-mask-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* Letters from "Ayodeji Akintilo" — each a distinct silhouette */
  const LETTERS = ['A', 'Y', 'O', 'K', 'N', 'T', 'I'];
  const SRCS = [
    './images/appomni/rsa-booth.png',
    './images/mongodb/4ac51aab-9cc8-444c-8805-575ba5c01a61_rw_1920.png',
    './images/appomni/IMG_7833.jpeg',
    './images/mongodb/727a56dd-b489-4dc2-b29c-a0bb14210d81_rw_1920.png',
  ];

  const imgs = SRCS.map(s => { const i = new Image(); i.src = s; return i; });
  const dpr  = Math.min(window.devicePixelRatio || 1, 2);

  let w = 0, h = 0;
  let li      = 0; /* current letter index */
  let imgCur  = 0; /* current image index  */
  let mouseXn = 0.5;

  /* Morph state — driven by GSAP between letter transitions */
  const m = { sx: 1, sy: 1, rot: 0 };

  function letterFs(letter) {
    /* Scale font so letter fills ~88 % of canvas width, capped by canvas height */
    ctx.font = `700 100px "Space Grotesk", sans-serif`;
    const bw      = ctx.measureText(letter).width;
    const byWidth = Math.floor(w * 0.88 / bw * 100);
    const byHeight = Math.floor(h / 0.74); /* 0.74 ≈ cap-height / font-size ratio */
    return Math.min(byWidth, byHeight);
  }

  function resize() {
    const cw = canvas.offsetWidth || window.innerWidth;
    /* Canvas height = 48 % of viewport height, capped at 560 px */
    const ch = Math.round(Math.min(window.innerHeight * 0.48, 560));
    w = cw; h = ch;
    canvas.width        = Math.round(cw * dpr);
    canvas.height       = Math.round(ch * dpr);
    canvas.style.height = ch + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function coverImg(img) {
    if (!img?.complete || !img.naturalWidth) return;
    const px = (mouseXn - 0.5) * w * 0.12; /* mouse parallax */
    const s  = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth  * s;
    const dh = img.naturalHeight * s;
    ctx.drawImage(img, (w - dw) / 2 + px, (h - dh) / 2, dw, dh);
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);

    /* Draw portfolio image — full-canvas cover */
    coverImg(imgs[imgCur % imgs.length]);

    /* Squish-morph transform applied only to the letter mask */
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(m.rot * Math.PI / 180);
    ctx.scale(m.sx, m.sy);
    ctx.translate(-w / 2, -h / 2);

    /* Clip image to letter silhouette */
    ctx.globalCompositeOperation = 'destination-in';
    const fs = letterFs(LETTERS[li]);
    ctx.font         = `700 ${fs}px "Space Grotesk", sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = '#000';
    ctx.fillText(LETTERS[li], w / 2, h / 2);

    ctx.restore();
    requestAnimationFrame(frame);
  }

  let morphing = false;
  function advance() {
    if (morphing) return;
    morphing = true;
    const nextLi = (li + 1) % LETTERS.length;

    if (typeof gsap === 'undefined') {
      li = nextLi; imgCur++;
      morphing = false;
      setTimeout(advance, 2800);
      return;
    }

    gsap.timeline({
      onComplete: () => { morphing = false; setTimeout(advance, 2800); }
    })
      /* Phase 1 — squish out: compress horizontally, stretch vertically, tilt */
      .to(m, { sx: 0.012, sy: 1.25, rot: 5,  duration: 0.38, ease: 'power3.in' })
      /* Swap letter + image at the thinnest point (invisible seam) */
      .call(() => { li = nextLi; imgCur++; })
      /* Phase 2 — bloom in: elastic expand, tilt unwinds */
      .to(m, { sx: 1,     sy: 1,    rot: 0,  duration: 0.70, ease: 'elastic.out(1, 0.65)' });
  }

  const hero = document.getElementById('hero');
  if (hero) {
    hero.addEventListener('mousemove', e => {
      mouseXn = e.clientX / window.innerWidth;
    }, { passive: true });
    hero.addEventListener('touchmove', e => {
      mouseXn = e.touches[0].clientX / window.innerWidth;
    }, { passive: true });
  }

  window.addEventListener('resize', resize, { passive: true });

  document.fonts.ready.then(() => {
    resize();
    requestAnimationFrame(frame);
    setTimeout(advance, 2800);
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
