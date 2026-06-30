# 暗色主题 + 三态切换 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 PixivNow 增加暗色主题与「亮/暗/跟随系统」三态切换，保持新粗野主义视觉风格。

**Architecture:** 用 `@vueuse/core` 的 `useColorMode`（经 `@vueuse/nuxt` 自动导入）在 `<html>` 写 `light`/`dark` class 并持久化；CSS 变量体系在 `:root`（亮，保持现有精确值）与 `html.dark`（暗覆盖）两套取值；暗色下把签名「黑边框+硬黑阴影」反转为浅色。散落硬编码颜色中"真正参与主题"的收进 `--fnb-*`（设计系统）/ `--pixiv-*`（业务语义）变量；图片之上的黑蒙版/白字/文字阴影等媒体处理保留字面值。

**Tech Stack:** Nuxt 4 (SPA, SSR off), Vue 3, TypeScript, Pinia, SCSS, Pug templates, @vueuse/core 14.x, @tabler/icons-vue。

## Global Constraints

- 无测试 / lint 框架。每个任务的验证 = `pnpm build` 通过 + 暗色目视检查（无单元测试）。
- 亮色（`:root`）取值必须**保持与现有完全一致**，不得改变现有外观。
- Prettier 风格：无分号、单引号、2 空格缩进、es5 尾逗号。
- Vue 模板用 Pug（`lang="pug"`），样式用 SCSS（`lang="scss"`）。
- 注释用英文（沿用现有注释语言）。
- 不新增依赖（`@vueuse/*` 与 `@tabler/icons-vue` 均已安装）；不引入 `@nuxtjs/color-mode`。
- 媒体类字面值（图片之上的黑蒙版 `rgba(0,0,0,*)`、白文字/文字阴影、carousel `#000` 背景、装饰性白色 sheen）**保留不动**。
- 变量前缀：`--fnb-*`=设计系统通用 UI 语义；`--pixiv-*`=Pixiv 业务语义（R18/AI/原创标）。

---

## 变量调色板（Task 1 建立，后续任务引用）

### `--fnb-*` 设计系统（`:root` 亮 / `html.dark` 暗）

现有保留（亮色值不变），**暗色覆盖**：

| 变量 | 亮（现有，不变） | 暗（新增覆盖） |
|------|------------------|----------------|
| `--fnb-bg` | `#EEF2FF` | `#14151b` |
| `--fnb-surface` | `#fff` | `#1e222b` |
| `--fnb-text` | `#1a1a1a` | `#eef0f3` |
| `--fnb-text-muted` | `#666` | `#9aa1ac` |
| `--fnb-border` | `#000` | `#e6e6e6` |

品牌/语义色（`--fnb-brand` `--fnb-brand-hover` `--fnb-accent` `--fnb-success` `--fnb-highlight` `--fnb-danger` `--fnb-bookmark`）在暗色下**保持不变**（鲜艳色在深底可读），无需 dark 覆盖。

阴影 `--fnb-shadow*` 定义不变（已用 `var(--fnb-border)`，随边框自动反转为浅色）。

**新增变量**（亮 / 暗）：

| 变量 | 亮 | 暗 | 用途 |
|------|----|----|------|
| `--fnb-bg-alt` | `#f0f0f0` | `#1d2029` | 备用底色（替换 login.vue 的 `--fnb-bg-alt` fallback） |
| `--fnb-on-brand` | `#fff` | `#fff` | 实心彩色 UI 元素上的前景文字（恒浅色） |
| `--fnb-skeleton` | `#e8e8e8` | `#2a2e38` | 骨架屏/占位/代码块等中性填充 |
| `--fnb-divider` | `#dedede` | `#343a45` | 分隔线/弱边框/选中环 |
| `--fnb-grid-line` | `rgba(0, 0, 0, 0.03)` | `rgba(255, 255, 255, 0.04)` | body 网格背景描线 |
| `--fnb-silver` | `#d1d5db` | `#d1d5db` | 排行银牌 |
| `--fnb-bronze` | `#f0b27a` | `#f0b27a` | 排行铜牌 |

### `--pixiv-*` 业务语义（`:root` 亮 / `html.dark` 暗）

