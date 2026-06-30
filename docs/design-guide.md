# PixivNow Design Guide

## Design Style: Neubrutalism

Core visual traits: bold black borders, solid offset shadows, high-contrast palette, zero border-radius, bold typography, press interaction feedback.

Aligned with PicaComicNow's Neubrutalism design language to form a unified FreeNowOrg brand identity.

---

## Colors

| Token | Value | Purpose |
|---|---|---|
| `--fnb-bg` | `#EEF2FF` | Page background (blue-tinted warm white) |
| `--fnb-brand` | `#4993FF` | Primary color, primary buttons |
| `--fnb-brand-hover` | `#6AABFF` | Primary hover state |
| `--fnb-accent` | `#A78BFA` | Secondary accent (view count icons, etc.) |
| `--fnb-success` | `#7FD957` | Success state |
| `--fnb-highlight` | `#FFE066` | Highlight, marker effect, hover background |
| `--fnb-danger` | `#FF5555` | Error, danger actions |
| `--fnb-bookmark` | `#FF69B4` | Bookmark marker |
| `--fnb-border` | `#000` | Borders, primary text |
| `--fnb-shadow-color` | `var(--fnb-border)` | Hard-shadow color (decoupled from border — see Theming) |
| `--fnb-surface` | `#fff` | Card, input background |
| `--fnb-bg-alt` | `#f0f0f0` | Alternate/raised surface |
| `--fnb-text` | `#1a1a1a` | Body text |
| `--fnb-text-muted` | `#666` | Secondary text |
| `--fnb-on-brand` | `#fff` | Foreground on dark/colored fills (brand, danger, badges) — light in both themes |
| `--fnb-on-light` | `#1a1a1a` | Foreground on light fills (highlight, success) — dark in both themes |
| `--fnb-skeleton` | `#e8e8e8` | Skeleton / placeholder / code fill |
| `--fnb-divider` | `#dedede` | Dividers, hairlines, focus rings |
| `--fnb-grid-line` | `rgba(0,0,0,.03)` | Body background grid lines |
| `--fnb-silver` / `--fnb-bronze` | `#d1d5db` / `#f0b27a` | Rank medals |

