# Neubrutalism Design Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace naive-ui with self-implemented Fnb* components using Neubrutalism design language, syncing PixivNow's UI with PicaComicNow.

**Architecture:** SCSS mixin system (`_fnb.scss`) provides Neubrutalism primitives (borders, shadows, press effects). CSS custom properties (`--fnb-*`) define design tokens. Self-implemented `Fnb*` Vue components in `app/components/ui/` replace all naive-ui usage. Components are scoped-SCSS, framework-agnostic, designed for future library extraction.

**Tech Stack:** Vue 3, Nuxt 4, Pug templates, SCSS (scoped), Pinia, unplugin-icons

## Global Constraints

- All colors must reference `--fnb-*` CSS custom properties, never hardcoded
- Zero `border-radius` site-wide (use `var(--fnb-radius)` token, default `0`)
- Templates use Pug syntax (`lang="pug"`)
- Styles use SCSS (`lang="scss"`) with scoped preferred
- Code comments in English
- UI copy in Simplified Chinese
- No external UI library dependencies in Fnb* components
- Icons passed via `#icon` slot in components, not hardcoded imports
- Spec: `docs/superpowers/specs/2026-06-19-neubrutalism-design-sync-design.md`
- Design guide: `docs/design-guide.md`

---

### Task 1: Foundation — Design Tokens, Mixin System, Config

**Files:**
- Create: `app/assets/styles/_fnb.scss`
- Create: `app/assets/styles/_variables.scss`
- Create: `app/assets/styles/_elements.scss`
- Create: `app/assets/styles/_formats.scss`
- Create: `app/assets/styles/_animate.scss`
- Create: `app/assets/styles/index.scss`
- Modify: `nuxt.config.ts`
- Modify: `package.json` (remove naive-ui related deps)
- Delete: `app/assets/styles/variables.sass`
- Delete: `app/assets/styles/elements.sass`
- Delete: `app/assets/styles/formats.sass`
- Delete: `app/assets/styles/animate.sass`
- Delete: `app/assets/styles/index.sass`

**Interfaces:**
- Produces: `--fnb-*` CSS custom properties available globally; `fnb-*` SCSS mixins available in all components via `additionalData` injection

- [ ] **Step 1: Create `_variables.scss` with all design tokens**

```scss
// app/assets/styles/_variables.scss
:root {
  // Colors
  --fnb-bg: #EEF2FF;
  --fnb-brand: #4993FF;
  --fnb-brand-hover: #6AABFF;
  --fnb-accent: #A78BFA;
  --fnb-success: #7FD957;
  --fnb-highlight: #FFE066;
  --fnb-danger: #FF5555;
  --fnb-bookmark: #FF69B4;
  --fnb-border: #000;
  --fnb-surface: #fff;
  --fnb-text: #1a1a1a;
  --fnb-text-muted: #666;

  // Border radius
  --fnb-radius: 0;
  --fnb-radius-sm: 0;
  --fnb-radius-lg: 0;

  // Typography
  --fnb-font-sans: 'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', system-ui, sans-serif;
  --fnb-font-display: 'Archivo Black', 'Noto Sans SC', system-ui, sans-serif;
  --fnb-font-mono: 'Space Grotesk', ui-monospace, monospace;

  // Shadows (used internally by mixins, exposed for edge cases)
  --fnb-shadow: 6px 6px 0 0 var(--fnb-border);
  --fnb-shadow-sm: 4px 4px 0 0 var(--fnb-border);
  --fnb-shadow-lg: 8px 8px 0 0 var(--fnb-border);
  --fnb-shadow-xs: 3px 3px 0 0 var(--fnb-border);
}
```

- [ ] **Step 2: Create `_fnb.scss` mixin library**

```scss
// app/assets/styles/_fnb.scss

// Borders
@mixin fnb-border {
  border: 3px solid var(--fnb-border);
  border-radius: var(--fnb-radius);
}

@mixin fnb-border-sm {
  border: 2px solid var(--fnb-border);
  border-radius: var(--fnb-radius-sm);
}

// Shadows
@mixin fnb-shadow {
  box-shadow: var(--fnb-shadow);
}

@mixin fnb-shadow-sm {
  box-shadow: var(--fnb-shadow-sm);
}

@mixin fnb-shadow-lg {
  box-shadow: var(--fnb-shadow-lg);
}

@mixin fnb-shadow-xs {
  box-shadow: var(--fnb-shadow-xs);
}

// Press effect
@mixin fnb-press {
  transition: transform 150ms, box-shadow 150ms;

  &:hover,
  &:active {
    transform: translate(1.5px, 1.5px);
    box-shadow: 0 0 0 0 var(--fnb-border);
  }
}

// Composites
@mixin fnb-card {
  @include fnb-border;
  @include fnb-shadow;
  background: var(--fnb-surface);
  transition: all 150ms;
}

@mixin fnb-btn {
  @include fnb-border;
  @include fnb-shadow;
  @include fnb-press;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 900;
  font-family: inherit;
  font-size: inherit;
  background: var(--fnb-bg);
  color: var(--fnb-text);
  cursor: pointer;
  text-decoration: none;
  border-radius: var(--fnb-radius);
}

@mixin fnb-tag {
  @include fnb-border-sm;
  @include fnb-shadow-xs;
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  font-size: 0.85rem;
  background: var(--fnb-surface);
  transition: all 150ms;
  border-radius: var(--fnb-radius-sm);
}

@mixin fnb-input {
  @include fnb-border-sm;
  @include fnb-shadow-sm;
  padding: 0.5rem 0.75rem;
  background: var(--fnb-surface);
  outline: none;
  font-family: inherit;
  font-size: inherit;
  color: var(--fnb-text);
  border-radius: var(--fnb-radius-sm);
  transition: box-shadow 150ms;

  &:focus {
    box-shadow: 4px 4px 0 0 var(--fnb-brand);
  }
}
```

- [ ] **Step 3: Migrate `_elements.scss` — global HTML element styles with Neubrutalism**

Convert from `.sass` indented syntax to `.scss` curly-brace syntax. Replace existing heading/link styles with Neubrutalism equivalents.

```scss
// app/assets/styles/_elements.scss

// Headings
article {
  h1 {
    font-family: var(--fnb-font-display);
    font-size: 2.2rem;
    font-weight: 900;
  }

  h2:not(.plain) {
    font-family: var(--fnb-font-display);
    font-weight: 900;
    font-size: 1.5em;
    display: inline-block;
    background: var(--fnb-highlight);
    border-bottom: 3px solid var(--fnb-border);
    padding: 0.2em 0.4em;
    margin: 1rem 0;
  }

  h3:not(.plain),
  h4:not(.plain),
  h5:not(.plain),
  h6:not(.plain) {
    font-weight: 700;
    padding: 0.2rem;
    color: var(--fnb-text);
  }

  h3:not(.plain) {
    font-size: 1.3rem;
    margin: 0.5em 0;
  }

  h4:not(.plain) {
    font-size: 1.2rem;
    margin: 0.5em 0;
  }

  h5:not(.plain) {
    font-size: 1.125rem;
    margin: 0.5em 0;
  }

  h6:not(.plain) {
    font-size: 1.125rem;
    margin: 0.5em 0;
  }
}

// Links
a {
  color: var(--fnb-text);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 2px;
  transition: color 150ms;

  &.plain {
    text-decoration: none;
  }

  &:hover {
    color: var(--fnb-brand);
  }

  &.button {
    @include fnb-btn;
    text-decoration: none;
  }
}

// Code
pre {
  overflow: auto;
  background: #efefef;
  padding: 4px;
  border-radius: var(--fnb-radius-sm);
}

code {
  background-color: #efefef;
  display: inline;
  padding: 0.1rem 0.2rem;
  color: var(--fnb-danger);
  word-break: break-word;
  border-radius: var(--fnb-radius-sm);
}

// Responsive container
.responsive,
.body-inner {
  @media (min-width: 1280px) {
    margin-left: auto;
    margin-right: auto;
    width: 1200px;
  }

  @media (max-width: 1280px) {
    margin-left: 1rem;
    margin-right: 1rem;
  }
}

// Inline SVG icons
svg.svg--inline {
  display: inline-block;
  vertical-align: -0.125em;
  overflow: visible;
}
```

