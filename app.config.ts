import { version } from './package.json'

export default defineAppConfig({
  version,
  githubOwner: 'FreeNowOrg',
  githubRepo: 'PixivNow',
  githubUrl: 'https://github.com/FreeNowOrg/PixivNow',
  projectName: 'PixivNow',
  projectTagline: 'Enjoy Pixiv Now (pixiv.js.org)',
  imageCacheSeconds: 12 * 60 * 60 * 1000,
  siteEnv:
    process.env.NODE_ENV === 'development' || version.includes('-')
      ? 'development'
      : 'production',
})
