# 搜索路由重构设计文档

日期：2026-06-23

## 背景与问题

现有搜索路由 `/search/:keyword/:p`（`app/pages/search/[keyword]/[p].vue`，`name: 'search'`）存在两个问题：

1. **没有 `/search` 根路由**：用户必须先输入关键词进入搜索页（默认综合模式），才能切换其他搜索方案。直接访问 `/search` 会 404。
2. **URL 结构割裂**：keyword 与 page 在 path param，其余筛选项（`content`/`s_mode`/`order`/`mode`/`ai_type`/`lang`）在 query。同类参数被拆到两处，且需要 `middleware/route-aliases.global.ts` 把 `/search/:keyword` 补成 `/search/:keyword/1`，翻页还要在 path 里重拼 URL。

## 目标

- 改为**全 query 方案**：`/search?q=&type=&p=&mode=&s_mode=&order=&ai_type=&lang=`。
- `/search`（无 `q`）成为**落地页**，可直接选搜索方案/筛选项再输入关键词。
- 旧 URL **重定向兼容**。
- **仅路由重构**，不新增搜索类型（不加用户搜索），不改 store / pixiv-client 方法签名、不改结果渲染语义。

## 决策（已确认）

- URL 方案：全 query `/search?q=...`。
- 类型参数名：`content` → **`type`**（其余筛选键名不变）。
- 旧 URL：**302 重定向**到新方案。
- 落地空态：仅一句提示，不放热门标签/历史（YAGNI）。

## 架构设计

### 1. 路由与文件

- `git mv app/pages/search/[keyword]/[p].vue app/pages/search.vue`（保留 git 历史），再删除空的 `app/pages/search/[keyword]/` 目录。
- `app/pages/search.vue` 保留 `definePageMeta({ name: 'search' })`（`SiteHeader` 用 `$route.name !== 'search'` 隐藏自身搜索框的逻辑因此不受影响）。
- 现有文件**约 85% 直接复用**：整个 `<template>`（类型 tab、refine 筛选栏、FnbSelect、error/loading/empty/结果区、分页）、全部选项数组、`<style>`、多数 computed、store 调用方式。

### 2. query 参数模型

| 参数 | 含义 | 默认（省略不写入 URL） |
| --- | --- | --- |
| `q` | 关键词 | 无（缺省即落地态） |
| `type` | 搜索方案（artworks/illustrations/ugoira/manga/novels） | `artworks` |
| `p` | 页码 | `1` |
| `mode` | 分级 | `all` |
| `s_mode` | 匹配方式 | `s_tag` |
| `order` | 排序 | `date_d` |
| `ai_type` | AI 过滤 | `''`（含 AI） |
| `lang` | 小说语言（仅 novels） | `''` |

沿用现有「默认值不写进 URL」的清洁策略。

### 3. `search.vue` 改造点（约 15%）

1. **数据源 path→query**：`makeSearch` 从 `route.query.q` 取关键词、`route.query.p` 取页码（替代 `route.params.keyword/p`）。
2. **键名 `content`→`type`**：`selectedContent` 读 `route.query.type`；`defaults` 的键、`setQuery` 里 `'content' in updates` 的判断、类型 tab 点击 `setQuery({ type: opt.value })` 一并改名。
3. **落地态**：无 `q` 时 `makeSearch` 早返回、不调用 API；结果区显示落地提示（如「输入关键词开始搜索」），与「搜索有结果为空（没有了…）」区分开。控制栏（搜索框 + 类型 tab + 筛选项）始终显示。
4. **翻页简化**：`page` 由 `route.query.p` 驱动（computed）；`FnbPagination` 的 `@update:page` 改为 push 新 query（更新 `p`）。删除原先 `watch(page)` 里在 path 重拼 URL 的逻辑。
5. **watcher 简化**：保留 `watch(() => route.query, makeSearch, { deep: true })`（现在 keyword/page 也在 query，一个 watch 即可覆盖）；删除 `onBeforeRouteUpdate`（不再有 params）。
6. **标题**：`setTitle` 用 `route.query.q` / `route.query.p`；无 `q` 时标题为「搜索」。

`setQuery` 现有实现（删默认值、切类型重置 `s_mode`/`lang`、`delete q.p`、`router.push({ query })`）本就是 query-based，键名改名后可直接用。

### 4. 旧 URL 重定向兼容

改写 `middleware/route-aliases.global.ts` 的 search 规则：匹配 `/search/:keyword` 与 `/search/:keyword/:page`，连同原有 query，302 重定向到 `/search?q=:keyword&p=:page&...`：

- `keyword`：`decodeURIComponent` path 段后作为 `q`。
- `page`：path 段缺省为 `1`；为 `1` 时按清洁策略可省略。
- 原 query 中的 `content` 重命名为 `type`，其余键（`mode`/`s_mode`/`order`/`ai_type`/`lang`）原样保留。
- 用 `navigateTo(..., { redirectCode: 302 })`。

### 5. 内部链接更新

所有硬编码旧路由的入口改为新 query 形态：

- `SearchBox.vue`：`router.push({ path: '/search', query: { q: keyword.value } })`；保留 `id:数字` → `/artworks/:id` 快捷与空输入不动作。
- `ArtTag.vue`：`searchUrl` 改为 `/search?q=<tag>` 并合并传入的 `searchQuery`。
- `app/pages/index.vue`：随机背景 tag 的 `FnbTag` 点击改为 `/search?q=<tag>`。
- 其余引用 `/search/.../1` 的位置一并改（实现时全局 grep `"/search/"` 兜底排查）。

### 6. store / API

`app/stores/search.ts` 与 `pixiv-client` 的搜索方法**不改**（仍按 keyword 调用）。仅页面读取数据源从 params 变为 query。

## 测试与验证

- 项目无测试框架。验证以 `pnpm build`（编译 + Pug 模板）为门禁，辅以浏览器冒烟：
  - `/search` 落地页显示控制栏 + 提示、不发请求；
  - 输入关键词跳转 `/search?q=...` 并出结果；切类型/筛选/翻页 URL 与结果正确；
  - 旧 URL（`/search/:keyword`、`/search/:keyword/2?content=novels&mode=r18`）正确 302 到新方案；
  - `id:123` 快捷仍生效；从作品页/首页 tag 跳转正确。

## 不做（YAGNI）

- 不新增用户搜索或任何新搜索类型。
- 不改结果渲染、筛选项语义、store 与 API 方法签名。
- 落地页不做热门标签/搜索历史。