| 变量 | 亮 | 暗 | 用途 |
|------|----|----|------|
| `--pixiv-original` | `#e02080` | `#ff4fa3` | 原创作品标 |
| `--pixiv-r18-text` | `#c00` | `#ff6b6b` | R18 限制文字 |
| `--pixiv-ai-text` | `#c70` | `#e0a44b` | AI 限制文字 |
| `--pixiv-r18-badge` | `rgba(255, 0, 0, 0.8)` | `rgba(255, 0, 0, 0.8)` | R18 徽章底 |
| `--pixiv-ai-badge` | `rgba(204, 102, 0, 0.8)` | `rgba(204, 102, 0, 0.8)` | AI 徽章底 |

### 保留字面值（不收变量，媒体/装饰类）

`_formats.scss:95` `rgba(255,255,255,0.25)`；`Placeholder.vue:14` stroke `#3697e7`；`UgoiraViewer.vue:279` `rgba(150,150,150,0.25)`；`ArtworkCard.vue:157/197/216/233` 及 `:171/188/232/244/268` 图片上的 `#fff`/黑蒙版；`ArtworkLargeCard.vue:101/102/113/170` 图片上的 `#fff`/蒙版；`RankingCarousel.vue:98/123/142/158/165/197/202/203/231/244` 全部（carousel 图片层）；`index.vue:288/289/298/338/339/340/363/502` hero 图片层；`Comment.vue:148`（若为图片层则保留，见 Task 7 判定）。

---

## Task 1: 建立变量调色板与主题骨架

**Files:**
- Modify: `app/assets/styles/_variables.scss`（整体重写为分区结构）
- Modify: `app/assets/styles/index.scss:19-24`（body 背景网格用 `--fnb-grid-line`）

**Interfaces:**
- Produces: 上述全部 `--fnb-*` / `--pixiv-*` CSS 变量；`html.dark` 选择器约定（与 `useColorMode` 默认 class 行为一致）。

- [ ] **Step 1: 重写 `_variables.scss`**

完整替换文件内容为：

```scss
// app/assets/styles/_variables.scss

// ============================================================
// Design system tokens (--fnb-*)
// ============================================================
:root {
  // Colors
  --fnb-bg: #eef2ff;
  --fnb-bg-alt: #f0f0f0;
  --fnb-brand: #4993ff;
  --fnb-brand-hover: #6aabff;
  --fnb-accent: #a78bfa;
  --fnb-success: #7fd957;
  --fnb-highlight: #ffe066;
  --fnb-danger: #ff5555;
  --fnb-bookmark: #ff69b4;
  --fnb-border: #000;
  --fnb-surface: #fff;
  --fnb-text: #1a1a1a;
  --fnb-text-muted: #666;
  --fnb-on-brand: #fff;
  --fnb-skeleton: #e8e8e8;
  --fnb-divider: #dedede;
  --fnb-grid-line: rgba(0, 0, 0, 0.03);
  --fnb-silver: #d1d5db;
  --fnb-bronze: #f0b27a;

  // Border radius
  --fnb-radius: 0;
  --fnb-radius-sm: 0;
  --fnb-radius-lg: 0;

  // Typography
  --fnb-font-sans: 'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', system-ui, sans-serif;
  --fnb-font-display: 'Archivo Black', 'Noto Sans SC', system-ui, sans-serif;
  --fnb-font-mono: 'Space Grotesk', ui-monospace, monospace;

  // Shadows (track --fnb-border, so they auto-invert in dark mode)
  --fnb-shadow: 6px 6px 0 0 var(--fnb-border);
  --fnb-shadow-sm: 4px 4px 0 0 var(--fnb-border);
  --fnb-shadow-lg: 8px 8px 0 0 var(--fnb-border);
  --fnb-shadow-xs: 3px 3px 0 0 var(--fnb-border);
  --fnb-shadow-active: 6px 6px 0 0 var(--fnb-brand);

  // ============================================================
  // Project tokens (--pixiv-*)
  // ============================================================
  --pixiv-original: #e02080;
  --pixiv-r18-text: #c00;
  --pixiv-ai-text: #c70;
  --pixiv-r18-badge: rgba(255, 0, 0, 0.8);
  --pixiv-ai-badge: rgba(204, 102, 0, 0.8);
}

// ============================================================
// Dark theme overrides
// ============================================================
html.dark {
  // Design system
  --fnb-bg: #14151b;
  --fnb-bg-alt: #1d2029;
  --fnb-border: #e6e6e6;
  --fnb-surface: #1e222b;
  --fnb-text: #eef0f3;
  --fnb-text-muted: #9aa1ac;
  --fnb-skeleton: #2a2e38;
  --fnb-divider: #343a45;
  --fnb-grid-line: rgba(255, 255, 255, 0.04);

  // Project tokens
  --pixiv-original: #ff4fa3;
  --pixiv-r18-text: #ff6b6b;
  --pixiv-ai-text: #e0a44b;
}
```

