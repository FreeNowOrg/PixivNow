# PixivNow Cloudflare Pages Functions

这个目录包含三个 Cloudflare Pages Functions 示例：

- `functions/ajax/[...path].js`: 代理 Pixiv `/ajax/*` 请求
- `functions/api/illust/random.js`: 示例接口 `/api/illust/random`
- `functions/img/[...path].js`: 图片代理

## 使用方法

1. 将 `functions/` 目录上传到你 Fork 的 PixivNow 项目根目录（与 `src/` 同级）。
2. 提交并推送到 GitHub。
3. Cloudflare Pages 会自动检测 `functions/` 并构建部署。
4. 部署完成后，在浏览器访问：
   - `/api/illust/random`
   - `/ajax/...`
   - `/img/...`