- [ ] **Step 4: Migrate `_formats.scss` — utility classes**

Convert from `.sass` to `.scss`:

```scss
// app/assets/styles/_formats.scss

.align-center {
  text-align: center;
}

.align-left {
  text-align: left;
}

.align-right {
  text-align: right;
}

.position-center {
  text-align: left;
  position: relative;
  left: 50%;
  transform: translateX(-50%);
}

.flex-center {
  display: flex;
  align-items: center;
}

.pre,
.poem {
  white-space: pre-wrap;
}

.flex {
  display: flex;
}

.flex-1 {
  flex: 1;
}

.flex-list {
  .list-item {
    display: flex;
    gap: 0.5rem;

    &:not(:first-of-type) {
      margin-top: 4px;
    }

    > div {
      flex: 1;
    }

    .key {
      font-weight: 600;
      box-shadow: 2px 0 #dedede;
    }
  }
}

.pointer {
  cursor: pointer;
}

.gap-1 {
  gap: 0.5rem;
}

// Loading
.loading-cover {
  position: relative;

  &::before,
  &::after {
    content: '';
    width: 100%;
    height: 100%;
    display: block;
    position: absolute;
  }

  &::before {
    background-image: url(/images/spinner.svg);
    background-size: 75px;
    background-repeat: no-repeat;
    background-position: center;
    top: 50%;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
    z-index: 6;
  }

  &::after {
    top: 0;
    left: 0;
    background-color: rgba(255, 255, 255, 0.25);
    z-index: 5;
  }
}
```

- [ ] **Step 5: Migrate `_animate.scss` — transitions and animations**

```scss
// app/assets/styles/_animate.scss
@use 'sass:color';

.fade-in-up {
  animation: fadeInUp 0.24s ease;
}

.fade-out-down {
  animation: fadeOutDown 0.4s ease;
}

svg.spin {
  animation: spin 2s linear infinite;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translate3d(0, 1rem, 0);
  }
  to {
    opacity: 1;
    transform: translateZ(0);
  }
}

@keyframes fadeOutDown {
  0% {
    opacity: 1;
  }
  to {
    opacity: 0;
    transform: translate3d(0, 1rem, 0);
  }
}

@keyframes imgProgress {
  from {
    background-color: color.adjust(#e8e8e8, $lightness: 4%);
  }
  to {
    background-color: #e8e8e8;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

- [ ] **Step 6: Create `index.scss` entry point**

```scss
// app/assets/styles/index.scss
@use 'variables';
@use 'animate';
@use 'elements';
@use 'formats';
```

- [ ] **Step 7: Update `nuxt.config.ts`**

Replace the entire file content. Key changes:
- Remove `nuxtjs-naive-ui` from modules
- Remove `AutoImport` and `Components` vite plugins and their imports
- Remove `naive-ui` from `optimizeDeps`
- Add `css.preprocessorOptions` for SCSS mixin auto-injection
- Change CSS entry from `.sass` to `.scss`
- Configure `app/components/ui/` with `pathPrefix: false`
- Add Google Fonts link for Archivo Black and Noto Sans SC

```typescript
import { resolve } from 'node:path'
import Icons from 'unplugin-icons/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-01',

  ssr: false,

  modules: ['@pinia/nuxt', '@nuxtjs/i18n', '@vueuse/nuxt'],

  components: [
    { path: '~/components/ui', pathPrefix: false },
    '~/components',
  ],

  css: ['~/assets/styles/index.scss'],

  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Noto+Sans+SC:wght@400;700;900&display=swap',
        },
      ],
    },
  },

  vite: {
    plugins: [
      Icons({
        scale: 1,
        defaultClass: 'svg--inline',
      }),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "${resolve(import.meta.dirname, './app/assets/styles/_fnb.scss')}" as *;`,
        },
        sass: {
          additionalData: `\n@use "${resolve(import.meta.dirname, './app/assets/styles/_fnb.scss')}" as *\n`,
        },
      },
    },
    vue: {
      template: {
        compilerOptions: {},
      },
    },
  },

  i18n: {
    locales: [{ code: 'zh-Hans', file: 'zh-Hans.json' }],
    defaultLocale: 'zh-Hans',
    lazy: true,
    langDir: '../app/locales',
    strategy: 'no_prefix',
  },

  runtimeConfig: {
    uaBlacklist: process.env.UA_BLACKLIST || '[]',
    public: {
      pximgBaseUrlI: process.env.VITE_PXIMG_BASEURL_I || '/-/',
      pximgBaseUrlS: process.env.VITE_PXIMG_BASEURL_S || '/~/',
      googleAnalyticsId: process.env.VITE_GOOGLE_ANALYTICS_ID || '',
      siteEnv:
        process.env.NODE_ENV === 'production' ? 'production' : 'development',
    },
  },

  devtools: { enabled: true },
})
```

- [ ] **Step 8: Remove naive-ui dependencies from `package.json`**

Remove these entries:
- `dependencies`: `naive-ui`
- `devDependencies`: `nuxtjs-naive-ui`, `unplugin-vue-components`, `unplugin-auto-import`

Then run: `pnpm install`

- [ ] **Step 9: Delete old `.sass` style files**

```bash
rm app/assets/styles/variables.sass
rm app/assets/styles/elements.sass
rm app/assets/styles/formats.sass
rm app/assets/styles/animate.sass
rm app/assets/styles/index.sass
```

- [ ] **Step 10: Verify foundation builds**

```bash
pnpm dev
```

Expected: Dev server starts without SCSS compilation errors. Pages will be broken (naive-ui components missing) — that's expected at this stage.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: foundation — design tokens, SCSS mixin system, config migration"
```

---

### Task 2: Core UI Components — FnbButton, FnbCard, FnbTag, FnbSkeleton

**Files:**
- Create: `app/components/ui/FnbButton.vue`
- Create: `app/components/ui/FnbCard.vue`
- Create: `app/components/ui/FnbTag.vue`
- Create: `app/components/ui/FnbSkeleton.vue`

**Interfaces:**
- Consumes: `fnb-*` SCSS mixins, `--fnb-*` CSS variables
- Produces: `<FnbButton>` with props `variant: 'default'|'primary'|'success'|'danger'`, `size: 'sm'|'md'|'lg'`, `loading: boolean`, `disabled: boolean`, `tag: string`, `href: string`; `<FnbCard>` with props `color: 'white'|'brand'|'highlight'|'success'`, `shadow: 'sm'|'md'|'lg'|'none'`; `<FnbTag>` with props `color: string`, `active: boolean`, `clickable: boolean`; `<FnbSkeleton>` with props `width: string`, `height: string`, `circle: boolean`, `block: boolean`, `text: boolean`, `repeat: number`

- [ ] **Step 1: Create `FnbButton.vue`**

```vue
<template lang="pug">
component.fnb-button(
  :is='tag || (href ? "a" : "button")'
  :class='[`fnb-button--${variant}`, `fnb-button--${size}`, { "fnb-button--disabled": disabled || loading, "fnb-button--loading": loading }]'
  :disabled='(tag === "button" || !tag) ? (disabled || loading) : undefined'
  :href='href'
  v-bind='$attrs'
)
  span.fnb-button__spinner(v-if='loading')
    svg.spin(viewBox='0 0 24 24' width='1em' height='1em')
      circle(cx='12' cy='12' r='10' fill='none' stroke='currentColor' stroke-width='3' stroke-dasharray='31.4 31.4' stroke-linecap='round')
  slot(name='icon' v-if='!loading')
  slot
</template>

<script lang="ts" setup>
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    variant?: 'default' | 'primary' | 'success' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    disabled?: boolean
    tag?: string
    href?: string
  }>(),
  {
    variant: 'default',
    size: 'md',
  }
)
</script>

