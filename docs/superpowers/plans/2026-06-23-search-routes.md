# 搜索路由重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把搜索从 `/search/:keyword/:p` 改为全 query 方案 `/search?q=&type=&p=&...`，新增 `/search` 落地页，并对旧 URL 做 302 重定向兼容。

**Architecture:** `git mv` 现有搜索页到 `app/pages/search.vue`，数据源从 path param 改为 query；改写 `route-aliases.global.ts` 把旧 URL 重定向到新方案；更新所有硬编码旧路由的内部链接。store 与 pixiv-client 不动。

**Tech Stack:** Nuxt 4 / Vue 3 SFC（Pug + SCSS）/ vue-router / Pinia。

## Global Constraints

- 代码风格：无分号、单引号、2 空格缩进、es5 trailing comma。模板用 Pug，样式 SCSS。
- 客户端 SPA（SSR 已禁用）。Vue/Nuxt composable、Pinia store、`components/` 组件自动导入；`~icons/*` 需显式 import。
- **项目无测试框架**（CLAUDE.md 确认无 test/lint）。验证门禁 = `pnpm build`（编译 + Pug 模板通过）；可视化交互留最终人工浏览器冒烟。
- query 参数名：`q`（关键词）、`type`（搜索方案，原 `content`）、`p`（页码）、`mode`/`s_mode`/`order`/`ai_type`/`lang`。沿用「默认值不写入 URL」清洁策略。
- 搜索页 `definePageMeta({ name: 'search' })` 必须保留（`SiteHeader` 依赖 `$route.name !== 'search'`）。
- 编写/修改 Pug 模板注意 pug-vue-pitfalls（属性逗号分隔、`:class` 对象语法、内联表达式引号）。
- 不改 `app/stores/search.ts` 与 `pixiv-client` 搜索方法；不新增搜索类型；落地页不做热门标签/历史（YAGNI）。

---

### Task 1: 重命名并改造搜索页为全 query 方案

`git mv` 旧动态路由文件到 `app/pages/search.vue`（保留 git 历史），整文件替换为 query 驱动版本：数据源 path→query、`content`→`type`、落地空态、翻页简化、watcher 简化。

**Files:**
- Rename: `app/pages/search/[keyword]/[p].vue` → `app/pages/search.vue`（`git mv`），随后删除空目录 `app/pages/search/`
- 该文件整体覆盖为下方内容

**Interfaces:**
- Consumes: `useSearchStore()` 的 `searchArtworks(keyword, type, params)` / `searchNovels(keyword, params)` / `artworkResults` / `novelResults` / `artworkTotal` / `novelTotal` / `loading`（均已存在，不改）
- Produces: 路由 `/search`（name `search`），消费 query keys `q`/`type`/`p`/`mode`/`s_mode`/`order`/`ai_type`/`lang`

- [ ] **Step 1: `git mv` 重命名并删空目录**

```bash
cd /Users/xiaoyujun/GitRepositories/PixivNow
git mv "app/pages/search/[keyword]/[p].vue" app/pages/search.vue
rmdir "app/pages/search/[keyword]" "app/pages/search" 2>/dev/null || true
```

- [ ] **Step 2: 用 query 驱动版本整体覆盖 `app/pages/search.vue`**

