# 统一探索发现页 `/discovery` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增统一的 `/discovery` 页面（顶部 tab 切换 artworks/novels/users 三个子路由 + R18 开关），并把现有 discovery 逻辑从 `home.ts` 抽成独立 store。

**Architecture:** Nuxt 嵌套路由（父布局 `discovery.vue` + 子页）。新建 `discovery` store 承载 artworks/novels/users 三类发现数据；首页改为引用新 store，行为保持不变。推荐用户接口在 `pixiv-client` 内做三段 join 适配成 `UserListItem`，从而零改动复用 `FollowUserCard`。

**Tech Stack:** Nuxt 4 / Vue 3 SFC（Pug 模板 + SCSS）/ Pinia / axios / @vueuse/core。

## Global Constraints

- 代码风格：无分号、单引号、2 空格缩进、trailing comma（es5）。模板用 Pug（`lang="pug"`），样式用 SCSS（`lang="scss"`）。
- 客户端 SPA（SSR 已禁用）。
- 组件（`components/`）、Vue/Nuxt composable、Pinia store（`useXxxStore`）均自动导入；`~icons/*` 与 `@tabler/icons-vue` 需显式 import。
- **项目无测试/lint 命令**（package.json 无 test）。验证方式：① 纯函数用 `node` 跑一次性脚本；② UI 用 dev server + 浏览器（可借助 Playwright MCP）；③ 最终 `pnpm build` 确认可编译。
- **首页 `index.vue` 的可见行为必须完全不变**，抽 store 仅替换数据源。
- 编写 Pug 模板前注意 `pug-vue-pitfalls`（class/属性特殊字符、slot 简写等）。
- `discovery/users` 接口实测忽略 `mode`，users 子页不展示 R18 开关。

---

### Task 1: 推荐用户 API 适配层

把 `/ajax/discovery/users` 的三段式返回 join 成 `UserListItem[]`。join 逻辑抽成纯函数 `buildDiscoveryUsers`（可独立用 node 验证），`pixiv-client` 调用它。

**Files:**
- Create: `app/api/discovery-users.ts`
- Modify: `app/api/pixiv-client.ts`（在 `// ── Discovery & Recommendations` 区块末尾、`getRecommendMore` 之后新增方法；确认 `UserListItem` 已在顶部类型 import 中）

**Interfaces:**
- Produces:
  - `buildDiscoveryUsers(body: DiscoveryUsersBody): UserListItem[]`
  - `DiscoveryUsersBody`（raw 返回体类型）
  - `PixivWebClient.getDiscoveryUsers(params: { limit?: number }): Promise<UserListItem[]>`

- [ ] **Step 1: 创建纯 join 函数 `app/api/discovery-users.ts`**

```ts
import type { ArtworkInfo, NovelInfo, UserListItem } from '~/types'

export interface DiscoveryUsersBody {
  recommendedUsers: {
    userId: string
    recentIllustIds: string[]
    recentNovelIds: string[]
  }[]
  users: {
    userId: `${number}`
    name: string
    image: string
    comment: string
    isFollowed: boolean
    followedBack: boolean
    isMypixiv: boolean
    isBlocking: boolean
    commission?: { acceptRequest: boolean } | null
  }[]
  thumbnails: {
    illust?: ArtworkInfo[]
    novel?: NovelInfo[]
  }
}

// Join the relational discovery/users payload into the denormalized
// UserListItem shape consumed by FollowUserCard.
export function buildDiscoveryUsers(body: DiscoveryUsersBody): UserListItem[] {
  const userMap = new Map(body.users.map((u) => [u.userId, u]))
  const illustMap = new Map((body.thumbnails.illust ?? []).map((i) => [i.id, i]))
  const novelMap = new Map((body.thumbnails.novel ?? []).map((n) => [n.id, n]))

  const result: UserListItem[] = []
  for (const rec of body.recommendedUsers) {
    const u = userMap.get(rec.userId as `${number}`)
    if (!u) continue
    result.push({
      userId: u.userId,
      userName: u.name,
      profileImageUrl: u.image,
      userComment: u.comment,
      following: u.isFollowed,
      followed: u.followedBack,
      isBlocking: u.isBlocking,
      isMypixiv: u.isMypixiv,
      illusts: rec.recentIllustIds
        .map((id) => illustMap.get(id as `${number}`))
        .filter((x): x is ArtworkInfo => !!x),
      novels: rec.recentNovelIds
        .map((id) => novelMap.get(id as `${number}`))
        .filter((x): x is NovelInfo => !!x),
      acceptRequest: u.commission?.acceptRequest ?? false,
    })
  }
  return result
}
```

- [ ] **Step 2: 抓取真实样本作为测试 fixture**

用调试 session 拉一份真实返回（不打印密钥）：