- [ ] **Step 2: index.scss body 网格描线改用变量**

`app/assets/styles/index.scss` 的 body 规则，把两处 `rgba(0, 0, 0, 0.03)` 改为 `var(--fnb-grid-line)`：

```scss
body {
  background-color: var(--fnb-bg);
  background-image:
    linear-gradient(var(--fnb-grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--fnb-grid-line) 1px, transparent 1px);
  background-size: 72px 72px;
}
```

- [ ] **Step 3: 构建验证**

Run: `pnpm build`
Expected: 构建成功，无 SCSS 报错。

- [ ] **Step 4: devtools 手动验证暗色变量**

Run: `pnpm dev`，浏览器打开首页，在 devtools 控制台执行 `document.documentElement.classList.add('dark')`。
Expected: body 底色变深、网格描线变浅；页面整体进入深色底（组件未迁移处暂仍有亮色块，正常）。再执行 `...remove('dark')` 恢复。

- [ ] **Step 5: Commit**

```bash
git add app/assets/styles/_variables.scss app/assets/styles/index.scss
git commit -m "feat(theme): add fnb/pixiv color tokens with dark overrides"
```

---

## Task 2: useTheme composable

**Files:**
- Create: `app/composables/useTheme.ts`

**Interfaces:**
- Consumes: `useColorMode`（@vueuse/nuxt 自动导入）。
- Produces:
  - `useTheme()` 返回 `{ mode, setTheme }`
  - `mode: Ref<'auto' | 'light' | 'dark'>`（含 `auto`，用于高亮当前项）
  - `setTheme(value: 'auto' | 'light' | 'dark'): void`

- [ ] **Step 1: 先确认 useColorMode 14.x 行为**

Run: `sed -n '1,80p' node_modules/@vueuse/core/index.d.cts | grep -n -i colormode` 并打开对应类型定义，确认 `useColorMode` 的 `emitAuto` 选项与返回值（是否为可写 `Ref`，`auto` 是否随 `emitAuto: true` 被保留）。
Expected: 确认 `useColorMode({ emitAuto: true })` 返回可写 ref，读出可为 `'auto'`，写入 `'auto'/'light'/'dark'` 均生效，并在 `<html>` 上加对应 class。

> 若实际 API 与下方实现假设不符（例如返回 `{ store, state }` 结构），按真实签名调整实现，不要凭印象硬套。

- [ ] **Step 2: 写 composable**

```ts
// app/composables/useTheme.ts
export type ThemeMode = 'auto' | 'light' | 'dark'

export function useTheme() {
  const mode = useColorMode({
    emitAuto: true,
    // useColorMode 默认在 <html> 上写 class（light/dark），auto 解析为系统值
  })

  function setTheme(value: ThemeMode) {
    mode.value = value
  }

  return { mode, setTheme }
}
```

- [ ] **Step 3: 构建验证**

Run: `pnpm build`
Expected: 构建成功，TypeScript 无报错。

- [ ] **Step 4: Commit**

```bash
git add app/composables/useTheme.ts
git commit -m "feat(theme): add useTheme composable wrapping useColorMode"
```

---

## Task 3: ThemeToggle 组件

**Files:**
- Create: `app/components/ui/ThemeToggle.vue`

**Interfaces:**
- Consumes: `useTheme()`（来自 Task 2）；`@tabler/icons-vue` 的 `IconSun` `IconMoon` `IconDeviceDesktop`。
- Produces: `<ThemeToggle />`（无 props），渲染三段分段控件，高亮当前 `mode`。

- [ ] **Step 1: 写组件**

新粗野主义方角分段控件，复刻 `fnb-tabs__nav` 视觉语言（硬边框、激活段填 `--fnb-brand`）：

