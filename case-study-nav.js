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
