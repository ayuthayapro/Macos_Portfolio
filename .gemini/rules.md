# Project: macOS Portfolio

## Overview
This is a macOS-inspired interactive portfolio website built with:
- React 19 + Vite
- Tailwind CSS v4 (uses @apply inside nested CSS in src/index.css)
- GSAP + Draggable for floating window dragging & movement
- Zustand + Immer for window state & focus management
- Lucide React for UI icons
- Mona Sans (font-mona) as the primary typography

## Architecture & Layout
- src/windows/Safari.jsx → Main Projects window (Header + Sidebar + Detail Panel)
- src/index.css → All styles live here using Tailwind v4 nested CSS
- src/constants/index.js → Project data (projectArticles array)
- src/hoc/WindowWrapper.jsx → Window shell wrapper with GSAP Draggable

## Critical Design & Coding Rules
1. ALWAYS ask for confirmation before modifying or touching code.
2. DO NOT modify layout, widths, heights, or flex structures when making style changes.
3. Use pure white (#ffffff) window backgrounds for the macOS aesthetic.
4. Accent colors:
    - Green (#00A154 / #34D399) → View Project button & project tags
    - Blue (#2563EB / #60A5FA) → Frontend code button
    - Purple (#7C3AED / #A78BFA) → Backend code button
5. DO NOT add inline Tailwind layout utilities in JSX (e.g. className="flex-1 min-w-0") — define proper CSS classes in src/index.css.
6. Reusable button styles (like .styled__button, .btn-primary) must stay in @layer components at the root of src/index.css.
7. Use CSS comments (/* ... */) only — never JavaScript comments (//) inside CSS files.

## Tilt Card (Contact) Exact Layout & Position Rules
- **Card Shell (`.tilt-card`)**:
  - `position: relative; width: 100%; max-width: 540px; height: 320px; border-radius: 20px; overflow: hidden;`
  - `background-color: #fdfdfd; background-image: url("/images/cardbg.jpg");`
  - `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);`
  - `display: flex; align-items: center; padding: 24px;`
- **Phone Image wrapper (`.card-media`)**:
  - `position: relative; flex: 0 0 40%; z-index: 1;`
  - `transform: translateZ(15px);`
- **Phone image (`.contact-phone`)**:
  - `display: block; width: 100%; max-height: 270px; object-fit: contain;`
  - `transform: rotate(-16deg) translateY(42px);`
  - `filter: drop-shadow(0 18px 18px rgba(0, 0, 0, 0.24));`
- **Heading & Copy wrapper (`.card-content`)**:
  - `position: relative; flex: 1; padding-left: 20px; z-index: 1;`
  - `transform: translateZ(25px);`
- **Heading (`.contact-heading`)**:
  - `font-size: 2rem; font-weight: 750; line-height: 1; letter-spacing: -0.04em;`
  - Has animated shimmer gradient (`textShimmer 4s infinite linear`).
- **Description (`.contact-copy`)**:
  - `margin-top: 10px; margin-left: 6px; font-size: 0.95rem; line-height: 1.45;`
- **Contact Links block (`.card-contact-info`)**:
  - `position: absolute; bottom: 0px; right: 0px; z-index: 10;`
  - `display: flex; flex-direction: column; align-items: flex-end; gap: 2px;`
  - `transform: translateZ(20px); pointer-events: auto !important;`
- **Links (`.tilt-card .card-contact-info a`)**:
  - `font-size: 1.2rem; font-weight: 500; color: #52525b !important;`
  - `pointer-events: auto !important; cursor: pointer !important;`
  - Hover: `color: #007aff !important;`