```bash
set -a && . ./.env && set +a && curl -s 'https://www.pixiv.net/ajax/discovery/users?limit=20&lang=zh' \
  -H "Cookie: PHPSESSID=$DEBUG_PIXIV_PHPSESSID" \
  -H 'User-Agent: Mozilla/5.0' \
  -H 'Referer: https://www.pixiv.net/discovery/users' \
  -H 'Accept: application/json' > /tmp/disc_users.json
```

Expected: 文件存在，`jq '.error' /tmp/disc_users.json` 输出 `false`。

- [ ] **Step 3: 写并运行 join 验证脚本（先验证它能跑通真实数据）**

```bash
cat > /tmp/test-join.mts <<'EOF'
import { readFileSync } from 'node:fs'
import { buildDiscoveryUsers } from '/Users/xiaoyujun/GitRepositories/PixivNow/app/api/discovery-users.ts'

const body = JSON.parse(readFileSync('/tmp/disc_users.json', 'utf8')).body
const users = buildDiscoveryUsers(body)

if (users.length === 0) throw new Error('FAIL: no users joined')
const u = users[0]
if (!u.userName) throw new Error('FAIL: userName not mapped from name')
if (!u.profileImageUrl) throw new Error('FAIL: profileImageUrl not mapped from image')
if (typeof u.following !== 'boolean') throw new Error('FAIL: following not mapped from isFollowed')
if (!u.illusts.length) throw new Error('FAIL: illusts not joined from recentIllustIds')

console.log('PASS users=' + users.length, 'name=' + u.userName, 'illusts=' + u.illusts.length)
EOF
node --experimental-strip-types /tmp/test-join.mts
```

Expected: 打印 `PASS users=20 name=... illusts=N`（N>0）。若 Node 版本 < 22.6，去掉 `--experimental-strip-types` 改用本地 `pnpm exec tsx`（若不可用则 Node 24 默认已支持类型剥离，直接 `node /tmp/test-join.mts`）。

- [ ] **Step 4: 在 `pixiv-client.ts` 新增方法**

确认文件顶部类型 import 含 `UserListItem`（若无则加入现有 `import type { ... } from '~/types'`），并在 `getRecommendMore` 之后插入：

```ts
  async getDiscoveryUsers(params: {
    limit?: number
  }): Promise<UserListItem[]> {
    const { data } = await this.http.get<PixivResponse<DiscoveryUsersBody>>(
      '/ajax/discovery/users',
      {
        params: {
          limit: String(params.limit ?? 20),
          lang: 'zh',
        },
      }
    )
    return buildDiscoveryUsers(this.unwrap(data))
  }
```

在文件顶部 import 区加入：

```ts
import { buildDiscoveryUsers, type DiscoveryUsersBody } from './discovery-users'
```

- [ ] **Step 5: 提交**

```bash
git add app/api/discovery-users.ts app/api/pixiv-client.ts
git commit -m "feat(api): add getDiscoveryUsers adapter for discovery/users"
```

---

### Task 2: 抽出 `discovery` store（保持首页行为不变）

把 `home.ts` 中 artworks/novels 的 discovery state + actions 迁到新 `discovery` store，首页改为引用新 store。

**Files:**
- Create: `app/stores/discovery.ts`
- Modify: `app/stores/home.ts`
- Modify: `app/pages/index.vue`

**Interfaces:**
- Produces（`useDiscoveryStore`）：`discoveryMode`、`discoveryList`、`loadingDiscovery`、`loadingMoreDiscovery`、`noMoreDiscovery`、`novelDiscoveryList`、`loadingNovelDiscovery`、`loadingMoreNovelDiscovery`、`noMoreNovelDiscovery`、`fetchDiscovery()`、`appendDiscovery()`、`fetchNovelDiscovery()`、`appendNovelDiscovery()`
- `home.ts` 保留：`randomBg`、`fetchRandomBg`、`rankingList`、`loadingRanking`、`fetchRanking`、`followingList`、`loadingFollowing`、`fetchFollowing`

- [ ] **Step 1: 创建 `app/stores/discovery.ts`（从 home.ts 原样搬迁 4 个函数）**

