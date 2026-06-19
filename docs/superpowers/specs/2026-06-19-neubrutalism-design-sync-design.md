# PixivNow Neubrutalism Design Sync — Spec

## Goal

Sync PixivNow's UI with PicaComicNow's Neubrutalism design language to establish a unified FreeNowOrg brand identity. Completely replace naive-ui with self-implemented Fnb* components. Components should be generic and decoupled for future extraction as a shared library.

## Decisions

- **Style**: Neubrutalism — bold black borders, offset solid shadows, zero border-radius, press interaction feedback
- **Primary color**: Keep blue `#4993FF` (PicaComicNow uses pink `#FF5C8A`); all other Neubrutalism mechanics are unified
- **CSS approach**: Scoped SCSS + CSS custom properties + SCSS mixins (no UnoCSS — better for library distribution)
- **Component prefix**: `Fnb*` (FreeNeubrutalism) — designed for future extraction as shared component library
- **Icon system**: Keep existing `unplugin-icons` approach unchanged
- **Scope**: Full replacement — remove naive-ui entirely, implement all Fnb* components in one pass

---

## 1. Design Tokens

### Colors

| Token | Value | Purpose |
|---|---|---|
| `--fnb-bg` | `#EEF2FF` | Page background |
| `--fnb-brand` | `#4993FF` | Primary color |
| `--fnb-brand-hover` | `#6AABFF` | Primary hover |
| `--fnb-accent` | `#A78BFA` | Secondary accent |
| `--fnb-success` | `#7FD957` | Success state |
| `--fnb-highlight` | `#FFE066` | Highlight / marker effect |
| `--fnb-danger` | `#FF5555` | Error / danger |
| `--fnb-bookmark` | `#FF69B4` | Bookmark marker |
| `--fnb-border` | `#000` | Borders, shadows |
| `--fnb-surface` | `#fff` | Card / input background |
| `--fnb-text` | `#1a1a1a` | Body text |
| `--fnb-text-muted` | `#666` | Secondary text |

### Border Radius

| Token | Default | Purpose |
|---|---|---|
| `--fnb-radius` | `0` | Global base radius |
| `--fnb-radius-sm` | `0` | Small radius (tags, inputs) |
| `--fnb-radius-lg` | `0` | Large radius (dialogs) |

Default is zero (Neubrutalism). Consumers can override for rounded variants.

### Typography

| Purpose | Font family |
|---|---|
| Body | Noto Sans SC, PingFang SC, system-ui |
| Display | Archivo Black, Noto Sans SC, system-ui |
| Mono | Space Grotesk, ui-monospace, monospace |

### Borders & Shadows

| Level | Border | Shadow | Mixin |
|---|---|---|---|
| Standard | `3px solid #000` | `6px 6px 0 0 #000` | `fnb-border` + `fnb-shadow` |
| Small | `2px solid #000` | `4px 4px 0 0 #000` | `fnb-border-sm` + `fnb-shadow-sm` |
| Large | `3px solid #000` | `8px 8px 0 0 #000` | `fnb-shadow-lg` |
| Micro | `2px solid #000` | `3px 3px 0 0 #000` | `fnb-shadow-xs` |

### Press Effect

```
hover/active: translate(1.5px, 1.5px); box-shadow: 0 0 0 0 #000;
```

---

## 2. SCSS Mixin System

File: `app/assets/styles/_fnb.scss`

Auto-injected globally via `vite.css.preprocessorOptions.scss.additionalData`.

| Mixin | Purpose |
|---|---|
| `fnb-border` | 3px black solid border |
| `fnb-border-sm` | 2px black solid border |
| `fnb-shadow` / `sm` / `lg` / `xs` | Offset shadows at various sizes |
| `fnb-press` | Press effect (hover/active translate + shadow collapse) |
| `fnb-card` | Card = border + shadow + surface bg + transition |
| `fnb-btn` | Button = border + shadow + press + padding + font |
| `fnb-tag` | Tag = border-sm + shadow-xs + small padding |
| `fnb-input` | Input = border-sm + shadow-sm + focus brand shadow |

