# Homepage Redesign Design Spec

## Overview

Redesign the PixivNow homepage from a full-screen hero + discovery grid into a tool-oriented navigation page with search as the primary entry point, quick-access links, user status, ranking carousel, following feed, and infinite-scroll discovery.

## Layout Structure (top to bottom)

### 1. Hero Section (~50vh)

Random Pixiv artwork as background image (shrunk from current 100vh). Contains:

- **Logo** centered
- **Slogan** "Now, everyone can enjoy Pixiv"
- **Search box** large, centered (reuses existing `SearchBox.big`)
- **Quick links** below the search box: Neubrutalism-styled tag buttons linking to Ranking (`/ranking`), Following (`/following`), Explore (scrolls to discovery section), Novel (placeholder, disabled/grayed)
- **Background controls** bottom-right: shuffle button + info button (same as current)
- **Background info dialog** same as current implementation

The navbar remains transparent on home and becomes opaque on scroll (existing `data-route="home"` behavior).

### 2. User Status Card

A compact horizontal card placed inside `.body-inner`, between Hero and the two-column area.

**Logged in:**
- Avatar + username + `@pixivId`
- Premium badge (if `user.premium`)
- Quick action buttons: My Bookmarks, My Following, Token Settings

**Not logged in:**
- Default avatar + "Guest" label
- Prompt text + login button

Styled with `@include fnb-card` (border + shadow + surface bg).

### 3. Two-Column Content Area (CSS Grid)

Grid layout: `grid-template-columns: 1fr 340px` on desktop, collapses to `1fr` below 768px.

#### Left Column: Ranking Carousel (Top 5)

Port the `HeroCarousel` component from PicaComicNow (`/Users/xiaoyujun/GitRepositories/PicaComicNow/app/components/HeroCarousel.vue`). Adaptations needed:

- Accept `ArtworkRank[]` instead of `PicaLeaderboardItem[]`
- Image source: use artwork thumbnail via `toRegularUrl()`
- Metadata: rank number, title, author name, bookmark count (instead of view count)
- Link target: `/artworks/{id}` instead of `/book/{id}`
- "View full ranking" link: `/ranking` instead of `/leaderboard`
- Keep: auto-play (5s), pause on hover, arrow/dot navigation, fade transition
- Reuse existing Neubrutalism styling (already uses same design tokens)

Data source: `pixivClient.getRanking({ mode: 'day', content: 'illust' })` — take first 5 items.

#### Right Column: Following Updates

A compact list of recent artworks from followed users. Each item shows:
- Square thumbnail (small, ~48px)
- Artwork title (single line, ellipsis)
- Author name with `@` prefix

Bottom link: "More" pointing to `/following`.

**Not logged in:** Show a prompt card encouraging login.

Data source: `pixivClient.getFollowLatest({ p: 1, mode: 'all' })` — display ~6 items.

On narrow screens (<768px), the two columns stack vertically: ranking carousel on top, following updates below.

### 4. Discovery Section (Explore)

Section title "Explore" with a "Shuffle" button.

**Tabs:** All / Illustration / Manga / Novel — only "All" is functional for now; other tabs are rendered but disabled/grayed with a "coming soon" indicator. The tab UI is prepared for future expansion.

**Content grid:** Artwork cards in a responsive flex-wrap grid (reuses existing `ArtworkList` component).

**Infinite scroll (logged in):**
- On reaching bottom, fetch another batch via `pixivClient.getDiscovery()`
- Client-side dedup using a `Set<string>` storing artwork IDs — filter out duplicates before appending
- Loading indicator at bottom during fetch

**Not logged in:**
- Show one batch (8 artworks)
- Bottom prompt: "Log in to unlock infinite browsing" with login button

## Store Changes (`stores/home.ts`)

Expand the existing `useHomeStore` to support:

- `rankingList: ArtworkRank[]` + `fetchRanking()` — fetches daily illust ranking, stores top 5
- `followingList: ArtworkInfo[]` + `fetchFollowing()` — fetches page 1 of follow latest
- `discoverySeenIds: Set<string>` — dedup set for infinite scroll
- `discoveryPage: number` — logical page counter (for loading state management)
- `hasMoreDiscovery: boolean` — controls infinite scroll (false when not logged in)
- `appendDiscovery()` — fetches a batch, deduplicates against `discoverySeenIds`, appends to `discoveryList`

Existing `fetchRandomBg()` and `fetchDiscovery()` are retained/refactored.

## New Components

| Component | Description |
|-----------|-------------|
| `RankingCarousel.vue` | Ported from PicACG HeroCarousel, adapted for `ArtworkRank` |
| `UserStatusCard.vue` | Compact user info card with quick actions |
| `FollowingLatest.vue` | Compact list of recent followed-user artworks |
| `DiscoveryTabs.vue` | Tab bar for discovery categories (only "All" active initially) |

## Pages Modified

| File | Changes |
|------|---------|
| `app/pages/index.vue` | Complete rewrite — new layout with all sections |
| `app/stores/home.ts` | Add ranking, following, infinite scroll logic |

## Responsive Breakpoints

- `>=768px`: Two-column grid layout for ranking + following
- `<768px`: Single column, stacked vertically
- `<450px`: Existing navbar search collapse behavior preserved

## Data Flow

```
onMounted (index.vue)
  ├── homeStore.fetchRandomBg()         → Hero background
  ├── homeStore.fetchRanking()          → Ranking carousel (top 5)
  ├── homeStore.fetchFollowing()        → Following list (if logged in)
  └── homeStore.fetchDiscovery()        → Initial discovery batch
      └── on scroll bottom (if logged in)
          └── homeStore.appendDiscovery()  → Next batch, deduped
```

## API Dependencies

All APIs already exist in `PixivWebClient`:
- `getDiscovery({ mode, max })` — discovery/random artworks
- `getRanking({ mode, content })` — daily ranking
- `getFollowLatest({ p, mode })` — followed users' latest works

## Out of Scope

- Novel tab functionality (placeholder only)
- Illustration/Manga tab filtering (placeholder only)
- Server-side dedup for discovery (client-side Set is sufficient)
- New API endpoints (all needed endpoints exist)
