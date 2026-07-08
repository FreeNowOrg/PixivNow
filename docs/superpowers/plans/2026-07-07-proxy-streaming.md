# 反代流式化重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 两个服务端反代改为流式透传,修复图片反代 HEAD→GET 整包回源 bug,去掉 API 反代无谓的 JSON parse→reserialize。

**Architecture:** 抽一个共享 `proxyPass()`(server/utils/proxy.ts)统一「fetch 上游 → 白名单响应头 → 返回流式 Response」+ DEV tee 日志;两个中间件各用自己的请求头构造调用它。`pixivFetch` 契约不动,`/api/*` 路由零改动。

**Tech Stack:** Nuxt 4 / nitro (node-server preset)、h3 1.15.10、undici fetch、TypeScript。

## Global Constraints

- 代码风格(Prettier):无分号、单引号、2 空格缩进、trailing comma es5。
- 项目**无测试框架**:每个任务用 `pnpm dev`(指定空闲端口)+ curl 手动验证,断言状态码/头/耗时。
- **不改动 `pixivFetch` 返回契约**;`server/routes/api/user.ts`、`server/routes/api/illust/random.ts` 零改动。
- **请求头转发逻辑原样保留**:API 对 pixiv.net 全转+覆写 origin/referer/UA/cookie;图片对 i.pximg 用请求头白名单(不含 cookie/authorization)+ 注入 referer/UA。
- **响应头两个反代均白名单-only**;`proxyPass` 返回 `new Response(body, { status, headers: 白名单 })`,不用 setResponseHeader/setResponseStatus。
- 提交信息用 Conventional Commits,结尾加 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。
- **实现前先 `git rebase origin/master`**(本地 master 落后 6 个 commit),再从 `refactor/proxy-streaming` 开始。
- 测试用的 `.env` 里有 `DEBUG_PIXIV_PHPSESSID`,**严禁打印其值**,仅用于 curl 的 cookie 头。

---

### Task 0: rebase 到最新 origin/master

**Files:** 无(仅 git)

- [ ] **Step 1: 确认工作区干净**

Run: `git status -sb`
Expected: 分支 `refactor/proxy-streaming`,无未提交改动(spec/plan 已提交)。

- [ ] **Step 2: 拉取并 rebase**

```bash
git fetch origin
git rebase origin/master
```
Expected: rebase 成功,无冲突(本分支只加了 docs/ 文件)。若有冲突,停下报告。

- [ ] **Step 3: 确认**

Run: `git log --oneline -3`
Expected: 顶部是本分支的 docs 提交,其父为 origin/master 最新 commit。

---

### Task 1: 创建 proxyPass 助手 + 迁移图片反代(修 HEAD)+ 删除 pximgFetch

**Files:**
- Modify: `server/utils/pixiv.ts`(导出 `proxyAwareFetch`;删除 `pximgFetch`)
- Create: `server/utils/proxy.ts`
- Modify: `server/middleware/pximg-proxy.ts`(改用 `proxyPass`,透传 method)

**Interfaces:**
- Consumes: `DEV`、`proxyAwareFetch`、`PROXY_USER_AGENT`(均 from `~~/server/utils/pixiv`)
- Produces: `proxyPass(event: H3Event, opts: ProxyPassOptions): Promise<Response>`;`ProxyPassOptions { url: string; method: string; headers: Record<string,string>; body?: BodyInit | null; responseHeaders: string[]; signal?: AbortSignal; devLabel?: string }`

- [ ] **Step 1: 导出 proxyAwareFetch**

在 `server/utils/pixiv.ts` 把私有函数改为导出(约 44 行):

```ts
export async function proxyAwareFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
```

（函数体不变。）

- [ ] **Step 2: 创建 server/utils/proxy.ts**