---

## 3. Fnb* Component System

Location: `app/components/ui/`, auto-imported with `pathPrefix: false`.

### Component List

| Component | Replaces | Key Props |
|---|---|---|
| `FnbButton` | NButton | `variant`, `size`, `loading`, `disabled` |
| `FnbCard` | — | `color`, `shadow` |
| `FnbTag` | NTag | `color`, `active`, `clickable` |
| `FnbSkeleton` | NSkeleton | `width`, `height`, `circle`, `block`, `text` |
| `FnbInput` | NInput | `modelValue`, `placeholder`, `type`, `disabled` |
| `FnbSelect` | NSelect | `modelValue`, `options`, `placeholder` |
| `FnbPagination` | NPagination | `modelPage`, `pageCount`, `pageSlot` |
| `FnbDialog` | NModal + useDialog | via `useDialog()` composable |
| `FnbToast` | useMessage | via `useToast()` composable |
| `FnbMbox` | — | `type`, `header` |
| `FnbSpin` | NSpin | `show` |
| `FnbProgress` | NProgress | `percentage`, `color` |
| `FnbEllipsis` | NEllipsis | `lineClamp`, `tooltip` |
| `FnbTabs` | NTabs + NTabPane | `modelValue`, `tabs` |
| `FnbTable` | NTable | `columns`, `data` |
| `FnbImage` | NImage | `src`, `alt`, `fallback` |
| `FnbScrollbar` | NScrollbar | — |
| `FnbResult` | NResult | `status`, `title`, `description` |
| `FnbFloatButton` | NFloatButton | `onClick` |
| `FnbProvider` | NaiveuiProvider | Global container for Dialog + Toast |

### Composables

| Composable | Replaces | Description |
|---|---|---|
| `useDialog()` | naive-ui useDialog | Imperative dialog, returns Promise |
| `useToast()` | naive-ui useMessage | Imperative toast (info/success/warning/error) |

### Design Principles

1. Props naming aligns with PicaComicNow's Pica* components for future merge
2. Content via slots, not render props
3. All colors reference `--fnb-*` tokens, no hardcoded values
4. Scoped SCSS with mixin reuse
5. No external UI library dependency
6. Icons passed via `#icon` slot — no hardcoded icon import method

---

## 4. Global Styles & Layout

### Page Background

Grid texture matching PicaComicNow:
- `var(--fnb-bg)` (`#EEF2FF`) + 72x72px grid lines at 3% opacity

### Headings

- h2: Archivo Black + `var(--fnb-highlight)` marker background + 3px black bottom border
- Replaces current blue left-bar decoration

### Links

- Black text + underline, `text-underline-offset: 3px`, `text-decoration-thickness: 2px`
- Replaces current `::after` pseudo-element animation

### Header

- Height: 60px content + 3px bottom border = 63px
- Background: `var(--fnb-brand)`
- Bottom: `3px solid var(--fnb-border)` replaces shadow
- Search box: `@include fnb-input`, zero border-radius
- User avatar: square + 2px black border
- Hamburger button: square, hover `var(--fnb-highlight)` background

### Footer

- Top: 3px black border
- Background: `var(--fnb-surface)` (white, not dark)
- Text: `var(--fnb-text)`
- h4 titles: yellow marker background
- Link hover: marker effect
- Copyright area: `var(--fnb-bg)` background

### SideNav

- Panel background: `var(--fnb-surface)`
- Right: 3px black border
- Link hover: `var(--fnb-highlight)` background

### Container

- `.responsive`: `max-width: 1200px`, `margin: auto`, `padding: 0 2rem` (mobile 1rem)

---

## 5. Business Component Adaptation

### ArtworkCard

- Image container: `@include fnb-card`, zero border-radius
- Hover: `@include fnb-press` replaces image scale
- `.page-count`: `@include fnb-tag`
- `.restrict` badges: square, not round
- `.bookmark` button: hover `var(--fnb-highlight)` bg
- Author avatar: square + `@include fnb-border-sm`