```ts
import { defineStore } from 'pinia'
import type { ArtworkInfo, NovelInfo } from '~/types'

export const useDiscoveryStore = defineStore('discovery', () => {
  const pixivClient = usePixivClient()

  const discoveryMode = ref('all')

  const discoveryList = ref<ArtworkInfo[]>([])
  const loadingDiscovery = ref(false)
  const loadingMoreDiscovery = ref(false)
  const noMoreDiscovery = ref(false)
  const discoverySeenIds = new Set<string>()

  const novelDiscoveryList = ref<NovelInfo[]>([])
  const loadingNovelDiscovery = ref(false)
  const loadingMoreNovelDiscovery = ref(false)
  const noMoreNovelDiscovery = ref(false)
  const novelDiscoverySeenIds = new Set<string>()

  async function fetchDiscovery(): Promise<void> {
    if (loadingDiscovery.value) return
    try {
      loadingDiscovery.value = true
      const illusts = await pixivClient.getDiscovery({ mode: discoveryMode.value, limit: 60 })
      discoverySeenIds.clear()
      noMoreDiscovery.value = false
      illusts.forEach((item) => discoverySeenIds.add(item.id))
      discoveryList.value = illusts
    } catch (err) {
      console.error('Failed to fetch discovery', err)
    } finally {
      loadingDiscovery.value = false
    }
  }

  async function appendDiscovery(): Promise<void> {
    if (loadingMoreDiscovery.value || noMoreDiscovery.value) return
    try {
      loadingMoreDiscovery.value = true
      const illusts = await pixivClient.getDiscovery({ mode: discoveryMode.value, limit: 60 })
      const fresh = illusts.filter((item) => !discoverySeenIds.has(item.id))
      if (!fresh.length) {
        noMoreDiscovery.value = true
        return
      }
      fresh.forEach((item) => discoverySeenIds.add(item.id))
      discoveryList.value = [...discoveryList.value, ...fresh]
    } catch (err) {
      console.error('Failed to append discovery', err)
    } finally {
      loadingMoreDiscovery.value = false
    }
  }

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
      const fresh = novels.filter((item) => !novelDiscoverySeenIds.has(item.id))
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

  return {
    discoveryMode,
    discoveryList,
    loadingDiscovery,
    loadingMoreDiscovery,
    noMoreDiscovery,
    fetchDiscovery,
    appendDiscovery,
    novelDiscoveryList,
    loadingNovelDiscovery,
    loadingMoreNovelDiscovery,
    noMoreNovelDiscovery,
    fetchNovelDiscovery,
    appendNovelDiscovery,
  }
})
```

- [ ] **Step 2: 精简 `app/stores/home.ts`（移除已迁出的 discovery 部分）**

将 `home.ts` 整体替换为：

```ts
import { defineStore } from 'pinia'
import type { ArtworkInfo, RankedArtworkInfo } from '~/types'

export const useHomeStore = defineStore('home', () => {
  const pixivClient = usePixivClient()
  const randomBg = ref<ArtworkInfo | null>(null)

  const rankingList = ref<RankedArtworkInfo[]>([])
  const loadingRanking = ref(false)

  const followingList = ref<ArtworkInfo[]>([])
  const loadingFollowing = ref(false)

  async function fetchRandomBg(): Promise<void> {
    try {
      const illusts = await pixivClient.getDiscovery({ mode: 'safe', limit: 1 })
      if (illusts.length) {
        randomBg.value = illusts[0]!
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function fetchRanking(): Promise<void> {
    if (loadingRanking.value) return
    try {
      loadingRanking.value = true
      const data = await pixivClient.getRanking({ mode: 'daily', content: 'all', p: 1 })
      rankingList.value = data.contents.slice(0, 5)
    } catch (err) {
      console.error('Failed to fetch ranking', err)
    } finally {
      loadingRanking.value = false
    }
  }

  async function fetchFollowing(): Promise<void> {
    if (loadingFollowing.value) return
    try {
      loadingFollowing.value = true
      const data = await pixivClient.getFollowLatest({ p: 1, mode: 'all' })
      followingList.value = data.thumbnails.illust
    } catch (err) {
      console.error('Failed to fetch following', err)
    } finally {
      loadingFollowing.value = false
    }
  }

  return {
    randomBg,
    fetchRandomBg,
    rankingList,
    loadingRanking,
    fetchRanking,
    followingList,
    loadingFollowing,
    fetchFollowing,
  }
})
```

- [ ] **Step 3: 在 `app/pages/index.vue` 把 discovery 数据源切到新 store**

在 `<script setup>` import 区加入：

```ts
import { useDiscoveryStore } from '~/stores/discovery'
```

在 `const homeStore = useHomeStore()` 下一行加入：

```ts
const discoveryStore = useDiscoveryStore()
```

然后把以下对 discovery 相关属性/方法的引用从 `homeStore.` 改为 `discoveryStore.`（其余 `homeStore.` 引用保持不变）：

- template 内：`homeStore.discoveryList` → `discoveryStore.discoveryList`；`homeStore.loadingDiscovery` → `discoveryStore.loadingDiscovery`；`homeStore.novelDiscoveryList` → `discoveryStore.novelDiscoveryList`；`homeStore.loadingNovelDiscovery` → `discoveryStore.loadingNovelDiscovery`；`homeStore.loadingMoreNovelDiscovery` → `discoveryStore.loadingMoreNovelDiscovery`；`homeStore.loadingMoreDiscovery` → `discoveryStore.loadingMoreDiscovery`
- script 内：`homeStore.discoveryMode`（2 处）、`homeStore.novelDiscoveryList`、`homeStore.fetchNovelDiscovery`、`homeStore.fetchDiscovery`（2 处）、`homeStore.appendNovelDiscovery`、`homeStore.appendDiscovery`、以及 `isDiscoveryLoading` 内的 `homeStore.loadingNovelDiscovery`/`homeStore.loadingDiscovery` —— 全部改为 `discoveryStore.`

