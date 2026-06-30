# 暗色主题 + 三态主题切换 — 设计文档

日期：2026-06-28

## 目标

为 PixivNow 增加暗色主题，并提供「亮 / 暗 / 跟随系统」三态切换，可手动覆盖系统偏好并持久化。保持现有新粗野主义（neo-brutalism）视觉风格不变（硬边缘、粗边框、硬阴影、0 圆角）。

## 关键决策

1. **切换模式**：`light` / `dark` / `auto`（跟随系统）三态。
2. **切换入口**：SiteHeader 用户下拉菜单内，仿 Vercel 用户菜单布局——「主题」菜单行左侧文字标签 + 右侧内联紧凑三图标分段控件（太阳 / 月亮 / 显示器），渲染成项目新粗野主义风格。
3. **暗色签名元素处理**：黑边框 + 硬黑阴影在暗色下**反转为浅色边框与浅色硬阴影**，保留粗野质感。
4. **硬编码颜色**：全部收进 CSS 变量体系（~70 处 hex + 28 处 rgba）。
5. **变量前缀分层**：
   - `--fnb-*`：设计系统 / 组件库通用 UI 语义色。
   - `--pixiv-*`：仅服务 Pixiv 业务领域的语义色（R18、AI 徽章等）。

## 技术方案

### 1. 切换机制

使用 `@vueuse/core` 的 `useColorMode`（已通过 `@vueuse/nuxt` 自动导入，无需新增依赖）。

配置：

- 三态：`modes` 默认含 `light` / `dark`，启用 `auto`；设 `emitAuto: true` 以便读取时保留 `auto` 状态（用于高亮当前选项）。
- 应用方式：在 `<html>` 上写入 `class`（`dark` / `light`），`auto` 时解析为系统实际值对应的 class。
- 持久化：localStorage（useColorMode 默认行为）。
- 项目为 SSR-disabled 纯 SPA，无服务端 HTML，**不存在首屏错误主题闪烁问题**。

封装 composable `app/composables/useTheme.ts`：

- 暴露当前模式（含 `auto`）与设定方法 `setTheme(mode)`。
- 供下拉菜单及未来其他入口复用。
- 实现细节（`useColorMode` 14.x 的确切返回结构 `store` / `state` / `system` / `emitAuto` 行为）在实现时阅读 `node_modules/@vueuse/core` 源码确认，不凭印象。

### 2. 变量体系（`app/assets/styles/_variables.scss`）

单文件、两个清晰注释分区承载（不拆文件）：

- **分区 A：`--fnb-*` 设计系统**
- **分区 B：`--pixiv-*` 项目业务语义**

每个分区内：`:root` 给亮色基准值，`html.dark` 给暗色覆盖值。

#### `--fnb-*` 变量清单

现有（保留亮色值不变，补充暗色值）：

```
--fnb-bg --fnb-brand --fnb-brand-hover --fnb-accent --fnb-success
--fnb-highlight --fnb-danger --fnb-bookmark --fnb-border --fnb-surface
--fnb-text --fnb-text-muted
--fnb-shadow --fnb-shadow-sm --fnb-shadow-lg --fnb-shadow-xs --fnb-shadow-active
```

新增（亮 / 暗成对）：

| 变量 | 含义 | 亮色 | 暗色 |
|------|------|------|------|
| `--fnb-on-brand` | 彩色块上的前景文字（恒为浅色，两主题基本一致） | `#fff` | `#fff` |
| `--fnb-skeleton` | 骨架屏 / 占位灰 | 浅灰（如 `#e8e8e8`） | 深灰 |
| `--fnb-divider` | 分隔线 / 弱边框 | 浅灰（如 `#dedede`） | 深灰 |
| `--fnb-overlay` | 图片 / 卡片遮罩（rgba） | `rgba(0,0,0,.x)` | 同向加深或调整 |
| `--fnb-grid-line` | body 网格背景描线 | `rgba(0,0,0,0.03)` | `rgba(255,255,255,0.04)` 一类 |

暗色关键反转值（实现时按对比度微调，下为方向）：

- `--fnb-border`：`#000` → 浅色（近白 / 浅灰，如 `#e6e6e6`）
- `--fnb-shadow*`：基于 `--fnb-border`，自动随之变浅（mixins 已用 `var(--fnb-border)`，无需逐个改 mixin）
- `--fnb-bg`：浅蓝灰 → 深色底（如 `#15161a` 一类）
- `--fnb-surface`：`#fff` → 深色面（比 bg 略亮，区分层次）
- `--fnb-text`：`#1a1a1a` → 近白
- `--fnb-text-muted`：`#666` → 中浅灰