### AuthorCard / FollowUserCard

- Avatar: square + `@include fnb-border-sm`
- Follow button: `FnbButton`
- Description: `FnbEllipsis`
- Skeleton: `FnbSkeleton`

### SearchBox

- `@include fnb-input`, zero border-radius
- Focus shadow: `var(--fnb-brand)`

### CommentArea

- "Load more" button: `FnbButton` replaces `NButton`

### ArtTag

- `FnbTag` replaces `NTag`

### ErrorPage

- `FnbResult` replaces `NResult`

### UgoiraViewer

- `FnbSpin`, `FnbProgress`, `FnbFloatButton`, `useToast()`

### Page-level Changes

| Page | Changes |
|---|---|
| `index.vue` | NH2 → native h2; NButton → FnbButton; NModal → FnbDialog |
| `login.vue` | NForm/NFormItem/NInput → native form + FnbInput; NButton → FnbButton |
| `artworks/[id].vue` | NButton/NSkeleton → FnbButton/FnbSkeleton |
| `users/[id]/index.vue` | NTabs → FnbTabs; NTable → FnbTable; NImage → FnbImage; NModal/NSkeleton/NButton → Fnb counterparts |
| `search/[keyword]/[p].vue` | NButton/NSpin → FnbButton/FnbSpin |
| `ranking.vue` | Pagination and filter controls |
| `[...slug].vue` | NButton → FnbButton |

---

## 6. Icons & Transitions

### Icons

Keep `unplugin-icons` + `@iconify-json/fa-solid`. No change. Components accept icons via `#icon` slot for library portability.

### Transitions

- Page transitions: keep existing `fade-in-up` / `fade-out-down`
- Dialog: scale(0.9) + opacity, 200ms ease-out
- Toast: translateY(-20px) + opacity, 250ms ease-out
- All durations 150-250ms, `ease-out` (not `ease-in-out`)

---

## 7. Dependency Changes

### Remove

| Package | Type |
|---|---|
| `naive-ui` | dependencies |
| `nuxtjs-naive-ui` | devDependencies |
| `unplugin-vue-components` | devDependencies |
| `unplugin-auto-import` | devDependencies |

### Add

None. Fonts loaded via Google Fonts `<link>`.

### nuxt.config.ts

- Remove `nuxtjs-naive-ui` from modules
- Remove AutoImport and Components vite plugins
- Remove naive-ui from optimizeDeps
- Add `css.preprocessorOptions` for SCSS mixin auto-injection
- Configure `app/components/ui/` with `pathPrefix: false`
- Change CSS entry from `.sass` to `.scss`

### File Structure

```
app/
  assets/styles/
    _fnb.scss          — Mixin library
    _variables.scss    — CSS custom properties (--fnb-* tokens)
    _elements.scss     — Global HTML element styles
    _formats.scss      — Utility classes
    _animate.scss      — Transition animations
    index.scss         — Entry, @use all modules
  components/ui/
    FnbButton.vue      FnbCard.vue       FnbTag.vue
    FnbSkeleton.vue    FnbInput.vue      FnbSelect.vue
    FnbPagination.vue  FnbDialog.vue     FnbToast.vue
    FnbMbox.vue        FnbSpin.vue       FnbProgress.vue
    FnbEllipsis.vue    FnbTabs.vue       FnbTable.vue
    FnbImage.vue       FnbScrollbar.vue  FnbResult.vue
    FnbFloatButton.vue FnbProvider.vue
  composables/
    useDialog.ts
    useToast.ts
```

### Files to Remove

| File | Reason |
|---|---|
| `app/components/NaiveuiProvider.vue` | Replaced by `FnbProvider.vue` |

### Style Migration

Existing `.sass` files migrated to `.scss` (curly-brace syntax) for consistency with `@include` mixin usage and Vue SFC `lang="scss"`.
