# 反代流式化重构设计

- 日期: 2026-07-07
- 分支: `refactor/proxy-streaming`
- 状态: 设计定稿待复核

## 背景与动机

项目最初是 Vercel Serverless + axios,axios 无法流式,所以两个反代都写成「`await` 完整响应体再 return」。现已迁到 Nuxt 4 / nitro(`node-server` preset,官方生产为腾讯云 EdgeOne 前置 CDN),`fetch` 支持流式,原先的 buffer 写法成了遗留负担。

排查中另发现一个真实 bug:自带图片反代把客户端的 **HEAD 请求发成上游 GET**,导致一次 HEAD 会把整包(如 6.7MB ugoira zip)从 i.pximg 拉下来再丢弃、且无缓存。实测本机 HEAD 耗时 9.6s(比完整 GET 的 3.5s 还久),而 i.pximg 原生 HEAD 仅 0.45s。

### 现状事实(已核实)

- **图片反代** `server/middleware/pximg-proxy.ts`:`return response`(fetch 的 Response),**已经是流式**。唯一问题是 `pximgFetch` 不透传 method → 一律 GET 上游(HEAD 变全量下载)。
- **API 反代** `server/middleware/pixiv-proxy.ts` → `pixivFetch()` 里 `await response.json()/.text()` → **buffer**,中间件再 `return data` 让 nitro `JSON.stringify` 回去。即 parse→reserialize,且全程**不 transform body**(服务端 `replacePximgUrls*` 零调用点)。纯开销 + 丢流式。这次 buffer 的历史原因是 DEV 响应体日志。
- `pixivFetch` 被 3 处复用:`pixiv-proxy` 中间件 + `server/routes/api/user.ts` + `server/routes/api/illust/random.ts`。后两个 API 路由**需要 parsed data**,契约不可动。
- 平台流式支持:自部署 `node-server`(Dockerfile)原生流式;官方 EdgeOne 运行时未完全确认,但图片反代当前就 `return Response` 且生产正常运行,**证明该模式与官方 prod 兼容**。故本设计不阻塞于 EdgeOne 流式语义(见「已知假设/风险」)。

## 目标

1. API 反代改为**流式透传**,去掉无谓的 parse→reserialize。
2. 修复图片反代 **HEAD→GET** bug(透传请求 method)。
3. 两个反代的「流式 + 错误处理 + DEV 日志」逻辑**单点收敛**,消除请求构造重复。
4. **不改动** `pixivFetch` 的返回契约,`/api/*` 路由零改动。
5. 保留 DEV 观察 Pixiv 响应体的能力(写业务逻辑需要)。

### 非目标(Out of scope)

- 用户自定义代理地址功能(见文末「Future extension」)。
- 两个反代合并成单一 god-handler(过度设计,已否决)。
- 给项目引入测试框架(项目无 test/lint,沿用手动验证)。

## 方案(Approach A)

抽一个流式透传 helper,并提取公共请求构造器;两个中间件各用自己的配置调用它。

### 文件变更

| 文件 | 变更 | 说明 |
|---|---|---|
| `server/utils/proxy.ts` | 新增 | 流式透传核心 `proxyPass()` + DEV tee 日志 |
| `server/utils/pixiv.ts` | 改 | 提取 `buildPixivHeaders(event)`;`pixivFetch` 改用它(行为不变) |
| `server/middleware/pixiv-proxy.ts` | 改 | 改调 `proxyPass`(auth/cookie 注入、UA 黑名单、body/method 转发) |
| `server/middleware/pximg-proxy.ts` | 改 | 改调 `proxyPass`;透传 method(修 HEAD)、range 透传 |
| `server/utils/pixiv.ts` `pximgFetch` | **删除** | 职责被 `proxyPass` 接管(见「行为变更 3」) |
| `server/routes/api/user.ts`、`.../illust/random.ts` | 不动 | 继续走 `pixivFetch` |

### 组件与接口

`server/utils/proxy.ts`:

```ts
interface ProxyPassOptions {
  url: string
  method: string                  // 透传客户端 method（HEAD→HEAD）
  headers: Record<string, string> // 调用方已构造好的上游请求头
  body?: BodyInit | null          // 非 GET 时的原始 body
  responseHeaders: string[]       // 回传白名单
  signal?: AbortSignal            // 可选超时（API 传 9s，图片不传）
  devLabel?: string               // DEV 日志前缀，如 'ajax' / 'pximg'
}

// 行为：
// - fetch 上游；首字节前抛错 → throw createError(502)
// - 回设白名单响应头 + setResponseStatus(upstream.status)
// - PROD：return upstream（Response 流式）
// - DEV 且有 body：upstream.body.tee() → 一支 new Response(s1,{status,headers}) 返回，
//   另一支封顶累积（默认 8KB）并打印 `[devLabel status] <preview>`（预览取前 200 字符，与现状一致）
async function proxyPass(event: H3Event, opts: ProxyPassOptions): Promise<Response>
```

`server/utils/pixiv.ts`:

```ts
// 提取自现 pixivFetch 96-127 行：Authorization→PHPSESSID cookie、CSRF、origin/referer/UA/cookie 注入
function buildPixivHeaders(event: H3Event): Record<string, string>
// pixivFetch 内部改用 buildPixivHeaders；.json()/.text()、DEV 日志、返回契约均不变
```

`server/middleware/pximg-proxy.ts`:

```ts
// 匹配 /-/ /~/ → 目标 URL
// headers = 白名单请求头(accept/accept-encoding/range/if-*/cache-control) + { referer, 'user-agent': PROXY_USER_AGENT }
// return proxyPass(event, {
//   url, method: event.method, headers,
//   responseHeaders: PROXY_RESPONSE_HEADERS,   // accept-ranges/content-length/content-range/content-type/etag/... 保持不变
//   devLabel: 'pximg',
// })
```

`server/middleware/pixiv-proxy.ts`:

```ts
// shouldProxy + checkCanPassUaBlackList 保留
// const headers = buildPixivHeaders(event)
// const body = event.method !== 'GET' ? await readRawBody(event) : undefined
// return proxyPass(event, {
//   url: reqUrl.pathname + reqUrl.search, method: event.method, headers, body,
//   responseHeaders: PROXY_RESPONSE_HEADERS,   // cache-control/content-disposition/content-type/etag/expires/last-modified
//   signal: AbortSignal.timeout(9000), devLabel: 'ajax',
// })
```

## 数据流

**图片反代**（`/-/ /~/`）:
```
客户端(GET/HEAD/Range) → 中间件:前缀→目标URL,挑白名单请求头+注入 referer/UA
  → proxyPass:fetch(method=客户端method) 到 i.pximg
     ├─ 连接/DNS 错 → createError(502)
     └─ 有响应 → 回设白名单头(含 content-length/content-range/accept-ranges)+status
        → return Response(流式) → h3/Node chunked 吐给客户端
```
HEAD 现在 method=HEAD → i.pximg 原生 HEAD(0 body,~0.45s),不再整包回源。Range 透传 206 分片。

**API 反代**（`/ajax /rpc *.php`）:
```
客户端 → 中间件:shouldProxy → UA黑名单(不过→403)
  → buildPixivHeaders(注入 PHPSESSID/CSRF/origin/referer/UA/cookie)
  → 非GET:readRawBody 原样携带
  → proxyPass:fetch(method,headers,body,signal=9s) 到 pixiv.net
     → 回设白名单头+status → return Response(流式,undici 已自动解压)
```

## 错误处理

- **首字节前抛错**（DNS/连接/超时,或上游未吐 body）→ `createError(502)` 干净响应。
- **上游非 2xx** → 原样透传 status + body(pixiv 错误 JSON 客户端业务要用)。
- **流到一半上游断** → status 已提交无法回改,自然截断,DEV 打日志,不做额外恢复(流式固有代价)。
- **超时** → API 保留 `AbortSignal.timeout(9000)`(作用于连接+响应头阶段,body 小无碍);图片维持无超时。

## 行为变更标注（需保持原行为处已逐条确认）

1. **API 响应体**:`JSON.parse→stringify` 改为原始字节透传 → 更忠实(不再重排空白/键序)。语义等价,字节可能不同。
2. **图片 HEAD**:`整包下载后丢弃(9.6s)` → `HEAD→HEAD(0 回源 body)`。有意修复的 bug;客户端仍得正确 content-length + 0 body。
3. **删除 `pximgFetch`**:职责并入 `proxyPass` + 图片中间件的头注入。已确认可删。
4. **DEV 响应体日志**:改为 tee 封顶抓取(默认 8KB),预览仍取前 200 字符,内容仍可见。
5. **content-encoding 已核实无坑**:undici 自动解压,两个白名单均不转发 content-encoding,不会出现客户端二次解压(图片反代本就如此,非回归)。

## 测试（手动验证,项目无测试框架）

dev server + curl:

- **图片反代**:HEAD(快、0 body、content-length 正确)/ Range 0-0 与中段(206、只回分片)/ 完整 GET(200、流式)/ 不存在路径(404 透传)。
- **API 反代**:某 GET `/ajax/...` 返回 JSON 与改前逐字节比对;一个 form-urlencoded POST 端点(如书签删除)仍工作(body 正确转发);UA 黑名单仍拦截。
- **DEV**:body 日志仍能看到 pixiv JSON。
- **回归**:`/api/user`、`/api/illust/random` 仍正常(`pixivFetch` 契约未动)。

## 已知假设 / 风险

- **官方 EdgeOne 是否端到端流式未确认**。缓解:图片反代当前就 `return Response` 且生产正常,证明该模式兼容;且「去掉 parse→reserialize」是无条件收益,与平台是否流式无关。若需确定性,后续单独实测 EdgeOne 运行时。
- 分支基于落后 origin/master 6 个 commit 的本地 master,**实现前需 `git rebase origin/master`**。

## Future extension: 用户自定义代理地址（out of scope）

当前 pximg URL 替换是**混合架构**:

- `/ajax/*` 反代 raw 透传,替换在前端 `PixivClient`(`app/api/pixiv-client.ts` `pximgReplacer`)+ `UgoiraPlayer`。
- `/api/illust/random` 等自定义路由**服务端**用 `PXIMG_BASEURL_I` 烘焙 URL;其中 `format=image` 走 `sendRedirect` 到代理地址——此路径**必须服务端替换**(不能重定向到不可内嵌的原始 i.pximg)。

要做用户自定义代理:

- 前端有两个独立替换器实例(`pixiv-client.ts` 自己的 + `pximg.ts` memoize 的 `_defaultReplacer` 单例,供 `UgoiraPlayer`/`pximgI/S`/`buildIllustUrls`)。需收敛为**单一 reactive 源**让所有替换点读取;现 `_defaultReplacer` 缓存启动时 config,运行时改不动。
- 服务端烘焙路径(如 random 的重定向)base 是 env 定死的,纯前端设置盖不住;需把用户设置传到服务端,或接受这些路径不受自定义代理影响。

本次流式重构保持 `/ajax` raw 透传,与该功能方向一致、无冲突。