<style scoped lang="scss">
.fnb-button {
  @include fnb-btn;

  &--primary {
    background: var(--fnb-brand);
    color: #fff;
  }

  &--success {
    background: var(--fnb-success);
    color: var(--fnb-text);
  }

  &--danger {
    background: var(--fnb-danger);
    color: #fff;
  }

  &--sm {
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
    font-weight: 700;
    border-width: 2px;
    box-shadow: var(--fnb-shadow-sm);
  }

  &--lg {
    padding: 1rem 2rem;
    font-size: 1.1rem;
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;

    &:hover,
    &:active {
      transform: none;
      box-shadow: var(--fnb-shadow);
    }
  }

  &--loading {
    cursor: wait;
  }

  &__spinner {
    display: inline-flex;
    animation: spin 1s linear infinite;
  }
}
</style>
```

- [ ] **Step 2: Create `FnbCard.vue`**

```vue
<template lang="pug">
.fnb-card(:class='[`fnb-card--${color}`, `fnb-card--shadow-${shadow}`]')
  slot
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    color?: 'white' | 'brand' | 'highlight' | 'success'
    shadow?: 'sm' | 'md' | 'lg' | 'none'
  }>(),
  {
    color: 'white',
    shadow: 'md',
  }
)
</script>

<style scoped lang="scss">
.fnb-card {
  @include fnb-border;
  background: var(--fnb-surface);
  padding: 1rem;
  transition: all 150ms;

  &--shadow-sm {
    @include fnb-shadow-sm;
  }

  &--shadow-md {
    @include fnb-shadow;
  }

  &--shadow-lg {
    @include fnb-shadow-lg;
  }

  &--shadow-none {
    box-shadow: none;
  }

  &--brand {
    background: var(--fnb-brand);
    color: #fff;
  }

  &--highlight {
    background: var(--fnb-highlight);
  }

  &--success {
    background: var(--fnb-success);
  }
}
</style>
```

- [ ] **Step 3: Create `FnbTag.vue`**

```vue
<template lang="pug">
span.fnb-tag(
  :class='{ "fnb-tag--active": active, "fnb-tag--clickable": clickable }'
  :style='colorStyle'
  :role='clickable ? "button" : undefined'
  :tabindex='clickable ? 0 : undefined'
  @click='clickable ? $emit("click", $event) : undefined'
  @keydown.enter='clickable ? $emit("click", $event) : undefined'
)
  slot
</template>

<script lang="ts" setup>
defineEmits<{
  click: [event: Event]
}>()

const props = withDefaults(
  defineProps<{
    color?: string
    active?: boolean
    clickable?: boolean
  }>(),
  {
    clickable: false,
  }
)

const colorStyle = computed(() => {
  if (!props.color) return undefined
  return { 'background-color': props.color }
})
</script>

<style scoped lang="scss">
.fnb-tag {
  @include fnb-tag;

  &--active {
    background: var(--fnb-highlight);
    font-weight: 700;
  }

  &--clickable {
    cursor: pointer;

    @include fnb-press;
  }
}
</style>
```

- [ ] **Step 4: Create `FnbSkeleton.vue`**

```vue
<template lang="pug">
template(v-if='repeat > 1')
  span.fnb-skeleton(
    v-for='i in repeat'
    :key='i'
    :class='classes'
    :style='sizeStyle'
  )
span.fnb-skeleton(v-else :class='classes' :style='sizeStyle')
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    width?: string
    height?: string
    circle?: boolean
    block?: boolean
    text?: boolean
    repeat?: number
  }>(),
  {
    repeat: 1,
  }
)

const classes = computed(() => ({
  'fnb-skeleton--circle': props.circle,
  'fnb-skeleton--block': props.block,
  'fnb-skeleton--text': props.text,
}))

const sizeStyle = computed(() => ({
  width: props.width,
  height: props.height,
}))
</script>

<style scoped lang="scss">
.fnb-skeleton {
  display: inline-block;
  background: #e0e0e0;
  animation: imgProgress 0.8s ease infinite alternate;
  border-radius: var(--fnb-radius-sm);

  &--circle {
    border-radius: 50%;
  }

  &--block {
    display: block;
    width: 100%;
  }

  &--text {
    height: 1em;
    display: inline-block;
  }
}
</style>
```

- [ ] **Step 5: Commit**

```bash
git add app/components/ui/FnbButton.vue app/components/ui/FnbCard.vue app/components/ui/FnbTag.vue app/components/ui/FnbSkeleton.vue
git commit -m "feat: core UI components — FnbButton, FnbCard, FnbTag, FnbSkeleton"
```

---

### Task 3: Form & Navigation Components — FnbInput, FnbSelect, FnbPagination, FnbTabs

**Files:**
- Create: `app/components/ui/FnbInput.vue`
- Create: `app/components/ui/FnbSelect.vue`
- Create: `app/components/ui/FnbPagination.vue`
- Create: `app/components/ui/FnbTabs.vue`

**Interfaces:**
- Consumes: `fnb-*` SCSS mixins, `--fnb-*` CSS variables
- Produces: `<FnbInput>` with v-model support (`modelValue`/`update:modelValue`), props `placeholder`, `type`, `disabled`, `readonly`; `<FnbSelect>` with v-model (`modelValue`/`update:modelValue`), props `options: {label,value}[]`, `placeholder`; `<FnbPagination>` with v-model (`page`/`update:page`), props `itemCount`, `pageSize`, `pageSlot`; `<FnbTabs>` with v-model (`modelValue`/`update:modelValue`), props `tabs: {key,label}[]`, slot `#panel-{key}`

- [ ] **Step 1: Create `FnbInput.vue`**

```vue
<template lang="pug">
input.fnb-input(
  :class='{ "fnb-input--disabled": disabled }'
  :disabled='disabled'
  :placeholder='placeholder'
  :readonly='readonly'
  :type='type'
  :value='modelValue'
  @input='$emit("update:modelValue", ($event.target as HTMLInputElement).value)'
)
</template>

<script lang="ts" setup>
defineEmits<{
  'update:modelValue': [value: string]
}>()

withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    type?: string
    disabled?: boolean
    readonly?: boolean
  }>(),
  {
    type: 'text',
  }
)
</script>

<style scoped lang="scss">
.fnb-input {
  @include fnb-input;
  width: 100%;

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
```

- [ ] **Step 2: Create `FnbSelect.vue`**

```vue
<template lang="pug">
.fnb-select
  select.fnb-select__native(
    :disabled='disabled'
    :value='modelValue'
    @change='$emit("update:modelValue", ($event.target as HTMLSelectElement).value)'
  )
    option(v-if='placeholder' value='' disabled selected hidden) {{ placeholder }}
    option(
      v-for='opt in options'
      :key='opt.value'
      :value='opt.value'
    ) {{ opt.label }}
</template>

<script lang="ts" setup>
defineEmits<{
  'update:modelValue': [value: string]
}>()

defineProps<{
  modelValue?: string
  options: { label: string; value: string }[]
  placeholder?: string
  disabled?: boolean
}>()
</script>

<style scoped lang="scss">
.fnb-select__native {
  @include fnb-input;
  width: 100%;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%23000'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2rem;
  cursor: pointer;
}
</style>
```

- [ ] **Step 3: Create `FnbPagination.vue`**

