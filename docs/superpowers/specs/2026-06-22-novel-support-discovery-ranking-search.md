# Novel Support: Discovery, Ranking, Search

## Overview

Enable novel (小说) support in three modules: home discovery, ranking, and search. All three already have disabled UI placeholders — this work activates them with real data.

## Verified API Endpoints

| Module | Endpoint | Auth | Response shape |
|--------|----------|------|---------------|
| Discovery | `GET /ajax/novel/discovery?mode=<safe\|all>&limit=N` | No | `{ novels: NovelInfo[], details: {} }` |
| Search | `GET /ajax/search/novels/{keyword}?p=N&mode=<mode>` | No | `{ novel: { data: NovelInfo[], total, lastPage }, popular: { recent, permanent } }` |
| Ranking | `GET /ajax/ranking/novel?mode=<mode>&p=N` | No | `{ display_a: { rank_a: NovelRankItem[], mode, page, title }, date }` |

### Ranking modes (novel)

No auth: `daily`, `weekly`, `monthly`, `rookie`, `male`, `female`
Requires auth: `daily_r18`, `weekly_r18`, `weekly_r18_ai`, `male_r18`, `female_r18`
Not supported: `original`, `daily_ai`, `daily_r18_ai`

### Ranking item structure (snake_case, needs conversion)

```
NovelRankItem {
  id, title, rank, user_id, user_name, profile_img, url,
  bookmark_count, character_count, word_count, reading_time,
  genre, is_original, language, series_id, series_title,
  tag_a, ai_type, x_restrict, restrict, create_date, comment, marker
}
```

## Design Decisions

- **SDK-level normalization**: All ranking endpoints (both artwork and novel) normalize snake_case API responses to camelCase types (`ArtworkInfo` / `NovelInfo`) at the API client layer. Components receive a single consistent type and carry no conversion logic. This also fixes the existing `ArtworkLargeList.convertRankToInfo` hack (with `@ts-ignore`) by moving it into `pixiv-client.ts`.
- **Display mode**: Tab switching — selecting "novel" replaces the entire content area with `NovelList`, mutually exclusive with artwork views.

## Module Changes

### 1. API Client (`app/api/pixiv-client.ts`)

**Refactor existing:**

- `getRanking()` — normalize return type from `ArtworkRank[]` to `RankedArtworkInfo[]` (where `RankedArtworkInfo = ArtworkInfo & { rank: number }`). Move the conversion logic currently in `ArtworkLargeList.vue#convertRankToInfo` into the client.

**Add three methods:**

- `getNovelDiscovery(params: { mode?, limit? }): Promise<NovelInfo[]>` — calls `/ajax/novel/discovery`, returns `body.novels`
- `searchNovels(keyword, params: { p?, mode? }): Promise<{ data: NovelInfo[], total: number }>` — calls `/ajax/search/novels/{keyword}`, returns `body.novel`
- `getNovelRanking(params: { mode?, p? }): Promise<{ date: string, contents: RankedNovelInfo[] }>` — calls `/ajax/ranking/novel`, normalizes `display_a.rank_a` from snake_case to `RankedNovelInfo` (where `RankedNovelInfo = NovelInfo & { rank: number }`)

### 2. Home Store (`app/stores/home.ts`)

Add parallel state for novel discovery:

- `novelDiscoveryList: NovelInfo[]`
- `loadingNovelDiscovery`, `loadingMoreNovelDiscovery`: booleans
- `novelDiscoverySeenIds: Set<string>` for dedup
- `fetchNovelDiscovery()`, `appendNovelDiscovery()` — mirror artwork discovery methods

### 3. Home Page (`app/pages/index.vue`)

- Enable the "小说" tab in `DiscoveryTabs`
- When novel tab active: show `NovelList` with `homeStore.novelDiscoveryList`
- Wire infinite scroll to `appendNovelDiscovery()` when in novel mode
- Mode selector (safe/all/r18) applies to novel discovery too

### 4. Discovery Tabs (`app/components/DiscoveryTabs.vue`)