保持 `homeStore.randomBg` / `fetchRandomBg` / `rankingList` / `loadingRanking` / `fetchRanking` / `followingList` / `loadingFollowing` / `fetchFollowing` 不变。

- [ ] **Step 4: 验证首页行为完全不变**

启动 dev server（若未运行）：`pnpm dev`，浏览器打开 `http://localhost:3000/`，逐项确认：

Expected:
- 「探索发现」区块加载出插画列表
- 切到「小说」tab 正常加载小说
- 切换 R18 下拉（混池/全年龄/R18）会重新拉取
- 「换一批」按钮可刷新
- 滚到底自动加载更多（已登录时）
- URL query（`?tab=`/`?mode=`）与 localStorage 记忆行为与改动前一致
- 浏览器 console 无新增报错

- [ ] **Step 5: 提交**

```bash
git add app/stores/discovery.ts app/stores/home.ts app/pages/index.vue
git commit -m "refactor(store): extract discovery store from home, keep home behavior intact"
```

---

### Task 3: discovery store 增加推荐用户

> `fetchUserDiscovery` / `appendUserDiscovery` 用 `limit: 100`（接口硬上限，实测 101+ 报错）—— 一次拉满当缓冲，配合 Task 6 的增量渲染，并降低小批次整批撞车导致过早判定到底的概率。终止逻辑沿用「单批 0 新增即 `noMore`」。

**Files:**
- Modify: `app/stores/discovery.ts`

**Interfaces:**
- Consumes: `pixivClient.getDiscoveryUsers({ limit })`（Task 1）
- Produces: `userDiscoveryList`、`loadingUserDiscovery`、`loadingMoreUserDiscovery`、`noMoreUserDiscovery`、`fetchUserDiscovery()`、`appendUserDiscovery()`

- [ ] **Step 1: 顶部 import 加上 `UserListItem`**

```ts
import type { ArtworkInfo, NovelInfo, UserListItem } from '~/types'
```

- [ ] **Step 2: 在 novel 相关 state 之后新增 user state**

```ts
  const userDiscoveryList = ref<UserListItem[]>([])
  const loadingUserDiscovery = ref(false)
  const loadingMoreUserDiscovery = ref(false)
  const noMoreUserDiscovery = ref(false)
  const userDiscoverySeenIds = new Set<string>()
```

- [ ] **Step 3: 在 `appendNovelDiscovery` 之后新增两个 action**

```ts
  async function fetchUserDiscovery(): Promise<void> {
    if (loadingUserDiscovery.value) return
    try {
      loadingUserDiscovery.value = true
      const users = await pixivClient.getDiscoveryUsers({ limit: 100 })
      userDiscoverySeenIds.clear()
      noMoreUserDiscovery.value = false
      users.forEach((u) => userDiscoverySeenIds.add(u.userId))
      userDiscoveryList.value = users
    } catch (err) {
      console.error('Failed to fetch user discovery', err)
    } finally {
      loadingUserDiscovery.value = false
    }
  }

  async function appendUserDiscovery(): Promise<void> {
    if (loadingMoreUserDiscovery.value || noMoreUserDiscovery.value) return
    try {
      loadingMoreUserDiscovery.value = true
      const users = await pixivClient.getDiscoveryUsers({ limit: 20 })
      const fresh = users.filter((u) => !userDiscoverySeenIds.has(u.userId))
      if (!fresh.length) {
        noMoreUserDiscovery.value = true
        return
      }
      fresh.forEach((u) => userDiscoverySeenIds.add(u.userId))
      userDiscoveryList.value = [...userDiscoveryList.value, ...fresh]
    } catch (err) {
      console.error('Failed to append user discovery', err)
    } finally {
      loadingMoreUserDiscovery.value = false
    }
  }
```

- [ ] **Step 4: 在 return 中导出新成员**

在 `return { ... }` 内追加：

```ts
    userDiscoveryList,
    loadingUserDiscovery,
    loadingMoreUserDiscovery,
    noMoreUserDiscovery,
    fetchUserDiscovery,
    appendUserDiscovery,
```

- [ ] **Step 5: 提交**

```bash
git add app/stores/discovery.ts
git commit -m "feat(store): add user discovery actions"
```

---

### Task 4: `/discovery` 父布局 + 默认重定向

**Files:**
- Create: `app/pages/discovery.vue`
- Create: `app/pages/discovery/index.vue`

