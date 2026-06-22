# 统一探索发现页 `/discovery` 设计文档

日期：2026-06-23

## 背景与目标

侧边栏预留了「探索发现」入口（目前 disabled）。当前 artworks/novels 的 discovery 逻辑散落在首页 `index.vue` + `home.ts` store 中。本次将其整合为独立的 `/discovery` 页面，并新增「推荐用户」子页面。

最终形态：一个 `/discovery` 父页面，顶部 tab 切换三个子路由（artworks / novels / users），右侧一个 R18 模式开关。布局风格参照 following。

## 关键接口验证结论

以下结论均通过 `DEBUG_PIXIV_PHPSESSID` 实际请求 `/ajax/discovery/users?limit=20&lang=zh` 验证，非推测：

1. **返回为关系型三段式结构**，需 join：
   - `body.recommendedUsers[]`：`{ userId, recentIllustIds[], recentNovelIds[] }` —— 推荐顺序 + 每个用户展示哪些作品
   - `body.users[]`：用户详情，字段命名为 `name` / `image` / `imageBig` / `comment` / `isFollowed` / `followedBack` / `isMypixiv` / `isBlocking` / `premium` / `commission`（即 `User` 风格，**非** `UserListItem` 的 `userName` / `profileImageUrl` 等）
   - `body.thumbnails.illust[]`：标准 `ArtworkInfo` 形状的作品缩略图，靠 `recentIllustIds` 关联
2. **接口忽略 `mode` 参数**：实测 `mode=safe/all/r18` 返回的 R18 占比仅随机波动，无过滤效果。用户推荐只跟随账号自身 R18 设置 → users 子页无法提供有效的 R18 开关。
3. **无分页**：无 `offset` / `total`，每次返回随机一批。复用首页现有「seenIds 去重 + 追加」模式做无限滚动。
4. artworks/novels 的 discovery 接口**支持** `mode`（现有 `getDiscovery` / `getNovelDiscovery` 已用 all/safe/r18）。

## 架构设计

### 1. 路由结构（Nuxt 嵌套路由）

```
app/pages/discovery.vue          父布局：标题 + 顶部 tab + R18 开关 + 换一批按钮 + <NuxtPage/>
app/pages/discovery/artworks.vue 插画·漫画子页
app/pages/discovery/novels.vue   小说子页
app/pages/discovery/users.vue    推荐用户子页
```

- `/discovery` 重定向到 `/discovery/artworks`（在父布局或 `discovery/index.vue` 中 `navigateTo`）。
- 顶部 tab 使用 **router-link** 切换子路由（高亮当前激活路由），而非 in-page panel。
- 父布局持有共享控件（R18 开关、换一批）；切换 mode 或点换一批时，父布局依据当前路由调用对应子页 store 的 `fetch*`。

### 2. 独立 `discovery` store（`app/stores/discovery.ts`）

从 `home.ts` 抽离**纯 discovery 相关**的 state/actions：

- 迁出：`discoveryList`、`novelDiscoveryList` 及各自的 `loading*` / `seenIds` / `noMore*` 标志、`discoveryMode`、`fetchDiscovery` / `appendDiscovery` / `fetchNovelDiscovery` / `appendNovelDiscovery`
- **保留在 `home.ts`**：`randomBg` / `fetchRandomBg`（hero 背景，虽调用 `getDiscovery` 但与发现列表无关）、`rankingList` / `fetchRanking`、`followingList` / `fetchFollowing`
- 新增 users 部分：`userDiscoveryList` / `loadingUserDiscovery` / `loadingMoreUserDiscovery` / `noMoreUserDiscovery` / `userDiscoverySeenIds` + `fetchUserDiscovery` / `appendUserDiscovery`（结构对齐现有 artworks/novels 的 fetch/append）

**约束：首页 `index.vue` 行为完全不变。** 仅将其 discovery 数据源从 `home.ts` 改为引用新 `discovery` store，所有现有交互（tab 切换、mode 切换、换一批、无限滚动、URL query 同步、localStorage 记忆）保持原样。

### 3. 推荐用户 API 适配层（`pixiv-client.ts`）

新增 `getDiscoveryUsers({ limit })`，**在 client 内部完成三段 join**，返回干净的 `UserListItem[]`，使 store 与组件零改动复用 following 那套。

字段映射：

| `UserListItem` 字段 | `discovery/users` 来源 |
| --- | --- |
| `userId` | `users[].userId` |
| `userName` | `users[].name` |
| `profileImageUrl` | `users[].image` |
| `userComment` | `users[].comment` |
| `following` | `users[].isFollowed` |
| `followed` | `users[].followedBack` |
| `isMypixiv` | `users[].isMypixiv` |
| `isBlocking` | `users[].isBlocking` |
| `acceptRequest` | `users[].commission?.acceptRequest` |
| `illusts` | `recommendedUsers[].recentIllustIds` join `thumbnails.illust`（按 id 匹配，保持顺序） |
| `novels` | `recommendedUsers[].recentNovelIds` join `thumbnails.novel`（若存在，否则 `[]`） |

- 顺序以 `recommendedUsers[]` 为准，按 `userId` 关联 `users[]` 详情。
- `thumbnails.illust` 的形状与现有 `getDiscovery` 处理的一致，沿用同样的取字段方式构造 `ArtworkInfo`。

### 4. users 子页（`discovery/users.vue`）

- 渲染列表：复用 `FollowUserCard`（接收 `UserListItem`）+ `Card` 包裹 + `ShowMore`/无限滚动。
- 关注 / 取关：复用现有 `user-profile` store 的 `followUser` / `unfollowUser`（`FollowUserCard` 内部已实现）。
- 无限滚动：滚到底自动 `appendUserDiscovery`，用 `userDiscoverySeenIds` 按 `userId` 去重；连续无新增时置 `noMoreUserDiscovery`。
- 未登录态参照现有 discovery 的登录提示处理。

### 5. R18 开关

- 父布局 `FnbSelect`，选项复用首页 `discoveryModeOptions`（混池 / 全年龄 / R18）。
- artworks/novels 子页：映射到 store 的 `discoveryMode` → `mode` 参数。
- **users 子页：隐藏开关**（接口忽略 mode，诚实地不展示）。

### 6. 侧边栏（`SideNav.vue`）

将禁用的「探索发现」项改为 `link='/discovery'`，去掉 `not-allowed` 占位。

### 7. 文档（`docs/pixiv-web-api.md`）

按既有格式新增 `/ajax/discovery/users` 接口章节：endpoint、参数表、`jsonc` 响应示例（含三段式结构说明）。

## 复用一览

| 复用项 | 来源 |
| --- | --- |
| 用户卡片 | `FollowUserCard.vue` + `Card.vue` |
| 加载更多 | `ShowMore.vue` + `useIntersectionObserver` |
| tab 栏 | 参照 following / 排行榜布局（router-link tab） |
| R18 开关 | `FnbSelect` + `discoveryModeOptions` |
| 作品 / 小说列表 | `ArtworkList.vue` / `NovelList.vue` |
| 关注操作 | `user-profile` store |
| artworks/novels 发现逻辑 | 从 `home.ts` 抽出的 fetch/append actions |

## 不做的事（YAGNI）

- 不为 users 子页实现客户端 R18 过滤（直接隐藏开关）。
- 不改动首页 discovery 的任何可见行为，仅换数据源。
- 不引入新的通用 toggle/switch 组件（项目无此组件，沿用 `FnbSelect`）。
- 不处理 `recommendByTag` / `requests` / `illustSeries` 等返回中的额外字段。