```ts
import type { H3Event } from 'h3'
import colors from 'picocolors'
import { DEV, proxyAwareFetch } from '~~/server/utils/pixiv'

export interface ProxyPassOptions {
  url: string
  method: string
  headers: Record<string, string>
  body?: BodyInit | null
  responseHeaders: string[]
  signal?: AbortSignal
  devLabel?: string
}

const DEV_LOG_CAP = 8 * 1024
const DEV_PREVIEW_CHARS = 200

export async function proxyPass(
  event: H3Event,
  opts: ProxyPassOptions
): Promise<Response> {
  let upstream: Response
  try {
    upstream = await proxyAwareFetch(opts.url, {
      method: opts.method,
      headers: opts.headers,
      body: opts.body ?? undefined,
      signal: opts.signal,
    })
  } catch (err: any) {
    console.error(
      `[proxyPass] upstream fetch failed: ${opts.url}`,
      err?.message ?? err
    )
    throw createError({
      statusCode: 502,
      statusMessage: 'Bad Gateway',
      data: String(err?.message ?? err),
    })
  }

  const headers = new Headers()
  for (const h of opts.responseHeaders) {
    const val = upstream.headers.get(h)
    if (val) headers.set(h, val)
  }

  let body = upstream.body
  if (DEV && body) {
    const [toClient, toLog] = body.tee()
    body = toClient
    void previewStream(toLog, opts.devLabel ?? 'proxy', upstream.status)
  }

  return new Response(body, { status: upstream.status, headers })
}

async function previewStream(
  stream: ReadableStream<Uint8Array>,
  label: string,
  status: number
): Promise<void> {
  try {
    const reader = stream.getReader()
    const chunks: Uint8Array[] = []
    let total = 0
    while (total < DEV_LOG_CAP) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        chunks.push(value)
        total += value.byteLength
      }
    }
    void reader.cancel().catch(() => {})
    const merged = new Uint8Array(total)
    let off = 0
    for (const c of chunks) {
      merged.set(c, off)
      off += c.byteLength
    }
    const text = new TextDecoder().decode(merged).slice(0, DEV_PREVIEW_CHARS)
    console.info(colors.green(`[${label} ${status}]`), text)
  } catch {
    // ignore dev logging errors
  }
}
```

- [ ] **Step 3: 重写 server/middleware/pximg-proxy.ts**

```ts
import { PROXY_USER_AGENT } from '~~/server/utils/pixiv'
import { proxyPass } from '~~/server/utils/proxy'

const PREFIX_MAP: Record<string, string> = {
  '-': 'https://i.pximg.net/',
  '~': 'https://s.pximg.net/',
}
const PROXY_REQUEST_HEADERS = [
  'accept',
  'accept-encoding',
  'accept-language',
  'cache-control',
  'if-modified-since',
  'if-none-match',
  'if-range',
  'range',
]
const PROXY_RESPONSE_HEADERS = [
  'accept-ranges',
  'cache-control',
  'content-disposition',
  'content-length',
  'content-range',
  'content-type',
  'etag',
  'expires',
  'last-modified',
]

export default defineEventHandler(async (event) => {
  const pathname = getRequestURL(event).pathname
  const match = pathname.match(/^\/([-~])\/(.+)/)
  if (!match) return

  const [, prefix, path] = match
  const baseUrl = PREFIX_MAP[prefix!]
  if (!baseUrl) return

  const url = `${baseUrl}${path}`

  const reqHeaders = getHeaders(event)
  const headers: Record<string, string> = {}
  for (const h of PROXY_REQUEST_HEADERS) {
    if (typeof reqHeaders[h] === 'string') headers[h] = reqHeaders[h] as string
  }
  headers['referer'] = 'https://www.pixiv.net/'
  headers['user-agent'] = PROXY_USER_AGENT

  return proxyPass(event, {
    url,
    method: event.method,
    headers,
    responseHeaders: PROXY_RESPONSE_HEADERS,
    devLabel: 'pximg',
  })
})
```

- [ ] **Step 4: 删除 pximgFetch**

在 `server/utils/pixiv.ts` 删除整个 `pximgFetch` 函数(约 177-188 行,含其上方 `// --- Pximg proxy fetch ---` 注释)。

Run: `grep -rn "pximgFetch" server/`
Expected: 无任何结果(所有引用已移除)。

- [ ] **Step 5: 启动 dev server(空闲端口)**

```bash
lsof -nP -iTCP:3100 -sTCP:LISTEN >/dev/null 2>&1 && echo BUSY || echo FREE
```
若 FREE:`pnpm dev --port 3100`(后台运行)。若 BUSY 换 3101 等空闲端口。等日志出现 `Nuxt Nitro server built`。

- [ ] **Step 6: 取一个真实 pximg zip 路径并验证 HEAD/Range/GET**

