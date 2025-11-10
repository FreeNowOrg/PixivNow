export async function onRequest() {
  const res = await fetch('https://www.pixiv.net/ajax/illust/discovery');
  const data = await res.json();
  return new Response(JSON.stringify({
    status: 'ok',
    data: data.body ? data.body.slice(0, 3) : [],
  }), {
    headers: { 'content-type': 'application/json' },
  });
}
