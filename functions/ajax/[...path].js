export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);

  const upstream = new URL(`https://pixiv.net/ajax/${params.path.join('/')}`);
  upstream.search = url.search;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.set('referer', 'https://www.pixiv.net/');
  headers.set('origin', 'https://www.pixiv.net');

  const res = await fetch(upstream.toString(), {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
  });

  const respHeaders = new Headers(res.headers);
  respHeaders.set('access-control-allow-origin', '*');

  return new Response(res.body, { status: res.status, headers: respHeaders });
}