```bash
set -a; . ./.env; set +a
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
ID=$(curl -s "https://www.pixiv.net/ranking.php?format=json&mode=daily&content=ugoira" \
  -H "User-Agent: $UA" -H "Referer: https://www.pixiv.net/" \
  --cookie "PHPSESSID=${DEBUG_PIXIV_PHPSESSID}" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['contents'][0]['illust_id'])")
SRC=$(curl -s "https://www.pixiv.net/ajax/illust/${ID}/ugoira_meta" \
  -H "User-Agent: $UA" -H "Referer: https://www.pixiv.net/" \
  --cookie "PHPSESSID=${DEBUG_PIXIV_PHPSESSID}" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['body']['src'])")
PATHPART=${SRC#https://i.pximg.net/}
BASE="http://localhost:3100/-/${PATHPART}"
echo "test path: $PATHPART"
echo "--- HEAD ---";  curl -s -o /dev/null -D - -X HEAD "$BASE" -w "time=%{time_total}s dl=%{size_download}\n" | grep -iE 'HTTP/|content-length|content-type|time='
echo "--- Range ---"; curl -s -o /dev/null -D - -H "Range: bytes=0-99" "$BASE" -w "status=%{http_code} dl=%{size_download}\n" | grep -iE 'HTTP/|content-range|status='
echo "--- GET ---";   curl -s -o /dev/null "$BASE" -w "status=%{http_code} dl=%{size_download}\n"
echo "--- 404 ---";   curl -s -o /dev/null "http://localhost:3100/-/img-master/nonexistent.jpg" -w "status=%{http_code}\n"
```
Expected:
- HEAD: `200`,有 `content-length`(数百万级),`content-type: application/zip`,`dl=0`,**time 明显 < 之前的整包下载(不再拉整包)**。
- Range: `206`,有 `content-range: bytes 0-99/...`,`dl=100`。
- GET: `200`,`dl` 等于整包字节数。
- 404: `404`(上游 404 透传)。

- [ ] **Step 7: 提交**

```bash
git add server/utils/proxy.ts server/utils/pixiv.ts server/middleware/pximg-proxy.ts
git commit -m "$(cat <<'EOF'
feat(server): stream pximg proxy via proxyPass and forward HEAD method

Add shared proxyPass helper (whitelist response headers, DEV tee logging).
Rewrite pximg proxy to forward the request method so HEAD no longer triggers
a full upstream GET download. Remove now-unused pximgFetch.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: 提取 buildPixivHeaders(pixivFetch 行为不变)

**Files:**
- Modify: `server/utils/pixiv.ts`

**Interfaces:**
- Produces: `buildPixivHeaders(event: H3Event): Record<string, string>`
- Consumes: `CookieUtils`、`PROXY_USER_AGENT`(同文件内)

- [ ] **Step 1: 新增 buildPixivHeaders**

在 `server/utils/pixiv.ts` `pixivFetch` 之前新增(逻辑逐字取自现 `pixivFetch` 96-127 行):

```ts
export function buildPixivHeaders(event: H3Event): Record<string, string> {
  const headers: Record<string, string> = {}
  const incomingHeaders = getHeaders(event)
  for (const [k, v] of Object.entries(incomingHeaders)) {
    if (typeof v === 'string') headers[k] = v
  }

  const token = (headers['authorization'] || '').replace(/^Bearer\s+/i, '')
  const cookies = CookieUtils.toJSON(headers['cookie'] || '')
  const csrfToken = headers['x-csrf-token'] ?? cookies.CSRFTOKEN ?? ''
  if (token) {
    cookies.PHPSESSID = token
  }

  Object.assign(headers, {
    origin: 'https://www.pixiv.net',
    referer: 'https://www.pixiv.net/',
    'user-agent': PROXY_USER_AGENT,
    cookie: CookieUtils.toString(cookies),
  })
  headers['accept-language'] ??=
    'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6'
  if (csrfToken) {
    headers['x-csrf-token'] = csrfToken
  }
  delete headers['authorization']
  delete headers['host']
  return headers
}
```

- [ ] **Step 2: 让 pixivFetch 改用它**

把 `pixivFetch` 里 96-127 行的整段头构造(从 `// Start with all incoming headers` 到 `delete headers['host']`)替换为:

```ts
  const headers = buildPixivHeaders(event)
```

- [ ] **Step 3: 修正 pixivFetch 的 DEV 日志对 cookies 的引用**

原 DEV 日志(约 143 行)引用了已被提取走的 `cookies` 变量,改为从 headers 反解以保持相同输出:

```ts
  if (DEV) {
    console.info(
      colors.green(`[${method}] <`),
      colors.cyan(url.pathname + url.search)
    )
    console.info({
      params: opts.params,
      data: opts.data,
      cookies: CookieUtils.toJSON(headers.cookie || ''),
    })
  }
```

- [ ] **Step 4: 类型检查通过**

Run: `pnpm build`（或 `npx nuxi typecheck` 若可用）
Expected: 构建/类型检查成功,无 `cookies is not defined` 之类错误。

- [ ] **Step 5: 回归验证(dev server + curl)**