```vue
<template lang="pug">
nav.fnb-pagination(v-if='totalPages > 1' aria-label='分页导航')
  button.fnb-pagination__btn(
    :disabled='page <= 1'
    @click='goTo(page - 1)'
    aria-label='上一页'
  ) ‹
  template(v-for='p in visiblePages' :key='p')
    span.fnb-pagination__ellipsis(v-if='p === "..."') …
    button.fnb-pagination__btn(
      v-else
      :class='{ "fnb-pagination__btn--active": p === page }'
      @click='goTo(p as number)'
    ) {{ p }}
  button.fnb-pagination__btn(
    :disabled='page >= totalPages'
    @click='goTo(page + 1)'
    aria-label='下一页'
  ) ›
</template>

<script lang="ts" setup>
const emit = defineEmits<{
  'update:page': [value: number]
}>()

const props = withDefaults(
  defineProps<{
    page?: number
    itemCount: number
    pageSize: number
    pageSlot?: number
  }>(),
  {
    page: 1,
    pageSlot: 7,
  }
)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(props.itemCount / props.pageSize))
)

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = props.page
  const slot = props.pageSlot

  if (total <= slot) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = [1]
  const half = Math.floor((slot - 2) / 2)
  let start = Math.max(2, current - half)
  let end = Math.min(total - 1, current + half)

  if (current - half < 2) {
    end = Math.min(total - 1, slot - 2)
  }
  if (current + half > total - 1) {
    start = Math.max(2, total - slot + 3)
  }

  if (start > 2) pages.push('...')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('...')
  pages.push(total)

  return pages
})

function goTo(p: number) {
  if (p >= 1 && p <= totalPages.value) {
    emit('update:page', p)
  }
}
</script>

<style scoped lang="scss">
.fnb-pagination {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
  justify-content: center;
}

.fnb-pagination__btn {
  @include fnb-border-sm;
  @include fnb-shadow-xs;
  @include fnb-press;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 0.5rem;
  background: var(--fnb-surface);
  font-weight: 700;
  font-family: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  border-radius: var(--fnb-radius-sm);

  &--active {
    background: var(--fnb-brand);
    color: #fff;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    pointer-events: none;
  }
}

.fnb-pagination__ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  height: 2.25rem;
  color: var(--fnb-text-muted);
}
</style>
```

- [ ] **Step 4: Create `FnbTabs.vue`**

```vue
<template lang="pug">
.fnb-tabs
  .fnb-tabs__nav
    button.fnb-tabs__tab(
      v-for='tab in tabs'
      :key='tab.key'
      :class='{ "fnb-tabs__tab--active": modelValue === tab.key }'
      @click='$emit("update:modelValue", tab.key)'
    ) {{ tab.label }}
  .fnb-tabs__panel(v-for='tab in tabs' :key='tab.key' v-show='modelValue === tab.key')
    slot(:name='`panel-${tab.key}`')
</template>

<script lang="ts" setup>
defineEmits<{
  'update:modelValue': [value: string]
}>()

defineProps<{
  modelValue?: string
  tabs: { key: string; label: string }[]
}>()
</script>

<style scoped lang="scss">
.fnb-tabs__nav {
  display: flex;
  border-bottom: 3px solid var(--fnb-border);
  gap: 0;
}

.fnb-tabs__tab {
  flex: 1;
  padding: 0.75rem 1rem;
  background: var(--fnb-surface);
  border: none;
  border-bottom: 3px solid transparent;
  margin-bottom: -3px;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 150ms;
  color: var(--fnb-text-muted);

  &:hover {
    background: var(--fnb-bg);
  }

  &--active {
    color: var(--fnb-text);
    border-bottom-color: var(--fnb-brand);
    background: var(--fnb-surface);
  }
}
</style>
```

- [ ] **Step 5: Commit**

```bash
git add app/components/ui/FnbInput.vue app/components/ui/FnbSelect.vue app/components/ui/FnbPagination.vue app/components/ui/FnbTabs.vue
git commit -m "feat: form and navigation components — FnbInput, FnbSelect, FnbPagination, FnbTabs"
```

---

### Task 4: Feedback Components — FnbDialog, FnbToast, FnbProvider, Composables

**Files:**
- Create: `app/components/ui/FnbDialog.vue`
- Create: `app/components/ui/FnbToast.vue`
- Create: `app/components/ui/FnbProvider.vue`
- Create: `app/composables/useDialog.ts`
- Create: `app/composables/useToast.ts`

**Interfaces:**
- Consumes: `fnb-*` SCSS mixins
- Produces: `useDialog()` returning `{ open(options): Promise<boolean>, close(): void }` where options are `{ title: string, content: string, positiveText?: string, negativeText?: string }`; `useToast()` returning `{ info(msg), success(msg), warning(msg), error(msg) }` each taking a string; `<FnbProvider>` that wraps app root and mounts Dialog + Toast containers; `<FnbDialog>` internal component; `<FnbToast>` internal component

- [ ] **Step 1: Create `useToast.ts` composable**

```typescript
// app/composables/useToast.ts
import { ref, type Component } from 'vue'

export interface ToastItem {
  id: number
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

const toasts = ref<ToastItem[]>([])
let nextId = 0

function addToast(message: string, type: ToastItem['type'], duration = 3000) {
  const id = nextId++
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, duration)
}

export function useToast() {
  return {
    info: (msg: string) => addToast(msg, 'info'),
    success: (msg: string) => addToast(msg, 'success'),
    warning: (msg: string) => addToast(msg, 'warning'),
    error: (msg: string) => addToast(msg, 'error'),
  }
}

export function useToastState() {
  return { toasts }
}
```

- [ ] **Step 2: Create `useDialog.ts` composable**

```typescript
// app/composables/useDialog.ts
import { ref } from 'vue'

export interface DialogOptions {
  title: string
  content: string
  positiveText?: string
  negativeText?: string
}

interface DialogState extends DialogOptions {
  resolve: (value: boolean) => void
}

const dialogState = ref<DialogState | null>(null)

export function useDialog() {
  return {
    open(options: DialogOptions): Promise<boolean> {
      return new Promise((resolve) => {
        dialogState.value = { ...options, resolve }
      })
    },
    close() {
      if (dialogState.value) {
        dialogState.value.resolve(false)
        dialogState.value = null
      }
    },
  }
}

export function useDialogState() {
  return {
    dialogState,
    confirm() {
      if (dialogState.value) {
        dialogState.value.resolve(true)
        dialogState.value = null
      }
    },
    cancel() {
      if (dialogState.value) {
        dialogState.value.resolve(false)
        dialogState.value = null
      }
    },
  }
}
```

- [ ] **Step 3: Create `FnbToast.vue`**

```vue
<template lang="pug">
Teleport(to='body')
  TransitionGroup.fnb-toast-container(name='toast' tag='div')
    .fnb-toast(
      v-for='toast in toasts'
      :key='toast.id'
      :class='`fnb-toast--${toast.type}`'
    ) {{ toast.message }}
</template>

<script lang="ts" setup>
import { useToastState } from '~/composables/useToast'

const { toasts } = useToastState()
</script>

<style scoped lang="scss">
.fnb-toast-container {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  pointer-events: none;
}

.fnb-toast {
  @include fnb-border-sm;
  @include fnb-shadow-sm;
  padding: 0.75rem 1.5rem;
  font-weight: 700;
  pointer-events: auto;
  max-width: 80vw;

  &--info {
    background: var(--fnb-surface);
  }

  &--success {
    background: var(--fnb-success);
  }

  &--warning {
    background: var(--fnb-highlight);
  }

  &--error {
    background: var(--fnb-danger);
    color: #fff;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: transform 250ms ease-out, opacity 250ms ease-out;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
```

- [ ] **Step 4: Create `FnbDialog.vue`**

