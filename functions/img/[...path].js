export async function onRequest(context) {
  const { params } = context;
  const base = 'https://i.pximg.net';
  const imgUrl = `${base}/${params.path.join('/')}`;
  
  const res = await fetch(imgUrl, {
    headers: { referer: 'https://www.pixiv.net/' },
    cf: { cacheTtl: 3600, cacheEverything: true },
  });

  const headers = new Headers(res.headers);
  headers.set('access-control-allow-origin', '*');
  return new Response(res.body, { status: res.status, headers });
}