> 注：`--fnb-shadow*` 当前定义里硬编码方向 `6px 6px 0 0 var(--fnb-border)`，颜色已是变量，因此暗色无需重定义 shadow 变量本身，只需改 `--fnb-border`。`--fnb-shadow-active` 用 `var(--fnb-brand)`，同理自动适配。

#### `--pixiv-*` 变量清单

迁移时逐处确认归属，初步候选：

| 变量 | 来源 hex | 含义 |
|------|----------|------|
| `--pixiv-r18` | `#e02080` | R18 标签 / 警示 |
| `--pixiv-ai` | `#c70` / `#f0b27a` | AI 生成徽章 |
| （其余 Pixiv 领域强调色按实际语义命名） | `#c00` `#3697e7` 等 | 实现时定 |

### 3. 硬编码颜色迁移

逐文件将 hex / rgba 替换为变量。映射判断原则：

- `color: #fff`（彩色背景上的文字）→ `--fnb-on-brand`（**不跟随主题**）
- `background: #fff`（白色面）→ `--fnb-surface`（**跟随主题**）
- `#000`（边框 / 文字）→ `--fnb-border` 或 `--fnb-text`（按语义）
- 灰阶 → `--fnb-text-muted` / `--fnb-skeleton` / `--fnb-divider`（按用途）
- rgba 遮罩 → `--fnb-overlay`
- Pixiv 业务语义色 → 对应 `--pixiv-*`

每处替换需对照渲染语义确认（不机械按色值替换）。涉及文件（30 个）：见下方清单。

涉及文件：
`_animate.scss` `_elements.scss` `_formats.scss`，`SiteHeader.vue` `DiscoveryTabs.vue` `DeferLoad.vue` `RankingCarousel.vue` `UgoiraViewer.vue` `Placeholder.vue`，`ui/` 下 `FnbPagination/FnbSelect/FnbTabs/FnbButton/FnbCard/FnbToast/FnbMbox/FnbSkeleton.vue`，`Artwork/ArtworkCard.vue` `Artwork/ArtworkLargeCard.vue`，`Comment/CommentSubmit.vue` `Comment/Comment.vue`，`Novel/NovelCard.vue`，`pages/` 下 `login/index/search/ranking/discovery/notifications-2024-04-26.vue` `novels/[id].vue` `artworks/[id].vue`。

### 4. 切换入口 UI

位置：`SiteHeader.vue` 用户下拉菜单 `.dropdown-content ul` 内，新增一行「主题」。

布局参考：Vercel 用户下拉菜单的 Theme 行——左侧文字标签「主题」，右侧内联一个紧凑的三图标分段控件，同一菜单行内右对齐，当前模式高亮。

新建组件 `app/components/ui/ThemeToggle.vue`：

- 三段对应 `light` / `dark` / `auto`，图标用 `@tabler/icons-vue`：`IconSun` / `IconMoon` / `IconDeviceDesktop`。
- **不复用 `FnbTabs`**（它携带 panel slot，会渲染空面板留白；且仅支持文字 label）。改为新建专用小组件，但复刻 `fnb-tabs__nav` 的视觉语言：复用 `@include fnb-border` 等同一套 mixin。
- 风格：**新粗野主义方角**（非 Vercel 圆角胶囊），硬边框，激活段填 `--fnb-brand`、前景 `--fnb-on-brand`；尺寸紧凑以塞进下拉菜单单行。
- 点击调用 `useTheme` 的 `setTheme(mode)`，并按当前模式高亮对应段。

## 验证

- 手动切换三态，确认 `<html>` class 与持久化生效，刷新后保持。
- `auto` 模式下切换系统 prefers-color-scheme，确认实时跟随。
- 亮 / 暗逐页目视检查（首页、作品详情、搜索、排行、发现、小说、登录、用户页、评论），确认无遗漏色块、对比度可读、粗野阴影/边框在暗色下清晰可见。
- 无 test / lint 命令，依赖目视验证 + `pnpm build` 通过。

## 范围外（YAGNI）

- 不做主题切换动画 / 过渡特效。
- 不做多套配色方案（仅亮 / 暗）。
- 不引入 `@nuxtjs/color-mode`（`@vueuse` 已满足需求）。
