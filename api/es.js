// Vercel serverless function: keeps your Epidemic Sound API key on the server.
// Place this file in your repo at  api/es.js
// Then in Vercel: Project > Settings > Environment Variables > add ES_KEY = your Epidemic Sound API key.

const ALLOWED = /^\/v0\/(tracks\/search|tracks\/[0-9a-f-]{36}\/stream|genres|moods|collections)\/?$/;

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');

  const { path, ...rest } = req.query;
  if (typeof path !== 'string' || !ALLOWED.test(path)) return res.status(404).send('Not found');

  const key = process.env.ES_KEY;
  if (!key) return res.status(500).send('ES_KEY is not set in the Vercel environment variables');

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(rest)) [].concat(v).forEach((x) => qs.append(k, x));
  const query = qs.toString();

  try {
    const up = await fetch('https://api.epidemicsound.com' + path + (query ? '?' + query : ''), {
      headers: {
        Authorization: 'Bearer ' + key,
        'x-partner-user-id': req.headers['x-partner-user-id'] || 'anonymous',
        Accept: 'application/json',
      },
    });
    const body = await up.text();
    res.setHeader('Content-Type', up.headers.get('content-type') || 'application/json');
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    return res.status(up.status).send(body);
  } catch (e) {
    return res.status(502).send('Could not reach Epidemic Sound');
  }
};