Project-domain semantic colors live under a separate `--pixiv-*` prefix (R18 / AI / original-work badges) — see [Theming](#theming-light--dark-mode). Values above are the **light** theme; dark overrides are in the Theming section.

### Border Radius

| Token | Default | Purpose |
|---|---|---|
| `--fnb-radius` | `0` | Global base radius |
| `--fnb-radius-sm` | `0` | Small (tags, inputs) |
| `--fnb-radius-lg` | `0` | Large (dialogs, large cards) |

Zero by default (Neubrutalism core). Consumers can override these tokens for rounded variants.

---

## Typography

| Purpose | Font family | Token |
|---|---|---|
| Body | Noto Sans SC, PingFang SC, system-ui | `--fnb-font-sans` |
| Display / Headings | Archivo Black, Noto Sans SC, system-ui | `--fnb-font-display` |
| Mono | Space Grotesk, ui-monospace, monospace | `--fnb-font-mono` |

### Heading Styles

- **h1**: Archivo Black, `2.2rem`, `font-weight: 900`
- **h2**: Yellow marker background (`--fnb-highlight`) + 3px black bottom border

---

## Borders & Shadows

**Zero border-radius** — no `border-radius` site-wide. Sharp corners are a Neubrutalism core trait.

| Level | Border | Shadow | Mixin |
|---|---|---|---|
| Standard | `3px solid #000` | `6px 6px 0 0 #000` | `@include fnb-border; @include fnb-shadow;` |
| Small | `2px solid #000` | `4px 4px 0 0 #000` | `@include fnb-border-sm; @include fnb-shadow-sm;` |
| Large | `3px solid #000` | `8px 8px 0 0 #000` | `@include fnb-shadow-lg;` |
| Micro | `2px solid #000` | `3px 3px 0 0 #000` | `@include fnb-shadow-xs;` |

### Press Effect

Hover/active: element shifts down-right, shadow collapses to 0 — simulates a tactile "push" feedback:

```
hover/active: translate(1.5px, 1.5px); box-shadow: 0 0 0 0 #000;
```

---

## Theming: Light / Dark Mode

Theming is driven entirely by CSS custom properties. `useColorMode` (`@vueuse/core`, auto-imported) writes a `light` / `dark` class on `<html>`; `:root` holds the light values and `html.dark { … }` overrides the subset that changes. The `useTheme()` composable (`app/composables/useTheme.ts`) wraps this into a tri-state (`'auto' | 'light' | 'dark'`) — note `useColorMode`'s `emitAuto` is deprecated in v14, read `colorMode.store` instead. `ThemeToggle.vue` is the segmented switcher. Since the app is a client-only SPA, there is no SSR flash.

### Token architecture

- **`--fnb-*`** — design-system / component-library tokens (generic UI semantics). Portable across sister projects.
- **`--pixiv-*`** — project-domain semantic colors (R18 / AI / original-work). A sister project swaps these for its own domain set.

### Dark overrides (the values this project ships)

```scss
html.dark {
  --fnb-bg: #14151b;          // page
  --fnb-surface: #1e222b;     // cards (slightly lighter than bg)
  --fnb-bg-alt: #1d2029;
  --fnb-border: #4c5160;      // subtle, NOT near-white
  --fnb-shadow-color: #2f5ea8;// brand-blue hard shadow (see principle 1)
  --fnb-text: #eef0f3;
  --fnb-text-muted: #9aa1ac;
  --fnb-skeleton: #2a2e38;
  --fnb-divider: #343a45;
  --fnb-grid-line: rgba(255,255,255,.04);
  // brand/accent/success/highlight/danger/bookmark stay vivid (principle 2)
  // pixiv text tones brighten for dark legibility:
  --pixiv-original: #ff4fa3; --pixiv-r18-text: #ff6b6b; --pixiv-ai-text: #e0a44b;
}
```

`--fnb-on-brand` / `--fnb-on-light` / `--fnb-silver` / `--fnb-bronze` and the `--pixiv-*` badge fills are **theme-invariant** (same value in both modes), so they need no dark override.

### Design principles (learned the hard way — follow these for a sister project)

1. **Don't invert the hard shadow/border to near-white.** A white border + white shadow on a near-black page reads like a photographic negative. Two approaches that work instead:
   - *(this project)* keep a **subtle border** + decouple the shadow into `--fnb-shadow-color` and tint it with the **brand color** (deepened, e.g. `#2f5ea8`) so the signature hard offset stays visible without glare.
   - *(authentic neubrutalism, e.g. neubrutalism.com)* **white** border + shadow, but only with a **mid-dark page** (`~#2d2c31`) and **cards darker than the page** — never near-black bg with cards lighter than bg.
2. **Keep semantic colors vibrant in dark mode — do NOT desaturate them.** Muting success/highlight/danger to dull tones drifts toward generic "dark-UI" and kills the neubrutalist punch. Fix *contrast*, not saturation.
3. **Foreground tokens carry the contrast, not the fill.** Light fills (highlight yellow, success green) pair with `--fnb-on-light` (fixed dark); dark/colored fills (brand, danger, badges) pair with `--fnb-on-brand` (fixed light). Because these are fixed per fill, a fill stays readable in both themes without per-theme overrides. Every place that paints a `--fnb-highlight` / `--fnb-success` background must set its foreground to `--fnb-on-light` (including `:hover` background swaps).
4. **Media literals stay literal.** Colors layered *over artwork images* — black scrims (`rgba(0,0,0,.x)`), white-on-image text, text-shadows, carousel backdrops, modal/preview scrims — are theme-invariant media treatments. Leave them as literals; do not tokenize.
5. **Base text color + font belong on `body`.** Form controls (`button`, `input`, `select`, `textarea`) don't inherit `color` — add a global `color: inherit` reset, or unstyled controls fall back to UA black and vanish in dark mode.

---

## SCSS Mixins

All Neubrutalism patterns are encapsulated as `fnb-*` mixins in `app/assets/styles/_fnb.scss`. Auto-injected globally via Vite `preprocessorOptions` — no manual `@use` needed in components.

| Mixin | Purpose |
|---|---|
| `fnb-border` | 3px black solid border |
| `fnb-border-sm` | 2px black solid border |
| `fnb-shadow` / `sm` / `lg` / `xs` | Standard / small / large / micro offset shadow |
| `fnb-card` | Card base (border + shadow + white bg + transition) |
| `fnb-btn` | Button base (border + shadow + press effect + padding) |
| `fnb-tag` | Tag (border-sm + shadow-xs + small padding) |
| `fnb-input` | Input (border-sm + shadow-sm + focus brand shadow) |
| `fnb-press` | Press effect only (hover/active translate + shadow collapse) |

---

## Component System

### Naming

- UI base components: `Fnb` prefix, located in `app/components/ui/`
- Business components: no prefix, located in `app/components/`
- Nuxt auto-imports with `pathPrefix: false` for `ui/` directory

### Component List

| Component | Description |
|---|---|
| `FnbButton` | Button — `variant` (default/primary/success/danger), `size` (sm/md/lg) |
| `FnbCard` | Card container — `color` (white/brand/highlight/success) |
| `FnbTag` | Tag — `color`, `active`, `clickable` |
| `FnbSkeleton` | Skeleton placeholder — `width`, `height`, `circle`, `block`, `text` |
| `FnbInput` | Text input — `modelValue`, `placeholder`, `type` |
| `FnbSelect` | Dropdown select — `modelValue`, `options` |
| `FnbPagination` | Pagination — `modelPage`, `pageCount`, `pageSlot` |
| `FnbDialog` | Modal dialog — driven by `useDialog()` composable |
| `FnbToast` | Toast notification — driven by `useToast()` composable |
| `FnbMbox` | Message box — `type` (info/success/warning/error), `header` |
| `FnbSpin` | Loading spinner — `show` |
| `FnbProgress` | Progress bar — `percentage`, `color` |
| `FnbEllipsis` | Text truncation — `lineClamp`, `tooltip` |
| `FnbTabs` | Tab switcher — `modelValue`, `tabs: {key, label}[]` |
| `FnbTable` | Simple data table — `columns`, `data` |
| `FnbImage` | Image with preview — `src`, `alt`, `fallback` |
| `FnbScrollbar` | Custom scrollbar container |
| `FnbResult` | Result status page — `status`, `title`, `description` |
| `FnbFloatButton` | Floating action button |
| `FnbProvider` | Global container — mounts Dialog + Toast |

### Composables

| Composable | Description |
|---|---|
| `useDialog()` | Imperative dialog open, returns Promise |
| `useToast()` | Imperative toast display (info/success/warning/error) |

---

## Layout

### Page Container

- `.responsive`: `max-width: 1200px`, `margin: auto`, `padding: 0 2rem` (mobile `1rem`)
- Page background: `--fnb-bg` + 72x72px grid lines

### Header

- Height: 60px content + 3px bottom border = 63px
- Background: `var(--fnb-brand)`
- Bottom border: `3px solid var(--fnb-border)` (no shadow)

### Footer

- Top border: `3px solid var(--fnb-border)`
- Background: `var(--fnb-surface)` (white)
- h4 headings: yellow marker background
- Link hover: marker effect

### Responsive Breakpoints

| Width | Behavior |
|---|---|
| `>=1200px` | Centered container, max-width |
| `>=800px` | Multi-column grids |
| `>=600px` | Reduced columns |
| `<600px` | Single column, compact padding |

---

## Interactions

### Links

- Default: black text + underline (2px thick, 3px offset)
- Hover: thicker underline

### Buttons

- Default background: `var(--fnb-bg)`
- Hover: press effect (translate + shadow collapse)
- Disabled: `opacity: 0.5`, no press effect

### Transitions

- Page transitions: `fade-in-up` / `fade-out-down` (existing)
- Dialog: scale(0.9) + opacity, 200ms ease-out
- Toast: translateY(-20px) + opacity, 250ms ease-out
- All component transitions: 150-250ms, `ease-out`

---

## Icons

Using `unplugin-icons` with `@iconify-json/fa-solid`. Icons imported as Vue components via `~icons/fa-solid/xxx`.

Components accept icons via `#icon` slot for portability — no hardcoded icon import method inside UI components.

---

## Pug + SCSS Compatibility

Vue templates use Pug syntax (`lang="pug"`). SCSS classes with special characters must use string form:

| Syntax | Safe? |
|---|---|
| `.fnb-card`, `.flex`, `.gap-4` | Yes |
| Dynamic classes via `:class` | Yes |

---

## File Organization

```
app/
  assets/styles/
    _fnb.scss          — Fnb mixin library
    _variables.scss    — CSS custom properties (--fnb-* tokens)
    _elements.scss     — Global HTML element styles
    _formats.scss      — Utility classes
    _animate.scss      — Transition animations
    index.scss         — Entry point
  components/
    ui/                — Fnb* base UI components (pathPrefix: false)
    SiteHeader.vue     — Global header
    SiteFooter.vue     — Global footer
    SideNav/           — Side navigation
    Artwork/           — Artwork display components
    Comment/           — Comment components
  composables/
    useDialog.ts       — Imperative dialog
    useToast.ts        — Imperative toast
  stores/             — Pinia stores
  pages/              — Route pages
```

---

## Development Conventions

- **Template**: Pug (`lang="pug"`)
- **Script**: TypeScript (`lang="ts"`)
- **Style**: SCSS (`lang="scss"`), scoped preferred
- **Code comments**: English
- **UI copy**: Simplified Chinese
- **Commits**: English, Conventional Commits format
- **No third-party UI library**: All UI components self-implemented
