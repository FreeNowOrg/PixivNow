# Novel Support: Discovery, Ranking, Search — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable novel support in home discovery, ranking, and search — activating the disabled UI placeholders with real data, while refactoring artwork ranking to normalize at the SDK layer.

**Architecture:** API client (`pixiv-client.ts`) handles all data normalization (snake_case → camelCase), returning uniform `RankedArtworkInfo` / `RankedNovelInfo` types. Stores manage loading state and caching. Pages switch between artwork and novel content via tab/filter controls, rendering novels with existing `NovelList`/`NovelCard` components.

**Tech Stack:** Nuxt 4, Vue 3, Pinia, TypeScript, Pug templates, SCSS

## Global Constraints

- No test or lint commands configured — verify manually via dev server (`pnpm dev`) and curl
- Vue templates use Pug syntax (`lang="pug"`)
- Prettier: no semicolons, single quotes, 2-space indent, trailing commas (es5)
- Auto-imports enabled for Vue/Nuxt composables and Pinia stores
- `.env` contains `DEBUG_PIXIV_PHPSESSID` for authenticated endpoint testing

---

### Task 1: Types — Add ranked types and raw novel ranking type

**Files:**
- Modify: `app/types/Artworks.ts` (add `RankedArtworkInfo`)
- Modify: `app/types/Novels.ts` (add `RankedNovelInfo`, `NovelRankItem`)

**Interfaces:**
- Produces: `RankedArtworkInfo = ArtworkInfo & { rank: number; viewCount: number }` — used by Task 2 (API client, stores, components)
- Produces: `RankedNovelInfo = NovelInfo & { rank: number }` — used by Task 3 (API client), Task 5 (ranking store/page)
- Produces: `NovelRankItem` — raw snake_case API response type, used internally by Task 3 (API client `getNovelRanking`)

- [ ] **Step 1: Add `RankedArtworkInfo` to `app/types/Artworks.ts`**

Add after the `ArtworkInfo` interface (after line 67):

```ts
export type RankedArtworkInfo = ArtworkInfo & {
  rank: number
  viewCount: number
}
```

- [ ] **Step 2: Add `RankedNovelInfo` and `NovelRankItem` to `app/types/Novels.ts`**

Add after the `NovelInfo` interface (after line 30):

```ts
export type RankedNovelInfo = NovelInfo & {
  rank: number
}

export interface NovelRankItem {
  id: number
  title: string
  rank: number
  user_id: number
  user_name: string
  profile_img: string
  url: string
  bookmark_count: number
  character_count: number
  word_count: number
  reading_time: number
  genre: string
  is_original: boolean
  language: string
  series_id: string
  series_title: string
  tag_a: string[]
  ai_type: number
  x_restrict: number
  restrict: number
  create_date: string
  comment: string
  marker: unknown
}
```

- [ ] **Step 3: Commit**

```bash
git add app/types/Artworks.ts app/types/Novels.ts
git commit -m "feat(types): add RankedArtworkInfo, RankedNovelInfo, NovelRankItem types"
```

---

### Task 2: Refactor artwork ranking — SDK-level normalization

Move the `ArtworkRank` → `ArtworkInfo` conversion from `ArtworkLargeList.vue` into `pixiv-client.ts`, so `getRanking()` returns normalized `RankedArtworkInfo[]`. Update all consumers: `ArtworkLargeList`, `ArtworkLargeCard`, `RankingCarousel`, home store, ranking store.

**Files:**
- Modify: `app/api/pixiv-client.ts` — change `getRanking()` return type and add normalization
- Modify: `app/components/Artwork/ArtworkLargeList.vue` — remove `convertRankToInfo`, simplify to pass items directly
- Modify: `app/components/Artwork/ArtworkLargeCard.vue` — accept `RankedArtworkInfo` (prop name change)
- Modify: `app/components/RankingCarousel.vue` — accept `RankedArtworkInfo[]`, use camelCase fields
- Modify: `app/stores/home.ts` — change `rankingList` type from `ArtworkRank[]` to `RankedArtworkInfo[]`
- Modify: `app/stores/ranking.ts` — change `rankingData.contents` type from `ArtworkRank[]` to `RankedArtworkInfo[]`

**Interfaces:**
- Consumes: `RankedArtworkInfo` from Task 1
- Consumes: `ArtworkRank` (existing raw type, now internal to pixiv-client)
- Produces: `getRanking()` returns `Promise<{ date: string; contents: RankedArtworkInfo[] }>`

- [ ] **Step 1: Update `getRanking()` in `app/api/pixiv-client.ts`**

Replace the `getRanking` method (lines 302-319) and add import for `RankedArtworkInfo`. Update the import block at the top of the file — add `RankedArtworkInfo` to the import from `~/types`:

```ts
import type {
  Artwork,
  ArtworkGallery,
  ArtworkInfo,
  ArtworkInfoOrAd,
  ArtworkRank,
  RankedArtworkInfo,
  Comments,
  // ... rest unchanged
} from '~/types'
```

Replace the `getRanking` method:

```ts
  async getRanking(params?: {
    p?: number
    mode?: string
    date?: string
    content?: string
  }): Promise<{ date: string; contents: RankedArtworkInfo[] }> {
    const searchParams = new URLSearchParams({ format: 'json' })
    if (params?.p) searchParams.set('p', String(params.p))
    if (params?.mode) searchParams.set('mode', params.mode)
    if (params?.date) searchParams.set('date', params.date)
    if (params?.content) searchParams.set('content', params.content)
    const { data } = await this.http.get<{
      date: string
      contents: ArtworkRank[]
    }>('/ranking.php', { params: searchParams })
    const transformed = this.transform(data)
    return {
      date: transformed.date,
      contents: transformed.contents.map(
        (item): RankedArtworkInfo => ({
          id: `${item.illust_id}`,
          title: item.title,
          description: '',
          createDate: item.date,
          updateDate: item.date,
          illustType: +item.illust_type as 0 | 1 | 2,
          restrict: 0,
          xRestrict: item.illust_content_type.sexual,
          sl: 0,
          userId: `${item.user_id}`,
          userName: item.user_name,
          alt: item.title,
          width: item.width,
          height: item.height,
          pageCount: +item.illust_page_count,
          isBookmarkable: true,
          bookmarkData: null,
          titleCaptionTranslation: {
            workTitle: null,
            workCaption: null,
          },
          isUnlisted: false,
          aiType: 0,
          url: item.url,
          tags: item.tags,
          profileImageUrl: item.profile_img,
          type: 'illust',
          rank: item.rank,
          viewCount: item.view_count,
        })
      ),
    }
  }
```

- [ ] **Step 2: Simplify `app/components/Artwork/ArtworkLargeList.vue`**

Replace the entire `<script>` section. Remove `convertRankToInfo`, the `[ArtworkInfo, number]` tuple pattern, and the `ArtworkRank` import. The component now accepts a flat `RankedArtworkInfo[]` and passes each item directly.

```pug
template(#default='{ item, index }')
  ArtworkLargeCard(:illust='item', :key='index')
```

Full `<script>`:

```ts
import ArtworkLargeCard from './ArtworkLargeCard.vue'
import type { ArtworkInfo, RankedArtworkInfo } from '~/types'
import { Waterfall } from 'vue-waterfall-plugin-next'
import 'vue-waterfall-plugin-next/dist/style.css'

const props = defineProps<{
  rankList?: RankedArtworkInfo[]
  artworkList?: ArtworkInfo[]
}>()
const artworks = computed(() => {
  if (props.rankList) {
    return props.rankList
  } else if (props.artworkList) {
    return props.artworkList
  } else {
    return []
  }
})

const waterfallRef = ref<any>()

function resize() {
  waterfallRef.value?.renderer()
}

onMounted(async () => {
  await nextTick()
  const event = new Event('resize')
  window.dispatchEvent(event)
})
```

- [ ] **Step 3: Update `app/components/Artwork/ArtworkLargeCard.vue` props**

Change the props to read `rank` from the `illust` object itself instead of a separate prop. The `rank` prop becomes optional (0 when not from ranking).

Replace the props definition:

```ts
defineProps<{
  illust: ArtworkInfo & { rank?: number; viewCount?: number }
}>()
```

Update the template references to `rank`:
- Change `v-if='rank !== 0'` → `v-if='illust.rank'`
- Change `{{ rank }}` → `{{ illust.rank }}`
- Change `:class='{ gold: rank === 1, silver: rank === 2, bronze: rank === 3 }'` → `:class='{ gold: illust.rank === 1, silver: illust.rank === 2, bronze: illust.rank === 3 }'`

- [ ] **Step 4: Update `app/components/RankingCarousel.vue`**

Change from `ArtworkRank` to `RankedArtworkInfo`. Update all snake_case field references to camelCase.

In `<script>`:

```ts
import type { RankedArtworkInfo } from '~/types'

const props = defineProps<{ artworks: RankedArtworkInfo[] }>()

function getImageUrl(artwork: RankedArtworkInfo): string {
  return toRegularUrl(artwork.url)
}
```

In `<template>`, update field references:
- `artwork.illust_id` → `artwork.id`
- `artwork.user_name` → `artwork.userName`
- `artwork.view_count` → `artwork.viewCount`

The template key and `:to` binding change:
- `:key='artwork.illust_id'` → `:key='artwork.id'`
- `:to='"/artworks/" + artwork.illust_id'` → `:to='"/artworks/" + artwork.id'`
- `@{{ artwork.user_name }}` → `@{{ artwork.userName }}`
- `artwork.view_count` → `artwork.viewCount`

- [ ] **Step 5: Update `app/stores/home.ts`**

Change import and `rankingList` type:

```ts
import type { ArtworkInfo, RankedArtworkInfo } from '~/types'
```

Change:
```ts
const rankingList = ref<ArtworkRank[]>([])
```
to:
```ts
const rankingList = ref<RankedArtworkInfo[]>([])
```

- [ ] **Step 6: Update `app/stores/ranking.ts`**

Change import and `rankingData` type:

```ts
import type { RankedArtworkInfo } from '~/types'
```

Change the `rankingData` ref type from `ArtworkRank[]` to `RankedArtworkInfo[]`:

