// Vercel Serverless Function — acts as a server-side proxy to Ozonetel's API.
// Runs on Vercel's servers, not in the browser, so CORS does not apply here.
// The browser calls THIS function (same-origin), and this function calls Ozonetel.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Only POST is supported on this endpoint' });
    return;
  }

  const { domain, path, method = 'GET', apiKey, params = {} } = req.body || {};

  if (!domain || !path) {
    res.status(400).json({ error: 'Missing domain or path in request' });
    return;
  }

  const base = domain.startsWith('http') ? domain : `https://${domain}`;
  let url = base.replace(/\/$/, '') + path;

  const headers = {
    apiKey: apiKey || '',
    'Content-Type': 'application/json',
  };

  let fetchOpts = { method, headers };

  if (method.toUpperCase() === 'GET') {
    const qs = new URLSearchParams(params).toString();
    if (qs) url += `?${qs}`;
  } else {
    fetchOpts.body = JSON.stringify(params);
  }

  try {
    const upstream = await fetch(url, fetchOpts);
    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = text; }

    res.status(200).json({
      upstream_status: upstream.status,
      upstream_url: url,
      data,
    });
  } catch (err) {
    res.status(502).json({ error: `Proxy could not reach Ozonetel: ${err.message}` });
  }
}
