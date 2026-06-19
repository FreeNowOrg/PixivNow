# Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the PixivNow homepage into a tool-oriented navigation page with search, user status card, ranking carousel, following feed, and infinite-scroll discovery.

**Architecture:** The page is a single Vue SFC (`index.vue`) that composes four new components: `RankingCarousel`, `UserStatusCard`, `FollowingLatest`, and `DiscoveryTabs`. All data flows through an expanded `useHomeStore` Pinia store. The store fetches from existing `PixivWebClient` methods — no new API endpoints needed.

**Tech Stack:** Nuxt 4 (Vue 3), Pug templates, SCSS with Neubrutalism design system (`fnb-*` mixins/variables), Pinia, @tabler/icons-vue, unplugin-icons (fa-solid), @vueuse/core

## Global Constraints

- Templates use Pug syntax (`lang="pug"`)
- Styles use SCSS (`lang="scss"`) with `fnb-*` mixins from `app/assets/styles/_fnb.scss`
- No semicolons, single quotes, 2-space indent, trailing commas (es5) per Prettier config
- Auto-imports enabled for Vue/Nuxt composables and Pinia stores
- No test framework configured — manual browser verification only
- Code comments in English
- Components placed in `app/components/`
- `ArtworkRank` uses snake_case fields (`illust_id`, `user_name`, `user_id`, `url`, `rank`, `view_count`, `rating_count`)
- `ArtworkInfo` uses camelCase fields (`id`, `userName`, `userId`, `url`, `profileImageUrl`)
- Image URLs from API are already proxy-replaced by `PixivWebClient`; use `toRegularUrl()` from `~/utils/pximg` when converting thumbnail URLs to regular quality

---

### Task 1: Expand `useHomeStore` with ranking, following, and infinite-scroll discovery

**Files:**
- Modify: `app/stores/home.ts`

**Interfaces:**
- Consumes: `usePixivClient()` (auto-imported composable returning `PixivWebClient`), `useUserStore()` from `~/stores/session` for `isLoggedIn` check
- Produces:
  - `rankingList: Ref<ArtworkRank[]>`, `loadingRanking: Ref<boolean>`, `fetchRanking(): Promise<void>`
  - `followingList: Ref<ArtworkInfo[]>`, `loadingFollowing: Ref<boolean>`, `fetchFollowing(): Promise<void>`
  - `discoverySeenIds: Set<string>` (internal), `loadingMoreDiscovery: Ref<boolean>`, `noMoreDiscovery: Ref<boolean>`, `appendDiscovery(): Promise<void>`
  - Existing: `randomBg`, `discoveryList`, `loadingDiscovery`, `fetchRandomBg()`, `fetchDiscovery()` (refactored to seed `discoverySeenIds`)

- [ ] **Step 1: Add ranking state and fetch method**

Add imports and ranking-related state to `app/stores/home.ts`:

```typescript
import type { ArtworkInfo, ArtworkRank } from '~/types'
```

Add inside the store setup function, after the existing `loadingDiscovery` ref:

```typescript
const rankingList = ref<ArtworkRank[]>([])
const loadingRanking = ref(false)

async function fetchRanking(): Promise<void> {
  if (loadingRanking.value) return
  try {
    loadingRanking.value = true
    const data = await pixivClient.getRanking({ mode: 'day', content: 'illust' })
    rankingList.value = data.contents.slice(0, 5)
  } catch (err) {
    console.error('Failed to fetch ranking', err)
  } finally {
    loadingRanking.value = false
  }
}
```

- [ ] **Step 2: Add following state and fetch method**

Add inside the store setup function:

```typescript
const followingList = ref<ArtworkInfo[]>([])
const loadingFollowing = ref(false)

async function fetchFollowing(): Promise<void> {
  if (loadingFollowing.value) return
  try {
    loadingFollowing.value = true
    const data = await pixivClient.getFollowLatest({ p: 1, mode: 'all' })
    followingList.value = data.thumbnails.illust.slice(0, 6)
  } catch (err) {
    console.error('Failed to fetch following', err)
  } finally {
    loadingFollowing.value = false
  }
}
```