```vue
<template lang="pug">
Teleport(to='body')
  Transition(name='dialog')
    .fnb-dialog-overlay(v-if='dialogState' @click.self='cancel')
      .fnb-dialog
        .fnb-dialog__header {{ dialogState.title }}
        .fnb-dialog__body {{ dialogState.content }}
        .fnb-dialog__footer
          FnbButton(v-if='dialogState.negativeText' @click='cancel') {{ dialogState.negativeText }}
          FnbButton(variant='primary' @click='confirm') {{ dialogState.positiveText || '确定' }}
</template>

<script lang="ts" setup>
import { useDialogState } from '~/composables/useDialog'

const { dialogState, confirm, cancel } = useDialogState()
</script>

<style scoped lang="scss">
.fnb-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
}

.fnb-dialog {
  @include fnb-border;
  @include fnb-shadow-lg;
  background: var(--fnb-surface);
  padding: 1.5rem;
  width: 400px;
  max-width: 86vw;
}

.fnb-dialog__header {
  font-family: var(--fnb-font-display);
  font-weight: 900;
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.fnb-dialog__body {
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.fnb-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 200ms ease-out;

  .fnb-dialog {
    transition: transform 200ms ease-out, opacity 200ms ease-out;
  }
}

.dialog-enter-from {
  opacity: 0;

  .fnb-dialog {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
}

.dialog-leave-to {
  opacity: 0;

  .fnb-dialog {
    opacity: 0;
    transform: scale(0.95);
  }
}
</style>
```

- [ ] **Step 5: Create `FnbProvider.vue`**

```vue
<template lang="pug">
slot
FnbDialog
FnbToast
</template>

<script lang="ts" setup>
import FnbDialog from './FnbDialog.vue'
import FnbToast from './FnbToast.vue'
</script>
```

- [ ] **Step 6: Commit**

```bash
git add app/components/ui/FnbDialog.vue app/components/ui/FnbToast.vue app/components/ui/FnbProvider.vue app/composables/useDialog.ts app/composables/useToast.ts
git commit -m "feat: feedback components — FnbDialog, FnbToast, FnbProvider, composables"
```

---

### Task 5: Specialized Components — FnbSpin, FnbProgress, FnbEllipsis, FnbMbox, FnbResult, FnbFloatButton, FnbScrollbar, FnbTable, FnbImage

**Files:**
- Create: `app/components/ui/FnbSpin.vue`
- Create: `app/components/ui/FnbProgress.vue`
- Create: `app/components/ui/FnbEllipsis.vue`
- Create: `app/components/ui/FnbMbox.vue`
- Create: `app/components/ui/FnbResult.vue`
- Create: `app/components/ui/FnbFloatButton.vue`
- Create: `app/components/ui/FnbScrollbar.vue`
- Create: `app/components/ui/FnbTable.vue`
- Create: `app/components/ui/FnbImage.vue`

**Interfaces:**
- Consumes: `fnb-*` SCSS mixins
- Produces: All specialized Fnb components. Key signatures: `<FnbSpin show>` wraps content with overlay spinner; `<FnbProgress :percentage :color>` linear progress bar; `<FnbEllipsis :line-clamp>` truncates text; `<FnbMbox type header>` message box; `<FnbResult status title description>` with `#footer` slot; `<FnbFloatButton>` floating action button with `#menu` slot; `<FnbScrollbar x-scrollable>` custom scrollbar; `<FnbTable>` simple pass-through table with styling; `<FnbImage :src :alt :preview-src>` with lightbox preview

- [ ] **Step 1: Create `FnbSpin.vue`**

```vue
<template lang="pug">
.fnb-spin(:class='{ "fnb-spin--active": show }')
  slot
  .fnb-spin__overlay(v-if='show')
    svg.spin(viewBox='0 0 24 24' :width='spinnerSize' :height='spinnerSize')
      circle(cx='12' cy='12' r='10' fill='none' stroke='currentColor' stroke-width='3' stroke-dasharray='31.4 31.4' stroke-linecap='round')
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    show?: boolean
    size?: 'small' | 'medium' | 'large'
  }>(),
  {
    size: 'medium',
  }
)

const spinnerSize = computed(() => {
  switch (props.size) {
    case 'small': return '16'
    case 'large': return '40'
    default: return '24'
  }
})
</script>

<style scoped lang="scss">
.fnb-spin {
  position: relative;
}

.fnb-spin--active > :not(.fnb-spin__overlay) {
  opacity: 0.4;
  pointer-events: none;
}

.fnb-spin__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
</style>
```

- [ ] **Step 2: Create `FnbProgress.vue`**

```vue
<template lang="pug">
.fnb-progress
  .fnb-progress__track
    .fnb-progress__fill(:style='fillStyle')
  .fnb-progress__label(v-if='showValue') {{ Math.round(percentage) }}%
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    percentage?: number
    color?: string
    height?: number
    showValue?: boolean
  }>(),
  {
    percentage: 0,
    height: 6,
  }
)

const fillStyle = computed(() => ({
  width: `${Math.min(100, Math.max(0, props.percentage))}%`,
  backgroundColor: props.color || 'var(--fnb-brand)',
  height: `${props.height}px`,
}))
</script>

<style scoped lang="scss">
.fnb-progress__track {
  @include fnb-border-sm;
  background: var(--fnb-surface);
  overflow: hidden;
}

.fnb-progress__fill {
  transition: width 300ms ease;
}

.fnb-progress__label {
  font-size: 0.75rem;
  font-weight: 700;
  text-align: center;
  margin-top: 0.25rem;
}
</style>
```

- [ ] **Step 3: Create `FnbEllipsis.vue`**

```vue
<template lang="pug">
.fnb-ellipsis(:style='ellipsisStyle')
  slot
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    lineClamp?: number
  }>(),
  {
    lineClamp: 1,
  }
)

const ellipsisStyle = computed(() => ({
  display: '-webkit-box',
  '-webkit-line-clamp': props.lineClamp,
  '-webkit-box-orient': 'vertical',
  overflow: 'hidden',
}))
</script>
```

- [ ] **Step 4: Create `FnbMbox.vue`**

```vue
<template lang="pug">
.fnb-mbox(:class='`fnb-mbox--${type}`')
  .fnb-mbox__header(v-if='header || $slots.header')
    slot(name='header') {{ header }}
  .fnb-mbox__body
    slot
  button.fnb-mbox__close(v-if='closable' @click='$emit("close")' aria-label='关闭') ×
</template>

<script lang="ts" setup>
defineEmits<{
  close: []
}>()

withDefaults(
  defineProps<{
    type?: 'info' | 'success' | 'warning' | 'error'
    header?: string
    closable?: boolean
  }>(),
  {
    type: 'info',
  }
)
</script>

<style scoped lang="scss">
.fnb-mbox {
  @include fnb-border;
  @include fnb-shadow-sm;
  padding: 1rem;
  position: relative;

  &--info {
    background: var(--fnb-surface);
  }

  &--success {
    background: var(--fnb-success);
  }

  &--warning {
    background: var(--fnb-highlight);
  }

  &--error {
    background: var(--fnb-danger);
    color: #fff;
  }
}

.fnb-mbox__header {
  font-weight: 900;
  margin-bottom: 0.5rem;
}

.fnb-mbox__close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  font-weight: 900;
  line-height: 1;
  padding: 0.25rem;
  color: inherit;
}
</style>
```

- [ ] **Step 5: Create `FnbResult.vue`**

```vue
<template lang="pug">
.fnb-result
  .fnb-result__status {{ statusEmoji }}
  .fnb-result__title(v-if='title') {{ title }}
  .fnb-result__description(v-if='description') {{ description }}
  .fnb-result__footer(v-if='$slots.footer')
    slot(name='footer')
  slot
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    status?: 'warning' | '500' | 'error' | 'info' | 'success' | '404' | '403' | '418'
    title?: string
    description?: string
  }>(),
  {
    status: 'warning',
  }
)

const statusEmoji = computed(() => {
  const map: Record<string, string> = {
    warning: '⚠',
    '500': '500',
    error: '✗',
    info: 'ℹ',
    success: '✓',
    '404': '404',
    '403': '403',
    '418': '418',
  }
  return map[props.status] || props.status
})
</script>

<style scoped lang="scss">
.fnb-result {
  text-align: center;
  padding: 2rem;
}

.fnb-result__status {
  font-family: var(--fnb-font-display);
  font-size: 4rem;
  font-weight: 900;
  line-height: 1.2;
  margin-bottom: 1rem;
}

.fnb-result__title {
  font-family: var(--fnb-font-display);
  font-size: 1.5rem;
  font-weight: 900;
  margin-bottom: 0.5rem;
}

.fnb-result__description {
  color: var(--fnb-text-muted);
  margin-bottom: 1rem;
}

.fnb-result__footer {
  margin-top: 1rem;
}
</style>
```