```vue
<template lang="pug">
#search-view
  .body-inner
    SearchBox.big
    .search-filters
      .content-tabs
        button.content-tab(
          v-for='opt in contentOptions',
          :key='opt.value',
          :class='{ active: selectedType === opt.value }',
          @click='setQuery({ type: opt.value })'
        ) {{ opt.label }}
      .refine-bar
        .refine-field
          span.refine-label 匹配
          FnbSelect(
            :model-value='selectedSMode',
            :options='activeSModeOptions',
            @update:model-value='v => setQuery({ s_mode: v })'
          )
        .refine-field
          span.refine-label 排序
          FnbSelect(
            :model-value='selectedOrder',
            :options='orderOptions',
            @update:model-value='v => setQuery({ order: v })'
          )
        .refine-field
          span.refine-label 分级
          FnbSelect(
            :model-value='selectedMode',
            :options='modeOptions',
            @update:model-value='v => setQuery({ mode: v })'
          )
        .refine-field
          span.refine-label AI
          FnbSelect(
            :model-value='selectedAiType',
            :options='aiTypeOptions',
            @update:model-value='v => setQuery({ ai_type: v })'
          )
        .refine-field(v-if='isNovel')
          span.refine-label 语言
          FnbSelect(
            :model-value='selectedLang',
            :options='langOptions',
            @update:model-value='v => setQuery({ lang: v })'
          )

  //- Error
  section(v-if='error && !searchStore.loading')
    ErrorPage(:description='error' title='出大问题')

  //- Landing: no keyword yet
  section.search-landing(v-else-if='!hasQuery')
    .body-inner
      FnbCard(style='padding: 12vh 0; text-align: center')
        .fnb-empty 输入关键词开始搜索

  //- Result (has keyword)
  section(v-else)

    //- Loading skeleton
    .loading-area(v-if='searchStore.loading && !currentResults.length')
      ArtworkList(v-if='!isNovel', :list='[]', :loading='16')
      .body-inner(v-else)
        NovelList(:list='[]', :loading='12')

    //- Empty
    .no-more(v-if='!searchStore.loading && !currentResults.length')
      FnbCard(style='padding: 15vh 0; text-align: center')
        .fnb-empty 没有了，一滴都没有了……

    //- Results
    FnbSpin.result-area(:show='searchStore.loading', v-if='currentResults.length')
      .body-inner
        .pagenator
          FnbPagination(
            :page='page',
            :item-count='currentTotal',
            :page-size='currentResults.length',
            @update:page='goPage'
          )
        ArtworkLargeList(v-if='!isNovel', :artwork-list='searchStore.artworkResults')
        NovelList(v-else, :list='searchStore.novelResults')
        .pagenator
          FnbPagination(
            :page='page',
            :item-count='currentTotal',
            :page-size='currentResults.length',
            @update:page='goPage'
          )
</template>

<script lang="ts" setup>
definePageMeta({ name: 'search' })
import ArtworkLargeList from '~/components/Artwork/ArtworkLargeList.vue'
import ArtworkList from '~/components/Artwork/ArtworkList.vue'
import NovelList from '~/components/Novel/NovelList.vue'
import ErrorPage from '~/components/ErrorPage.vue'
import SearchBox from '~/components/SearchBox.vue'
import { useSearchStore, type SearchContentType } from '~/stores/search'
import { effect } from 'vue'
import { setTitle } from '~/utils/setTitle'

// ── Filter options ──

const contentOptions = [
  { label: '综合', value: 'artworks' },
  { label: '插画', value: 'illustrations' },
  { label: '动图', value: 'ugoira' },
  { label: '漫画', value: 'manga' },
  { label: '小说', value: 'novels' },
]

const artworkSModeOptions = [
  { label: '标签（部分一致）', value: 's_tag' },
  { label: '标签（完全一致）', value: 's_tag_full' },
  { label: '标题、说明文字', value: 's_tc' },
  { label: '标签、标题、说明', value: 's_tag_tc' },
]

const novelSModeOptions = [
  { label: '标签、标题、说明', value: 's_tag' },
  { label: '标签（部分一致）', value: 's_tag_only' },
  { label: '标签（完全一致）', value: 's_tag_full' },
  { label: '正文', value: 's_tc' },
]

const orderOptions = [
  { label: '新到旧', value: 'date_d' },
  { label: '旧到新', value: 'date' },
]

const modeOptions = [
  { label: '混池', value: 'all' },
  { label: '全年龄', value: 'safe' },
  { label: 'R18', value: 'r18' },
]

const aiTypeOptions = [
  { label: '含AI作品', value: '' },
  { label: '隐藏AI作品', value: '1' },
]

const langOptions = [
  { label: '全部语言', value: '' },
  { label: '中文', value: 'zh-cn' },
  { label: '日本語', value: 'ja' },
  { label: 'English', value: 'en' },
  { label: '한국어', value: 'ko' },
]

// ── State ──

const error = ref('')
const route = useRoute()
const router = useRouter()
const searchStore = useSearchStore()

const keyword = computed(() => (route.query.q as string) || '')
const hasQuery = computed(() => !!keyword.value)
const page = computed(() => {
  const p = parseInt((route.query.p as string) || '1')
  return p > 0 ? p : 1
})

const selectedType = computed(() => (route.query.type as string) || 'artworks')
const selectedSMode = computed(() => (route.query.s_mode as string) || 's_tag')
const selectedOrder = computed(() => (route.query.order as string) || 'date_d')
const selectedMode = computed(() => (route.query.mode as string) || 'all')
const selectedAiType = computed(() => (route.query.ai_type as string) || '')
const selectedLang = computed(() => (route.query.lang as string) || '')

const isNovel = computed(() => selectedType.value === 'novels')

const activeSModeOptions = computed(() =>
  isNovel.value ? novelSModeOptions : artworkSModeOptions
)

const currentResults = computed(() =>
  isNovel.value ? searchStore.novelResults : searchStore.artworkResults
)

const currentTotal = computed(() =>
  isNovel.value ? searchStore.novelTotal : searchStore.artworkTotal
)

// ── Query helpers ──

const defaults: Record<string, string> = {
  type: 'artworks',
  s_mode: 's_tag',
  order: 'date_d',
  mode: 'all',
  ai_type: '',
  lang: '',
}

function setQuery(updates: Record<string, string>) {
  const q = { ...route.query } as Record<string, string>
  const isTypeSwitch = 'type' in updates

  for (const [key, value] of Object.entries(updates)) {
    if (value === defaults[key] || value === '') {
      delete q[key]
    } else {
      q[key] = value
    }
  }

  if (isTypeSwitch) {
    delete q.s_mode
    delete q.lang
  }

  delete q.p
  router.push({ query: q })
}

function goPage(value: number) {
  const target = value < 1 ? 1 : value
  const q = { ...route.query } as Record<string, string>
  if (target === 1) delete q.p
  else q.p = String(target)
  router.push({ query: q })
}

// ── Search execution ──

async function makeSearch(): Promise<void> {
  error.value = ''
  if (!keyword.value) return

  try {
    if (isNovel.value) {
      await searchStore.searchNovels(keyword.value, {
        p: page.value,
        s_mode: selectedSMode.value,
        order: selectedOrder.value,
        mode: selectedMode.value,
        ai_type: selectedAiType.value || undefined,
        work_lang: selectedLang.value || undefined,
      })
    } else {
      await searchStore.searchArtworks(
        keyword.value,
        selectedType.value as SearchContentType,
        {
          p: page.value,
          s_mode: selectedSMode.value,
          order: selectedOrder.value,
          mode: selectedMode.value,
          ai_type: selectedAiType.value || undefined,
        }
      )
    }
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = '哎呀，出错了！'
    }
  }
}

// ── Watchers ──

watch(() => route.query, makeSearch, { deep: true })

effect(() =>
  keyword.value
    ? setTitle(`${keyword.value} (第${page.value}页)`, 'Search')
    : setTitle('搜索')
)

onMounted(() => makeSearch())
</script>

<style lang="scss" scoped>
.search-filters {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-top: 1rem;
}

// ── Primary axis: content type ──
.content-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.content-tab {
  @include fnb-border-sm;
  @include fnb-shadow-xs;
  padding: 0.4rem 0.95rem;
  font-family: var(--fnb-font-display);
  font-size: 0.9rem;
  font-weight: 800;
  background: var(--fnb-surface);
  color: var(--fnb-text);
  cursor: pointer;
  transition: all 150ms;

  &.active {
    background: var(--fnb-brand);
    color: #fff;
    box-shadow: none;
    transform: translate(2px, 2px);
  }

  &:hover:not(.active) {
    background: var(--fnb-highlight);
  }
}

// ── Secondary axis: refinement ──
.refine-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem 1.15rem;
}

.refine-field {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.refine-label {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--fnb-text-muted);
  white-space: nowrap;
}

.pagenator {
  display: flex;
  justify-content: center;
  margin: 1rem auto;
}

.no-more {
  text-align: center;
  padding: 1rem;
  opacity: 0.75;
}

.search-box {
  margin: 1rem auto;
  margin-top: 2rem;
  box-shadow: 0 0 8px #ddd;
}

.fnb-empty {
  color: var(--fnb-text-muted);
  padding: 1rem;
}
</style>
```