- Remove `disabled: true` from the novel tab entry

### 5. Search Store (`app/stores/search.ts`)

Add novel search state:

- `novelResults: NovelInfo[]`, `novelTotal: number`
- `searchNovels(keyword, params)` method

### 6. Search Page (`app/pages/search/[keyword]/[p].vue`)

- Add content type toggle (artworks / novels) — synced to query param `?type=novel`
- When type=novel: call `searchStore.searchNovels()`, render `NovelList`
- Pagination works the same way

### 7. Ranking Store (`app/stores/ranking.ts`)

**Refactor existing:**

- `rankingData.contents` type changes from `ArtworkRank[]` to `RankedArtworkInfo[]`

**Add novel ranking state:**

- `novelRankingData: { date: Date, contents: RankedNovelInfo[] } | null`
- `fetchNovelRanking(params)` method

### 8. Ranking Page (`app/pages/ranking.vue`)

- Enable "小说" in content filter (remove `disabled: true`)
- When content=novel: call `rankingStore.fetchNovelRanking()`, render `NovelList` instead of `ArtworkLargeList`
- Filter available modes to only those supported by novel ranking (hide original, add r18_ai variants)

### 9. ArtworkLargeList (`app/components/Artwork/ArtworkLargeList.vue`)

- Remove `convertRankToInfo` function and `[ArtworkInfo, number]` tuple pattern
- Simplify: accept `RankedArtworkInfo[]` directly, read `item.rank` from the object itself

### 10. Types

- Add `RankedArtworkInfo = ArtworkInfo & { rank: number }` — normalized artwork ranking item
- Add `RankedNovelInfo = NovelInfo & { rank: number }` — normalized novel ranking item
- Add `NovelRankItem` — raw snake_case API type, internal to pixiv-client
- `ArtworkRank` — remains as raw API type, internal to pixiv-client

## Component Reuse

All three modules render novel results with the existing `NovelList` + `NovelCard` components. No new UI components needed.

### 11. API Documentation (`docs/pixiv-web-api.md`)

Add comprehensive novel API section covering all known endpoints:

**Novel detail & content:**
- `GET /ajax/novel/{id}` — novel detail (already implemented)
- `GET /ajax/novel/{id}/recommend/init?limit=N` — related recommendations, returns `{ novels: NovelInfo[], nextIds: string[], details }`
- `GET /ajax/novel/recommend/novels?novelIds[]=...` — batch novel info by ids, returns `{ novels: NovelInfo[] }`

**Novel comments:**
- `GET /ajax/novels/comments/roots?novel_id={id}&offset=N&limit=N` — root comments, returns `{ comments: Comment[], hasNext }`

**User novels:**
- `GET /ajax/user/{uid}/novels?ids[]=...` — user's novels by ids, returns `Record<id, NovelInfo>`
- `GET /ajax/user/{uid}/novels/tags` — user's novel tags, returns `{ tag, tag_translation, tag_yomigana, cnt }[]`

**Novel series:**
- `GET /ajax/novel/series/{id}` — series info (already implemented)
- `GET /ajax/novel/series_content/{id}?limit=N&last_order=N&order_by=asc` — series content list (already implemented)
- `GET /ajax/novel/series/{id}/content_titles` — series title list (already implemented)

**Discovery, search, ranking:**
- `GET /ajax/novel/discovery?mode=<safe|all>&limit=N` — novel discovery (no auth), returns `{ novels: NovelInfo[], details }`
- `GET /ajax/search/novels/{keyword}?p=N&mode=<mode>` — novel search, returns `{ novel: { data, total, lastPage }, popular: { recent, permanent } }`
- `GET /ajax/ranking/novel?mode=<mode>&p=N` — novel ranking, returns `{ display_a: { rank_a, mode, page, title }, date }`

## Scope Exclusions

- No novel bookmark search (user bookmarks remain artwork-only for now)
- No novel-specific mode filters beyond what Pixiv API supports
- No novel content in the "following" sidebar
- Novel detail page enhancements (recommend, comments) are out of scope for this PR