- [ ] **Step 6: Create `FnbFloatButton.vue`**

```vue
<template lang="pug">
.fnb-float-button(:style='positionStyle')
  button.fnb-float-button__main(@click='$emit("click", $event)' v-bind='$attrs')
    slot
  .fnb-float-button__menu(v-if='$slots.menu')
    slot(name='menu')
</template>

<script lang="ts" setup>
defineOptions({ inheritAttrs: false })

defineEmits<{
  click: [event: Event]
}>()

const props = defineProps<{
  bottom?: number
  right?: number
}>()

const positionStyle = computed(() => ({
  bottom: props.bottom ? `${props.bottom}px` : undefined,
  right: props.right ? `${props.right}px` : undefined,
}))
</script>

<style scoped lang="scss">
.fnb-float-button {
  position: fixed;
  z-index: 100;

  &:hover .fnb-float-button__menu {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
}

.fnb-float-button__main {
  @include fnb-border;
  @include fnb-shadow-sm;
  @include fnb-press;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--fnb-surface);
  cursor: pointer;
  font-size: 1.25rem;
  border-radius: var(--fnb-radius);
}

.fnb-float-button__menu {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  opacity: 0;
  pointer-events: none;
  transform: translateY(4px);
  transition: all 200ms ease-out;
}
</style>
```

- [ ] **Step 7: Create `FnbScrollbar.vue`**

```vue
<template lang="pug">
.fnb-scrollbar(:class='{ "fnb-scrollbar--x": xScrollable }')
  slot
</template>

<script lang="ts" setup>
defineProps<{
  xScrollable?: boolean
}>()
</script>

<style scoped lang="scss">
.fnb-scrollbar {
  overflow: auto;

  &--x {
    overflow-x: auto;
    overflow-y: hidden;
  }

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--fnb-text-muted);
    border-radius: var(--fnb-radius-sm);

    &:hover {
      background: var(--fnb-text);
    }
  }
}
</style>
```

- [ ] **Step 8: Create `FnbTable.vue`**

```vue
<template lang="pug">
table.fnb-table
  slot
</template>

<style scoped lang="scss">
.fnb-table {
  width: 100%;
  border-collapse: collapse;

  :deep(th),
  :deep(td) {
    @include fnb-border-sm;
    padding: 0.5rem 0.75rem;
    text-align: left;
  }

  :deep(th) {
    background: var(--fnb-bg);
    font-weight: 700;
  }

  :deep(tr:hover td) {
    background: var(--fnb-bg);
  }
}
</style>
```

- [ ] **Step 9: Create `FnbImage.vue`**

```vue
<template lang="pug">
.fnb-image(@click='previewSrc ? (showPreview = true) : undefined' :class='{ "fnb-image--preview": previewSrc }')
  img.fnb-image__img(:src='src' :alt='alt' loading='lazy' @error='handleError')
Teleport(to='body')
  Transition(name='dialog')
    .fnb-image__overlay(v-if='showPreview' @click='showPreview = false')
      img(:src='previewSrc || src' :alt='alt')
</template>

<script lang="ts" setup>
const props = defineProps<{
  src: string
  alt?: string
  previewSrc?: string
  fallback?: string
}>()

const showPreview = ref(false)

function handleError(e: Event) {
  if (props.fallback) {
    ;(e.target as HTMLImageElement).src = props.fallback
  }
}
</script>

<style scoped lang="scss">
.fnb-image {
  display: inline-block;

  &--preview {
    cursor: zoom-in;
  }
}

.fnb-image__img {
  max-width: 100%;
  display: block;
}

.fnb-image__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9500;
  cursor: zoom-out;

  img {
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
  }
}
</style>
```

- [ ] **Step 10: Commit**

```bash
git add app/components/ui/
git commit -m "feat: specialized components — FnbSpin, FnbProgress, FnbEllipsis, FnbMbox, FnbResult, FnbFloatButton, FnbScrollbar, FnbTable, FnbImage"
```

---

### Task 6: Global Styles & Layout Components

**Files:**
- Modify: `app/app.vue`
- Modify: `app/components/SiteHeader.vue`
- Modify: `app/components/SiteFooter.vue`
- Modify: `app/components/SideNav/SideNav.vue`
- Modify: `app/components/SideNav/SideNavListLink.vue`
- Modify: `app/components/Card.vue`
- Modify: `app/components/SearchBox.vue`
- Modify: `app/components/ShowMore.vue`
- Delete: `app/components/NaiveuiProvider.vue`

**Interfaces:**
- Consumes: `FnbProvider`, `fnb-*` SCSS mixins, `--fnb-*` CSS variables

- [ ] **Step 1: Update `app.vue` — replace NaiveuiProvider with FnbProvider**

Replace the entire `app.vue`:

```vue
<template lang="pug">
FnbProvider
  #app-full-container(
    :data-env='siteConfig.public.siteEnv',
    :data-route-name='route.name'
  )
    SiteNoticeBanner
    SiteHeader

    main
      article
        NuxtPage(
          :transition='{ enterActiveClass: "fade-in-up", leaveActiveClass: "fade-out-down", mode: "out-in" }'
        )

    SideNav
    SiteFooter
    NProgress
</template>

<script lang="ts" setup>
import NProgress from '~/components/NProgress.vue'
import SiteHeader from '~/components/SiteHeader.vue'
import SiteFooter from '~/components/SiteFooter.vue'
import { existsSessionId, initUser } from '~/composables/userData'
import { useUserStore } from '~/stores/session'

const SideNav = defineAsyncComponent(
  () => import('~/components/SideNav/SideNav.vue')
)

const userStore = useUserStore()
const route = useRoute()
const siteConfig = useRuntimeConfig()

onMounted(async () => {
  if (!existsSessionId()) {
    console.log('No session id found. Maybe you are not logged in?')
    userStore.logout()
    return
  }
  try {
    const userData = await initUser()
    userStore.login(userData)
  } catch (err) {
    console.error('User init failed:', err)
    userStore.logout()
  }
})
</script>

<style scoped lang="scss">
#app-full-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  position: relative;
  flex: 1;

  article {
    padding-bottom: 3rem;
    z-index: 1;
  }
}
</style>
```

- [ ] **Step 2: Rewrite `SiteHeader.vue` with Neubrutalism**

Preserve all existing logic (scroll hide, dropdown, sidebar toggle). Change visual styling: 60px + 3px border, `fnb-input` search box, square avatars. Convert `<style lang="sass">` to `<style lang="scss">`.

The full file content is too large to inline completely. Key style changes:

- `.global-navbar`: height `60px`, `border-bottom: 3px solid var(--fnb-border)`, remove `border-radius: 50%` from buttons, remove `box-shadow` scroll effect
- `.search-box input`: apply `@include fnb-input`, zero border-radius
- `.avatar`: remove `border-radius: 50%`, add `@include fnb-border-sm`
- `.dropdown-content ul`: `@include fnb-border; @include fnb-shadow;` replace `border-radius: 4px; box-shadow: 0 0 4px #aaa`
- `.side-nav-toggle`: remove `border-radius: 50%`, add `border-radius: var(--fnb-radius)`, hover `background: var(--fnb-highlight)`

- [ ] **Step 3: Rewrite `SiteFooter.vue` with Neubrutalism**

Convert styles to SCSS. Key changes:
- `.global-footer`: `background-color: var(--fnb-surface)`, `color: var(--fnb-text)`, `border-top: 3px solid var(--fnb-border)`
- `h4`: `background: var(--fnb-highlight)`, `display: inline-block`, `padding: 0.2em 0.4em`
- `.bottom`: `background-color: var(--fnb-bg)`
- Links: `color: var(--fnb-text)`, hover adds `background: var(--fnb-highlight)`, `padding: 0 0.2em`

