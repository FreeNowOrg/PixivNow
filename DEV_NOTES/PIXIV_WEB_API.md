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
| `/ajax/illust/discovery`   | Full `urls`          | Use directly |
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

### 4.1 GET `/ajax/illust/discovery`

Discover random artworks (requires authentication).

| Param  | Type   | Default | Description            |
| ------ | ------ | ------- | ---------------------- |
| `mode` | string | `safe`  | `safe` / `all` / `r18` |
| `max`  | string | `18`    | Max number of results  |

**Response** `body`:

```jsonc
{
  "illusts": [
    // Array of ArtworkInfo objects (same shape as §3.1 but abbreviated)
    // May include ad objects: { "isAdContainer": true, ... }
    // Filter by checking for the presence of "id" field
  ],
}
```

### 4.2 GET `/ajax/illust/{id}/recommend/init`

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

### 4.3 GET `/ajax/illust/recommend/illusts`

Load more recommendations by ID. Use `nextIds` from §4.2 response.

| Param        | Type     | Description                               |
| ------------ | -------- | ----------------------------------------- |
| `illust_ids` | string[] | Artwork IDs (repeated query key for each) |

Query string example: `?illust_ids=123&illust_ids=456&illust_ids=789`

**Response** `body`: same shape as §4.2.

---

## 5. Search

### 5.1 GET `/ajax/search/artworks/{keyword}`

Search artworks by keyword. The `{keyword}` must be URI-encoded.

| Param  | Type   | Default | Description               |
| ------ | ------ | ------- | ------------------------- |
| `p`    | string | `1`     | Page number (1-indexed)   |
| `mode` | string | `text`  | Search mode (e.g. `text`) |

**Response** `body`:

```jsonc
{
  "illustManga": {
    "data": [
      /* ArtworkInfo[] */
    ],
    "total": 12345,
  },
}
```

---

## 6. Ranking

### 6.1 GET `/ranking.php`

Get artwork rankings. This is a legacy PHP endpoint.

| Param     | Type   | Required | Description                                                                                                                                      |
| --------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `format`  | string | Yes      | Must be `json`                                                                                                                                   |
| `mode`    | string | No       | `daily` / `weekly` / `monthly` / `rookie` / `original` / `male` / `female` / `daily_r18` / `weekly_r18` / etc.                                   |
| `content` | string | No       | `all` (combined) / `illust` (illustrations) / `ugoira` (animations) / `manga`. Novel ranking uses a separate endpoint and is not supported here. |
| `p`       | number | No       | Page number                                                                                                                                      |
| `date`    | string | No       | Date in `YYYYMMDD` format                                                                                                                        |

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

## 12. Common Response Envelope

All `/ajax/*` endpoints return responses in this envelope:

```jsonc
{
  "error": false, // true on error
  "message": "", // error message if error=true
  "body": {
    /* ... */
  }, // actual response data
}
```

When `error` is `true`, `body` may be `null` or contain error details. Always check the `error` field before accessing `body`.

The `/ranking.php` endpoint is an exception — it returns data directly without this envelope.

---

## Appendix: Endpoint Summary

| #    | Method | Endpoint                                | Auth                        | Description               |
| ---- | ------ | --------------------------------------- | --------------------------- | ------------------------- |
| 3.1  | GET    | `/ajax/illust/{id}?full=1`              | Optional (Required for r18) | Artwork detail            |
| 3.2  | GET    | `/ajax/illust/{id}/pages`               | Optional (Required for r18) | Multi-page artwork        |
| 3.3  | GET    | `/ajax/illust/{id}/ugoira_meta`         | Optional (Required for r18) | Ugoira animation metadata |
| 4.1  | GET    | `/ajax/illust/discovery`                | Required                    | Random artwork discovery  |
| 4.2  | GET    | `/ajax/illust/{id}/recommend/init`      | Optional                    | Initial recommendations   |
| 4.3  | GET    | `/ajax/illust/recommend/illusts`        | Optional                    | More recommendations      |
| 5.1  | GET    | `/ajax/search/artworks/{keyword}`       | Optional                    | Search artworks           |
| 6.1  | GET    | `/ranking.php`                          | No                          | Artwork ranking           |
| 7.1  | GET    | `/ajax/user/{userId}?full=1`            | Optional                    | User profile              |
| 7.2  | GET    | `/ajax/user/{userId}/profile/top`       | Optional                    | User featured works       |
| 7.3  | GET    | `/ajax/user/{userId}/profile/all`       | Optional                    | All user work IDs         |
| 7.4  | GET    | `/ajax/user/{userId}/profile/illusts`   | Optional                    | User works by IDs         |
| 8.1  | GET    | `/ajax/user/{userId}/following`         | Required                    | User following list       |
| 8.2  | GET    | `/ajax/follow_latest/illust`            | Required                    | Feed from followed users  |
| 9.1  | GET    | `/ajax/user/{userId}/illusts/bookmarks` | Optional                    | User bookmarks            |
| 9.2  | POST   | `/ajax/illusts/bookmarks/add`           | Required                    | Add bookmark              |
| 9.3  | POST   | `/ajax/illusts/bookmarks/delete`        | Required                    | Remove bookmark           |
| 10.1 | GET    | `/ajax/illusts/comments/roots`          | Optional                    | Artwork comments          |
| 10.2 | POST   | `/ajax/illusts/comments/post`           | Required                    | Post comment              |
| 11.1 | POST   | `/bookmark_add.php`                     | Required                    | Follow user               |
| 11.2 | POST   | `/rpc_group_setting.php`                | Required                    | Unfollow user             |