```ts
const rankingData = ref<{
  date: Date
  contents: RankedArtworkInfo[]
} | null>(null)
```

- [ ] **Step 7: Verify artwork ranking still works**

Run `pnpm dev`, navigate to:
1. Home page — verify the ranking carousel shows artwork images, titles, authors, view counts, and rank numbers
2. `/ranking` — verify the ranking page loads and displays artworks in the waterfall layout with rank badges
3. `/ranking?mode=weekly` — verify mode switching works

- [ ] **Step 8: Commit**

```bash
git add app/api/pixiv-client.ts app/components/Artwork/ArtworkLargeList.vue app/components/Artwork/ArtworkLargeCard.vue app/components/RankingCarousel.vue app/stores/home.ts app/stores/ranking.ts
git commit -m "refactor(ranking): normalize ArtworkRank to RankedArtworkInfo at SDK layer

Move snake_case → camelCase conversion from ArtworkLargeList into
pixiv-client.ts. Components now receive uniform RankedArtworkInfo
instead of raw ArtworkRank."
```

---

### Task 3: API Client — Add novel discovery, search, and ranking methods

**Files:**
- Modify: `app/api/pixiv-client.ts` — add `getNovelDiscovery`, `searchNovels`, `getNovelRanking`

**Interfaces:**
- Consumes: `NovelInfo`, `NovelRankItem`, `RankedNovelInfo` from Task 1
- Produces: `getNovelDiscovery(params: { mode?, limit? }): Promise<NovelInfo[]>`
- Produces: `searchNovels(keyword, params: { p?, mode? }): Promise<{ data: NovelInfo[], total: number }>`
- Produces: `getNovelRanking(params: { mode?, p? }): Promise<{ date: string, contents: RankedNovelInfo[] }>`

- [ ] **Step 1: Add imports**

Add `RankedNovelInfo` and `NovelRankItem` to the import from `~/types`:

```ts
import type {
  // ... existing imports ...
  NovelRankItem,
  RankedNovelInfo,
} from '~/types'
```

- [ ] **Step 2: Add `getNovelDiscovery` method**

Add in the `// ── Discovery & Recommendations ──` section, after `getDiscovery`:

```ts
  async getNovelDiscovery(params: {
    mode?: string
    limit?: number
  }): Promise<NovelInfo[]> {
    const { data } = await this.http.get<
      PixivResponse<{ novels: NovelInfo[] }>
    >('/ajax/novel/discovery', {
      params: {
        mode: params.mode ?? 'safe',
        limit: params.limit,
      },
    })
    return this.unwrap(data).novels ?? []
  }
```

- [ ] **Step 3: Add `searchNovels` method**

Add in the `// ── Search ──` section, after `searchArtworks`:

```ts
  async searchNovels(
    keyword: string,
    params?: { p?: number; mode?: string }
  ): Promise<{ data: NovelInfo[]; total: number }> {
    const { data } = await this.http.get<
      PixivResponse<{
        novel: { data: NovelInfo[]; total: number }
      }>
    >(`/ajax/search/novels/${encodeURIComponent(keyword)}`, {
      params: { p: params?.p ?? 1, mode: params?.mode },
    })
    const body = this.unwrap(data)
    return {
      data: body.novel?.data ?? [],
      total: body.novel?.total ?? 0,
    }
  }
```

- [ ] **Step 4: Add `getNovelRanking` method**

Add in the `// ── Ranking ──` section, after `getRanking`:

```ts
  async getNovelRanking(params?: {
    p?: number
    mode?: string
  }): Promise<{ date: string; contents: RankedNovelInfo[] }> {
    const { data } = await this.http.get<
      PixivResponse<{
        display_a: { rank_a: NovelRankItem[] }
        date: string
      }>
    >('/ajax/ranking/novel', {
      params: { mode: params?.mode ?? 'daily', p: params?.p },
    })
    const body = this.unwrap(data)
    return {
      date: body.date,
      contents: (body.display_a?.rank_a ?? []).map(
        (item): RankedNovelInfo => ({
          id: `${item.id}`,
          title: item.title,
          description: item.comment ?? '',
          createDate: item.create_date ?? '',
          updateDate: item.create_date ?? '',
          restrict: item.restrict as 0,
          xRestrict: item.x_restrict as 0 | 1 | 2,
          userId: `${item.user_id}`,
          userName: item.user_name,
          isBookmarkable: true,
          bookmarkData: null,
          titleCaptionTranslation: {
            workTitle: null,
            workCaption: null,
          },
          isUnlisted: false,
          aiType: item.ai_type,
          url: item.url,
          tags: item.tag_a ?? [],
          profileImageUrl: item.profile_img,
          type: 'novel',
          genre: item.genre,
          textCount: item.character_count,
          wordCount: item.word_count,
          readingTime: item.reading_time,
          isOriginal: item.is_original,
          bookmarkCount: item.bookmark_count,
          language: item.language,
          marker: item.marker,
          rank: item.rank,
        })
      ),
    }
  }
```

- [ ] **Step 5: Verify with curl**

