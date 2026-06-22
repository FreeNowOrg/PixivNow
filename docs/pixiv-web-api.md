# Pixiv Web API (AJAX endpoint) Reference

> Reverse-engineered from pixiv.net web client. All endpoints are under `https://www.pixiv.net/` unless noted otherwise.

---

## 1. Authentication & Session

### 1.1 Session Cookie

All authenticated requests require the `PHPSESSID` cookie. Obtain it by logging in to pixiv.net via browser and extracting the cookie value.

### 1.2 CSRF Token

Write operations (POST) require an `X-CSRF-TOKEN` header. The token can be extracted from the homepage HTML:

**Method A** — Legacy `<meta>` tag:

```html
<meta name="global-data" content='{"token":"<CSRF_TOKEN>","userData":{...}}' />
```

Parse the JSON from `content` attribute, read the `token` field.

**Method B** — Next.js data (current):

```html
<script id="__NEXT_DATA__" type="application/json">
  ...
</script>
```

Parse the JSON, then:

```
JSON.parse(nextData.props.pageProps.serverSerializedPreloadedState).api.token
```

The same `__NEXT_DATA__` also contains `userData.self` for the logged-in user's profile.

### 1.3 Required Request Headers

All API requests to `www.pixiv.net` should include:

| Header            | Value                                       |
| ----------------- | ------------------------------------------- |
| `User-Agent`      | A modern browser UA string                  |
| `Referer`         | `https://www.pixiv.net/`                    |
| `Origin`          | `https://www.pixiv.net`                     |
| `Accept-Language` | e.g. `zh-CN,zh;q=0.9,en;q=0.8`              |
| `Cookie`          | `PHPSESSID=<session_id>`                    |
| `X-CSRF-TOKEN`    | _(POST only)_ CSRF token obtained from §1.2 |

You can use `navigator.userAgent` in your Chrome to get a valid User-Agent string. e.g. `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36`

---

## 2. Image CDN

Pixiv serves images from separate CDN domains. Requests to these domains **must** include `Referer: https://www.pixiv.net/` or they will be rejected (HTTP 403).

| Domain                | Purpose                           |
| --------------------- | --------------------------------- |
| `https://i.pximg.net` | Artwork images, user avatars      |
| `https://s.pximg.net` | Static assets (stamps, UI images) |

### Image URL Structure

All artwork image URLs follow a unified structure:

```
https://i.pximg.net/[c/{size}/]{path_segment}/img/{yyyy}/{MM}/{dd}/{HH}/{mm}/{ss}/{illust_id}_p{page}[_{suffix}].{ext}
```

The `{yyyy/MM/dd/HH/mm/ss}` portion is the artwork's `updateDate` in `Asia/Tokyo` (JST) timezone.

### Quality Levels

Pixiv provides 5 quality levels for each artwork image:

| Level      | Example URL                                                                      | Path Segment   | Size Prefix        | Filename Suffix |
| ---------- | -------------------------------------------------------------------------------- | -------------- | ------------------ | --------------- |
| `mini`     | `https://i.pximg.net/c/48x48/img-master/img/.../12345_p0_square1200.jpg`         | `img-master`   | `c/48x48/`         | `_square1200`   |
| `thumb`    | `https://i.pximg.net/c/250x250_80_a2/img-master/img/.../12345_p0_square1200.jpg` | `img-master`¹  | `c/250x250_80_a2/` | `_square1200`¹  |
| `small`    | `https://i.pximg.net/c/540x540_70/img-master/img/.../12345_p0_master1200.jpg`    | `img-master`   | `c/540x540_70/`    | `_master1200`   |
| `regular`  | `https://i.pximg.net/img-master/img/.../12345_p0_master1200.jpg`                 | `img-master`   | _(none)_           | `_master1200`   |
| `original` | `https://i.pximg.net/img-original/img/.../12345_p0.jpg`                          | `img-original` | _(none)_           | _(none)_        |

> ¹ The `thumb` level path segment may be `custom-thumb` instead of `img-master`, in which case the filename suffix is `_custom1200`. This depends on whether the artist has set a custom thumbnail crop.

### Size Prefix Format

The size parameter after `/c/` follows the format `{W}x{H}[_{param1}[_{param2}...]]`. The parameters are not fixed:

- `48x48` — width and height only
- `540x540_70` — width, height, and quality parameter
- `250x250_80_a2` — width, height, and multiple parameters

### URL Conversion Rules

Given any quality level URL, other levels can be derived using these rules:

**→ regular** (derive regular from any URL):

1. Strip the `/c/{size}/` prefix
2. Normalize path segment to `img-master` (`custom-thumb` → `img-master`)
3. Normalize filename suffix to `_master1200` (`_square1200`/`_custom1200` → `_master1200`)

**→ original** (derive original from any URL):

1. Strip the `/c/{size}/` prefix
2. Normalize path segment to `img-original` (`img-master`/`custom-thumb` → `img-original`)
3. Remove filename suffix (`_square1200`/`_custom1200`/`_master1200` → removed)

> ⚠️ The actual file extension of the original may differ from `.jpg` (e.g. `.png`). URL derivation can only guess the extension; callers should handle 404 responses.

### Recommended SDK Interfaces

SDK implementations should provide two approaches for obtaining all quality level URLs:

**Approach A — Derive from a known URL (preferred)**

