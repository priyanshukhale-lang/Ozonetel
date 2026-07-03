// Vercel Serverless Function — proxies requests to Ozonetel's API.
// Uses Node's raw https module (not fetch) because Ozonetel's endpoints
// expect a JSON body even on GET requests, and the standard fetch API
// refuses to attach a body to GET calls.

import https from 'https';
import { URL } from 'url';

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
  let target;
  try {
    target = new URL(base.replace(/\/$/, '') + path);
  } catch (e) {
    res.status(400).json({ error: `Invalid domain/path: ${e.message}` });
    return;
  }

  const bodyStr = JSON.stringify(params);

  const options = {
    hostname: target.hostname,
    path: target.pathname + target.search,
    method: method.toUpperCase(),
    headers: {
      apiKey: apiKey || '',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyStr),
    },
  };

  const upstreamResult = await new Promise((resolve) => {
    const upstreamReq = https.request(options, (upstreamRes) => {
      let data = '';
      upstreamRes.on('data', (chunk) => (data += chunk));
      upstreamRes.on('end', () => {
        resolve({ status: upstreamRes.statusCode, body: data });
      });
    });

    upstreamReq.on('error', (err) => {
      resolve({ error: err.message });
    });

    upstreamReq.write(bodyStr);
    upstreamReq.end();
  });

  if (upstreamResult.error) {
    res.status(502).json({ error: `Proxy could not reach Ozonetel: ${upstreamResult.error}` });
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(upstreamResult.body);
  } catch (e) {
    parsed = upstreamResult.body;
  }

  res.status(200).json({
    upstream_status: upstreamResult.status,
    upstream_url: target.toString(),
    data: parsed,
  });
}