确保 dev server 在 3100 运行。此时 `/ajax` 仍走 `pixivFetch`(未改中间件),验证行为不变:

```bash
set -a; . ./.env; set +a
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
AUTH="Authorization: Bearer ${DEBUG_PIXIV_PHPSESSID}"
echo "--- /api/illust/random ---"; curl -s -o /dev/null "http://localhost:3100/api/illust/random?format=json&max=3" -w "status=%{http_code}\n"
echo "--- /api/user ---";          curl -s -o /dev/null "http://localhost:3100/api/user" -H "$AUTH" -w "status=%{http_code}\n"
echo "--- /ajax 示例 ---";         curl -s "http://localhost:3100/ajax/illust/${ID:-146845308}" -H "$AUTH" | python3 -c "import sys,json;d=json.load(sys.stdin);print('error=',d.get('error'),'hasBody=', 'body' in d)"
```
Expected:
- `/api/illust/random`: `200`。
- `/api/user`: `200`(带合法 token)。
- `/ajax/...`: `error= False hasBody= True`(结构与改前一致)。

- [ ] **Step 6: 提交**

```bash
git add server/utils/pixiv.ts
git commit -m "$(cat <<'EOF'
refactor(server): extract buildPixivHeaders from pixivFetch

No behavior change; pixivFetch keeps its buffering contract for /api routes.
Prepares the shared header builder for the streaming API proxy middleware.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 迁移 API 反代中间件到 proxyPass 流式

**Files:**
- Modify: `server/middleware/pixiv-proxy.ts`

**Interfaces:**
- Consumes: `buildPixivHeaders`(from `~~/server/utils/pixiv`)、`proxyPass`(from `~~/server/utils/proxy`)

- [ ] **Step 1: 重写 pixiv-proxy.ts 的 handler**

保留 `shouldProxy`、`PROXY_PATTERNS`、UA 黑名单相关全部函数不变;只改 import 与 `defineEventHandler`:

```ts
import escapeRegExp from 'lodash.escaperegexp'
import { buildPixivHeaders } from '~~/server/utils/pixiv'
import { proxyPass } from '~~/server/utils/proxy'

// PROXY_PATTERNS / shouldProxy / PROXY_RESPONSE_HEADERS 保持不变：
const PROXY_RESPONSE_HEADERS = [
  'cache-control',
  'content-disposition',
  'content-type',
  'etag',
  'expires',
  'last-modified',
]

export default defineEventHandler(async (event) => {
  const pathname = getRequestURL(event).pathname
  if (!shouldProxy(pathname)) {
    return
  }

  if (!checkCanPassUaBlackList(event)) {
    throw createError({ statusCode: 403, message: '403' })
  }

  const reqUrl = getRequestURL(event)
  const headers = buildPixivHeaders(event)
  const body =
    event.method !== 'GET' ? await readRawBody(event) : undefined

  return proxyPass(event, {
    url: new URL(
      reqUrl.pathname + reqUrl.search,
      'https://www.pixiv.net/'
    ).toString(),
    method: event.method,
    headers,
    body,
    responseHeaders: PROXY_RESPONSE_HEADERS,
    signal: AbortSignal.timeout(9000),
    devLabel: 'ajax',
  })
})
```

（`checkCanPassUaBlackList`、`getUaBlacklistRegex` 及模块级缓存变量原样保留在文件下方。）

- [ ] **Step 2: 重启 dev server**

停掉旧 dev server 进程,重新 `pnpm dev --port 3100`,等 `Nuxt Nitro server built`。

- [ ] **Step 3: 验证 GET /ajax 流式 + 内容一致**

```bash
set -a; . ./.env; set +a
AUTH="Authorization: Bearer ${DEBUG_PIXIV_PHPSESSID}"
ID=${ID:-146845308}
# 与「改前」对比：改前该端点返回同样的 JSON（error/body 结构）
curl -s "http://localhost:3100/ajax/illust/${ID}" -H "$AUTH" \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print('error=',d.get('error'),'id=',d.get('body',{}).get('illustId'))"
curl -s -o /dev/null -D - "http://localhost:3100/ajax/illust/${ID}" -H "$AUTH" \
  | grep -iE 'HTTP/|content-type|content-encoding'