**Interfaces:**
- Consumes: `useDiscoveryStore`（mode + fetch*）、`useUserStore`
- Produces: 父布局含 `<NuxtPage/>`；顶部 tab（router-link）、R18 `FnbSelect`（users 子页隐藏）、「换一批」按钮

- [ ] **Step 1: 创建 `app/pages/discovery.vue`**

```vue
<template lang="pug">
#discovery-view.body-inner
  .discover-header
    h2
      FnbIcon: ITablerCompass
      |  探索发现
    .discover-controls
      .tab-nav
        RouterLink.tab-item(
          v-for='t in tabs',
          :key='t.key',
          :to='t.to',
          :class='{ active: activeKey === t.key }'
        ) {{ t.label }}
      FnbSelect(
        v-if='showModeSelect && userStore.isLoggedIn',
        :model-value='discoveryMode',
        :options='discoveryModeOptions',
        @update:model-value='changeMode'
      )
      FnbButton(:loading='isLoading', @click='refresh', size='sm')
        template(#icon): IFasRandom
        | {{ isLoading ? '加载中' : '换一批' }}
  NuxtPage
</template>

<script lang="ts" setup>
import IFasRandom from '~icons/fa-solid/random'
import { IconCompass as ITablerCompass } from '@tabler/icons-vue'
import { useDiscoveryStore } from '~/stores/discovery'
import { useUserStore } from '~/stores/session'
import { setTitle } from '~/utils/setTitle'

definePageMeta({ name: 'discovery' })

const discoveryStore = useDiscoveryStore()
const userStore = useUserStore()
const route = useRoute()

const discoveryModeOptions = [
  { label: '混池', value: 'all' },
  { label: '全年龄', value: 'safe' },
  { label: 'R18', value: 'r18' },
]

const savedDiscoveryMode = useLocalStorage('pixivnow:discovery-mode', 'all')
const discoveryMode = ref(savedDiscoveryMode.value)
discoveryStore.discoveryMode = discoveryMode.value

const tabs = [
  { key: 'artworks', label: '插画·漫画', to: '/discovery/artworks' },
  { key: 'novels', label: '小说', to: '/discovery/novels' },
  { key: 'users', label: '用户', to: '/discovery/users' },
]

const activeKey = computed(() => {
  if (route.path.startsWith('/discovery/novels')) return 'novels'
  if (route.path.startsWith('/discovery/users')) return 'users'
  return 'artworks'
})

const showModeSelect = computed(() => activeKey.value !== 'users')

const isLoading = computed(() => {
  if (activeKey.value === 'novels') return discoveryStore.loadingNovelDiscovery
  if (activeKey.value === 'users') return discoveryStore.loadingUserDiscovery
  return discoveryStore.loadingDiscovery
})

function refresh() {
  if (activeKey.value === 'novels') discoveryStore.fetchNovelDiscovery()
  else if (activeKey.value === 'users') discoveryStore.fetchUserDiscovery()
  else discoveryStore.fetchDiscovery()
}

function changeMode(mode: string) {
  discoveryMode.value = mode
  savedDiscoveryMode.value = mode
  discoveryStore.discoveryMode = mode
  refresh()
}

onMounted(() => setTitle('探索发现'))
</script>

<style lang="scss" scoped>
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

.tab-nav {
  display: flex;
  gap: 0.25rem;
}

.tab-item {
  padding: 0.3rem 1rem;
  border: 3px solid transparent;
  border-radius: var(--fnb-radius-sm);
  font-weight: 700;
  color: var(--fnb-text-muted);
  text-decoration: none;
  transition: color 150ms, background 150ms;

  &:hover {
    color: var(--fnb-text);
    background: color-mix(in srgb, var(--fnb-brand) 15%, var(--fnb-surface));
  }

  &.active {
    color: #fff;
    background: var(--fnb-brand);
    border-color: var(--fnb-border);
  }
}
</style>
```

- [ ] **Step 2: 创建 `app/pages/discovery/index.vue`（`/discovery` 重定向到 artworks）**

```vue
<template lang="pug">
div
</template>

<script lang="ts" setup>
definePageMeta({
  name: 'discovery-index',
  middleware: () => navigateTo('/discovery/artworks', { replace: true }),
})
</script>
```

- [ ] **Step 3: 验证（子页尚未建，预期空白但布局/重定向可见）**

`pnpm dev`，浏览器打开 `http://localhost:3000/discovery`。

Expected:
- URL 跳转到 `/discovery/artworks`
- 顶部出现「探索发现」标题 + 三个 tab（插画·漫画/小说/用户）+「换一批」按钮
- 点击不同 tab，对应 tab 高亮（active 样式）
- 切到「用户」tab 时 R18 下拉消失，切回其他 tab 又出现
- 下方内容区暂为空（子页 Task 5/6 实现），console 无报错

- [ ] **Step 4: 提交**