```bash
# Novel discovery
curl -s 'http://localhost:3000/ajax/novel/discovery?mode=safe&limit=3' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'error={d[\"error\"]}, novels={len(d[\"body\"].get(\"novels\",[]))}')"

# Novel search
curl -s 'http://localhost:3000/ajax/search/novels/%E5%8E%9F%E7%A5%9E?p=1' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'error={d[\"error\"]}, total={d[\"body\"][\"novel\"][\"total\"]}')"

# Novel ranking
curl -s 'http://localhost:3000/ajax/ranking/novel?mode=daily&p=1' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'error={d[\"error\"]}, items={len(d[\"body\"][\"display_a\"][\"rank_a\"])}')"
```

- [ ] **Step 6: Commit**

```bash
git add app/api/pixiv-client.ts
git commit -m "feat(api): add getNovelDiscovery, searchNovels, getNovelRanking methods"
```

---

### Task 4: Home page — Novel discovery support

Enable the "小说" tab on the home page discovery section. When active, fetch and display novels using `NovelList`.

**Files:**
- Modify: `app/components/DiscoveryTabs.vue` — remove `disabled: true` from novel tab
- Modify: `app/stores/home.ts` — add novel discovery state and methods
- Modify: `app/pages/index.vue` — switch between ArtworkList and NovelList based on active tab, wire infinite scroll

**Interfaces:**
- Consumes: `getNovelDiscovery()` from Task 3
- Consumes: `NovelList` component (existing)

- [ ] **Step 1: Enable novel tab in `app/components/DiscoveryTabs.vue`**

Change line 20:
```ts
  { label: '小说', value: 'novel', disabled: true },
```
to:
```ts
  { label: '小说', value: 'novel', disabled: false },
```

- [ ] **Step 2: Add novel discovery state to `app/stores/home.ts`**

Add import for `NovelInfo`:

```ts
import type { ArtworkInfo, NovelInfo, RankedArtworkInfo } from '~/types'
```

Add novel discovery state refs after the existing discovery refs (after line 19, `discoveryMode`):

```ts
  const novelDiscoveryList = ref<NovelInfo[]>([])
  const loadingNovelDiscovery = ref(false)
  const loadingMoreNovelDiscovery = ref(false)
  const noMoreNovelDiscovery = ref(false)
  const novelDiscoverySeenIds = new Set<string>()
```

Add `fetchNovelDiscovery` function after `appendDiscovery`:

```ts
  async function fetchNovelDiscovery(): Promise<void> {
    if (loadingNovelDiscovery.value) return
    try {
      loadingNovelDiscovery.value = true
      const novels = await pixivClient.getNovelDiscovery({
        mode: discoveryMode.value,
        limit: 60,
      })
      novelDiscoverySeenIds.clear()
      noMoreNovelDiscovery.value = false
      novels.forEach((item) => novelDiscoverySeenIds.add(item.id))
      novelDiscoveryList.value = novels
    } catch (err) {
      console.error('Failed to fetch novel discovery', err)
    } finally {
      loadingNovelDiscovery.value = false
    }
  }

  async function appendNovelDiscovery(): Promise<void> {
    if (loadingMoreNovelDiscovery.value || noMoreNovelDiscovery.value) return
    try {
      loadingMoreNovelDiscovery.value = true
      const novels = await pixivClient.getNovelDiscovery({
        mode: discoveryMode.value,
        limit: 60,
      })
      const fresh = novels.filter(
        (item) => !novelDiscoverySeenIds.has(item.id)
      )
      if (!fresh.length) {
        noMoreNovelDiscovery.value = true
        return
      }
      fresh.forEach((item) => novelDiscoverySeenIds.add(item.id))
      novelDiscoveryList.value = [...novelDiscoveryList.value, ...fresh]
    } catch (err) {
      console.error('Failed to append novel discovery', err)
    } finally {
      loadingMoreNovelDiscovery.value = false
    }
  }
```

Add the new state and methods to the return object:

```ts
  return {
    // ... existing ...
    novelDiscoveryList,
    loadingNovelDiscovery,
    loadingMoreNovelDiscovery,
    noMoreNovelDiscovery,
    fetchNovelDiscovery,
    appendNovelDiscovery,
  }
```

- [ ] **Step 3: Update `app/pages/index.vue` template — switch content by tab**

Add `NovelList` import in `<script>`:

```ts
import NovelList from '~/components/Novel/NovelList.vue'
```

Replace the discovery content area in the template. Find the `ArtworkList` block (around line 115-118):

```pug
      ArtworkList(
        :list='homeStore.discoveryList',
        :loading='homeStore.loadingDiscovery'
      )
```

Replace with:

```pug
      ArtworkList(
        v-if='discoveryTab !== "novel"',
        :list='homeStore.discoveryList',
        :loading='homeStore.loadingDiscovery'
      )
      NovelList(
        v-else,
        :list='homeStore.novelDiscoveryList',
        :loading='homeStore.loadingNovelDiscovery'
      )
```

- [ ] **Step 4: Update `app/pages/index.vue` script — fetch and infinite scroll logic**

In the `changeDiscoveryTab` function, trigger fetch when switching to novel tab. Replace `changeDiscoveryTab` (around line 198):