- [ ] **Step 3: Add infinite-scroll discovery with dedup**

Add inside the store setup function:

```typescript
const discoverySeenIds = new Set<string>()
const loadingMoreDiscovery = ref(false)
const noMoreDiscovery = ref(false)

async function appendDiscovery(): Promise<void> {
  if (loadingMoreDiscovery.value || noMoreDiscovery.value) return
  try {
    loadingMoreDiscovery.value = true
    const illusts = await pixivClient.getDiscovery({ mode: 'all', max: 18 })
    const fresh = illusts.filter((item) => !discoverySeenIds.has(item.id))
    fresh.forEach((item) => discoverySeenIds.add(item.id))
    discoveryList.value = [...discoveryList.value, ...fresh]
  } catch (err) {
    console.error('Failed to append discovery', err)
  } finally {
    loadingMoreDiscovery.value = false
  }
}
```

- [ ] **Step 4: Refactor existing `fetchDiscovery` to seed the dedup set**

Replace the existing `fetchDiscovery` function body:

```typescript
async function fetchDiscovery(): Promise<void> {
  if (loadingDiscovery.value) return
  try {
    loadingDiscovery.value = true
    const illusts = await pixivClient.getDiscovery({ mode: 'all', max: 18 })
    discoverySeenIds.clear()
    illusts.forEach((item) => discoverySeenIds.add(item.id))
    discoveryList.value = illusts
  } catch (err) {
    console.error('Failed to fetch discovery', err)
  } finally {
    loadingDiscovery.value = false
  }
}
```

- [ ] **Step 5: Export all new state and methods**

Update the return statement to include all new members:

```typescript
return {
  randomBg,
  discoveryList,
  loadingDiscovery,
  fetchRandomBg,
  fetchDiscovery,
  rankingList,
  loadingRanking,
  fetchRanking,
  followingList,
  loadingFollowing,
  fetchFollowing,
  loadingMoreDiscovery,
  noMoreDiscovery,
  appendDiscovery,
}
```

- [ ] **Step 6: Verify dev server starts without errors**

Run: `cd /Users/xiaoyujun/GitRepositories/PixivNow && pnpm dev`

Expected: Dev server starts, no TypeScript errors in the terminal.

- [ ] **Step 7: Commit**

```bash
git add app/stores/home.ts
git commit -m "feat(home): expand store with ranking, following, and infinite discovery"
```

---

### Task 2: Create `RankingCarousel` component

**Files:**
- Create: `app/components/RankingCarousel.vue`

**Interfaces:**
- Consumes: `ArtworkRank[]` via props, `toRegularUrl()` from `~/utils/pximg`
- Produces: A self-contained carousel component. Props: `artworks: ArtworkRank[]`. Emits: none.

**Reference:** Port from `/Users/xiaoyujun/GitRepositories/PicaComicNow/app/components/HeroCarousel.vue`, adapting types and links.

- [ ] **Step 1: Create the component file**

Create `app/components/RankingCarousel.vue` with the following content:

```vue
<template lang="pug">
.ranking-carousel(
  @mouseenter='pause',
  @mouseleave='resume'
)
  .slides
    RouterLink.slide(
      v-for='(artwork, i) in artworks',
      :key='artwork.illust_id',
      :class='{ active: i === current }',
      :to='"/artworks/" + artwork.illust_id'
    )
      DeferLoad.slide-bg(:src='getImageUrl(artwork)')
      .slide-overlay
      .slide-content
        .rank \#{{ artwork.rank }}
        .slide-title {{ artwork.title }}
        .slide-meta
          span.author @{{ artwork.user_name }}
          span.views
            ITablerEye
            | {{ formatCount(artwork.view_count) }}
  .controls
    button.arrow.prev(@click='prev')
      ITablerChevronLeft
    .dots
      button.dot(
        v-for='(_, i) in artworks',
        :key='i',
        :class='{ active: i === current }',
        @click='goTo(i)'
      )
    button.arrow.next(@click='next')
      ITablerChevronRight
  .ranking-link
    RouterLink(to='/ranking') 查看完整排行榜 →
</template>

<script lang="ts" setup>
import DeferLoad from '~/components/DeferLoad.vue'
import { toRegularUrl } from '~/utils/pximg'
import { IconEye as ITablerEye, IconChevronLeft as ITablerChevronLeft, IconChevronRight as ITablerChevronRight } from '@tabler/icons-vue'
import type { ArtworkRank } from '~/types'

const props = defineProps<{ artworks: ArtworkRank[] }>()

const current = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function getImageUrl(artwork: ArtworkRank): string {
  return toRegularUrl(artwork.url)
}

function next() {
  current.value = (current.value + 1) % props.artworks.length
}

function prev() {
  current.value = (current.value - 1 + props.artworks.length) % props.artworks.length
}

function goTo(i: number) {
  current.value = i
}

function startTimer() {
  timer = setInterval(next, 5000)
}

function pause() {
  if (timer) { clearInterval(timer); timer = null }
}

function resume() {
  if (!timer) startTimer()
}

function formatCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

onMounted(startTimer)
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<style scoped lang="scss">
.ranking-carousel {
  @include fnb-border;
  @include fnb-shadow;
  position: relative;
  overflow: hidden;
  height: 360px;
  background: #000;
}

.slides {
  position: relative;
  width: 100%;
  height: 100%;
}

.slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.5s ease;
  display: flex;
  align-items: flex-end;
  text-decoration: none;
  color: #fff;

  &.active {
    opacity: 1;
    z-index: 1;
  }
}

.slide-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slide-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent 40%, rgba(0, 0, 0, 0.7));
  z-index: 1;
}

.slide-content {
  position: relative;
  z-index: 2;
  padding: 1.5rem;
  width: 100%;

  .rank {
    font-family: var(--fnb-font-display);
    font-size: 2.5rem;
    font-weight: 900;
    line-height: 1;
    color: var(--fnb-highlight);
    text-shadow: 3px 3px 0 #000;
  }

  .slide-title {
    font-size: 1.25rem;
    font-weight: 900;
    margin: 0.25rem 0;
    text-shadow: 1px 1px 0 #000;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .slide-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    opacity: 0.9;

    .views {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  }
}

.controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
}

.arrow {
  background: none;
  border: 2px solid #fff;
  color: #fff;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0;
  box-shadow: none;
  transition: background 0.15s;

  &:hover {
    background: var(--fnb-bookmark);
    border-color: var(--fnb-bookmark);
    translate: 0;
    box-shadow: none;
  }
}

.dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border: 2px solid #fff;
  background: transparent;
  padding: 0;
  cursor: pointer;
  box-shadow: none;
  transition: background 0.15s;

  &.active {
    background: var(--fnb-bookmark);
    border-color: var(--fnb-bookmark);
  }

  &:hover {
    background: #fff;
    translate: 0;
    box-shadow: none;
  }
}

.ranking-link {
  position: absolute;
  bottom: 0.75rem;
  right: 1rem;
  z-index: 3;
  font-size: 0.8rem;
  font-weight: 700;

  a {
    color: var(--fnb-highlight);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
```

- [ ] **Step 2: Verify no syntax errors**

Check that dev server shows no errors for the new component file.

- [ ] **Step 3: Commit**

```bash
git add app/components/RankingCarousel.vue
git commit -m "feat(home): add RankingCarousel component ported from PicACG"
```

---

### Task 3: Create `UserStatusCard` component

**Files:**
- Create: `app/components/UserStatusCard.vue`

**Interfaces:**
- Consumes: `useUserStore()` from `~/stores/session` (auto-imported), provides `isLoggedIn`, `userId`, `userName`, `userPixivId`, `userProfileImg`, `user` (for `premium`)
- Produces: A self-contained card component. No props. Reads user state from the store directly.

- [ ] **Step 1: Create the component file**

Create `app/components/UserStatusCard.vue`:

```vue
<template lang="pug">
FnbCard.user-status-card(shadow='sm')
  //- Logged in
  .user-status(v-if='userStore.isLoggedIn')
    .user-identity
      RouterLink.plain(:to='"/users/" + userStore.userId')
        img.avatar(:src='userStore.userProfileImg', :alt='userStore.userName')
      .user-info
        .user-name
          RouterLink.plain(:to='"/users/" + userStore.userId') {{ userStore.userName }}
          FnbTag.premium-badge(v-if='userStore.user?.premium', color='var(--fnb-highlight)') Premium
        .user-id @{{ userStore.userPixivId }}
    .user-actions
      FnbButton(
        size='sm',
        tag='RouterLink',
        :to='`/users/${userStore.userId}?tab=public_bookmarks`'
      )
        template(#icon): ITablerBookmark
        | 收藏
      FnbButton(
        size='sm',
        tag='RouterLink',
        :to='`/users/${userStore.userId}/following`'
      )
        template(#icon): ITablerUsers
        | 关注
      FnbButton(
        size='sm',
        tag='RouterLink',
        to='/login'
      )
        template(#icon): ITablerKey
        | 令牌

  //- Not logged in
  .user-status.guest(v-else)
    .user-identity
      img.avatar(src='/~/common/images/no_profile.png', alt='游客')
      .user-info
        .user-name 游客
        .user-id 绑定令牌，同步您的 Pixiv 信息！
    .user-actions
      FnbButton(
        size='sm',
        variant='primary',
        tag='RouterLink',
        :to='"/login?back=/"'
      )
        template(#icon): ITablerLogin
        | 登录
</template>

<script lang="ts" setup>
import { IconBookmark as ITablerBookmark, IconUsers as ITablerUsers, IconKey as ITablerKey, IconLogin as ITablerLogin } from '@tabler/icons-vue'
import { useUserStore } from '~/stores/session'

const userStore = useUserStore()
</script>

<style scoped lang="scss">
.user-status-card {
  padding: 0.75rem 1rem;
}

.user-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.user-identity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.avatar {
  width: 48px;
  height: 48px;
  @include fnb-border-sm;
  flex-shrink: 0;
}

.user-info {
  min-width: 0;
}

.user-name {
  font-weight: 900;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  a {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.premium-badge {
  font-size: 0.7rem;
  font-weight: 900;
}

.user-id {
  font-size: 0.8rem;
  color: var(--fnb-text-muted);
}

.user-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
  flex-wrap: wrap;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/UserStatusCard.vue
git commit -m "feat(home): add UserStatusCard component"
```

---

### Task 4: Create `FollowingLatest` component

**Files:**
- Create: `app/components/FollowingLatest.vue`

**Interfaces:**
- Consumes: `ArtworkInfo[]` via props, `useUserStore()` for login check
- Produces: A compact list of followed users' artworks, or a login prompt. Props: `artworks: ArtworkInfo[]`, `loading: boolean`.

- [ ] **Step 1: Create the component file**

Create `app/components/FollowingLatest.vue`:

```vue
<template lang="pug">
.following-latest
  h3.section-title
    ITablerUsers
    | 关注更新
  FnbCard(shadow='sm')
    //- Loading
    template(v-if='loading')
      .following-item(v-for='i in 4', :key='i')
        FnbSkeleton(width='48px', height='48px')
        .following-item-info
          FnbSkeleton(text, width='8em', height='1em')
          FnbSkeleton(text, width='5em', height='0.8em')

    //- Logged in with artworks
    template(v-else-if='artworks.length')
      RouterLink.following-item(
        v-for='item in artworks',
        :key='item.id',
        :to='"/artworks/" + item.id'
      )
        DeferLoad.following-thumb(:src='item.url', :alt='item.alt')
        .following-item-info
          .following-item-title {{ item.title }}
          .following-item-author @{{ item.userName }}
      .following-more
        RouterLink(to='/following/latest') 更多 →

    //- Not logged in
    .following-empty(v-else)
      p 登录后查看关注用户的最新作品
      FnbButton(
        size='sm',
        variant='primary',
        tag='RouterLink',
        to='/login?back=/'
      )
        template(#icon): ITablerLogin
        | 登录
</template>

<script lang="ts" setup>
import DeferLoad from '~/components/DeferLoad.vue'
import { IconUsers as ITablerUsers, IconLogin as ITablerLogin } from '@tabler/icons-vue'
import type { ArtworkInfo } from '~/types'

defineProps<{
  artworks: ArtworkInfo[]
  loading: boolean
}>()
</script>

<style scoped lang="scss">
.section-title {
  font-family: var(--fnb-font-display);
  font-weight: 900;
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.following-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  text-decoration: none;
  color: var(--fnb-text);
  transition: background 0.15s;

  &:hover {
    background: var(--fnb-highlight);
    margin: 0 -1rem;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  & + .following-item {
    border-top: 1px solid var(--fnb-border);
  }
}

.following-thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  @include fnb-border-sm;
  flex-shrink: 0;
}

.following-item-info {
  min-width: 0;
  flex: 1;
}

.following-item-title {
  font-weight: 700;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.following-item-author {
  font-size: 0.8rem;
  color: var(--fnb-text-muted);
  font-style: italic;
}

.following-more {
  text-align: right;
  padding-top: 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;

  a {
    color: var(--fnb-brand);
  }
}

.following-empty {
  text-align: center;
  padding: 1rem 0;
  color: var(--fnb-text-muted);

  p {
    margin-bottom: 0.75rem;
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/FollowingLatest.vue
git commit -m "feat(home): add FollowingLatest component"
```