```bash
git add app/pages/discovery.vue app/pages/discovery/index.vue
git commit -m "feat(discovery): add /discovery parent layout with tabs and mode switch"
```

---

### Task 5: artworks 与 novels 子页

两个子页结构对称，分别消费 discovery store 的 artworks/novels 数据 + 无限滚动。

**Files:**
- Create: `app/pages/discovery/artworks.vue`
- Create: `app/pages/discovery/novels.vue`

**Interfaces:**
- Consumes: `useDiscoveryStore`（`discoveryList`/`loadingDiscovery`/`loadingMoreDiscovery`/`appendDiscovery`/`fetchDiscovery` 及 novel 对应项）、`useUserStore`、`ArtworkList`、`NovelList`

- [ ] **Step 1: 创建 `app/pages/discovery/artworks.vue`**

```vue
<template lang="pug">
#discovery-artworks
  ArtworkList(
    :list='discoveryStore.discoveryList',
    :loading='discoveryStore.loadingDiscovery'
  )
  .discover-footer(v-if='!discoveryStore.loadingDiscovery')
    .loading-more(v-if='userStore.isLoggedIn && discoveryStore.loadingMoreDiscovery')
      FnbSkeleton(block, height='2rem', width='200px')
    .login-prompt(v-else-if='!userStore.isLoggedIn && discoveryStore.discoveryList.length')
      p 登录后解锁无限浏览
      FnbButton(
        size='sm',
        variant='primary',
        tag='RouterLink',
        to='/login?back=/discovery/artworks'
      )
        template(#icon): ITablerLogin
        | 登录
    div(v-else-if='userStore.isLoggedIn', ref='scrollSentinel')
</template>

<script lang="ts" setup>
import ArtworkList from '~/components/Artwork/ArtworkList.vue'
import { IconLogin as ITablerLogin } from '@tabler/icons-vue'
import { useDiscoveryStore } from '~/stores/discovery'
import { useUserStore } from '~/stores/session'

const discoveryStore = useDiscoveryStore()
const userStore = useUserStore()
const scrollSentinel = ref<HTMLElement | null>(null)

useIntersectionObserver(scrollSentinel, ([{ isIntersecting }]) => {
  if (isIntersecting && userStore.isLoggedIn) {
    discoveryStore.appendDiscovery()
  }
})

onMounted(() => {
  if (!discoveryStore.discoveryList.length) {
    discoveryStore.fetchDiscovery()
  }
})
</script>

<style lang="scss" scoped>
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
</style>
```

- [ ] **Step 2: 创建 `app/pages/discovery/novels.vue`**

```vue
<template lang="pug">
#discovery-novels
  NovelList(
    :list='discoveryStore.novelDiscoveryList',
    :loading='discoveryStore.loadingNovelDiscovery'
  )
  .discover-footer(v-if='!discoveryStore.loadingNovelDiscovery')
    .loading-more(v-if='userStore.isLoggedIn && discoveryStore.loadingMoreNovelDiscovery')
      FnbSkeleton(block, height='2rem', width='200px')
    .login-prompt(v-else-if='!userStore.isLoggedIn && discoveryStore.novelDiscoveryList.length')
      p 登录后解锁无限浏览
      FnbButton(
        size='sm',
        variant='primary',
        tag='RouterLink',
        to='/login?back=/discovery/novels'
      )
        template(#icon): ITablerLogin
        | 登录
    div(v-else-if='userStore.isLoggedIn', ref='scrollSentinel')
</template>

<script lang="ts" setup>
import NovelList from '~/components/Novel/NovelList.vue'
import { IconLogin as ITablerLogin } from '@tabler/icons-vue'
import { useDiscoveryStore } from '~/stores/discovery'
import { useUserStore } from '~/stores/session'

const discoveryStore = useDiscoveryStore()
const userStore = useUserStore()
const scrollSentinel = ref<HTMLElement | null>(null)

useIntersectionObserver(scrollSentinel, ([{ isIntersecting }]) => {
  if (isIntersecting && userStore.isLoggedIn) {
    discoveryStore.appendNovelDiscovery()
  }
})

onMounted(() => {
  if (!discoveryStore.novelDiscoveryList.length) {
    discoveryStore.fetchNovelDiscovery()
  }
})
</script>

<style lang="scss" scoped>
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
</style>
```

- [ ] **Step 3: 验证**

`pnpm dev`，浏览器：
- `http://localhost:3000/discovery/artworks` → 加载插画列表；切换 R18 下拉重新拉取；「换一批」刷新；滚到底自动加载更多（已登录）
- `http://localhost:3000/discovery/novels` → 加载小说列表，同样支持模式切换/换一批/无限滚动

Expected: 两个子页均正常渲染，console 无报错。

- [ ] **Step 4: 提交**

```bash
git add app/pages/discovery/artworks.vue app/pages/discovery/novels.vue
git commit -m "feat(discovery): add artworks and novels sub-pages"
```

