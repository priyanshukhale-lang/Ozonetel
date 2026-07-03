# Zen Cruises Campaign Console — Deploy to Vercel

Two files:
- `index.html` — the dashboard
- `api/proxy.js` — serverless function that calls Ozonetel on the server side (fixes the CORS block)

## 1. Push to GitHub

```bash
mkdir zen-campaign-console
cd zen-campaign-console
# copy index.html and the api/ folder into here
git init
git add .
git commit -m "Campaign console"
git branch -M main
git remote add origin https://github.com/<your-username>/zen-campaign-console.git
git push -u origin main
```

(Create the empty repo on GitHub first at github.com/new, then run the commands above.)

## 2. Deploy on Vercel

1. Go to vercel.com → **Add New → Project**
2. Import the GitHub repo you just pushed
3. Framework preset: leave as **Other** (no build step needed)
4. Click **Deploy**

Vercel will give you a live URL like `https://zen-campaign-console.vercel.app` — open it, the dashboard loads with your credentials pre-filled, and API calls route through `/api/proxy` automatically.

## 3. If a request fails

Open the **Debug Log** panel on the page — it shows the exact upstream URL and status/error Ozonetel returned. Paste that here and I'll adjust `api/proxy.js` or the endpoint path in `index.html` accordingly.

## Notes
- No `npm install` or `package.json` needed — the proxy function only uses built-in `fetch`.
- Your API key is stored in the page's config fields (client-side), not hardcoded server-side. For a shared/public deployment, you'd normally move it into a Vercel Environment Variable instead — say the word if you want that version.