- [ ] **Step 3: 构建验证**

Run: `pnpm build`
Expected: `✨ Build complete!`，无 TypeScript/Pug/编译错误。

- [ ] **Step 4: 确认旧目录已删除**

Run: `ls app/pages/search.vue && ! test -d "app/pages/search" && echo "OK: file moved, dir removed"`
Expected: 打印 `OK: file moved, dir removed`。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "refactor(search): migrate search page to query-based /search route"
```

---

### Task 2: 旧 URL 302 重定向兼容

改写 `app/middleware/route-aliases.global.ts`，把旧 `/search/:keyword` 与 `/search/:keyword/:page`（连同原 query）重定向到新 `/search?q=...`。

**Files:**
- Modify: `app/middleware/route-aliases.global.ts`（整体替换）

**Interfaces:**
- Consumes: 新路由 `/search`（Task 1）与其 query 模型
- Produces: 无（纯重定向中间件）

- [ ] **Step 1: 整体替换 `app/middleware/route-aliases.global.ts`**

```ts
export default defineNuxtRouteMiddleware((to) => {
  // Legacy search URLs → new query-based /search
  //   /search/:keyword            → /search?q=:keyword
  //   /search/:keyword/:page      → /search?q=:keyword&p=:page
  // Old `content` query param is renamed to `type`; other filter params pass through.
  const m = to.path.match(/^\/search\/([^/]+)(?:\/([^/]+))?\/?$/)
  if (m) {
    const keyword = decodeURIComponent(m[1])
    const page = m[2]
    const query: Record<string, string> = {
      ...(to.query as Record<string, string>),
    }
    if (query.content) {
      query.type = query.content
      delete query.content
    }
    query.q = keyword
    if (page && page !== '1') {
      query.p = page
    } else {
      delete query.p
    }
    return navigateTo({ path: '/search', query }, { redirectCode: 302 })
  }
})
```

- [ ] **Step 2: 构建验证**

Run: `pnpm build`
Expected: `✨ Build complete!`，无错误。

- [ ] **Step 3: 提交**

```bash
git add app/middleware/route-aliases.global.ts
git commit -m "feat(search): redirect legacy /search/:keyword/:page URLs to query scheme"
```

---

### Task 3: 更新内部链接到新方案

把所有硬编码旧搜索路由的入口改为新 query 形态，并把两处 ArtTag 调用方的 `content` 键改为 `type`。

**Files:**
- Modify: `app/components/SearchBox.vue`
- Modify: `app/components/ArtTag.vue`
- Modify: `app/pages/index.vue`（随机背景 tag 点击）
- Modify: `app/pages/novel/series/[id].vue`（ArtTag `content`→`type`）
- Modify: `app/pages/novels/[id].vue`（ArtTag `content`→`type`）

**Interfaces:**
- Consumes: 新 `/search?q=&type=&...` 路由（Task 1）

- [ ] **Step 1: `SearchBox.vue` —— 输入框初值与跳转改用 query**

把第 15 行：

```ts
const keyword = ref((route.params.keyword as string) || '')
```

改为：

```ts
const keyword = ref((route.query.q as string) || '')
```

把第 25 行：

```ts
  router.push(`/search/${encodeURIComponent(keyword.value)}/1`)
