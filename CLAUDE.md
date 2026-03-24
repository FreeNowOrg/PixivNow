# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PixivNow is a Pixiv mirror/proxy web application built with **Nuxt 4** (Vue 3, TypeScript). It runs as a **client-side only SPA** (SSR disabled) with server-side API proxy routes. Templates use **Pug** syntax. Deployed on **Vercel**.

## Commands

```bash
pnpm dev        # Start dev server
pnpm build      # Production build
pnpm generate   # Static site generation
pnpm preview    # Preview production build
```

No test or lint commands are configured.

## Architecture

### Frontend (`app/`)

- **Pages** (`app/pages/`): File-based routing — artworks, users, search, ranking, following, login, about
- **Stores** (`app/stores/`): Pinia stores for session, artwork, search, ranking, following, user profile/artworks, home
- **Components** (`app/components/`): Vue SFCs using Pug templates. Key groups: Artwork/, Comment/, SideNav/
- **Composables** (`app/composables/`): `states.ts` (shared state), `userData.ts` (auth/session init)
- **API client** (`app/api/pixiv-client.ts`): Client-side Pixiv API wrapper
- **Utils** (`app/utils/`): Image URL handling (`pximg.ts`), animated artwork player (`UgoiraPlayer.ts`), ZIP downloads (`ZipDownloader.ts`)
- **i18n**: Chinese only (`zh-Hans`), lazy-loaded from `app/locales/`

### Backend (`server/`)

Two server middleware handle proxying:
- **`pixiv-proxy.ts`**: Proxies `/ajax/*`, `/rpc/*`, `*.php` requests to `pixiv.net` (with UA blacklist)
- **`pximg-proxy.ts`**: Proxies `/-/*` → `i.pximg.net`, `/~/*` → `s.pximg.net` (image CDN)

API routes:
- `GET /api/illust/random` — random artworks from Pixiv discovery
- `GET /api/user` — current logged-in user profile (parses Pixiv HTML for user data)

### Auth Flow

Session relies on `PHPSESSID` cookie forwarded to Pixiv. The `/api/user` endpoint extracts user data and CSRF token from Pixiv's HTML response.

### Key Dependencies

- **UI**: naive-ui (component library), @tabler/icons-vue
- **State**: pinia, vue-router
- **Media**: gif.js, modern-mp4, fflate (for animated artwork export)

## Code Style

- Prettier: no semicolons, single quotes, 2-space indent, trailing commas (es5)
- Vue templates use Pug syntax (`lang="pug"`)
- Auto-imports enabled for Vue/Nuxt composables, naive-ui components, and Pinia stores

## Environment Variables

- `NUXT_PUBLIC_PXIMG_BASEURL_I` — i.pximg.net proxy base (default: `/-/`)
- `NUXT_PUBLIC_PXIMG_BASEURL_S` — s.pximg.net proxy base (default: `/~/`)
- `NUXT_PUBLIC_GOOGLE_ANALYTICS_ID` — GA tracking ID
- `NUXT_UA_BLACKLIST` — JSON array of blocked user-agent patterns

## Reference

Reverse-engineered Pixiv API documentation is in `DEV_NOTES/PIXIV_WEB_API.md`.