When at least one image URL is available (e.g. from the API's `urls` field or a thumbnail `url`), derive all levels via string transformation. This approach requires no additional information and correctly handles special path segments like `custom-thumb`.

```
ToRegularURL(imageURL) → regular URL
ToOriginalURL(imageURL) → original URL
```

**Approach B — Build from illustId + updateDate**

When only the artwork ID and update time are available (no image URL), all URLs can be constructed directly:

```
BuildIllustURLs(illustId, updateDate, page) → { mini, thumb, small, regular, original }
```

> Note: This approach always uses `img-master` for the `thumb` path segment and cannot reproduce `custom-thumb`. For scenarios requiring exact thumbnails, fetch the `urls` field from the API instead.

**Applicability by Endpoint**

Some API endpoints (e.g. `/ajax/illust/{id}`) return a complete `urls` object — no conversion needed. Others return only partial information:

| Endpoint                   | Returns              | Recommended  |
| -------------------------- | -------------------- | ------------ |
| `/ajax/illust/{id}`        | Full `urls` object   | Use directly |
| `/ajax/illust/{id}/pages`  | Full `urls`          | Use directly |
| `/ranking.php`             | Thumbnail `url` only | Approach A   |
| `/ajax/discovery/artworks` | Thumbnail `url`      | Approach A   |
| `/ajax/illust/discovery`   | Thumbnail `url`      | Approach A   |
| Only id + updateDate known | No URL available     | Approach B   |

### URL Conversion Examples

```
Input (mini):        https://i.pximg.net/c/48x48/img-master/img/2026/03/22/00/00/19/142584954_p0_square1200.jpg
→ regular:           https://i.pximg.net/img-master/img/2026/03/22/00/00/19/142584954_p0_master1200.jpg
→ original:          https://i.pximg.net/img-original/img/2026/03/22/00/00/19/142584954_p0.jpg

Input (thumb/custom): https://i.pximg.net/c/250x250_80_a2/custom-thumb/img/2024/10/27/00/08/15/123706421_p0_custom1200.jpg
→ regular:           https://i.pximg.net/img-master/img/2024/10/27/00/08/15/123706421_p0_master1200.jpg
→ original:          https://i.pximg.net/img-original/img/2024/10/27/00/08/15/123706421_p0.jpg

Input (ranking):     https://i.pximg.net/c/480x960/img-master/img/2026/03/21/09/39/18/142555360_p0_master1200.jpg
→ regular:           https://i.pximg.net/img-master/img/2026/03/21/09/39/18/142555360_p0_master1200.jpg
→ original:          https://i.pximg.net/img-original/img/2026/03/21/09/39/18/142555360_p0.jpg
```

---

## 3. Artwork Endpoints

### 3.1 GET `/ajax/illust/{id}?full=1`

Get full artwork details.

**Response** `body`:

```jsonc
{
  "id": "12345678",
  "title": "...",
  "description": "...",       // HTML
  "illustType": 0,            // 0=illust, 1=manga, 2=ugoira
  "createDate": "...",        // ISO 8601
  "updateDate": "...",
  "urls": { "mini", "thumb", "small", "regular", "original" },
  "tags": { "tags": [{ "tag": "...", "translation": { "en": "..." } }] },
  "width": 1920,
  "height": 1080,
  "pageCount": 1,
  "bookmarkCount": 100,
  "likeCount": 50,
  "commentCount": 10,
  "viewCount": 1000,
  "userId": "...",
  "userName": "...",
  "userAccount": "...",
  "bookmarkData": null,       // null = not bookmarked; { id, private } = bookmarked
  "isBookmarkable": true,
  // ... many more fields
}
```

### 3.2 GET `/ajax/illust/{id}/pages`

Get all pages of a multi-page artwork.

**Response** `body`: array of:

```jsonc
{
  "urls": {
    "thumb_mini": "https://i.pximg.net/c/128x128/...",
    "small": "https://i.pximg.net/c/540x540_70/...",
    "regular": "https://i.pximg.net/img-master/...",
    "original": "https://i.pximg.net/img-original/...",
  },
  "width": 1920,
  "height": 1080,
}
```

### 3.3 GET `/ajax/illust/{id}/ugoira_meta`

Get ugoira (animated illustration) metadata.

**Response** `body`:

```jsonc
{
  "src": "https://i.pximg.net/img-zip-ugoira/..._ugoira600x600.zip",
  "originalSrc": "https://i.pximg.net/img-zip-ugoira/..._ugoira1920x1080.zip",
  "mime_type": "image/jpeg",
  "frames": [
    { "file": "000000.jpg", "delay": 100 },
    { "file": "000001.jpg", "delay": 100 },
    // ...
  ],
}
```

The `src`/`originalSrc` is a ZIP archive containing the frame images. Extract frames and render them according to each frame's `delay` (milliseconds).

---

## 4. Discovery & Recommendations

There are two discovery endpoints. The new one requires authentication; the legacy one works anonymously but has stricter limits.

### 4.1 GET `/ajax/discovery/artworks` (New, Auth Required)

Discover random artworks. **Requires authentication** (returns 401 without a valid session).

| Param   | Type   | Default | Description            |
| ------- | ------ | ------- | ---------------------- |
| `mode`  | string | `safe`  | `safe` / `all` / `r18` |
| `limit` | string | `60`    | Max number of results  |

**Response** `body`:

```jsonc
{
  "thumbnails": {
    "illust": [
      // Array of ArtworkInfo objects (same shape as §3.1 but abbreviated)
      // May include ad objects: { "isAdContainer": true, ... }
      // Filter by checking for the presence of "id" field
    ],
  },
}
```

### 4.1.1 GET `/ajax/illust/discovery` (Legacy, No Auth)

Legacy discovery endpoint. **Does not require authentication**, but has a lower result limit and does not support `r18` mode without a session.

| Param  | Type   | Default | Description                                        |
| ------ | ------ | ------- | -------------------------------------------------- |
| `mode` | string | `safe`  | `safe` / `all` (`r18` requires auth, same as §4.1) |
| `max`  | string | `18`    | Max number of results (hard limit: **18**)         |

**Response** `body`:

```jsonc
{
  "illusts": [
    // Same ArtworkInfo shape as §4.1, but wrapped in "illusts" instead of "thumbnails.illust"
    // May include ad objects: { "isAdContainer": true, ... }
  ],
}
```

> **Usage note:** Use §4.1 when a user session is available and fall back to §4.1.1 for anonymous access. The `max` parameter on the legacy endpoint is clamped to 18 regardless of the requested value.

### 4.2 GET `/ajax/discovery/novels` (New, Auth Required)

Discover novels. **Requires authentication.** Supports R18 mode.

| Param   | Type   | Default | Description            |
| ------- | ------ | ------- | ---------------------- |
| `mode`  | string | `safe`  | `safe` / `all` / `r18` |
| `limit` | number | —       | Max number of results  |

**Response** `body`:

```jsonc
{
  "thumbnails": {
    "novel": [
      // Array of NovelInfo objects (see §12)
    ]
  },
  "recommendedNovelIds": [ "12345", "67890", ... ],
  "recommendNovelDetails": { /* keyed by novel ID */ }
}
```

### 4.2.1 GET `/ajax/novel/discovery` (Legacy, No Auth)

Legacy novel discovery endpoint. **Does not require authentication**, but does not support `r18` mode.

| Param   | Type   | Default | Description       |
| ------- | ------ | ------- | ----------------- |
| `mode`  | string | `safe`  | `safe` / `all`    |
| `limit` | number | —       | Number of results |

**Response** `body`:

```jsonc
{
  "novels": [
    // Array of NovelInfo objects (see §12)
    // Wrapped in "novels" instead of "thumbnails.novel"
  ],
  "details": {
    /* keyed by novel ID, values are string */
  },
}
```

> **Usage note:** Same pattern as artwork discovery — §4.2 (new, auth) vs §4.2.1 (legacy, no auth). Use §4.2 when a user session is available and fall back to §4.2.1 for anonymous access.

### 4.3 GET `/ajax/illust/{id}/recommend/init`

Get initial recommendations for a specific artwork.

| Param   | Type   | Default | Description       |
| ------- | ------ | ------- | ----------------- |
| `limit` | number | 18      | Number of results |

**Response** `body`:

```jsonc
{
  "illusts": [ /* ArtworkInfo[] */ ],
  "nextIds": [ "12345", "67890", ... ]  // IDs for pagination
}
```

### 4.4 GET `/ajax/illust/recommend/illusts`

Load more recommendations by ID. Use `nextIds` from §4.3 response.

| Param        | Type     | Description                               |
| ------------ | -------- | ----------------------------------------- |
| `illust_ids` | string[] | Artwork IDs (repeated query key for each) |

Query string example: `?illust_ids=123&illust_ids=456&illust_ids=789`

**Response** `body`: same shape as §4.3.

### 4.5 GET `/ajax/novel/{id}/recommend/init`

Get initial recommendations for a specific novel.

| Param   | Type   | Default | Description       |
| ------- | ------ | ------- | ----------------- |
| `limit` | number | —       | Number of results |

**Response** `body`:

```jsonc
{
  "novels": [ /* NovelInfo[] (see §12) */ ],
  "nextIds": [ "12345", "67890", ... ],
  "details": { /* keyed by novel ID */ }
}
```

### 4.6 GET `/ajax/novel/recommend/novels`

Load more novel recommendations by ID. Use `nextIds` from §4.5 response.

| Param      | Type     | Description                             |
| ---------- | -------- | --------------------------------------- |
| `novelIds` | string[] | Novel IDs (repeated query key for each) |

Query string example: `?novelIds[]=123&novelIds[]=456`

**Response** `body`:

```jsonc
{
  "novels": [
    /* NovelInfo[] */
  ],
}
```

---

## 5. Search

All search endpoints share a common set of parameters and the `{keyword}` must be URI-encoded.

### Common Parameters

| Param       | Type   | Default  | Description                                                                 |
| ----------- | ------ | -------- | --------------------------------------------------------------------------- |
| `p`         | number | `1`      | Page number (1-indexed)                                                     |
| `s_mode`    | string | `s_tag`  | Match mode (see table below)                                                |
| `order`     | string | `date_d` | Sort: `date_d` (newest) / `date` (oldest). Other values require premium.    |
| `mode`      | string | `all`    | Content filter: `all` / `safe` / `r18`                                      |
| `ai_type`   | number | —        | Set to `1` to hide AI-generated works                                       |

**`s_mode` values:**

| Value        | Description        | Artworks | Novels |
| ------------ | ------------------ | -------- | ------ |
| `s_tag`      | Tag (partial)      | Yes      | Yes    |
| `s_tag_full` | Tag (exact)        | Yes      | Yes    |
| `s_tc`       | Tag + title + desc | Yes      | Yes    |
| `tc`         | Title + desc       | Yes      | No     |
| `text`       | Full text           | No       | Yes    |

### 5.1 GET `/ajax/search/artworks/{keyword}`

Search all artworks (illustrations + manga). Combined results.

**Response** `body`:

```jsonc
{
  "illustManga": {
    "data": [ /* ArtworkInfo[] */ ],
    "total": 12345,
  },
  "popular": { "recent": [], "permanent": [] },
  "relatedTags": [],
  "tagTranslation": {},
}
```

### 5.2 GET `/ajax/search/illustrations/{keyword}`

Search illustrations only, with optional type filter.

| Param  | Type   | Default              | Description                                                    |
| ------ | ------ | -------------------- | -------------------------------------------------------------- |
| `type` | string | `illust_and_ugoira`  | `illust_and_ugoira` / `illust` (static only) / `ugoira` (animated only) |

**Response** `body`:

```jsonc
{
  "illust": {
    "data": [ /* ArtworkInfo[] */ ],
    "total": 12345,
  },
  // same auxiliary fields as §5.1
}
```

### 5.3 GET `/ajax/search/manga/{keyword}`

Search manga only.

**Response** `body`:

```jsonc
{
  "manga": {
    "data": [ /* ArtworkInfo[] */ ],
    "total": 12345,
  },
  // same auxiliary fields as §5.1
}
```

### 5.4 GET `/ajax/search/novels/{keyword}`

Search novels.

| Param       | Type   | Default | Description                                              |
| ----------- | ------ | ------- | -------------------------------------------------------- |
| `work_lang` | string | —       | Language filter: `zh-cn`, `ja`, `en`, `ko`, etc.         |
| `gs`        | number | `0`     | Group by series: `0` (individual novels) / `1` (series)  |

**Response** `body`:

```jsonc
{
  "novel": {
    "data": [ /* NovelInfo[] (see §12) */ ],
    "total": 22713,
    "lastPage": 10,
  },
  "popular": { "recent": [], "permanent": [] },
  "relatedTags": [],
  "tagTranslation": {},
}
```

---

## 6. Ranking

### 6.1 GET `/ranking.php`

Get artwork rankings. This is a legacy PHP endpoint.

| Param     | Type   | Required | Description                                                          |
| --------- | ------ | -------- | -------------------------------------------------------------------- |
| `format`  | string | Yes      | Must be `json`                                                       |
| `mode`    | string | No       | Ranking mode (see table below). Default: `daily`                     |
| `content` | string | No       | `all` / `illust` / `ugoira` / `manga`. Default: `all`                |
| `p`       | number | No       | Page number                                                          |
| `date`    | string | No       | Date in `YYYYMMDD` format. Time zone: `Asia/Tokyo`. Must be < today. |

**Available mode × content combinations:**

| Mode           | `all` | `illust` | `ugoira` | `manga` | Auth     |
| -------------- | ----- | -------- | -------- | ------- | -------- |
| `daily`        | Yes   | Yes      | Yes      | Yes     | No       |
| `weekly`       | Yes   | Yes      | Yes      | Yes     | No       |
| `monthly`      | Yes   | Yes      | —        | Yes     | No       |
| `rookie`       | Yes   | Yes      | —        | Yes     | No       |
| `original`     | Yes   | —        | —        | —       | No       |
| `daily_ai`     | Yes   | —        | —        | —       | No       |
| `male`         | Yes   | Yes      | —        | Yes     | No       |
| `female`       | Yes   | Yes      | —        | Yes     | No       |
| `daily_r18`    | Yes   | Yes      | Yes      | Yes     | Required |
| `weekly_r18`   | Yes   | Yes      | Yes      | Yes     | Required |
| `daily_r18_ai` | Yes   | —        | —        | —       | Required |
| `male_r18`     | Yes   | Yes      | —        | Yes     | Required |
| `female_r18`   | Yes   | Yes      | —        | Yes     | Required |

> Novel ranking uses a separate AJAX endpoint (§6.2), not `/ranking.php`.
>
> **R18 & AI content visibility:** R18 and AI modes depend on the user's Pixiv account settings (two independent toggles, both off by default). If the corresponding setting is disabled, requests may return empty results or an error.

**Response** (top-level, not wrapped in `body`):

```jsonc
{
  "date": "20240101",
  "contents": [
    {
      "illust_id": 12345678,
      "title": "...",
      "url": "...", // thumbnail URL (e.g. /c/480x960/img-master/...), use SDK to derive other quality levels
      "rank": 1,
      "yes_rank": 2, // previous rank
      "user_id": 12345,
      "user_name": "...",
      "illust_page_count": "1",
      "tags": ["tag1", "tag2"],
      // ...
    },
  ],
}
```

> Note: Unlike `/ajax/*` endpoints, `/ranking.php` returns data directly without a `body` wrapper.

### 6.2 GET `/ajax/ranking/novel`

Get novel rankings. Uses the standard `/ajax/*` envelope (§12).

| Param  | Type   | Required | Description                    |
| ------ | ------ | -------- | ------------------------------ |
| `mode` | string | No       | Ranking mode (see table below) |
| `p`    | number | No       | Page number                    |

**Available modes:**

| Mode            | Auth     |
| --------------- | -------- |
| `daily`         | No       |
| `weekly`        | No       |
| `monthly`       | No       |
| `rookie`        | No       |
| `male`          | No       |
| `female`        | No       |
| `daily_r18`     | Required |
| `weekly_r18`    | Required |
| `weekly_r18_ai` | Required |
| `male_r18`      | Required |
| `female_r18`    | Required |

> R18 and AI modes depend on the user's Pixiv account settings (two independent toggles, both off by default). If disabled, requests may return empty results or an error.

**Response** `body`:

```jsonc
{
  "display_a": {
    "rank_a": [
      {
        "id": 28389206,
        "title": "...",
        "rank": 1,
        "user_id": 49661701,
        "user_name": "...",
        "profile_img": "...",
        "url": "...", // novel cover image URL
        "bookmark_count": 2461,
        "character_count": 12345,
        "word_count": 6789,
        "reading_time": 300, // seconds
        "genre": "...",
        "is_original": false,
        "language": "ja",
        "series_id": "...",
        "series_title": "...",
        "tag_a": ["tag1", "tag2"],
        "ai_type": 0,
        "x_restrict": 0,
        "restrict": 0,
        "create_date": "...",
        "comment": "...", // novel description/summary
        "marker": null,
      },
    ],
    "mode": "daily",
    "muted_count": 0,
    "page": 1,
    "title": "小説 デイリーランキング",
  },
  "date": "2026年6月21日", // localized date string
  "h_title": "[pixiv] 小说 今日排行榜",
}
```

---

## 7. User Endpoints

### 7.1 GET `/ajax/user/{userId}?full=1`

Get full user profile.

**Response** `body`:

```jsonc
{
  "userId": "12345",
  "name": "...",
  "image": "https://i.pximg.net/...", // avatar
  "imageBig": "https://i.pximg.net/...", // large avatar
  "comment": "...", // bio (HTML)
  "isFollowed": false,
  "following": 100,
  "followedBack": false,
  "social": { "twitter": { "url": "..." } },
  "region": { "name": "Japan" },
  // ...
}
```

### 7.2 GET `/ajax/user/{userId}/profile/top`

Get user's featured/pinned works.

**Response** `body`:

```jsonc
{
  "illusts": { "12345": { /* ArtworkInfo */ }, ... },   // keyed by artwork ID
  "manga":   { "67890": { /* ArtworkInfo */ }, ... },
  "novels":  { "11111": { /* NovelInfo */ }, ... }
}
```

### 7.3 GET `/ajax/user/{userId}/profile/all`

Get IDs of all user's works (for client-side pagination).

**Response** `body`:

```jsonc
{
  "illusts": { "12345": null, "12346": null, ... },  // keys = artwork IDs
  "manga":   { "67890": null, ... }
}
```

### 7.4 GET `/ajax/user/{userId}/profile/illusts`

Get artwork details by IDs for a specific user.

| Param           | Type     | Description                      |
| --------------- | -------- | -------------------------------- |
| `ids`           | string[] | Artwork IDs (repeated query key) |
| `work_category` | string   | `illust` or `manga`              |
| `is_first_page` | number   | `0` or `1`                       |

**Response** `body`:

```jsonc
{
  "works": { "12345": { /* ArtworkInfo */ }, ... }   // keyed by artwork ID
}
```

---

## 8. Following & Feed

### 8.1 GET `/ajax/user/{userId}/following`

Get user's following list (requires authentication for own list).

| Param    | Type   | Description                       |
| -------- | ------ | --------------------------------- |
| `offset` | number | Pagination offset                 |
| `limit`  | number | Results per page (typically `24`) |
| `rest`   | string | `show` = public, `hide` = private |

**Response** `body`:

```jsonc
{
  "total": 500,
  "users": [
    {
      "userId": "...",
      "userName": "...",
      "profileImageUrl": "...",
      "isFollowed": true,
      // ...
    },
  ],
  "extraData": {
    "meta": {
      "ogp": { "title": "...", "image": "...", "description": "..." },
    },
  },
}
```

### 8.2 GET `/ajax/follow_latest/illust`

Get latest illustrations from followed users (requires authentication).

| Param  | Type   | Description             |
| ------ | ------ | ----------------------- |
| `p`    | number | Page number (1-indexed) |
| `mode` | string | `all` or `r18`          |

**Response** `body`:

```jsonc
{
  "page": {
    "isLastPage": false,
  },
  "thumbnails": {
    "illust": [
      /* ArtworkInfo[] */
    ],
  },
}
```

---

## 9. Bookmarks

### 9.1 GET `/ajax/user/{userId}/illusts/bookmarks`

Get others' public bookmarked artworks, or own bookmarks (including private) if authenticated.

| Param    | Type   | Description                       |
| -------- | ------ | --------------------------------- |
| `tag`    | string | Tag filter (empty string = all)   |
| `offset` | number | Pagination offset                 |
| `limit`  | number | Results per page (default `48`)   |
| `rest`   | string | `show` = public, `hide` = private |

**Response** `body`:

```jsonc
{
  "works": [
    /* ArtworkInfo[] */
  ],
  "total": 1234,
}
```

### 9.2 POST `/ajax/illusts/bookmarks/add`

Add artwork to bookmarks.

**Headers**: `X-CSRF-TOKEN`, `Content-Type: application/json`

**Body**:

```json
{
  "illust_id": 12345678,
  "restrict": 0,
  "comment": "",
  "tags": []
}
```

`restrict`: `0` = public, `1` = private.

### 9.3 POST `/ajax/illusts/bookmarks/delete`

Remove artwork from bookmarks.

**Headers**: `X-CSRF-TOKEN`, `Content-Type: application/x-www-form-urlencoded`

**Body**: `bookmark_id=12345678`

The `bookmark_id` can be found in the `bookmarkData.id` field of artwork detail (§3.1).

---

## 10. Comments

### 10.1 GET `/ajax/illusts/comments/roots`

Get root-level comments on an artwork.

| Param       | Type   | Description       |
| ----------- | ------ | ----------------- |
| `illust_id` | string | Artwork ID        |
| `limit`     | string | Results per page  |
| `offset`    | string | Pagination offset |

**Response** `body`:

```jsonc
{
  "hasNext": true,
  "comments": [
    {
      "id": "...",
      "comment": "...",
      "stampId": null,
      "userId": "...",
      "userName": "...",
      "img": "...", // user avatar URL
      "commentDate": "...",
      "hasReplies": false,
      // ...
    },
  ],
}
```

### 10.2 POST `/ajax/illusts/comments/post`

Post a comment on an artwork.

**Headers**: `X-CSRF-TOKEN`, `Content-Type: application/json`

**Body**:

```json
{
  "type": "comment",
  "illust_id": 12345678,
  "author_user_id": 87654321,
  "comment": "Nice work!"
}
```

---

## 11. User Follow / Unfollow (Legacy PHP)

### 11.1 POST `/bookmark_add.php`

Follow a user.

**Headers**: `X-CSRF-TOKEN`, `Content-Type: application/x-www-form-urlencoded`

**Body**:

```
mode=add&type=user&user_id=12345&tag=&restrict=0&format=json
```

`restrict`: `0` = public, `1` = private.

### 11.2 POST `/rpc_group_setting.php`

Unfollow a user.

**Headers**: `X-CSRF-TOKEN`, `Content-Type: application/x-www-form-urlencoded`

**Body**:

```
mode=del&type=bookuser&id=12345
```

---

## 12. Novel Endpoints

### 12.1 GET `/ajax/novel/{id}`

Get full novel details including content.

**Response** `body`:

```jsonc
{
  "id": "28389206",
  "title": "...",
  "description": "...",         // HTML
  "content": "...",             // novel text content with Pixiv markup
  "createDate": "...",          // ISO 8601
  "updateDate": "...",
  "userId": "...",
  "userName": "...",
  "textCount": 12345,
  "wordCount": 6789,
  "readingTime": 300,           // seconds
  "genre": "...",
  "tags": { "tags": [{ "tag": "...", "translation": { "en": "..." } }] },
  "bookmarkCount": 100,
  "likeCount": 50,
  "viewCount": 1000,
  "bookmarkData": null,         // null = not bookmarked
  "isBookmarkable": true,
  "xRestrict": 0,
  "restrict": 0,
  "aiType": 0,
  "isOriginal": false,
  "seriesId": "...",
  "seriesTitle": "...",
  "seriesNavData": {
    "seriesId": 686487,
    "title": "...",
    "order": 5,
    "prev": { "id": 12345, "title": "...", "order": 4 },
    "next": { "id": 67890, "title": "...", "order": 6 }
  },
  "userNovels": { "12345": null, "67890": null, ... }  // IDs of author's other novels (values are null)
}
```

> The `userNovels` field contains only IDs (values are `null`). Use §12.2 to fetch full info for these IDs.

### 12.2 GET `/ajax/user/{userId}/novels`

Get novel details by IDs for a specific user.

| Param | Type     | Description                             |
| ----- | -------- | --------------------------------------- |
| `ids` | string[] | Novel IDs (repeated query key for each) |

Query string example: `?ids[]=12345&ids[]=67890`

**Response** `body`:

```jsonc
{
  "28389206": {
    /* NovelInfo */
  },
  "28413309": {
    /* NovelInfo */
  },
  // keyed by novel ID
}
```

### 12.3 GET `/ajax/novels/comments/roots`

Get root-level comments on a novel.

| Param      | Type   | Description       |
| ---------- | ------ | ----------------- |
| `novel_id` | string | Novel ID          |
| `limit`    | number | Results per page  |
| `offset`   | number | Pagination offset |

**Response** `body`:

```jsonc
{
  "hasNext": true,
  "comments": [
    {
      "id": "...",
      "comment": "...",
      "commentDate": "...",
      "userId": "...",
      "userName": "...",
      "img": "...",
      "hasReplies": false,
      "editable": false,
      "isDeletedUser": false,
      // ...
    },
  ],
}
```

### 12.4 GET `/ajax/novel/series/{id}`

Get novel series info (cover, description, etc.).

**Response** `body`:

```jsonc
{
  "id": "686487",
  "title": "...",
  "caption": "...",
  "cover": {
    "urls": {
      /* image URLs */
    },
  },
  "total": 10,
  "userId": "...",
  "userName": "...",
  // ...
}
```

### 12.5 GET `/ajax/novel/series_content/{id}`

Get novels in a series.

| Param        | Type   | Default | Description           |
| ------------ | ------ | ------- | --------------------- |
| `limit`      | number | —       | Number of results     |
| `last_order` | number | `0`     | Offset for pagination |
| `order_by`   | string | `asc`   | `asc` / `desc`        |

**Response** `body`:

```jsonc
{
  "page": {
    "seriesContents": [
      /* NovelSeriesContentItem[] */
    ],
  },
  "thumbnails": {
    "novel": [
      /* NovelInfo[] */
    ],
  },
}
```

### 12.6 GET `/ajax/novel/series/{id}/content_titles`

Get all titles in a series (lightweight, for navigation).

**Response** `body`: array of:

```jsonc
{
  "id": "12345",
  "title": "Chapter 1",
  "order": 1,
  "available": true,
}
```

### 12.7 GET `/ajax/user/{userId}/novels/tags`

Get all tags used across a user's novels.

**Response** `body`: array of:

```jsonc
{
  "tag": "翠星のガルガンティア",
  "tag_translation": "Gargantia on the Verdurous Planet",
  "tag_yomigana": "すいせいのがるがんてぃあ",
  "cnt": 39,
}
```

---

## 13. Common Conventions

### 13.1 Response Envelope

All `/ajax/*` endpoints return responses in a standard envelope:

```jsonc
{
  "error": false, // true on error
  "message": "", // error message if error=true
  "body": {
    /* ... endpoint-specific data */
  },
}
```

When `error` is `true`, `body` may be `null`, an empty array `[]`, or contain error details. Always check the `error` field before accessing `body`.

Legacy PHP endpoints (`/ranking.php`, `/bookmark_add.php`, `/rpc_group_setting.php`) return data directly without this envelope.

### 13.2 Naming Conventions

Most `/ajax/*` endpoints return **camelCase** field names (e.g. `userId`, `bookmarkCount`, `createDate`). Legacy PHP endpoints and some newer AJAX endpoints use **snake_case** (e.g. `user_id`, `bookmark_count`, `create_date`).

Known snake_case endpoints:

| Endpoint                                  | Section |
| ----------------------------------------- | ------- |
| `GET /ranking.php` (ArtworkRank)          | §6.1    |
| `GET /ajax/ranking/novel` (NovelRankItem) | §6.2    |

Clients should normalize field names to a consistent convention (typically camelCase) when consuming these endpoints. See §14.2 and §14.4 for the full field listings.

---

## 14. Common Data Types

Reusable data shapes referenced throughout this document. Names like `ArtworkInfo` and `NovelInfo` are conventions used in this doc for brevity.

### 14.1 ArtworkInfo

Abbreviated artwork object returned by listing, search, and discovery endpoints.

```jsonc
{
  "id": "12345678", // string (numeric)
  "title": "...",
  "description": "...", // HTML
  "createDate": "...", // ISO 8601
  "updateDate": "...",
  "illustType": 0, // 0=illust, 1=manga, 2=ugoira
  "restrict": 0,
  "xRestrict": 0, // 0=safe, 1=R-18, 2=R-18G
  "sl": 0,
  "userId": "12345",
  "userName": "...",
  "alt": "...",
  "width": 1920,
  "height": 1080,
  "pageCount": 1,
  "isBookmarkable": true,
  "bookmarkData": null, // null = not bookmarked; { id, private } = bookmarked
  "titleCaptionTranslation": { "workTitle": null, "workCaption": null },
  "isUnlisted": false,
  "aiType": 0, // 0=not AI, 1=AI-assisted, 2=AI-generated
  "url": "https://i.pximg.net/c/250x250_80_a2/...", // thumbnail URL
  "tags": ["tag1", "tag2"], // flat string array (not the full tag objects)
  "profileImageUrl": "...", // author avatar
  "type": "illust", // "illust" or "novel"
}
```

> Listing endpoints may also return ad objects (`{ "isAdContainer": true, ... }`) mixed in. Filter by checking for the `"id"` field.

### 14.2 ArtworkRank

Artwork ranking item from `/ranking.php`. Uses **snake_case** field names.

```jsonc
{
  "illust_id": 12345678,         // number (not string)
  "title": "...",
  "url": "...",                  // thumbnail URL
  "rank": 1,
  "yes_rank": 2,                 // previous rank
  "user_id": 12345,
  "user_name": "...",
  "profile_img": "...",
  "tags": ["tag1", "tag2"],
  "illust_type": "0",            // 0=illust, 1=manga, 2=ugoira
  "illust_page_count": "1",
  "width": 1920,
  "height": 1080,
  "rating_count": 100,
  "view_count": 1000,
  "illust_upload_timestamp": 1700000000,
  "illust_content_type": { "sexual": 0, "lo": false, ... },
  "illust_series": false         // false or { illustSeriesId, illustSeriesTitle, ... }
}
```

### 14.3 NovelInfo

Abbreviated novel object returned by listing, search, and discovery endpoints. Shares most fields with `ArtworkInfo` (§14.1) but omits artwork-specific fields (`illustType`, `alt`, `width`, `height`) and adds novel-specific ones.

```jsonc
{
  // Inherited from ArtworkInfo (§14.1):
  "id": "28389206",
  "title": "...",
  "description": "...",
  "createDate": "...",
  "updateDate": "...",
  "restrict": 0,
  "xRestrict": 0,
  "userId": "12345",
  "userName": "...",
  "isBookmarkable": true,
  "bookmarkData": null,
  "isUnlisted": false,
  "aiType": 0,
  "url": "...", // cover image URL
  "tags": ["tag1", "tag2"],
  "profileImageUrl": "...",

  // Novel-specific fields:
  "type": "novel", // may be absent in some endpoints
  "genre": "...",
  "textCount": 4040, // character count
  "wordCount": 2000, // word count (for non-CJK languages)
  "readingTime": 484, // estimated reading time in seconds
  "useWordCount": false, // true = display wordCount, false = display textCount
  "isOriginal": false,
  "bookmarkCount": 100,
  "language": "ja",
  "marker": null,
  "seriesId": "686487", // may be absent
  "seriesTitle": "...", // may be absent
}
```

### 14.4 NovelRankItem

Novel ranking item from `/ajax/ranking/novel`. Uses **snake_case** field names (different from `NovelInfo`).

```jsonc
{
  "id": 28389206, // number (not string)
  "title": "...",
  "rank": 1,
  "user_id": 49661701,
  "user_name": "...",
  "profile_img": "...",
  "url": "...", // cover image URL
  "bookmark_count": 2461,
  "character_count": 12345,
  "word_count": 6789,
  "reading_time": 300, // seconds
  "genre": "...",
  "is_original": false,
  "language": "ja",
  "series_id": "...",
  "series_title": "...",
  "tag_a": ["tag1", "tag2"],
  "ai_type": 0,
  "x_restrict": 0,
  "restrict": 0,
  "create_date": "...",
  "comment": "...", // novel description/summary
  "marker": null,
}
```

---

## Appendix: Endpoint Summary

| #     | Method | Endpoint                                 | Auth                | Description                  |
| ----- | ------ | ---------------------------------------- | ------------------- | ---------------------------- |
| 3.1   | GET    | `/ajax/illust/{id}?full=1`               | Optional (R18 req.) | Artwork detail               |
| 3.2   | GET    | `/ajax/illust/{id}/pages`                | Optional (R18 req.) | Multi-page artwork           |
| 3.3   | GET    | `/ajax/illust/{id}/ugoira_meta`          | Optional (R18 req.) | Ugoira animation metadata    |
| 4.1   | GET    | `/ajax/discovery/artworks`               | Required            | Artwork discovery (new)      |
| 4.1.1 | GET    | `/ajax/illust/discovery`                 | No                  | Artwork discovery (legacy)   |
| 4.2   | GET    | `/ajax/discovery/novels`                 | Required            | Novel discovery (new)        |
| 4.2.1 | GET    | `/ajax/novel/discovery`                  | No                  | Novel discovery (legacy)     |
| 4.3   | GET    | `/ajax/illust/{id}/recommend/init`       | Optional            | Artwork recommendations      |
| 4.4   | GET    | `/ajax/illust/recommend/illusts`         | Optional            | More artwork recommendations |
| 4.5   | GET    | `/ajax/novel/{id}/recommend/init`        | Optional            | Novel recommendations        |
| 4.6   | GET    | `/ajax/novel/recommend/novels`           | Optional            | More novel recommendations   |
| 5.1   | GET    | `/ajax/search/artworks/{keyword}`        | Optional            | Search artworks (combined)   |
| 5.2   | GET    | `/ajax/search/illustrations/{keyword}`   | Optional            | Search illustrations         |
| 5.3   | GET    | `/ajax/search/manga/{keyword}`           | Optional            | Search manga                 |
| 5.4   | GET    | `/ajax/search/novels/{keyword}`          | Optional            | Search novels                |
| 6.1   | GET    | `/ranking.php`                           | Partial (R18 req.)  | Artwork ranking              |
| 6.2   | GET    | `/ajax/ranking/novel`                    | Partial (R18 req.)  | Novel ranking                |
| 7.1   | GET    | `/ajax/user/{userId}?full=1`             | Optional            | User profile                 |
| 7.2   | GET    | `/ajax/user/{userId}/profile/top`        | Optional            | User featured works          |
| 7.3   | GET    | `/ajax/user/{userId}/profile/all`        | Optional            | All user work IDs            |
| 7.4   | GET    | `/ajax/user/{userId}/profile/illusts`    | Optional            | User works by IDs            |
| 8.1   | GET    | `/ajax/user/{userId}/following`          | Required            | User following list          |
| 8.2   | GET    | `/ajax/follow_latest/illust`             | Required            | Feed from followed users     |
| 9.1   | GET    | `/ajax/user/{userId}/illusts/bookmarks`  | Optional            | User bookmarks               |
| 9.2   | POST   | `/ajax/illusts/bookmarks/add`            | Required            | Add bookmark                 |
| 9.3   | POST   | `/ajax/illusts/bookmarks/delete`         | Required            | Remove bookmark              |
| 10.1  | GET    | `/ajax/illusts/comments/roots`           | Optional            | Artwork comments             |
| 10.2  | POST   | `/ajax/illusts/comments/post`            | Required            | Post comment                 |
| 11.1  | POST   | `/bookmark_add.php`                      | Required            | Follow user                  |
| 11.2  | POST   | `/rpc_group_setting.php`                 | Required            | Unfollow user                |
| 12.1  | GET    | `/ajax/novel/{id}`                       | Optional            | Novel detail & content       |
| 12.2  | GET    | `/ajax/user/{userId}/novels`             | Optional            | User novels by IDs           |
| 12.3  | GET    | `/ajax/novels/comments/roots`            | Optional            | Novel comments               |
| 12.4  | GET    | `/ajax/novel/series/{id}`                | Optional            | Novel series info            |
| 12.5  | GET    | `/ajax/novel/series_content/{id}`        | Optional            | Novel series content list    |
| 12.6  | GET    | `/ajax/novel/series/{id}/content_titles` | Optional            | Novel series titles          |
| 12.7  | GET    | `/ajax/user/{userId}/novels/tags`        | Optional            | User novel tags              |
