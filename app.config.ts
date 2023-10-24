import { version } from './package.json'

export default defineAppConfig({
  version,
  GITHUB_OWNER: 'FreeNowOrg',
  GITHUB_REPO: 'PixivNow',
  GITHUB_URL: 'https://github.com/FreeNowOrg/PixivNow',
  PROJECT_NAME: 'PixivNow',
  PROJECT_TAGLINE: 'Enjoy Pixiv Now (pixiv.js.org)',
  IMAGE_CACHE_SECONDS: 12 * 60 * 60 * 1000,
  SITE_ENV:
    process.env.NODE_ENV === 'development' || version.includes('-')
      ? 'development'
      : 'production',
})