---

### Task 6: users 子页（复用 FollowUserCard）

**Files:**
- Create: `app/pages/discovery/users.vue`

**Interfaces:**
- Consumes: `useDiscoveryStore`（`userDiscoveryList`/`loadingUserDiscovery`/`loadingMoreUserDiscovery`/`fetchUserDiscovery`/`appendUserDiscovery`）、`useUserStore`、`Card`、`FollowUserCard`

- [ ] **Step 1: 创建 `app/pages/discovery/users.vue`**

**关键策略（应对 FollowUserCard DOM 较重）：网络层一次拉满 `limit: 100` 入缓冲（Task 3），渲染层用 `visibleCount` 增量 `slice` 显示，首屏只渲染 ~10 张。未登录直接提示登录、不发请求（接口必须登录）。**

```vue
<template lang="pug">
#discovery-users
  //- endpoint requires auth — show login prompt directly, no request
  .login-prompt(v-if='!userStore.isLoggedIn')
    p 推荐用户需要登录后查看
    FnbButton(
      size='sm',
      variant='primary',
      tag='RouterLink',
      to='/login?back=/discovery/users'
    )
      template(#icon): ITablerLogin
      | 登录

  template(v-else)
    .user-list(v-if='visibleUsers.length')
      Card(v-for='u in visibleUsers', :key='u.userId')
        FollowUserCard(:user='u')
    .user-list(v-else-if='discoveryStore.loadingUserDiscovery')
      Card(v-for='n in 4', :key='n')
        FollowUserCard

    .discover-footer(v-if='!discoveryStore.loadingUserDiscovery && visibleUsers.length')
      .loading-more(v-if='discoveryStore.loadingMoreUserDiscovery')
        FnbSkeleton(block, height='2rem', width='200px')
      div(v-else-if='!atEnd', ref='scrollSentinel')
</template>

<script lang="ts" setup>
import { IconLogin as ITablerLogin } from '@tabler/icons-vue'
import { useDiscoveryStore } from '~/stores/discovery'
import { useUserStore } from '~/stores/session'

const discoveryStore = useDiscoveryStore()
const userStore = useUserStore()
const scrollSentinel = ref<HTMLElement | null>(null)

const PAGE_SIZE = 10
const visibleCount = ref(PAGE_SIZE)

const visibleUsers = computed(() =>
  discoveryStore.userDiscoveryList.slice(0, visibleCount.value)
)

// buffer fully revealed AND store says nothing more to fetch
const atEnd = computed(
  () =>
    visibleCount.value >= discoveryStore.userDiscoveryList.length &&
    discoveryStore.noMoreUserDiscovery
)

function loadMore() {
  const buffered = discoveryStore.userDiscoveryList.length
  if (visibleCount.value < buffered) {
    // reveal more from the already-fetched buffer (no request)
    visibleCount.value = Math.min(visibleCount.value + PAGE_SIZE, buffered)
  } else if (!discoveryStore.noMoreUserDiscovery) {
    // buffer exhausted — fetch the next batch of 100
    discoveryStore.appendUserDiscovery()
  }
}

useIntersectionObserver(scrollSentinel, ([{ isIntersecting }]) => {
  if (isIntersecting && userStore.isLoggedIn) loadMore()
})

// reset incremental reveal when the list is replaced by 换一批
watch(
  () => discoveryStore.userDiscoveryList.length,
  (len, oldLen) => {
    if (len < oldLen) visibleCount.value = PAGE_SIZE
  }
)

function maybeFetch() {
  if (userStore.isLoggedIn && !discoveryStore.userDiscoveryList.length) {
    discoveryStore.fetchUserDiscovery()
  }
}

// session init is async — react to login state becoming available
watch(() => userStore.isLoggedIn, () => maybeFetch(), { immediate: true })
onMounted(maybeFetch)
</script>

<style lang="scss" scoped>
.user-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  // Skip render/layout/image-decode for off-screen cards (heavy DOM).
  // `auto` remembers the real height after first paint to avoid scroll jump.
  > * {
    content-visibility: auto;
    contain-intrinsic-size: auto 220px;
  }
}

.discover-footer {
  margin-top: 2rem;
  text-align: center;

  .loading-more {
    display: flex;
    justify-content: center;
  }
}

.login-prompt {
  padding: 2rem;
  text-align: center;
  color: var(--fnb-text-muted);

  p {
    margin-bottom: 0.75rem;
    font-weight: 700;
  }
}
</style>
```

- [ ] **Step 2: 验证（核心功能，需登录态）**

① 未登录：打开 `http://localhost:3000/discovery/users`，应**直接显示「推荐用户需要登录后查看」+ 登录按钮**，且 Network 面板**无** `/ajax/discovery/users` 请求。

② 已登录（浏览器有 PHPSESSID）：

