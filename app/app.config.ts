// Copyright links
// Do not modify please
const GITHUB_OWNER = 'FreeNowOrg'
const GITHUB_REPO = 'PixivNow'

export default defineAppConfig({
  version: '4.0.0',
  SITE_ENV: import.meta.dev ? 'development' : 'production',
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_URL: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`,
  PROJECT_NAME: 'PixivNow',
  PROJECT_TAGLINE: 'Enjoy Pixiv Now (pixiv.js.org)',
  IMAGE_CACHE_SECONDS: 12 * 60 * 60 * 1000,
})
