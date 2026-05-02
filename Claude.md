# Ayo Akintilo — Portfolio

## Project
Personal portfolio site for Ayodeji "Ayo" Akintilo, Creative Systems Leader.

## Design System
- **Fonts**: Cormorant Garamond (display/serif, wt 300–400), Space Grotesk (headings), Inter (body)
- **Colors**: `--bg-deep: #07070f`, `--text-primary: #ede9e4` (warm ivory), `--accent: #5b8cff`, `--accent-2: #9b6dff`
- **Glass**: `backdrop-filter: blur(40px) saturate(180%)` with inner gradient `rgba(255,255,255,0.1→0.03)`, bright top border `rgba(255,255,255,0.22)`, atmosphere blobs behind cards
- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` throughout

## Animations (all implemented)
- **Hero name**: CSS `@keyframes maskRise` — `translateY(106%→0)` on load
- **Section headings**: scroll-triggered line-mask reveal via `splitReveal()` JS — splits at `<br>` tags, 85ms stagger per line
- **Project cards / images**: `.img-rise` class + IntersectionObserver — `opacity 0→1, translateY(40px)→0, scale(0.96→1)`
- **Parallax**: `.parallax-frame` + `.parallax-img` — `scale(1.14) translateY()` driven by scroll position
- **`text-wrap: balance`** on all display headings

## Key layouts
- **portfolio.html** — main page with hero, about, 6 project cards, experience, skills, contact
- **case-study.css** — shared styles for all case study pages
- **event-brand/navan.html** — sticky card stack scroll layout (cards pin, next slides on top, 80% wide)
- **event-brand/docusign-momentum.html** — 3-column bento grid with staggered card entrance

## Pending / next up
- Upload images to case study pages (placeholders are `<div class="bento-slot">` and `<div class="img-slot">`)
- Navan: add video/embed stack cards when files are ready
- Most case study pages are stubs — need full content built out