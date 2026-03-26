<div align="center">

![PixivNow Logo](app/assets/LogoH.png)

PixivNow - Now, everyone can enjoy Pixiv!

</div>

## Deploy / 部署

### Docker (推荐)

```bash
git clone https://github.com/FreeNowOrg/PixivNow.git
cd PixivNow
docker compose up -d
```

服务将在 `http://localhost:3000` 启动。

代码更新后重新构建：

```bash
git pull && docker compose up -d --build
```

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FFreeNowOrg%2FPixivNow&demo-title=PixivNow)

点击上方按钮一键部署，或 Fork 后在 Vercel 导入项目。

如果打算公开你的部署，请小心你的账单。PixivNow 可能会被滥用来大量下载图片，导致流量激增和高额费用。

### 手动构建

需要 [Node.js](https://nodejs.org/) LTS 和 [pnpm](https://pnpm.io/)。

```bash
pnpm install
pnpm build
node .output/server/index.mjs
```

## Environment Variables / 环境变量

| 变量                              | 说明                       | 默认值 |
| --------------------------------- | -------------------------- | ------ |
| `NUXT_PUBLIC_PXIMG_BASEURL_I`     | i.pximg.net 图片代理地址   | `/-/`  |
| `NUXT_PUBLIC_PXIMG_BASEURL_S`     | s.pximg.net 图片代理地址   | `/~/`  |
| `NUXT_PUBLIC_GOOGLE_ANALYTICS_ID` | Google Analytics ID        | —      |
| `NUXT_UA_BLACKLIST`               | 屏蔽的 UA 模式 (JSON 数组) | —      |

Docker 部署时可在 `docker-compose.yml` 中添加 `environment` 配置。

## API

通过以下方式传递用户 token 鉴权（二选一）：

- Header `Authorization`
- Cookie `PHPSESSID`

请求路径 `/ajax/*` 的返回结果与 `https://pixiv.net/ajax/*` 行为一致。

### `/api/illust/random`

返回随机图片（`/ajax/illust/discovery` 的语法糖）。

| 参数     | 类型                       | 说明                                                         |
| -------- | -------------------------- | ------------------------------------------------------------ |
| `max`    | `number`                   | 返回图片的个数                                               |
| `mode`   | `'all' \| 'safe' \| 'r18'` | `r18` 需登录且账号设置允许                                   |
| `format` | `'image' \| 'json'`        | `Accept` 包含 `image` 时默认为 `image`，image 模式返回重定向 |

### `/api/ranking`

`/ranking.php` 的重定向。

### `/api/user`

辅助接口，通过传入的 token，返回当前登录用户信息 (globalData->userData)。

---

_For communication and learning only._

**All data & pictures from query:** &copy;Pixiv & original authors

> Licensed under the [Apache License 2.0](LICENSE)