---

### Task 5: Create `DiscoveryTabs` component

**Files:**
- Create: `app/components/DiscoveryTabs.vue`

**Interfaces:**
- Consumes: none
- Produces: A tab bar that emits the selected tab value. Props: `modelValue: string`. Emits: `update:modelValue(value: string)`.

- [ ] **Step 1: Create the component file**

Create `app/components/DiscoveryTabs.vue`:

```vue
<template lang="pug">
.discovery-tabs
  button.discovery-tab(
    v-for='tab in tabs',
    :key='tab.value',
    :class='{ active: modelValue === tab.value, disabled: tab.disabled }',
    :disabled='tab.disabled',
    @click='!tab.disabled && $emit("update:modelValue", tab.value)'
  )
    | {{ tab.label }}
    span.coming-soon(v-if='tab.disabled') soon
</template>

<script lang="ts" setup>
defineProps<{ modelValue: string }>()
defineEmits<{ 'update:modelValue': [value: string] }>()

const tabs = [
  { label: '综合', value: 'all', disabled: false },
  { label: '插画', value: 'illust', disabled: true },
  { label: '漫画', value: 'manga', disabled: true },
  { label: '小说', value: 'novel', disabled: true },
]
</script>

<style scoped lang="scss">
.discovery-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.discovery-tab {
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

  &.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:hover:not(.active):not(.disabled) {
    background: var(--fnb-highlight);
  }

  .coming-soon {
    font-size: 0.6rem;
    margin-left: 0.25rem;
    vertical-align: super;
    opacity: 0.7;
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/DiscoveryTabs.vue
git commit -m "feat(home): add DiscoveryTabs component"
```

---

### Task 6: Rewrite `index.vue` — compose all sections into the new homepage

**Files:**
- Modify: `app/pages/index.vue` (complete rewrite)

**Interfaces:**
- Consumes:
  - `useHomeStore()` — `randomBg`, `fetchRandomBg()`, `rankingList`, `loadingRanking`, `fetchRanking()`, `followingList`, `loadingFollowing`, `fetchFollowing()`, `discoveryList`, `loadingDiscovery`, `fetchDiscovery()`, `loadingMoreDiscovery`, `noMoreDiscovery`, `appendDiscovery()`
  - `useUserStore()` from `~/stores/session` — `isLoggedIn`
  - Components: `SearchBox`, `ArtworkList`, `RankingCarousel`, `UserStatusCard`, `FollowingLatest`, `DiscoveryTabs`, `FnbButton`, `FnbTag`
  - Icons: `@tabler/icons-vue` for quick links, `~icons/fa-solid/*` for bg controls
  - Utils: `toRegularUrl` from `~/utils/pximg`, `setTitle` from `~/utils/setTitle`

- [ ] **Step 1: Rewrite the template**

Replace the entire `<template>` section of `app/pages/index.vue`:

```pug
<template lang="pug">
#home-view
  //- ── Hero Section ──
  .hero-section(
    :style='{ "background-image": `url(${randomBgRegularUrl || ""})` }'
  )
    .hero-overlay
    .hero-content
      .site-logo
        img(:src='LogoH')
      .description Now, everyone can enjoy Pixiv

      .search-area
        SearchBox.big.search

      .quick-links
        FnbTag(clickable, @click='$router.push("/ranking")')
          ITablerChartBar
          |  排行榜
        FnbTag(clickable, @click='$router.push("/following/latest")')
          ITablerUsers
          |  关注
        FnbTag(clickable, @click='scrollToDiscovery')
          ITablerCompass
          |  探索
        FnbTag(:clickable='false', style='opacity: 0.4')
          ITablerBook
          |  小说

      .bg-info
        a.pointer(@click='homeStore.fetchRandomBg()', title='换一个~')
          IFasRandom
        a.pointer(
          @click='isShowBgInfo = true',
          style='margin-left: 0.5em',
          title='关于背景',
          v-if='randomBg?.id'
        )
          IFasInfoCircle

  //- ── Background Info Dialog ──
  .fnb-dialog-overlay(v-if='isShowBgInfo', @click.self='isShowBgInfo = false')
    .fnb-dialog-card
      button.fnb-dialog-card__close(@click='isShowBgInfo = false', aria-label='关闭') ×
      .fnb-dialog-card__header {{ `背景图片：${randomBg?.alt}` }}
      .fnb-dialog-card__body
        .bg-info-modal
          .align-center
            RouterLink.thumb(:to='"/artworks/" + randomBg?.id')
              img(
                :src='randomBgRegularUrl',
                lazyload
              )
            .desc
              .author
                RouterLink(:to='"/users/" + randomBg?.userId') @{{ randomBg?.userName }}
                | 的作品 (ID: {{ randomBg?.id }})
            .tag-list(style='display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-top: 1rem')
              FnbTag(
                :key='tag',
                clickable,
                @click='$router.push(`/search/${encodeURIComponent(tag)}/1`)',
                v-for='tag in randomBg?.tags'
              ) {{ tag }}

  //- ── Body Content ──
  .body-inner
    //- User Status Card
    UserStatusCard

    //- Two-Column Content Area
    .content-grid
      .content-left
        h3.section-title
          ITablerTrophy
          |  今日排行
        RankingCarousel(
          v-if='homeStore.rankingList.length',
          :artworks='homeStore.rankingList'
        )
        .ranking-skeleton(v-else-if='homeStore.loadingRanking')
          FnbSkeleton(block, height='360px')

      .content-right
        FollowingLatest(
          :artworks='homeStore.followingList',
          :loading='homeStore.loadingFollowing'
        )

    //- Discovery Section
    section.discover(ref='discoverRef')
      .discover-header
        h2
          ITablerCompass
          |  探索发现
        .discover-controls
          DiscoveryTabs(v-model='discoveryTab')
          FnbButton(
            :loading='homeStore.loadingDiscovery',
            @click='homeStore.fetchDiscovery()',
            size='sm'
          )
            template(#icon): IFasRandom
            | {{ homeStore.loadingDiscovery ? '加载中' : '换一批' }}
      ArtworkList(
        :list='homeStore.discoveryList',
        :loading='homeStore.loadingDiscovery'
      )

      //- Infinite scroll sentinel / login prompt
      .discover-footer(v-if='!homeStore.loadingDiscovery')
        .loading-more(v-if='userStore.isLoggedIn && homeStore.loadingMoreDiscovery')
          FnbSkeleton(block, height='2rem', width='200px')
        .login-prompt(v-else-if='!userStore.isLoggedIn && homeStore.discoveryList.length')
          p 登录后解锁无限浏览
          FnbButton(
            size='sm',
            variant='primary',
            tag='RouterLink',
            to='/login?back=/'
          )
            template(#icon): ITablerLogin
            | 登录
        div(v-else-if='userStore.isLoggedIn', ref='scrollSentinel')
</template>
```

- [ ] **Step 2: Rewrite the script**

Replace the entire `<script>` section:

```typescript
<script lang="ts" setup>
import ArtworkList from '~/components/Artwork/ArtworkList.vue'
import SearchBox from '~/components/SearchBox.vue'
import RankingCarousel from '~/components/RankingCarousel.vue'
import UserStatusCard from '~/components/UserStatusCard.vue'
import FollowingLatest from '~/components/FollowingLatest.vue'
import DiscoveryTabs from '~/components/DiscoveryTabs.vue'
import IFasRandom from '~icons/fa-solid/random'
import IFasInfoCircle from '~icons/fa-solid/info-circle'
import { IconChartBar as ITablerChartBar, IconUsers as ITablerUsers, IconCompass as ITablerCompass, IconBook as ITablerBook, IconTrophy as ITablerTrophy, IconLogin as ITablerLogin } from '@tabler/icons-vue'
import { useHomeStore } from '~/stores/home'
import { useUserStore } from '~/stores/session'
import { toRegularUrl } from '~/utils/pximg'
import LogoH from '~/assets/LogoH.png'
import { setTitle } from '~/utils/setTitle'

definePageMeta({ name: 'home' })

useHead({
  bodyAttrs: { 'data-route': 'home' },
})

const isShowBgInfo = ref(false)
useBodyScrollLock(isShowBgInfo)
const homeStore = useHomeStore()
const userStore = useUserStore()
const discoveryTab = ref('all')
const discoverRef = ref<HTMLElement | null>(null)
const scrollSentinel = ref<HTMLElement | null>(null)

const randomBg = computed(() => homeStore.randomBg)
const randomBgRegularUrl = computed(() => {
  const bg = randomBg.value
  if (!bg?.url) return ''
  return toRegularUrl(bg.url)
})

function scrollToDiscovery() {
  discoverRef.value?.scrollIntoView({ behavior: 'smooth' })
}

// Infinite scroll observer
useIntersectionObserver(scrollSentinel, ([{ isIntersecting }]) => {
  if (isIntersecting && userStore.isLoggedIn) {
    homeStore.appendDiscovery()
  }
})

onMounted(async () => {
  setTitle()
  if (!homeStore.randomBg) {
    homeStore.fetchRandomBg()
  }
  if (!homeStore.rankingList.length) {
    homeStore.fetchRanking()
  }
  if (userStore.isLoggedIn && !homeStore.followingList.length) {
    homeStore.fetchFollowing()
  }
  if (!homeStore.discoveryList.length) {
    homeStore.fetchDiscovery()
  }
})
</script>
```

- [ ] **Step 3: Rewrite the styles**

Replace the entire `<style>` section:

```scss
<style lang="scss">
#home-view {
  // ── Hero ──
  .hero-section {
    min-height: 50vh;
    margin-top: -63px;
    padding: 30px 10%;
    padding-top: 93px;
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    background-attachment: fixed;
    position: relative;
    color: #fff;
    text-shadow: 0 0 2px #222;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.3);
    pointer-events: none;
    z-index: 0;
  }

  .hero-content {
    position: relative;
    z-index: 1;
    text-align: center;
    width: 100%;
    max-width: 600px;
  }

  .site-logo {
    img {
      height: 4rem;
      width: auto;
    }
  }

  .description {
    font-size: 1.2rem;
    margin-bottom: 1.5rem;
  }

  .search-area {
    margin-bottom: 1rem;

    > * {
      width: 100%;
    }
  }

  .quick-links {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;

    .fnb-tag {
      color: #fff;
      background: rgba(0, 0, 0, 0.4);
      border-color: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(4px);
      text-shadow: none;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;

      &:hover {
        background: var(--fnb-highlight);
        color: var(--fnb-text);
        border-color: var(--fnb-border);
      }
    }
  }

  .bg-info {
    position: absolute;
    right: 1.5rem;
    bottom: 1rem;
    font-size: 1.25rem;
    z-index: 1;

    a {
      --color: #fff;
    }
  }

  // ── Background Info Modal (reuse existing dialog styles) ──
  .bg-info-modal {
    .thumb {
      display: block;
      text-align: center;

      img {
        max-width: 100%;
        max-height: 60vh;
        object-fit: contain;
      }
    }
    .desc {
      margin-top: 1rem;
      font-size: 0.75rem;
      font-style: italic;
    }
  }

  // ── User Status Card ──
  .user-status-card {
    margin-bottom: 1.5rem;
  }

  // ── Two-Column Grid ──
  .content-grid {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .section-title {
    font-family: var(--fnb-font-display);
    font-weight: 900;
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .ranking-skeleton {
    @include fnb-border;
    overflow: hidden;
  }

  // ── Discovery ──
  .discover {
    margin-top: 1rem;
  }

  .discover-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;

    h2 {
      font-family: var(--fnb-font-display);
      font-weight: 900;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
    }
  }

  .discover-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .discover-footer {
    margin-top: 2rem;
    text-align: center;

    .loading-more {
      display: flex;
      justify-content: center;
    }

    .login-prompt {
      padding: 2rem;
      color: var(--fnb-text-muted);

      p {
        margin-bottom: 0.75rem;
        font-weight: 700;
      }
    }
  }
}

// ── Responsive ──
@media (max-width: 768px) {
  #home-view {
    .content-grid {
      grid-template-columns: 1fr;
    }

    .hero-section {
      padding: 30px 5%;
      padding-top: 93px;
    }
  }
}
</style>
```

