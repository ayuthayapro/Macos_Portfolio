# macOS Portfolio Project Architecture & Memory

## Overview
- **Project Name:** `macos_portfolio`
- **Location:** `D:\S_Any_P\macos_portfolio`
- **Concept:** A macOS-inspired interactive web desktop portfolio built with React 19, Tailwind CSS v4, Zustand, and GSAP animations.

---

## Tech Stack & Core Libraries
- **Framework & Runtime:** React 19 (`react`, `react-dom`) + Vite 8 (`@vitejs/plugin-react`)
- **Styling:** Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`) + PostCSS / LightningCSS
- **State Management:** Zustand 5 with Immer middleware (`zustand`, `immer`)
- **Animations & Draggables:** 
  - GSAP 3 (`gsap`, `@gsap/react`, `gsap/Draggable` registered globally)
  - Framer Motion (`framer-motion`)
- **UI & Helpers:** `lucide-react`, `liquid-glass-react`, `react-tooltip`, `dayjs`

---

## Path Aliases (`vite.config.js`)
- `#components` -> `src/components`
- `#constants`  -> `src/constants`
- `#store`      -> `src/store`
- `#hoc`        -> `src/hoc`
- `#windows`    -> `src/windows`

---

## Directory & File Structure
```text
D:\S_Any_P\macos_portfolio\
├── index.html
├── package.json
├── vite.config.js
├── public/
│   ├── icons/            # SVG icons (finder, trash, file, etc.)
│   └── images/           # Screenshots, wallpapers, app icons
└── src/
    ├── main.jsx          # App entry point (StrictMode, index.css)
    ├── App.jsx           # Desktop orchestrator (Background, Navbar, Welcome, Items, Dock, Windows)
    ├── index.css         # Global Tailwind styles & font declarations
    ├── components/
    │   ├── index.js      # Barrel export for all core desktop components
    │   ├── Navbar.jsx    # macOS Top Menu Bar (Apple menu, date/time, control center)
    │   ├── Welcome.jsx   # Hero / introductory notification / banner
    │   ├── DesktopItem.jsx # Desktop icon shortcuts & clickable file nodes
    │   ├── Dock.jsx      # macOS bottom floating dock with app launch triggers
    │   ├── WindowControls.jsx # Red/Yellow/Green window action buttons (close, minimize, maximize)
    │   └── WaveBackground.jsx # Dynamic background canvas / fluid animation
    ├── windows/
    │   ├── index.js      # Barrel export for all wrapped window components
    │   ├── Terminal.jsx  # Terminal window displaying interactive tech stack & CLI look
    │   ├── Safari.jsx    # Browser window displaying case studies / live project previews
    │   ├── contact.jsx   # Contact / messaging window
    │   └── Resume.jsx    # Interactive Resume / PDF viewer window
    ├── hoc/
    │   └── WindowWrapper.jsx # Higher-Order Component attaching GSAP entrance, z-index stacking, and Draggable.create to window headers
    ├── store/
    │   └── window.js     # Zustand store managing open/closed states, active z-index focus, and window data
    └── constants/
        └── index.js      # Static data: projectArticles, locations (work, about, resume, trash), techStack, and WINDOW_CONFIG
```

---

## Core Architecture Patterns

### 1. Window Management (`#store/window.js` & `#constants/index.js`)
* Initial z-index starts at `1000` (`INITIAL_Z_INDEX`).
* `WINDOW_CONFIG` defines state for:
  `finder`, `contact`, `resume`, `safari`, `photos`, `terminal`, `txtfile`, `imgfile`, `trash`.
* Actions in `useWindowStore`:
  - `openWindow(windowKey, data)`: Sets `isOpen = true`, raises `zIndex` to `nextZIndex++`, attaches optional data.
  - `closeWindow(windowKey)`: Sets `isOpen = false`, resets `zIndex` and clears `data`.
  - `focusWindow(windowKey)`: Increments `nextZIndex` and updates target window's `zIndex` on click or drag.

### 2. Window Wrapping Pattern (`#hoc/WindowWrapper.jsx`)
* All window components are exported wrapped in `WindowWrapper(Component, windowKey)`:
  - Listens to `useWindowStore()` for `isOpen` and `zIndex`.
  - Handles GSAP opening animation (`scale: 0.8 -> 1`, `opacity: 0 -> 1`, `power3.out`).
  - Registers GSAP `Draggable.create` using `#window-header` as the drag trigger.
  - Automatically brings the window to the front on press (`onPress: () => focusWindow(windowKey)`).

### 3. Desktop Orchestration (`App.jsx`)
* The main desktop layout layers components in a relative container:
  1. `<WaveBackground />`
  2. `<Navbar />` (macOS top menu bar)
  3. `<Welcome />`
  4. `<DesktopItem />` (Finder file items on desktop)
  5. `<Dock />` (Bottom launcher dock)
  6. Layered Windows (`<Terminal />`, `<SafariWindow />`, `<ContactWindow />`, `<ResumeWindow />`, etc.)