```
Expected:
- JSON:`error= False id= <该作品id>`。
- 响应头:`content-type: application/json`,**无 `content-encoding`**(白名单不含,已解压)。

- [ ] **Step 4: 验证 POST(form-urlencoded body 转发)——关注/取关 uid=10**

用户已授权:关注 uid=10(pixiv 站长)再取关,验证 form-urlencoded body 被原样转发。端点取自 `app/api/pixiv-client.ts:747-766`。需先取 CSRF token(`/api/user` 的 `token` 字段)。

```bash
set -a; . ./.env; set +a
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
AUTH="Authorization: Bearer ${DEBUG_PIXIV_PHPSESSID}"
CSRF=$(curl -s "http://localhost:3100/api/user" -H "$AUTH" \
  | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))")
echo "csrf len: ${#CSRF}"   # 应 > 0
echo "--- follow uid=10 ---"
curl -s -X POST "http://localhost:3100/bookmark_add.php" \
  -H "$AUTH" -H "x-csrf-token: $CSRF" -H "User-Agent: $UA" \
  -H 'content-type: application/x-www-form-urlencoded' \
  --data 'mode=add&type=user&user_id=10&tag=&restrict=0&format=json' \
  -w "\nstatus=%{http_code}\n"
echo "--- unfollow uid=10 (清理) ---"
curl -s -X POST "http://localhost:3100/rpc_group_setting.php" \
  -H "$AUTH" -H "x-csrf-token: $CSRF" -H "User-Agent: $UA" \
  -H 'content-type: application/x-www-form-urlencoded' \
  --data 'mode=del&type=bookuser&id=10' \
  -w "\nstatus=%{http_code}\n"
```
Expected:
- `csrf len` > 0。
- follow:**非 502**,返回 pixiv 成功 JSON(如 `{"error":false,...}` 或含 follow 结果)→ 证明 POST body 已正确送达并被 pixiv 解析。
- unfollow:同样成功,恢复原状(清理)。
- 若任一返回 `502`,说明 body/头转发有问题,需排查后再继续。

- [ ] **Step 5: 验证 UA 黑名单仍拦截**

临时用一个会命中黑名单的 UA(依据 `NUXT_UA_BLACKLIST` 配置;若本地未配黑名单则此步跳过并记录)。有配置时:

```bash
curl -s -o /dev/null "http://localhost:3100/ajax/illust/${ID:-146845308}" \
  -H "User-Agent: <黑名单中的某个模式>" -w "status=%{http_code}\n"
```
Expected: `403`。

- [ ] **Step 6: 回归 /api 路由**

```bash
AUTH="Authorization: Bearer ${DEBUG_PIXIV_PHPSESSID}"
curl -s -o /dev/null "http://localhost:3100/api/illust/random?format=json&max=3" -w "random=%{http_code}\n"
curl -s -o /dev/null "http://localhost:3100/api/user" -H "$AUTH" -w "user=%{http_code}\n"
```
Expected: 均 `200`(未受本次中间件改动影响)。

- [ ] **Step 7: 提交**

```bash
git add server/middleware/pixiv-proxy.ts
git commit -m "$(cat <<'EOF'
feat(server): stream pixiv API proxy via proxyPass

Replace the JSON parse→reserialize buffering path with streaming passthrough
using proxyPass + buildPixivHeaders. Request-header forwarding and UA
blacklist behavior are preserved; /api routes still use pixivFetch.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 8: 收尾——关闭我起的 dev server**

关闭在 3100 起的 dev server 进程(自己起的,安全)。确认端口释放。

---

## Self-Review

**Spec coverage:**
- 目标1(API 流式)→ Task 3 ✓;目标2(修 HEAD)→ Task 1 ✓;目标3(去 parse/reserialize)→ Task 3 ✓;目标4(pixivFetch 契约不动)→ Task 2 保持 + api 路由不改 ✓;目标5(DEV body 可见)→ Task 1 proxyPass tee ✓。
- 行为变更 1-6 均落在对应任务;删除 pximgFetch → Task 1 Step 4 ✓;图片响应头白名单-only → Task 1 Step 3(PROXY_RESPONSE_HEADERS 挑选)✓;请求头不对称保留 → Task 1(图片白名单)+ Task 2/3(API 全转)✓。

**Placeholder scan:** 无 TBD/TODO;所有代码步骤含完整代码;验证步骤含具体 curl 与期望输出。Task 3 Step 4/5 依赖环境(安全的 POST 端点 / 黑名单配置),已给出「无把握则跳过并记录」的明确降级说明,非占位。

**Type consistency:** `proxyPass(event, opts)` 与 `ProxyPassOptions` 在 Task 1 定义,Task 1/3 调用签名一致;`buildPixivHeaders(event): Record<string,string>` 在 Task 2 定义,Task 3 消费一致;`proxyAwareFetch` Task 1 Step 1 导出、proxy.ts 消费一致。