```vue
<template lang="pug">
.theme-toggle(role='group' aria-label='主题切换')
  button.theme-toggle__seg(
    v-for='opt in options'
    :key='opt.value'
    type='button'
    :class='{ "theme-toggle__seg--active": mode === opt.value }'
    :aria-label='opt.label'
    :title='opt.label'
    :aria-pressed='mode === opt.value'
    @click='setTheme(opt.value)'
  )
    component(:is='opt.icon' :size='18' stroke-width='2.5')
</template>

<script lang="ts" setup>
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-vue'
import type { ThemeMode } from '~/composables/useTheme'

const { mode, setTheme } = useTheme()

const options: { value: ThemeMode; label: string; icon: unknown }[] = [
  { value: 'light', label: '亮色', icon: IconSun },
  { value: 'dark', label: '暗色', icon: IconMoon },
  { value: 'auto', label: '跟随系统', icon: IconDeviceDesktop },
]
</script>

<style scoped lang="scss">
.theme-toggle {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  @include fnb-border-sm;
  background: var(--fnb-surface);
}

.theme-toggle__seg {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.9rem;
  height: 1.6rem;
  padding: 0;
  background: transparent;
  border: 2px solid transparent;
  color: var(--fnb-text-muted);
  cursor: pointer;
  transition: color 150ms, background 150ms;

  &:hover:not(.theme-toggle__seg--active) {
    color: var(--fnb-text);
    background: color-mix(in srgb, var(--fnb-brand) 15%, var(--fnb-surface));
  }

  &--active {
    color: var(--fnb-on-brand);
    background: var(--fnb-brand);
    border-color: var(--fnb-border);
  }
}
</style>
```

> 注：`@include fnb-border-sm` 在 SFC scoped 样式中可用，因 Nuxt 已全局注入 fnb mixins（参考其他 `ui/*.vue` 直接用 `@include fnb-border`）。实现时若 mixin 未自动可用，对照 `FnbTabs.vue` 的引入方式补 `@use`。

- [ ] **Step 2: 构建验证**

Run: `pnpm build`
Expected: 构建成功。

- [ ] **Step 3: Commit**

```bash
git add app/components/ui/ThemeToggle.vue
git commit -m "feat(theme): add ThemeToggle segmented control"
```

---

## Task 4: 接入 SiteHeader 用户下拉菜单 + 迁移 SiteHeader 自身颜色

**Files:**
- Modify: `app/components/SiteHeader.vue`（模板 `.dropdown-content ul` 内新增主题行；样式迁移 #fff → `--fnb-on-brand`，brand 提取）

**Interfaces:**
- Consumes: `<ThemeToggle />`（Task 3，Nuxt 自动导入组件）。

- [ ] **Step 1: 模板加主题行**

在 `app/components/SiteHeader.vue` 的 `.dropdown-content ul` 内（第 50-90 行的 `ul` 中，建议放在「查看令牌/用户登入」项附近、登出之前），新增：

```pug
li.theme-row
  span.theme-row__label 主题
  ThemeToggle
```

- [ ] **Step 2: 模板项样式（scoped 样式块内新增）**

```scss
.theme-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.theme-row__label {
  font-weight: 700;
}
```

> 若下拉 `li` 已有统一内边距/排版，沿用之；`.theme-row` 仅补充 flex 对齐，参考相邻 `li` 现有 padding。

- [ ] **Step 3: 迁移 SiteHeader 主题色（仅 UI-on-brand，非媒体）**

navbar 背景为 `var(--fnb-brand)`，其上的白色前景属主题色，替换：

| 行 | 现值 | 改为 |
|----|------|------|
| 159 | `color: #fff;` | `color: var(--fnb-on-brand);` |
| 186 | `color: #fff;` | `color: var(--fnb-on-brand);` |
| 201 | `outline: 2px solid #fff;` | `outline: 2px solid var(--fnb-on-brand);` |
| 287 | `outline: 2px solid #fff;` | `outline: 2px solid var(--fnb-on-brand);` |
| 292 | `box-shadow: 0 0 0 2px #fff;` | `box-shadow: 0 0 0 2px var(--fnb-on-brand);` |
| 394 | `color: #fff;` | `color: var(--fnb-on-brand);` |
| 398 | `outline: 2px solid #fff;` | `outline: 2px solid var(--fnb-on-brand);` |
| 358 | `background-color: rgba(73, 147, 255, 0.1);` | `background-color: color-mix(in srgb, var(--fnb-brand) 10%, transparent);` |

