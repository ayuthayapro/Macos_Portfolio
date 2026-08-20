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