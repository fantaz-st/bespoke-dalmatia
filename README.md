# Sliced-transition WebGL hero — Next.js port

A recreation of [Théo Gil's Hrvoje Grubisic × Thomas Blanchard experiment](https://github.com/TheoGil/Hrvoje-Grubisic-Thomas-Blanchard) on the Next.js App Router, with CSS Modules.

> **Not build-verified.** The files are complete, but `npm install` never finished in the environment where this was written, so nothing here has been compiled or run in a browser yet. Treat the first `npm run dev` as the real test — see "Known unknowns" below.

## Setup

```bash
npm install
```

Then drop the three source clips into `public/videos/`, keeping the filenames referenced in `src/data/slides.js`:

- `mini-planets.mp4`
- `galaxy-gates.mp4`
- `kingdom-of-colours.mp4`

They're ~35 MB combined, which is why they aren't committed. The poster JPGs (used by the menu) are already in `public/img/`.

```bash
npm run dev
```

## How the effect works

**The shader** (`src/gl/shaders.js`) crossfades two video textures. A single fullscreen triangle covers the viewport rather than a quad — `uv` spans 0–2 and the excess falls outside, so it's one less triangle to rasterise.

Three lines do the visible work:

```glsl
float currentColumnIndex = floor(vUv.x * uColumnsCount) / uColumnsCount;
float columnYOff = currentColumnIndex * uOffsetAmount;
float yOff = progress + columnYOff * progress;
```

Each pixel is bucketed into one of three columns, and each column gets a vertical offset scaled by its index. Rotation (45°→0°) and scale (3→1) unwind in step with the same `uTransitionProgress`, which is what reads as panels sliding into place.

`backgroundCover()` is CSS `object-fit: cover` reimplemented in GLSL, so a 16:9 video fills any viewport without stretching.

**Video as texture** (`src/gl/GL.js`). The MP4s never enter the DOM. They're fetched as blobs, wrapped in detached `<video>` elements, and pushed into GL textures with `needsUpdate = true` on every RAF tick — a texture is a one-off upload otherwise, so this is what makes a slide "play".

**Orchestration** (`src/components/Hero/Hero.jsx`). GSAP drives a plain JS property that syncs the `uTransitionProgress` uniform; a staggered intro timeline scales the two column guides, then fades in the header, counter, controls and credits.

## What changed from the original

| Original | Here | Why |
| --- | --- | --- |
| `.glsl` files + `raw-loader` | Shaders as template strings | Turbopack is the default bundler in Next 16; a custom rule for two short files isn't worth the config |
| `preload-it` | ~30-line XHR helper (`src/lib/preload.js`) | Unmaintained since 2020, and genuinely small to replace |
| `can-autoplay` | `await video.play()` in a try/catch | That's all the library did under the hood |
| Splitting.js | Chars split during render (`SlideshowCaption.jsx`) | Post-mount DOM mutation fights React and breaks on hydration |
| Local woff/woff2 + `@font-face` | `next/font/google` | Self-hosts and preloads without the manual plumbing |
| 8 class components, `createRef` | Function components, `ref` as a prop | React 19 — no `forwardRef` wrapper needed |
| SCSS partials, `$variables` | CSS Modules + custom properties on `:root` | Also lets GSAP tween `--ruleScaleX` and `--beforeScaleY` directly |
| Imperative `updatePercentLoaded()` | `progress` state passed as a prop | Removes three `useImperativeHandle` surfaces |

Kept: `ogl` (~10 kb, and the shader is written against its API), `gsap`, `focus-trap-react`.

Only `Slideshow` retains an imperative handle, for `attachVideos()` and the `isTransitioning()` input guard. Everything else is prop-driven.

## Deliberate improvements

- DPR clamped at 2 — the original rendered at 1
- `playsInline` on the video elements, without which iOS won't autoplay at all
- `100dvh` alongside `100vh` for mobile browser chrome
- Arrow-key navigation
- Fluid caption sizing via `clamp()`, replacing the fixed `70px` that overflowed the column (the original's own `@TODO`)
- Transparent-pixel texture generated from a 1×1 canvas instead of shipping a PNG, which also removes a load race on first paint

## Known unknowns

Things I'd check first, since none of this has been run:

1. **`transpilePackages: ["ogl"]`** in `next.config.mjs` may be unnecessary on current ogl. Try removing it.
2. **GSAP tweening CSS custom properties** (`--ruleScaleX`, `--beforeScaleY`) needs a browser to confirm. If either fails to animate, swap to a class toggle with a CSS transition.
3. **The 800 ms menu-close delay** (`MENU_CLOSE_DURATION` in `Hero.jsx`) is inherited from the original's own acknowledged hack — it waits for the entry reverse animations rather than listening for them.
4. **`prefers-reduced-motion`** only shortens CSS transitions right now. The GSAP timelines ignore it. Worth wiring up `gsap.matchMedia()` if this goes anywhere near production.

## Structure

```
src/
├── app/
│   ├── layout.js            # font + metadata
│   ├── page.js              # renders <Hero />
│   └── globals.css          # design tokens on :root, focus ring
├── components/
│   ├── Hero/                # orchestrator: preload, autoplay, intro, slide state
│   ├── Header/
│   ├── Loader/              # progress ring + autoplay fallback button
│   ├── Menu/                # clip-path reveal, BurgerButton
│   ├── Slideshow/           # canvas, captions, counter, controls
│   └── Icons/
├── gl/
│   ├── GL.js                # OGL renderer, textures, transition
│   └── shaders.js
├── lib/preload.js
└── data/slides.js
```

## Credits

UI based on [Hrvoje Grubisic's](https://dribbble.com/hrvoje-grubisic) Cargo Logistics dribbble shots. Visuals by [Thomas Blanchard](https://thomas-blanchard.com/). Original implementation by [Théo Gil](https://github.com/TheoGil).