第 230 行是注释（`// header sets color:#fff ...`），保留或同步措辞，不影响渲染。

> dropdown 面板背景应为 `--fnb-surface`、文字 `--fnb-text`：检查 `.dropdown-content` 现有背景是否已是 `var(--fnb-surface)`；若是硬编码白，一并改为变量（确保下拉在暗色下为深色面）。

- [ ] **Step 4: 构建 + 端到端验证（核心里程碑）**

Run: `pnpm build` 然后 `pnpm dev`。
Expected：
1. 打开用户下拉菜单，看到「主题」行 + 三段控件，当前模式高亮。
2. 点「暗色」→ `<html>` 加 `dark` class，整体进入深色；刷新后保持（localStorage）。
3. 点「跟随系统」→ 跟随 OS 偏好；切换系统深浅色实时跟随。
4. 点「亮色」→ 恢复亮色，外观与改造前一致。
5. navbar 文字/聚焦环在亮、暗下均清晰。

- [ ] **Step 5: Commit**

```bash
git add app/components/SiteHeader.vue
git commit -m "feat(theme): wire ThemeToggle into header menu, tokenize header colors"
```

---

## Task 5: 迁移 SCSS partials 与 login fallback

**Files:**
- Modify: `app/assets/styles/_animate.scss:39,42`
- Modify: `app/assets/styles/_elements.scss:78,84`
- Modify: `app/assets/styles/_formats.scss:55`
- Modify: `app/pages/login.vue:184`

**Interfaces:** Consumes Task 1 变量。

- [ ] **Step 1: 替换**

| 文件:行 | 现值 | 改为 |
|---------|------|------|
| `_animate.scss:39` | `background-color: color.adjust(#e8e8e8, $lightness: 4%);` | `background-color: color-mix(in srgb, var(--fnb-skeleton) 92%, white);` |
| `_animate.scss:42` | `background-color: #e8e8e8;` | `background-color: var(--fnb-skeleton);` |
| `_elements.scss:78` | `background: #efefef;` | `background: var(--fnb-skeleton);` |
| `_elements.scss:84` | `background-color: #efefef;` | `background-color: var(--fnb-skeleton);` |
| `_formats.scss:55` | `box-shadow: 2px 0 #dedede;` | `box-shadow: 2px 0 var(--fnb-divider);` |
| `login.vue:184` | `background: var(--fnb-bg-alt, #f0f0f0);` | `background: var(--fnb-bg-alt);` |

> `_animate.scss:39` 原用 `color.adjust(#e8e8e8, 4%)` 做 shimmer 高亮端；改为对 `--fnb-skeleton` 用 `color-mix` 提亮（SCSS 的 `color.adjust` 无法作用于运行时 CSS 变量，故用 `color-mix`）。`_formats.scss:95` 的 `rgba(255,255,255,0.25)` 保留不动（媒体 sheen）。`login.vue:184` 去掉 fallback，`--fnb-bg-alt` 已在 Task 1 全局定义。

- [ ] **Step 2: 构建验证**

Run: `pnpm build`
Expected: 成功。

- [ ] **Step 3: 目视验证**

`pnpm dev`：亮色下骨架屏闪烁动画、代码块 `pre/code` 底色、login 页背景与改造前一致；切暗色后这些区域变为深色中性填充。

- [ ] **Step 4: Commit**

```bash
git add app/assets/styles/_animate.scss app/assets/styles/_elements.scss app/assets/styles/_formats.scss app/pages/login.vue
git commit -m "feat(theme): tokenize scss partials and login background"
```

---

## Task 6: 迁移 ui/ 组件

**Files:**
- Modify: `app/components/ui/FnbButton.vue:41,51`
- Modify: `app/components/ui/FnbCard.vue:44`
- Modify: `app/components/ui/FnbMbox.vue:48`
- Modify: `app/components/ui/FnbPagination.vue:108`
- Modify: `app/components/ui/FnbSelect.vue:169`
- Modify: `app/components/ui/FnbTabs.vue:52`
- Modify: `app/components/ui/FnbToast.vue:53`
- Modify: `app/components/ui/FnbSkeleton.vue:42`

**Interfaces:** Consumes Task 1 变量。

- [ ] **Step 1: 替换**

以下均为实心彩色 UI 元素上的前景文字或占位填充：