- [ ] **Step 4: Rewrite `SideNav/SideNav.vue` with Neubrutalism**

Convert styles to SCSS. Key changes:
- `.inner`: `border-right: 3px solid var(--fnb-border)`, remove rounded search box shadow
- Link hover: `background: var(--fnb-highlight)`
- `.search-box`: remove `border-radius: 2em`, `box-shadow`

- [ ] **Step 5: Update `Card.vue` with Neubrutalism**

```vue
<template lang="pug">
.card
  h2(:id='title' v-if='title') {{ title }}
  .inner
    slot
</template>

<script lang="ts" setup>
defineProps<{ title: string | undefined }>()
</script>

<style scoped lang="scss">
.inner {
  @include fnb-card;
  padding: 1rem;
}
</style>
```

- [ ] **Step 6: Update `SearchBox.vue` with Neubrutalism**

Convert styles to SCSS. Key change: replace `border-radius: 2em` with `border-radius: var(--fnb-radius-sm)`, apply `@include fnb-input` to input.

- [ ] **Step 7: Update `ShowMore.vue` with Neubrutalism**

Convert styles to SCSS. Replace `.show-more a` style: remove `border-radius: 4px`, apply `@include fnb-btn`.

- [ ] **Step 8: Delete `NaiveuiProvider.vue`**

```bash
rm app/components/NaiveuiProvider.vue
```

- [ ] **Step 9: Verify layout with dev server**

```bash
pnpm dev
```

Check: header, footer, sidebar render with Neubrutalism styling. Pages may still have broken naive-ui component references.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: global styles and layout — header, footer, sidebar, card Neubrutalism adaptation"
```

---

### Task 7: Business Component Migration

**Files:**
- Modify: `app/components/Artwork/ArtworkCard.vue`
- Modify: `app/components/Artwork/ArtworkList.vue`
- Modify: `app/components/Artwork/ArtworkListByUser.vue`
- Modify: `app/components/ArtTag.vue`
- Modify: `app/components/AuthorCard.vue`
- Modify: `app/components/FollowUserCard.vue`
- Modify: `app/components/Comment/CommentArea.vue`
- Modify: `app/components/ErrorPage.vue`
- Modify: `app/components/SiteNoticeBanner.vue`
- Modify: `app/components/UgoiraViewer.vue`

**Interfaces:**
- Consumes: All Fnb* components and composables from Tasks 2-5

Each component needs: (1) remove naive-ui imports, (2) replace naive-ui components with Fnb* equivalents in template, (3) convert `<style lang="sass">` to `<style lang="scss">`, (4) apply Neubrutalism styles.

- [ ] **Step 1: Migrate `ArtworkCard.vue`**

- Remove `import { NSkeleton } from 'naive-ui'`
- Replace `NSkeleton` with `FnbSkeleton` in template (auto-imported)
- Convert styles to SCSS
- Replace `border-radius: 8px` on `.artwork-image` with `border-radius: var(--fnb-radius)`
- Add `@include fnb-border` to `.artwork-image`
- Replace hover scale with `@include fnb-press` on the card container
- Replace `border-radius: 50%` on `.restrict` with `border-radius: var(--fnb-radius-sm)`
- Replace `border-radius: 50%` on `.author .avatar` with `border-radius: var(--fnb-radius-sm)`, add `@include fnb-border-sm`
- Replace `border-radius: 4px` on `.page-count` and `.bookmark` with `border-radius: var(--fnb-radius-sm)`

- [ ] **Step 2: Migrate `ArtworkList.vue`**

- Remove `import { NScrollbar } from 'naive-ui'`
- Replace `:is='inline ? NScrollbar : "ul"'` with `:is='inline ? "div" : "ul"'` and add class `fnb-scrollbar--x` when inline
- Import `FnbScrollbar` is not needed since we use a simple div with overflow styles
- Convert styles to SCSS

- [ ] **Step 3: Migrate `ArtworkListByUser.vue`**

- Remove `import { NPagination } from 'naive-ui'`
- Replace `NPagination` with `FnbPagination` (auto-imported), update prop names: `:item-count` → `:item-count`, `:page-size` → `:page-size`, `v-model:page` → `:page` + `@update:page`
- Replace `NFlex` with native `div.flex.justify-center.align-center` (flexbox utility classes)
- Convert styles to SCSS

- [ ] **Step 4: Migrate `ArtTag.vue`**

```vue
<template lang="pug">
FnbTag.artwork-tag(
  @click='$router.push(`/search/${encodeURIComponent(tag)}/1`)'
  clickable
) {{ '#' }}{{ tag }}
</template>

<script lang="ts" setup>
defineProps<{ tag: string }>()
</script>

<style scoped lang="scss">
.artwork-tag {
  margin: 2px;
}
</style>
```

- [ ] **Step 5: Migrate `AuthorCard.vue`**

- Remove `import { NButton, NEllipsis, NSkeleton } from 'naive-ui'`
- Replace `NButton` → `FnbButton`, `NEllipsis` → `FnbEllipsis`, `NSkeleton` → `FnbSkeleton`
- Map NButton props: `round` (remove, not needed), `secondary` (remove), `size='small'` → `size='sm'`, `:type='...'` → `:variant='...'`
- Map NEllipsis props: `:line-clamp='3'` → `:line-clamp='3'`
- Convert styles to SCSS, replace `border-radius: 50%` on avatar

- [ ] **Step 6: Migrate `FollowUserCard.vue`**

Same pattern as AuthorCard: replace NButton/NEllipsis/NSkeleton with Fnb counterparts. Convert styles to SCSS.

- [ ] **Step 7: Migrate `CommentArea.vue`**

- Remove `import { NButton } from 'naive-ui'`
- Replace `NButton` with `FnbButton`: `round secondary size='small'` → `size='sm'`
- Convert styles to SCSS

- [ ] **Step 8: Migrate `ErrorPage.vue`**

- Remove `import { NResult } from 'naive-ui'`
- Replace `NResult` with `FnbResult`: same props (`:description`, `:status`, `:title`), `#footer` slot stays
- Convert styles to SCSS

- [ ] **Step 9: Migrate `SiteNoticeBanner.vue`**

- Replace `NAlert` with `FnbMbox`: `type='warning'` stays, `title='全站公告'` → `header='全站公告'`, `closable` stays, `@close` → `@close`
- Replace `NUl`/`NLi` with native `ul`/`li`
- Convert styles to SCSS

- [ ] **Step 10: Migrate `UgoiraViewer.vue`**