```ts
function changeDiscoveryTab(tab: string) {
  discoveryTab.value = tab
  savedDiscoveryTab.value = tab
  syncDiscoveryQuery()
  if (tab === 'novel' && !homeStore.novelDiscoveryList.length) {
    homeStore.fetchNovelDiscovery()
  }
}
```

Update the "换一批" button click handler in the template (around line 110). Replace:

```pug
          FnbButton(
            :loading='homeStore.loadingDiscovery',
            @click='homeStore.fetchDiscovery()',
            size='sm'
          )
            template(#icon): IFasRandom
            | {{ homeStore.loadingDiscovery ? '加载中' : '换一批' }}
```

With:

```pug
          FnbButton(
            :loading='isDiscoveryLoading',
            @click='refreshDiscovery',
            size='sm'
          )
            template(#icon): IFasRandom
            | {{ isDiscoveryLoading ? '加载中' : '换一批' }}
```

Add the computed and function in `<script>`:

```ts
const isDiscoveryLoading = computed(() =>
  discoveryTab.value === 'novel'
    ? homeStore.loadingNovelDiscovery
    : homeStore.loadingDiscovery
)

function refreshDiscovery() {
  if (discoveryTab.value === 'novel') {
    homeStore.fetchNovelDiscovery()
  } else {
    homeStore.fetchDiscovery()
  }
}
```

Update the `changeDiscoveryMode` function to also refresh novel discovery:

```ts
function changeDiscoveryMode(mode: string) {
  discoveryMode.value = mode
  savedDiscoveryMode.value = mode
  homeStore.discoveryMode = mode
  syncDiscoveryQuery()
  refreshDiscovery()
}
```

Update the infinite scroll observer (around line 217-221). Replace:

```ts
useIntersectionObserver(scrollSentinel, ([{ isIntersecting }]) => {
  if (isIntersecting && userStore.isLoggedIn) {
    homeStore.appendDiscovery()
  }
})
```

With:

```ts
useIntersectionObserver(scrollSentinel, ([{ isIntersecting }]) => {
  if (isIntersecting && userStore.isLoggedIn) {
    if (discoveryTab.value === 'novel') {
      homeStore.appendNovelDiscovery()
    } else {
      homeStore.appendDiscovery()
    }
  }
})
```

Update the loading-more indicator in the template (around line 122). Replace:

```pug
        .loading-more(v-if='userStore.isLoggedIn && homeStore.loadingMoreDiscovery')
```

With:

```pug
        .loading-more(v-if='userStore.isLoggedIn && (discoveryTab === "novel" ? homeStore.loadingMoreNovelDiscovery : homeStore.loadingMoreDiscovery)')
```

- [ ] **Step 5: Update hero quick link for 小说**

Replace the disabled 小说 tag (around line 26-28):

```pug
        FnbTag(:clickable='false', style='opacity: 0.4')
          FnbIcon: ITablerBook
          |  小说
```

With:

```pug
        FnbTag(clickable, @click='scrollToDiscovery(); changeDiscoveryTab("novel")')
          FnbIcon: ITablerBook
          |  小说
```

- [ ] **Step 6: Verify**

Run `pnpm dev`, navigate to home page:
1. The "小说" tab in discovery section should be clickable (not grayed out)
2. Click the "小说" tab → should show novel cards in a grid
3. Click "换一批" → should refresh the novel list
4. Scroll down → should load more novels (if logged in)
5. Switch mode selector (全年龄/混池) → should refresh novels
6. Switch back to "插画·漫画" tab → should show artworks again
7. Click the 小说 quick link in the hero → should scroll to discovery and switch to novel tab

- [ ] **Step 7: Commit**

```bash
git add app/components/DiscoveryTabs.vue app/stores/home.ts app/pages/index.vue
git commit -m "feat(home): add novel discovery support

Enable the novel tab in discovery section. Fetch and display novels
using NovelList with infinite scroll and mode switching."
```

---

### Task 5: Ranking page — Novel ranking support

Enable the "小说" content filter on the ranking page. When selected, fetch novel ranking data and display with `NovelList`. Dynamically adjust available mode options based on content type.

**Files:**
- Modify: `app/stores/ranking.ts` — add novel ranking state and `fetchNovelRanking`
- Modify: `app/pages/ranking.vue` — enable novel filter, switch rendering, adjust mode options

**Interfaces:**
- Consumes: `getNovelRanking()` from Task 3
- Consumes: `RankedNovelInfo` from Task 1
- Consumes: `NovelList` component (existing)

- [ ] **Step 1: Update `app/stores/ranking.ts`**

Replace the entire file:

```ts
import { defineStore } from 'pinia'
import type { RankedArtworkInfo, RankedNovelInfo } from '~/types'

export const useRankingStore = defineStore('ranking', () => {
  const rankingData = ref<{
    date: Date
    contents: RankedArtworkInfo[]
  } | null>(null)
  const novelRankingData = ref<{
    date: string
    contents: RankedNovelInfo[]
  } | null>(null)
  const loading = ref(false)
  const pixivClient = usePixivClient()

  async function fetchRanking(params?: {
    p?: string
    mode?: string
    date?: string
    content?: string
  }): Promise<void> {
    loading.value = true
    try {
      const data = await pixivClient.getRanking({
        p: params?.p ? Number(params.p) : undefined,
        mode: params?.mode,
        date: params?.date,
        content: params?.content,
      })
      const rankingDate = data.date
      rankingData.value = {
        date: new Date(
          +rankingDate.substring(0, 4),
          +rankingDate.substring(4, 6) - 1,
          +rankingDate.substring(6, 8)
        ),
        contents: data.contents,
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchNovelRanking(params?: {
    p?: string
    mode?: string
  }): Promise<void> {
    loading.value = true
    try {
      const data = await pixivClient.getNovelRanking({
        p: params?.p ? Number(params.p) : undefined,
        mode: params?.mode,
      })
      novelRankingData.value = {
        date: data.date,
        contents: data.contents,
      }
    } finally {
      loading.value = false
    }
  }

  function reset() {
    rankingData.value = null
    novelRankingData.value = null
  }

  return {
    rankingData,
    novelRankingData,
    loading,
    fetchRanking,
    fetchNovelRanking,
    reset,
  }
})
```

- [ ] **Step 2: Update `app/pages/ranking.vue`**

Replace the entire file:

```pug
<template lang="pug">
#ranking-view
  .body-inner
    h1 排行榜
    .ranking-filters
      .filter-row
        span.filter-label 内容
        .filter-tabs
          button.filter-tab(
            v-for='opt in contentOptions',
            :key='opt.value',
            :class='{ active: selectedContent === opt.value }',
            @click='setFilter("content", opt.value)'
          )
            | {{ opt.label }}
      .filter-row
        span.filter-label 模式
        .filter-tabs
          button.filter-tab(
            v-for='opt in activeModeOptions',
            :key='opt.value',
            :class='{ active: selectedMode === opt.value }',
            @click='setFilter("mode", opt.value)'
          ) {{ opt.label }}

  //- Error
  section(v-if='error')
    .body-inner
      ErrorPage(:description='error' title='出大问题')

  //- Loading
  section(v-if='rankingStore.loading')
    .body-inner
      .loading
        Placeholder

  //- Result — Artwork
  section(v-if='!isNovel && rankingStore.rankingData')
    .body-inner
      h2.ranking-date {{ rankingStore.rankingData.date.toLocaleDateString('zh', { dateStyle: 'long' }) }}
      ArtworkLargeList(:rank-list='rankingStore.rankingData.contents')

  //- Result — Novel
  section(v-if='isNovel && rankingStore.novelRankingData')
    .body-inner
      h2.ranking-date {{ rankingStore.novelRankingData.date }}
      NovelList(:list='rankingStore.novelRankingData.contents')
</template>

<script lang="ts" setup>
definePageMeta({ name: 'ranking' })
import ArtworkLargeList from '~/components/Artwork/ArtworkLargeList.vue'
import NovelList from '~/components/Novel/NovelList.vue'
import ErrorPage from '~/components/ErrorPage.vue'
import Placeholder from '~/components/Placeholder.vue'
import { useRankingStore } from '~/stores/ranking'
import { effect } from 'vue'
import { setTitle } from '~/utils/setTitle'

const contentOptions = [
  { label: '综合', value: 'all' },
  { label: '插画', value: 'illust' },
  { label: '动图', value: 'ugoira' },
  { label: '漫画', value: 'manga' },
  { label: '小说', value: 'novel' },
]

const artworkModeOptions = [
  { label: '日榜', value: 'daily' },
  { label: '周榜', value: 'weekly' },
  { label: '月榜', value: 'monthly' },
  { label: '新人', value: 'rookie' },
  { label: '原创', value: 'original' },
  { label: 'AI', value: 'daily_ai' },
  { label: '男性向', value: 'male' },
  { label: '女性向', value: 'female' },
  { label: 'R18 日榜', value: 'daily_r18' },
  { label: 'R18 周榜', value: 'weekly_r18' },
  { label: 'R18 AI', value: 'daily_r18_ai' },
  { label: 'R18 男性向', value: 'male_r18' },
  { label: 'R18 女性向', value: 'female_r18' },
]

const novelModeOptions = [
  { label: '日榜', value: 'daily' },
  { label: '周榜', value: 'weekly' },
  { label: '月榜', value: 'monthly' },
  { label: '新人', value: 'rookie' },
  { label: '男性向', value: 'male' },
  { label: '女性向', value: 'female' },
  { label: 'R18 日榜', value: 'daily_r18' },
  { label: 'R18 周榜', value: 'weekly_r18' },
  { label: 'R18 AI', value: 'weekly_r18_ai' },
  { label: 'R18 男性向', value: 'male_r18' },
  { label: 'R18 女性向', value: 'female_r18' },
]

const error = ref('')
const rankingStore = useRankingStore()
const route = useRoute()
const router = useRouter()

const selectedContent = computed(() => (route.query.content as string) || 'all')
const selectedMode = computed(() => (route.query.mode as string) || 'daily')
const isNovel = computed(() => selectedContent.value === 'novel')

const activeModeOptions = computed(() =>
  isNovel.value ? novelModeOptions : artworkModeOptions
)

function setFilter(key: string, value: string) {
  const query = { ...route.query, [key]: value }
  if (key === 'content' && value === 'all') delete query.content
  if (key === 'mode' && value === 'daily') delete query.mode
  if (key === 'content') delete query.mode
  delete query.p
  router.push({ query })
}

async function init(): Promise<void> {
  const { p, mode, date, content } = route.query
  error.value = ''
  try {
    if (content === 'novel') {
      await rankingStore.fetchNovelRanking({
        p: p as string | undefined,
        mode: (mode as string) || 'daily',
      })
    } else {
      await rankingStore.fetchRanking({
        p: p as string | undefined,
        mode: (mode as string) || 'daily',
        date: date as string | undefined,
        content: (content as string) || 'all',
      })
    }
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = '哎呀，出错了！'
    }
  }
}

effect(() =>
  setTitle(
    rankingStore.rankingData?.date?.toLocaleDateString('zh', {
      dateStyle: 'long',
    }),
    'Ranking'
  )
)

watch(() => route.query, () => {
  init()
})

onMounted(() => {
  init()
})
</script>

<style scoped lang="scss">
.ranking-filters {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-label {
  font-family: var(--fnb-font-display);
  font-weight: 900;
  font-size: 0.85rem;
  flex-shrink: 0;
  width: 2.5em;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-tab {
  @include fnb-border-sm;
  @include fnb-shadow-xs;
  padding: 0.3rem 0.75rem;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  background: var(--fnb-surface);
  color: var(--fnb-text);
  cursor: pointer;
  transition: all 150ms;

  &.active {
    background: var(--fnb-brand);
    color: #fff;
    box-shadow: none;
    transform: translate(3px, 3px);
  }

  &:hover:not(.active) {
    background: var(--fnb-highlight);
  }
}

.ranking-date {
  margin-top: 0;
  margin-bottom: 1rem;
}

.loading {
  text-align: center;
}
</style>
```