| 文件:行 | 现值 | 改为 |
|---------|------|------|
| `FnbButton.vue:41` | `color: #fff;` | `color: var(--fnb-on-brand);` |
| `FnbButton.vue:51` | `color: #fff;` | `color: var(--fnb-on-brand);` |
| `FnbCard.vue:44` | `color: #fff;` | `color: var(--fnb-on-brand);` |
| `FnbMbox.vue:48` | `color: #fff;` | `color: var(--fnb-on-brand);` |
| `FnbPagination.vue:108` | `color: #fff;` | `color: var(--fnb-on-brand);` |
| `FnbSelect.vue:169` | `color: #fff;` | `color: var(--fnb-on-brand);` |
| `FnbTabs.vue:52` | `color: #fff;` | `color: var(--fnb-on-brand);` |
| `FnbToast.vue:53` | `color: #fff;` | `color: var(--fnb-on-brand);` |
| `FnbSkeleton.vue:42` | `background: #e0e0e0;` | `background: var(--fnb-skeleton);` |

- [ ] **Step 2: 构建验证**

Run: `pnpm build`
Expected: 成功。

- [ ] **Step 3: 目视验证**

`pnpm dev`：亮/暗下逐一查看按钮、卡片、消息框、分页、下拉、tabs、toast 激活态文字清晰；骨架占位在暗色为深灰。

- [ ] **Step 4: Commit**

```bash
git add app/components/ui/Fnb*.vue
git commit -m "feat(theme): tokenize ui component colors"
```

---

## Task 7: 迁移 卡片 / 评论 / 小说 / 发现 / Ugoira / DeferLoad

**Files:**
- Modify: `app/components/Artwork/ArtworkCard.vue`
- Modify: `app/components/Artwork/ArtworkLargeCard.vue`
- Modify: `app/components/Comment/Comment.vue`
- Modify: `app/components/Comment/CommentSubmit.vue`
- Modify: `app/components/Novel/NovelCard.vue`
- Modify: `app/components/DiscoveryTabs.vue`
- Modify: `app/components/UgoiraViewer.vue`
- Modify: `app/components/DeferLoad.vue`

**Interfaces:** Consumes Task 1 变量（`--fnb-*` 与 `--pixiv-*`）。

- [ ] **Step 1: 替换（仅主题色；媒体类保留，见下方"保留"）**

| 文件:行 | 现值 | 改为 |
|---------|------|------|
| `ArtworkCard.vue:256` | `background-color: rgb(255, 0, 0, 0.8);` | `background-color: var(--pixiv-r18-badge);` |
| `ArtworkCard.vue:261` | `background-color: rgba(204, 102, 0, 0.8);` | `background-color: var(--pixiv-ai-badge);` |
| `ArtworkCard.vue:213` | `box-shadow: 0 0 0 2px #aaa;` | `box-shadow: 0 0 0 2px var(--fnb-divider);` |
| `ArtworkLargeCard.vue:125` | `background-color: rgb(255, 0, 0, 0.8);` | `background-color: var(--pixiv-r18-badge);` |
| `ArtworkLargeCard.vue:130` | `background-color: rgba(204, 102, 0, 0.8);` | `background-color: var(--pixiv-ai-badge);` |
| `ArtworkLargeCard.vue:152` | `background-color: #d1d5db;` | `background-color: var(--fnb-silver);` |
| `ArtworkLargeCard.vue:155` | `background-color: #f0b27a;` | `background-color: var(--fnb-bronze);` |
| `Comment.vue:178` | `color: #aaa` | `color: var(--fnb-text-muted)` |
| `CommentSubmit.vue:81` | `color: #888` | `color: var(--fnb-text-muted)` |
| `NovelCard.vue:57` | `background: #eee;` | `background: var(--fnb-skeleton);` |
| `NovelCard.vue:80` | `background-color: rgba(255, 0, 0, 0.8);` | `background-color: var(--pixiv-r18-badge);` |
| `UgoiraViewer.vue:277` | `color: #999;` | `color: var(--fnb-text-muted);` |
| `DeferLoad.vue:58` | `background-color: #e8e8e8` | `background-color: var(--fnb-skeleton)` |
| `DiscoveryTabs.vue:45` | `color: #fff;` | `color: var(--fnb-on-brand);` (确认是激活 tab 实心 brand 底；若是图片上文字则保留) |
| `Comment.vue:148` | `color: #fff` | 判定：若为实心 brand/彩底徽章上文字 → `var(--fnb-on-brand)`；若叠在头像/图片上 → 保留 `#fff` |