Expected:
- 首屏只渲染约 10 张用户卡片（头像 / 用户名 / 自述 / 4 张作品预览），不卡顿
- 向下滚动从缓冲增量显示更多（前若干次不发新请求）
- 缓冲（100 个）显示完后滚动触发一次新的 `getDiscoveryUsers`（Network 可见），按 `userId` 去重追加
- 关注 / 取关按钮可点击且状态切换
- 顶部无 R18 下拉
- console 无报错

- [ ] **Step 3: 提交**

```bash
git add app/pages/discovery/users.vue
git commit -m "feat(discovery): add recommended users sub-page"
```

---

### Task 7: 启用侧边栏「探索发现」入口

**Files:**
- Modify: `app/components/SideNav/SideNav.vue:15`

- [ ] **Step 1: 替换禁用占位为可用链接**

将：

```pug
          SideNavListLink.not-allowed(link='' text='探索发现')
            IFasImage.link-icon
```

改为：

```pug
          SideNavListLink(link='/discovery' text='探索发现')
            IFasImage.link-icon
```

- [ ] **Step 2: 验证**

`pnpm dev`，打开侧边栏，点击「探索发现」。

Expected: 跳转到 `/discovery`（再重定向到 `/discovery/artworks`），不再有删除线/`not-allowed` 样式。

- [ ] **Step 3: 提交**

```bash
git add app/components/SideNav/SideNav.vue
git commit -m "feat(nav): enable discovery entry in side nav"
```

---

### Task 8: 补充 API 文档

**Files:**
- Modify: `docs/pixiv-web-api.md`（在 §4 Discovery 相关章节后新增；若无独立 Discovery 章节，则置于 §8 Following 之前，并在末尾 Endpoint Summary 表追加一行）

- [ ] **Step 1: 按既有格式新增章节**

```markdown
### GET `/ajax/discovery/users`

Get recommended users (personalized; requires authentication). Ignores the
`mode` param — R18 visibility follows the account's own setting. No
pagination; each call returns a fresh random batch.

| Param   | Type   | Description                       |
| ------- | ------ | --------------------------------- |
| `limit` | number | Number of users (typically `20`)  |
| `lang`  | string | UI language, e.g. `zh`            |

**Response** `body` (relational — join the three arrays):

```jsonc
{
  "recommendedUsers": [
    {
      "userId": "117674738",
      "recentIllustIds": ["145684188", "145364001"],
      "recentNovelIds": []
    }
  ],
  "users": [
    {
      "userId": "117674738",
      "name": "...",
      "image": "https://i.pximg.net/...",   // avatar (50px)
      "imageBig": "https://i.pximg.net/...", // avatar (170px)
      "comment": "...",
      "isFollowed": false,
      "followedBack": false,
      "isMypixiv": false,
      "isBlocking": false,
      "premium": true,
      "commission": { "acceptRequest": true }
    }
  ],
  "thumbnails": {
    "illust": [ /* ArtworkInfo[] — referenced by recentIllustIds */ ],
    "novel":  [ /* NovelInfo[]  — referenced by recentNovelIds  */ ]
  }
}
```

Join `recommendedUsers[]` (order + which works) → `users[]` (by `userId`,
user detail) → `thumbnails.illust` / `thumbnails.novel` (by id) to build a
denormalized user-with-works list.
```

并在文末 Endpoint Summary 表追加：

```markdown
| GET    | `/ajax/discovery/users` | Recommended users |
```

- [ ] **Step 2: 验证**

`grep -n "discovery/users" docs/pixiv-web-api.md`

Expected: 命中新增章节标题与 summary 行。

- [ ] **Step 3: 提交**

```bash
git add docs/pixiv-web-api.md
git commit -m "docs: document /ajax/discovery/users endpoint"
```

---

## 收尾验证

- [ ] **最终编译检查**

```bash
pnpm build
```

Expected: 构建成功，无 TypeScript/模板报错。

- [ ] **全流程回归**

浏览器依次验证：首页 discovery（行为不变）→ 侧边栏入口 → `/discovery` 三个 tab 切换、模式开关、换一批、无限滚动、关注操作。

---

## Self-Review 记录

- **Spec 覆盖**：路由结构(Task 4/5/6)、独立 store(Task 2/3)、用户 API 适配(Task 1)、users 复用 FollowUserCard(Task 6)、R18 开关含 users 隐藏(Task 4)、侧边栏(Task 7)、文档(Task 8)、首页行为不变(Task 2 Step 4) —— 均有对应任务。
- **类型一致性**：`buildDiscoveryUsers` / `DiscoveryUsersBody` / `getDiscoveryUsers` 在 Task 1 定义，Task 3 消费签名一致；store 导出的 `userDiscoveryList` 等命名在 Task 3 定义、Task 4/6 消费一致。
- **Placeholder**：无 TBD/TODO；每个代码步骤均为完整代码。