```

改为：

```ts
  router.push({ path: '/search', query: { q: keyword.value } })
```

（保留 `id:数字` → `/artworks/:id` 快捷与空输入早返回。）

- [ ] **Step 2: `ArtTag.vue` —— searchUrl 改用 query**

把第 14-19 行的 `searchUrl`：

```ts
const searchUrl = computed(() => {
  const base = `/search/${encodeURIComponent(props.tag)}/1`
  if (!props.searchQuery || !Object.keys(props.searchQuery).length) return base
  const qs = new URLSearchParams(props.searchQuery).toString()
  return `${base}?${qs}`
})
```

改为：

```ts
const searchUrl = computed(() => {
  const params = new URLSearchParams({ q: props.tag, ...(props.searchQuery ?? {}) })
  return `/search?${params.toString()}`
})
```

- [ ] **Step 3: `index.vue` —— 随机背景 tag 点击改用 query**

把第 62 行：

```pug
                @click='$router.push(`/search/${encodeURIComponent(tag)}/1`)',
```

改为：

```pug
                @click='$router.push({ path: "/search", query: { q: tag } })',
```

- [ ] **Step 4: 两处 ArtTag 调用方 `content`→`type`**

`app/pages/novel/series/[id].vue` 第 32 行与 `app/pages/novels/[id].vue` 第 59 行，均把：

```pug
              :search-query='{ content: "novels", s_mode: "s_tag_only" }',
