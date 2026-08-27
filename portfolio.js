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
/* fromTo (not from) for every element gsap.set() above already forced to
   opacity:0 — .from() infers its implicit "to" from the element's CURRENT
   value, which is already 0 at this point, so it would silently animate
   0 -> 0 and never actually reveal the element. Confirmed via an isolated
   repro of gsap.set(el,{opacity:0}) followed by gsap.from(el,{opacity:0}):
   the timeline completes but opacity never leaves 0. */
heroTl
  .fromTo('.hero-eyebrow',         { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 })
  /* Opacity only — no y/transform here. .n-char's ancestor (.hero-name-inner)
     uses background-clip:text for the gradient fill, and Chromium fails to
     render clip-text gradients correctly when a transformed descendant
     exists anywhere in that subtree (confirmed by reproduction: adding
     `y: 80` back makes "Ayodeji" render fully invisible despite every
     computed style — opacity, background-image, position — looking correct).
     Losing the rise motion here is a small trade for the name actually
     being visible. */
  .from('.hero-name-line .n-char', {
    opacity: 0, duration: 0.65,
    stagger: { each: 0.038, from: 'start' },
    ease: 'power4.out'
  }, '-=0.3')
  .fromTo('.hero-sub',             { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.2')
  .fromTo('.hero-typewriter',      { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.5')
  .fromTo('.hero-cta',             { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.5')
  .fromTo('.hero-scroll',          { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.3');

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

/* ── Hero card flight ──────────────────────────────
   6 decorative clones (built from the 6 real .proj-card[data-hero-card]
   grid cards — content scraped, never hand-duplicated) sit in the hero
   at load. As the user scrolls from the hero into the Projects grid,
   each clone flies — via live-updated position:fixed top/left/width/
   height — from its hero position to the real card's current position,
   fading out right as it arrives while the real card (opacity 0 until
   then) fades in underneath it. Deliberately reads the real card's
   getBoundingClientRect() fresh every frame rather than caching a
   target rect once: since that rect is naturally viewport-relative and
   already reflects however far the page has scrolled, the clone is
   mathematically guaranteed to land exactly on the real card the
   instant progress reaches 1, with no separate resize-tracking needed
   for the landing point (only the hero starting point is measured
   once, at load). */
function initHeroCardFlight() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || reducedMotion) return;
  const heroRow = document.getElementById('hero-proj-row');
  const realCards = [...document.querySelectorAll('.proj-card[data-hero-card]')]
    .sort((a, b) => +a.dataset.heroCard - +b.dataset.heroCard);
  if (!heroRow || !realCards.length) return;

  const clones = realCards.map(card => {
    const imgEl   = card.querySelector('.proj-thumb img, .proj-thumb-video');
    const bgMatch = card.querySelector('.proj-thumb-bg')?.style.background.match(/url\(['"]?([^'")]+)['"]?\)/);
    const imgSrc  = imgEl
      ? (imgEl.tagName === 'VIDEO' ? imgEl.getAttribute('poster') : imgEl.src)
      : (bgMatch ? bgMatch[1] : '');
    const cat   = card.querySelector('.proj-ov-cat')?.textContent || '';
    const title = card.querySelector('h3')?.textContent || '';
    const href  = card.querySelector('.proj-ov-link')?.getAttribute('href') || '#';

    const a = document.createElement('a');
    a.href = href;
    a.className = 'hero-proj-card';
    a.setAttribute('aria-hidden', 'true');
    a.setAttribute('tabindex', '-1');
    a.innerHTML =
      `<div class="hf-img-wrap"><img src="${imgSrc}" alt="" loading="lazy"></div>` +
      `<div class="hpc-cap"><span class="hpc-cat">${cat}</span><span class="hpc-title">${title}</span></div>`;
    a.style.opacity = '0';
    heroRow.appendChild(a);
    return a;
  });

  requestAnimationFrame(() => {
    // Measure each clone's natural (flex-laid-out) rect, THEN reparent to
    // <body> before switching to position:fixed — #hero-content carries a
    // GSAP transform for its own parallax above, and any transformed
    // ancestor becomes the containing block for position:fixed
    // descendants, which would break the "fixed = viewport-relative"
    // assumption this whole effect depends on.
    const heroRects = clones.map(c => c.getBoundingClientRect());
    clones.forEach((clone, i) => {
      const r = heroRects[i];
      document.body.appendChild(clone);
      Object.assign(clone.style, {
        position: 'fixed',
        top: r.top + 'px',
        left: r.left + 'px',
        width: r.width + 'px',
        height: r.height + 'px',
        margin: '0',
        zIndex: '40',
        willChange: 'top, left, width, height, opacity'
      });
    });

    const smoothstep = (x, e0, e1) => {
      const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
      return t * t * (3 - 2 * t);
    };

    function setProgress(p) {
      realCards.forEach((card, i) => {
        const hr = heroRects[i];
        const gr = card.getBoundingClientRect(); // live — see function comment
        const top    = hr.top    + (gr.top    - hr.top)    * p;
        const left   = hr.left   + (gr.left   - hr.left)   * p;
        const width  = hr.width  + (gr.width  - hr.width)  * p;
        const height = hr.height + (gr.height - hr.height) * p;
        const clone = clones[i];
        clone.style.top = top + 'px';
        clone.style.left = left + 'px';
        clone.style.width = width + 'px';
        clone.style.height = height + 'px';
        const cloneOpacity = 1 - smoothstep(p, 0.85, 1);
        clone.style.opacity = String(cloneOpacity);
        gsap.set(card, { opacity: smoothstep(p, 0.85, 1) });
      });
    }

    // Clones start visible in the hero (progress 0); real grid cards start
    // hidden until their clone arrives.
    gsap.set(clones, { opacity: 1 });
    gsap.set(realCards, { opacity: 0 });

    ScrollTrigger.create({
      trigger: '#hero',
      endTrigger: '#projects',
      start: 'bottom 95%',
      end: 'top top',
      onUpdate: self => setProgress(self.progress),
      onLeave: () => { // scrolled past the grid — clone has fully handed off
        clones.forEach(c => { c.style.opacity = '0'; c.style.pointerEvents = 'none'; });
        gsap.set(realCards, { opacity: 1 });
      },
      onEnterBack: () => { // scrolled back up into the transition zone
        setProgress(1); // will be immediately corrected by the next onUpdate tick
      },
      onLeaveBack: () => { // scrolled back above the hero — reset to rest state
        setProgress(0);
      }
    });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
}
initHeroCardFlight();

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

/* ── Project grid entrance — picks up where the hero project row's
   scroll-fade (see the hero parallax block below) leaves off, so the
   hero cards recede as the user scrolls and the full grid rises into
   place a beat later. ── */
/* Excludes [data-hero-card] — those 6 cards' opacity is exclusively owned
   by the hero card flight system (see initHeroCardFlight below), which
   already reveals them in sync with their clone's arrival. Reusing the
   generic reveal on top of that would fight over the same opacity
   property, and since .from() reads the element's CURRENT value as its
   implicit start point, a card already forced to opacity:0 by the flight
   system would make this a 0→0 no-op on top of fighting for control. */
ScrollTrigger.batch('.proj-card:not([data-hero-card])', {
  onEnter: els => gsap.from(els, {
    y: isMobile ? 20 : 40, scale: isMobile ? 0.97 : 0.94, opacity: 0,
    duration: revDur, stagger: revStg, ease: 'expo.out'
  }),
  start: 'top 90%', once: true
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

  /* Collapsed grid adapts to however many live cards actually exist, rather
     than assuming a fixed count — set once from data, not hardcoded in CSS. */
  function applyCollapsedLayout() {
    if (!labGrid) return;
    labGrid.classList.add('lab-grid--collapsed');
    const cols = Math.min(liveCards.length, 3) || 1;
    const maxWidth = { 1: '420px', 2: '760px', 3: '1140px' }[cols];
    labGrid.style.setProperty('--collapsed-cols', cols);
    labGrid.style.setProperty('--collapsed-max-w', maxWidth);
  }

  /* Initial state: live cards only, no tabs, collapsed grid */
  applyCollapsedLayout();
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
      applyCollapsedLayout();
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
