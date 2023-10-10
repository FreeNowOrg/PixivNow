import { EventContext } from '@cloudflare/workers-types'

export async function handleImageProxy(
  ctx: EventContext<any, any, any>
): Promise<Response> {
  switch (ctx.params.prefix) {
    // s.pximg.net
    case '~':
    case 's':
      const url = new URL(ctx.request.url)
      url.port = ''
      url.protocol = 'https:'
      url.hostname = 's.pximg.net'
      url.pathname = Array.isArray(ctx.params.path)
        ? '/' + ctx.params.path.join('/')
        : ctx.params.path
      const request = new Request(url, ctx.request)
      return fetch(request, {
        headers: {
          referer: 'https://www.pixiv.net/',
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:110.0) Gecko/20100101 Firefox/110.0',
        },
      })
    default:
      return new Response('Not implemented', { status: 501 })
  }
}