**保留不动（媒体/装饰类，勿改）**：
`ArtworkCard.vue` 的 `:157` `rgba(255,100,100,0.2)`、`:171/188` `#fff`、`:197` `rgba(0,0,0,0.2)`、`:216` `rgba(100,100,100,0.6)`、`:232/244/268` `#fff`、`:233` `rgba(0,0,0,0.6)`；
`ArtworkLargeCard.vue` 的 `:101/113/170` `#fff`、`:102` `rgba(0,0,0,0.6)`；
`NovelCard.vue:72` `#fff`（R18 徽章上文字）；
`UgoiraViewer.vue:279` `rgba(150,150,150,0.25)`。

> `Comment.vue:148`、`DiscoveryTabs.vue:45` 两处需读各自上下文确认（实心彩底 vs 图片上）后再定，按上表判定规则执行。

- [ ] **Step 2: 构建验证**

Run: `pnpm build`
Expected: 成功。

- [ ] **Step 3: 目视验证（亮/暗）**

`pnpm dev`：作品卡（普通/大图）、R18/AI 徽章、排行银铜牌底、评论、小说卡、发现 tabs、Ugoira、懒加载占位——亮色与改造前一致；暗色下文字/分隔/占位可读，徽章业务色清晰，图片之上的蒙版与白字保持原样。

- [ ] **Step 4: Commit**

```bash
git add app/components/Artwork app/components/Comment app/components/Novel app/components/DiscoveryTabs.vue app/components/UgoiraViewer.vue app/components/DeferLoad.vue
git commit -m "feat(theme): tokenize artwork/comment/novel/misc component colors"
```

---

## Task 8: 迁移 pages

**Files:**
- Modify: `app/pages/index.vue`
- Modify: `app/pages/search.vue`
- Modify: `app/pages/ranking.vue`
- Modify: `app/pages/discovery.vue`
- Modify: `app/pages/novels/[id].vue`
- Modify: `app/pages/artworks/[id].vue`
- Modify: `app/pages/notifications/2024-04-26.vue`

**Interfaces:** Consumes Task 1 变量。

- [ ] **Step 1: 替换**

| 文件:行 | 现值 | 改为 |
|---------|------|------|
| `search.vue:301` | `color: #fff;` | `color: var(--fnb-on-brand);` (确认实心彩底；否则保留) |
| `search.vue:348` | `box-shadow: 0 0 8px #ddd;` | `box-shadow: 0 0 8px var(--fnb-divider);` |
| `ranking.vue:271` | `color: #fff;` | `color: var(--fnb-on-brand);` (确认实心彩底；否则保留) |
| `discovery.vue:136` | `color: #fff;` | `color: var(--fnb-on-brand);` (确认实心彩底；否则保留) |
| `novels/[id].vue:327` | `color: #fff;` | `color: var(--fnb-on-brand);` (确认实心彩底；否则保留) |
| `notifications/2024-04-26.vue:14` | `border: 1px solid #efefef` (inline style) | `border: 1px solid var(--fnb-divider)` |
| `artworks/[id].vue:45` | `:style='{ color: "#aaa" }'` | `:style='{ color: "var(--fnb-text-muted)" }'` |
| `artworks/[id].vue:194` | `backgroundColor: '#e8e8e8',` | `backgroundColor: 'var(--fnb-skeleton)',` |
| `artworks/[id].vue:417` | `color: #e02080;` | `color: var(--pixiv-original);` |
| `artworks/[id].vue:420` | `color: #c00;` | `color: var(--pixiv-r18-text);` |
| `artworks/[id].vue:423` | `color: #c70;` | `color: var(--pixiv-ai-text);` |
| `artworks/[id].vue:484` | `color: #fff;` | `color: var(--fnb-on-brand);` (bookmark 实心底上文字) |
| `artworks/[id].vue:486` | `color: #fff;` | `color: var(--fnb-on-brand);` |
| `artworks/[id].vue:497` | `color: #fff;` | `color: var(--fnb-on-brand);` (brand 实心底上文字) |
| `artworks/[id].vue:499` | `color: #fff;` | `color: var(--fnb-on-brand);` |
| `artworks/[id].vue:506` | `color: #aaa;` | `color: var(--fnb-text-muted);` |