- [ ] **Step 4: Verify in the browser**

Run `pnpm dev` and check:
1. Hero section renders with background, search box, logo, slogan, quick links
2. User status card shows guest prompt (or user info if logged in)
3. Ranking carousel displays top 5 with auto-play
4. Following section shows login prompt or recent artworks
5. Discovery section shows artworks with tabs and shuffle button
6. Responsive: resize to <768px and verify grid collapses
7. Infinite scroll works when logged in (scroll to bottom loads more)

- [ ] **Step 5: Commit**

```bash
git add app/pages/index.vue
git commit -m "feat(home): rewrite homepage with new tool-oriented layout"
```

---

### Task 7: Polish and edge cases

**Files:**
- Modify: `app/pages/index.vue` (minor adjustments if needed)
- Modify: `app/components/RankingCarousel.vue` (minor adjustments if needed)

**Interfaces:**
- Same as Task 6, no new interfaces.

- [ ] **Step 1: Handle empty ranking state gracefully**

In `app/pages/index.vue`, verify that the ranking skeleton shows while loading and the carousel only renders when data is available. The template already handles this with `v-if='homeStore.rankingList.length'` and `v-else-if='homeStore.loadingRanking'`. If the ranking fails to load entirely, neither block renders — this is acceptable (the section title still shows).

- [ ] **Step 2: Verify carousel doesn't crash with 0 artworks**

In `RankingCarousel.vue`, the `next()` and `prev()` functions use `props.artworks.length` as modulus. If `artworks` is empty (which shouldn't happen since we guard with `v-if`), this would divide by zero. Add a guard at the top of `next()` and `prev()`:

```typescript
function next() {
  if (!props.artworks.length) return
  current.value = (current.value + 1) % props.artworks.length
}

function prev() {
  if (!props.artworks.length) return
  current.value = (current.value - 1 + props.artworks.length) % props.artworks.length
}
```

- [ ] **Step 3: Verify the navbar transparency behavior**

The existing `[data-route="home"]` CSS in `SiteHeader.vue` should continue to work since we kept `useHead({ bodyAttrs: { 'data-route': 'home' } })`. Verify:
1. On page load, navbar is transparent
2. On scroll past hero, navbar gets brand background and shows search bar

- [ ] **Step 4: Test infinite scroll dedup**

Scroll down multiple times while logged in. Each batch should add new cards. If the discovery API returns some duplicates, they should be filtered out (the `discoverySeenIds` Set handles this). Verify the list grows without duplicates appearing.

- [ ] **Step 5: Test the background info dialog**

Click the info icon on the hero background. Verify:
1. Dialog opens with artwork info
2. Tags are clickable and navigate to search
3. Clicking outside or × closes the dialog
4. Body scroll is locked while dialog is open

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "fix(home): polish edge cases in carousel and infinite scroll"
```