- Remove `import { NSpin, NIcon, NFloatButton, useMessage, NProgress } from 'naive-ui'`
- Replace `useMessage()` with `useToast()` from `~/composables/useToast`
- Replace `message.warning(...)` with `toast.warning(...)`, `message.error(...)` with `toast.error(...)`
- Replace `NProgress` with `FnbProgress`: `:percentage`, `:height` stay; remove `show-value`, `status`, `type`, `transition` (handled internally)
- Replace `NFloatButton` with `FnbFloatButton`: `:bottom`, `:right` stay; `shape='circle'` remove
- Replace `NSpin` with inline spinner SVG or `FnbSpin` (for the small inline usages, use the spinner SVG directly)
- Replace `NIcon` with direct icon component usage (NIcon was just a wrapper)
- Convert styles to SCSS, replace `border-radius: 4px` with `border-radius: var(--fnb-radius)`

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: migrate all business components from naive-ui to Fnb"
```

---

### Task 8: Page Migration

**Files:**
- Modify: `app/pages/index.vue`
- Modify: `app/pages/login.vue`
- Modify: `app/pages/[...slug].vue`
- Modify: `app/pages/artworks/[id].vue`
- Modify: `app/pages/users/[id]/index.vue`
- Modify: `app/pages/search/[keyword]/[p].vue`
- Modify: `app/pages/ranking.vue`

**Interfaces:**
- Consumes: All Fnb* components from Tasks 2-5

- [ ] **Step 1: Migrate `index.vue`**

- Remove `import { NH2, NButton, NIcon, NModal } from 'naive-ui'`
- Replace `NModal` → use `FnbDialog` or a simple `FnbCard` in a `Teleport` overlay. Since the index page modal shows a card with background image info, use a custom dialog approach: `Teleport(to='body')` with a `Transition` and `.fnb-dialog-overlay` wrapping a `FnbCard`.
- Replace `NH2` → native `h2`
- Replace `NButton` → `FnbButton`: `round secondary size='small'` → `size='sm'`
- Replace `NIcon` → remove wrapper, use icon component directly
- Replace `NSpace` → native flex div
- Replace `NTag` → `FnbTag` with `clickable` prop
- Convert styles from `<style lang="sass">` to `<style lang="scss">`
- Replace `border-radius: 8px` in `.bg-info-modal .thumb` with `border-radius: var(--fnb-radius)`

- [ ] **Step 2: Migrate `login.vue`**

- Remove `import { NButton, NForm, NFormItem, NInput } from 'naive-ui'`
- Replace `NForm` → native `form`
- Replace `NFormItem` → custom form-item div with label + feedback message
- Replace `NInput` → `FnbInput`: `v-model:value` → `v-model`
- Replace `NButton` → `FnbButton`: `block` → add `style='width: 100%'`, `type='primary'` → `variant='primary'`, `type='error'` → `variant='danger'`
- Convert styles to SCSS, replace `border-radius: 4px` and `box-shadow: var(--theme-box-shadow)` with `@include fnb-card`

- [ ] **Step 3: Migrate `[...slug].vue`**

```vue
<template lang="pug">
#error-view
  ErrorPage(
    description='啊咧？啊咧咧——？！页面跑丢了！！！'
    status='404'
    title='404 Not Found'
  )
    RouterLink(to='/'): FnbButton(variant='primary') Take me home
</template>

<script lang="ts" setup>
import ErrorPage from '~/components/ErrorPage.vue'
</script>
```

- [ ] **Step 4: Migrate `artworks/[id].vue`**

- Remove `import { NButton, NSkeleton } from 'naive-ui'`
- Replace all `NSkeleton` → `FnbSkeleton`: same props (`:height`, `:width`, `circle`, `text`, `block`, `:repeat`); remove `:sharp='false'` (no longer applies)
- Replace `NButton` → `FnbButton`: `tag='a'` + `href` → `tag='a'` + `href`, `size='small'` → `size='sm'`, `icon-placement='right'` → move icon slot after text
- Convert styles to SCSS
- Replace `border-radius: 6px` on `.stat-item` with `border-radius: var(--fnb-radius-sm)`

- [ ] **Step 5: Migrate `users/[id]/index.vue`**

The most complex page. Changes:
- Remove `import { NButton, NEmpty, NImage, NModal, NSkeleton, NTabPane, NTable, NTabs } from 'naive-ui'`
- Replace `NSkeleton` → `FnbSkeleton`
- Replace `NButton` → `FnbButton`: `round size='small'` → `size='sm'`, `:type='"success"'` → `:variant='"success"'`
- Replace `NModal` → inline dialog using Teleport + FnbCard + overlay
- Replace `NImage` → `FnbImage`: `:preview-src` → `:preview-src`, `:src` → `:src`
- Replace `NTable` → `FnbTable`
- Replace `NTabs`/`NTabPane` → `FnbTabs` with `#panel-{key}` slots. Restructure: move tab pane contents into named slots
- Replace `NEmpty` → simple div with text: `.fnb-empty {{ description }}`
- Convert styles to SCSS
- Replace `border-radius: 50%` on `.avatar-area img` with square + `@include fnb-border-sm`
- Remove `:deep(.n-tabs)` and `:deep(.n-empty)` CSS overrides

- [ ] **Step 6: Migrate `search/[keyword]/[p].vue`**

- Remove `import { NButton, NSpin } from 'naive-ui'`
- Replace `NSpin` → `FnbSpin`: `:show` prop stays
- Replace `NCard` → `FnbCard` (or simple div since it's just a container)
- Replace `NEmpty` → simple text div
- Replace `NPagination` → `FnbPagination`: `v-model:page` → `:page` + `@update:page`, `:item-count` and `:page-size` stay
- Convert styles to SCSS, remove `border-radius: 2em` on `.search-box`

- [ ] **Step 7: Verify `ranking.vue`**

This page does not import naive-ui directly. Just convert `<style scoped lang="sass">` to `<style scoped lang="scss">`.

- [ ] **Step 8: Verify all pages load in dev server**

```bash
pnpm dev
```

Navigate to: `/`, `/ranking`, `/login`, `/about`, `/search/test/1`, `/artworks/123`, `/users/123`, `/nonexistent-page`

Check each page renders without console errors related to missing components.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: migrate all pages from naive-ui to Fnb components"
```

---

### Task 9: Cleanup & Final Verification

**Files:**
- Modify: `package.json` (verify deps removed)
- Verify: No remaining naive-ui references in codebase

- [ ] **Step 1: Verify no naive-ui references remain**

```bash
grep -rn 'naive-ui\|naive_ui\|NaiveUi\|naiveui' app/ --include='*.vue' --include='*.ts' | grep -v node_modules | grep -v '.d.ts'
```

Expected: zero results. If any found, fix them.

- [ ] **Step 2: Verify no old theme CSS variables remain in component styles**

```bash
grep -rn 'theme-accent-color\|theme-background-color\|theme-text-color\|theme-link-color\|theme-box-shadow\|theme-tag-color\|theme-bookmark-color\|theme-secondary-color\|theme-border-color\|theme-danger-color\|theme-text-shadow' app/ --include='*.vue' --include='*.scss' | grep -v node_modules
```

Any hits should be migrated to `--fnb-*` equivalents. Map:
- `--theme-accent-color` → `var(--fnb-brand)`
- `--theme-background-color` → `var(--fnb-surface)`
- `--theme-text-color` → `var(--fnb-text)`
- `--theme-link-color` → `var(--fnb-brand)`
- `--theme-box-shadow` → `var(--fnb-shadow-sm)` or `@include fnb-shadow-sm`
- `--theme-tag-color` → `var(--fnb-bg)`
- `--theme-bookmark-color` → `var(--fnb-bookmark)`
- `--theme-danger-color` → `var(--fnb-danger)`
- `--theme-border-color` → `var(--fnb-text-muted)`
- `--theme-secondary-color` → `var(--fnb-accent)`

- [ ] **Step 3: Run `pnpm install` to clean lock file**

```bash
pnpm install
```

Verify naive-ui and related packages are no longer in `node_modules`.

- [ ] **Step 4: Run production build**

```bash
pnpm build
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Full visual verification with dev server**

```bash
pnpm dev
```

Walk through every page and verify:
- Global: page background has grid texture, fonts load (Archivo Black, Noto Sans SC), zero border-radius everywhere
- Header: blue background, 3px bottom border, square search box, square avatar
- Footer: white background, 3px top border, yellow marker h4 titles
- SideNav: white panel, 3px right border, yellow hover on links
- Home: hero section, FnbButton for refresh, FnbTag for tags
- Search: FnbPagination, FnbSpin overlay
- Artwork detail: FnbSkeleton loading, FnbButton link, tags, author card
- User profile: FnbTabs, FnbPagination, square avatar, follow FnbButton
- Login: FnbInput, FnbButton, form layout
- Error pages: FnbResult display
- 404: FnbButton "Take me home"

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: cleanup — remove naive-ui remnants, migrate old CSS variables"
```

- [ ] **Step 7: Update CLAUDE.md to reflect new architecture**

Update the "Key Dependencies" section in `CLAUDE.md` to remove naive-ui and add the Fnb component system description. Update "Code Style" section to reflect SCSS migration.

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for Neubrutalism design system"
```