```

改为：

```pug
              :search-query='{ type: "novels", s_mode: "s_tag_only" }',
```

- [ ] **Step 5: 兜底排查无残留旧链接**

Run:
```bash
grep -rn "/search/" app/ --include=*.vue --include=*.ts | grep -v "ajax/search" | grep -v "route-aliases.global.ts"
```
Expected: 无输出（除 middleware 注释/逻辑外，应无任何 `/search/:keyword` 形态的硬编码）。若有遗漏，按同样方式改为 `/search?q=...`。

- [ ] **Step 6: 构建验证**

Run: `pnpm build`
Expected: `✨ Build complete!`，无错误。

- [ ] **Step 7: 提交**

```bash
git add app/components/SearchBox.vue app/components/ArtTag.vue app/pages/index.vue "app/pages/novel/series/[id].vue" "app/pages/novels/[id].vue"
git commit -m "refactor(search): update internal links to query-based search route"
```

---

## 收尾验证（人工浏览器冒烟）

- [ ] `pnpm dev`，依次确认：
  - `/search` 落地页：显示搜索框 + 类型 tab + 筛选项，结果区为「输入关键词开始搜索」，Network 无搜索请求。
  - 输入关键词回车 → `/search?q=...`，出结果。
  - 切类型 tab / 改筛选（mode/order/s_mode/ai_type）→ URL query 变化、结果刷新、切类型时 `s_mode`/`lang` 重置、页码重置。
  - 翻页 → URL 出现 `p=N`（第 1 页省略），结果正确。
  - 旧 URL：`/search/foo` → 302 到 `/search?q=foo`；`/search/foo/2?content=novels&mode=r18` → `/search?q=foo&p=2&type=novels&mode=r18`。
  - `id:123` 快捷 → `/artworks/123`。
  - 作品页/小说页标签、首页随机背景标签跳转正确（小说页标签带 `type=novels&s_mode=s_tag_only`）。

---

## Self-Review 记录

- **Spec 覆盖**：全 query 方案（Task 1）、`/search` 落地页（Task 1 landing 段）、旧 URL 302 兼容含 `content`→`type`（Task 2）、内部链接更新含两处 ArtTag 调用方（Task 3）、store/API 不动（全程未触及）—— 均有对应任务。
- **类型/命名一致**：query 键 `q`/`type`/`p`/`mode`/`s_mode`/`order`/`ai_type`/`lang` 在 Task 1 页面、Task 2 重定向、Task 3 链接中一致；`setQuery`/`goPage`/`selectedType` 命名一致。
- **Placeholder**：无 TBD/TODO；每个代码步骤均为完整代码或精确行替换。