- [ ] **Step 3: Verify**

Run `pnpm dev`, navigate to `/ranking`:
1. "小说" button in content filter should be clickable (no "soon" badge)
2. Click "小说" → should load and display novel cards in a grid
3. Mode options should update to novel-specific modes (no "原创" or "AI", has "R18 AI" as `weekly_r18_ai`)
4. Switch modes (日榜 → 周榜) → should reload novel ranking
5. Switch back to "综合" → should show artwork waterfall again with artwork mode options
6. Verify switching content resets mode to "daily" (via `delete query.mode` in `setFilter`)

- [ ] **Step 4: Commit**

```bash
git add app/stores/ranking.ts app/pages/ranking.vue
git commit -m "feat(ranking): add novel ranking support

Switch between artwork and novel ranking via content filter.
Novel ranking uses /ajax/ranking/novel with mode-specific options."
```

---

### Task 6: Search page — Novel search support

Add a content type toggle to the search page so users can search novels. When "小说" is selected, fetch and display novel results.

**Files:**
- Modify: `app/stores/search.ts` — add `searchNovels` method and novel state
- Modify: `app/pages/search/[keyword]/[p].vue` — add content type toggle, switch rendering

**Interfaces:**
- Consumes: `searchNovels()` from Task 3
- Consumes: `NovelList` component (existing)

- [ ] **Step 1: Update `app/stores/search.ts`**

Replace the entire file:

```ts
import { defineStore } from 'pinia'
import type { ArtworkInfo, NovelInfo } from '~/types'

export const useSearchStore = defineStore('search', () => {
  const pixivClient = usePixivClient()
  const results = ref<ArtworkInfo[]>([])
  const total = ref(0)
  const loading = ref(false)

  const novelResults = ref<NovelInfo[]>([])
  const novelTotal = ref(0)

  async function search(
    keyword: string,
    params?: { p?: number; mode?: string }
  ): Promise<void> {
    if (!keyword) return
    loading.value = true
    try {
      const data = await pixivClient.searchArtworks(keyword, params)
      results.value = data.data
      total.value = data.total
    } finally {
      loading.value = false
    }
  }

  async function searchNovels(
    keyword: string,
    params?: { p?: number; mode?: string }
  ): Promise<void> {
    if (!keyword) return
    loading.value = true
    try {
      const data = await pixivClient.searchNovels(keyword, params)
      novelResults.value = data.data
      novelTotal.value = data.total
    } finally {
      loading.value = false
    }
  }

  function reset() {
    results.value = []
    total.value = 0
    novelResults.value = []
    novelTotal.value = 0
  }

  return {
    results,
    total,
    novelResults,
    novelTotal,
    loading,
    search,
    searchNovels,
    reset,
  }
})
```

- [ ] **Step 2: Update `app/pages/search/[keyword]/[p].vue`**

Replace the entire file:

```pug
<template lang="pug">
#search-view
  .body-inner
    SearchBox.big
    .search-type-tabs
      button.search-type-tab(
        :class='{ active: searchType !== "novel" }',
        @click='switchType("artworks")'
      ) 插画·漫画
      button.search-type-tab(
        :class='{ active: searchType === "novel" }',
        @click='switchType("novel")'
      ) 小说

  //- Error
  section(v-if='error && !searchStore.loading')
    ErrorPage(:description='error' title='出大问题')

  //- Result
  section(v-if='!error')

    //- Loading
    .loading-area(v-if='searchStore.loading && !currentResults.length')
      ArtworkList(v-if='searchType !== "novel"', :list='[]', :loading='16')
      .body-inner(v-else)
        NovelList(:list='[]', :loading='12')

    .no-more(v-if='!searchStore.loading && !currentResults.length')
      FnbCard(style='padding: 15vh 0; text-align: center')
        .fnb-empty 没有了，一滴都没有了……

    FnbSpin.result-area(:show='searchStore.loading' v-if='currentResults.length')
      .body-inner
        .pagenator
          FnbPagination(
            :page='page'
            :item-count='currentTotal'
            :page-size='currentResults.length'
            @update:page='page = $event'
          )
        ArtworkLargeList(v-if='searchType !== "novel"', :artwork-list='searchStore.results')
        NovelList(v-else, :list='searchStore.novelResults')
        .pagenator
          FnbPagination(
            :page='page'
            :item-count='currentTotal'
            :page-size='currentResults.length'
            @update:page='page = $event'
          )
</template>

<script lang="ts" setup>
definePageMeta({ name: 'search' })
import ArtworkLargeList from '~/components/Artwork/ArtworkLargeList.vue'
import ArtworkList from '~/components/Artwork/ArtworkList.vue'
import NovelList from '~/components/Novel/NovelList.vue'
import ErrorPage from '~/components/ErrorPage.vue'
import SearchBox from '~/components/SearchBox.vue'
import { useSearchStore } from '~/stores/search'
import { effect } from 'vue'
import { setTitle } from '~/utils/setTitle'

const error = ref('')
const searchKeyword = ref('')
const page = ref(1)
const route = useRoute()
const router = useRouter()
const searchStore = useSearchStore()

const searchType = computed(() => (route.query.type as string) || 'artworks')

const currentResults = computed(() =>
  searchType.value === 'novel' ? searchStore.novelResults : searchStore.results
)

const currentTotal = computed(() =>
  searchType.value === 'novel' ? searchStore.novelTotal : searchStore.total
)

function switchType(type: string) {
  const query = { ...route.query, type }
  if (type === 'artworks') delete query.type
  router.push({ query })
}

async function makeSearch({
  keyword,
  p,
  mode,
}: {
  keyword: string
  p?: `${number}`
  mode?: string
}): Promise<void> {
  searchKeyword.value = keyword
  page.value = parseInt(p || '1')
  error.value = ''
  if (!searchKeyword.value) return
  try {
    if (searchType.value === 'novel') {
      await searchStore.searchNovels(keyword, {
        p: parseInt(p || '1'),
        mode: mode ?? 'text',
      })
    } else {
      await searchStore.search(keyword, {
        p: parseInt(p || '1'),
        mode: mode ?? 'text',
      })
    }
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = '哎呀，出错了！'
    }
  }
}

watch(page, (value) => {
  page.value = value < 1 ? 1 : value
  const query = route.query.type ? `?type=${route.query.type}` : ''
  router.push(`/search/${searchKeyword.value}/${page.value}${query}`)
})

watch(() => route.query.type, () => {
  makeSearch(route.params as { keyword: string; p?: `${number}` })
})

onBeforeRouteUpdate(async (to) => {
  const params = to.params as {
    keyword: string
    p?: `${number}`
    mode?: string
  }
  makeSearch(params)
})

effect(() =>
  setTitle(`${route.params.keyword} (第${route.params.p}页)`, 'Search')
)
onMounted(async () => {
  const params = route.params as {
    keyword: string
    p?: `${number}`
    mode?: string
  }
  await makeSearch(params)
})
</script>

<style lang="scss" scoped>
.search-type-tabs {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.search-type-tab {
  @include fnb-border-sm;
  @include fnb-shadow-xs;
  padding: 0.3rem 0.75rem;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  background: var(--fnb-surface);
  color: var(--fnb-text);
  cursor: pointer;
  transition: all 150ms;

  &.active {
    background: var(--fnb-brand);
    color: #fff;
    box-shadow: none;
    transform: translate(3px, 3px);
  }

  &:hover:not(.active) {
    background: var(--fnb-highlight);
  }
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

- [ ] **Step 3: Verify**

Run `pnpm dev`, navigate to `/search/原神/1`:
1. "插画·漫画" and "小说" tabs should appear below the search box
2. Default should show artwork results (插画·漫画 active)
3. Click "小说" → URL should update to `?type=novel`, results should switch to novel cards
4. Pagination should work for novel results
5. Click "插画·漫画" → should switch back to artworks, `?type` removed from URL
6. Search a new keyword while on novel tab → should search novels
7. Empty results should show "没有了，一滴都没有了……"

- [ ] **Step 4: Commit**

```bash
git add app/stores/search.ts app/pages/search/\[keyword\]/\[p\].vue
git commit -m "feat(search): add novel search support

Add content type toggle (artworks/novels) to search page.
Novel search synced via ?type=novel query parameter."
```