**保留不动（媒体/装饰类，勿改）**：
`index.vue` 的 `:288` `#fff`、`:289` `text-shadow ... #222`、`:298` `rgba(0,0,0,0.3)`、`:338/363` `#fff`、`:339` `rgba(0,0,0,0.4)`、`:340` `rgba(255,255,255,0.5)`、`:502` `rgba(0,0,0,0.4)`（均为 hero/标签覆盖在图片之上）；
`artworks/[id].vue:411` `--bg-color: rgba(0,0,0,0.08)`（loading 蒙版）。

> `search:301`、`ranking:271`、`discovery:136`、`novels/[id].vue:327` 四处 `color:#fff` 需读上下文确认背景是实心彩色还是图片：实心彩底 → `--fnb-on-brand`；图片上 → 保留 `#fff`。`notifications/2024-04-26.vue` 与 `artworks/[id].vue:45,194` 为内联 style，CSS 变量在内联 style 中合法可用。

- [ ] **Step 2: 构建验证**

Run: `pnpm build`
Expected: 成功。

- [ ] **Step 3: 目视验证（亮/暗）**

`pnpm dev` 逐页：首页 hero、搜索、排行、发现、小说详情、作品详情（原创/R18/AI 标签、收藏/点赞按钮、日期），亮色与改造前一致；暗色下文字可读、业务标签色清晰、图片层覆盖物保持原样。

- [ ] **Step 4: Commit**

```bash
git add app/pages
git commit -m "feat(theme): tokenize page-level colors"
```

---

## Task 9: 全站双主题 QA 收尾

**Files:** 无新增改动（修复期间发现的遗漏除外）。

- [ ] **Step 1: 残留硬编码扫描**

Run:
```bash
grep -rEn '#[0-9a-fA-F]{3,8}\b|rgba?\(' app --include="*.vue" --include="*.scss" \
  | grep -v '_variables.scss' | grep -vE 'var\(--fnb|var\(--pixiv'
```
Expected: 仅剩"保留字面值"清单内的媒体/装饰项（图片蒙版、白字、文字阴影、`#3697e7`、`rgba(255,255,255,0.25)` 等）。逐条核对确属保留类；若发现漏迁的主题色，按对应映射补迁。

- [ ] **Step 2: 全站双主题目视巡检**

`pnpm dev`，亮/暗各走一遍：首页、作品详情、搜索、排行、发现、小说（列表+详情）、用户页、关注、登录、评论区。重点：
- 无遗漏亮色块 / 不可读对比度；
- 粗野硬阴影、边框在暗色下为浅色且清晰；
- 三态切换 + 刷新持久化 + 跟随系统均正常。

- [ ] **Step 3: 生产构建验证**

Run: `pnpm build`
Expected: 成功，无报错。

- [ ] **Step 4: Commit（如有收尾修复）**

```bash
git add -A
git commit -m "fix(theme): resolve dark-mode QA findings"
```

---

## Self-Review 记录

- **Spec 覆盖**：切换机制→Task 2/3/4；变量体系（fnb/pixiv，:root+html.dark，签名反转）→Task 1；硬编码迁移（全部参与主题者）→Task 5-8；入口 UI（Vercel 式布局+新粗野渲染+ThemeToggle 不复用 FnbTabs）→Task 3/4；验证→各任务 + Task 9。媒体类保留为用户最新决策，已在 Global Constraints 与各任务"保留"清单落实。
- **类型一致**：`useTheme()` 暴露 `mode` / `setTheme(ThemeMode)`，Task 3 一致引用；`ThemeMode = 'auto'|'light'|'dark'`。
- **占位扫描**：无 TBD/TODO；少数 `color:#fff` 标注"读上下文判定"附带明确判定规则（实心彩底→on-brand / 图片上→保留），非占位。
- **变量命名一致**：`--fnb-on-brand` `--fnb-skeleton` `--fnb-divider` `--fnb-grid-line` `--fnb-bg-alt` `--fnb-silver` `--fnb-bronze`；`--pixiv-original` `--pixiv-r18-text` `--pixiv-ai-text` `--pixiv-r18-badge` `--pixiv-ai-badge` 全文一致。
