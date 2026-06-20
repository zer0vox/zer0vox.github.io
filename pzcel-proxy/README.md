# pzcel-proxy

A tiny Cloudflare Worker that lets the pzcel Excel add-in use OpenAI **without
putting the API key in the browser**. The add-in calls this Worker; the Worker
holds the key as an encrypted secret and forwards the request to OpenAI. It also
sets CORS headers, so Ask AI works in every browser.

```
Excel add-in  →  pzcel-proxy (Cloudflare Worker, holds the key)  →  OpenAI
```

## One-time deploy

From this folder (`pzcel-proxy/`):

```bash
npm install                       # installs wrangler locally
npx wrangler login                # opens the browser to authorize Cloudflare (free account)
npx wrangler secret put OPENAI_API_KEY   # paste your NEW OpenAI key when prompted
npx wrangler deploy
```

`wrangler deploy` prints a URL like:

```
https://pzcel-proxy.<your-subdomain>.workers.dev
```

That URL is **not** a secret — it's safe to share.

## Wire it into the add-in

Paste the Worker URL into `PROXY_URL` in
`../public/pzcel-addin/index.html`, then redeploy the site. After that, Ask AI
works for everyone with no per-user key.

## Important: cap your spending

This endpoint is reachable from the internet, so set a hard limit as a backstop:
**platform.openai.com → Settings → Limits → set a monthly budget cap.**
The `ALLOWED_ORIGINS` allowlist in `src/index.js` blocks other websites from
calling it in a browser, but a usage cap is the real protection.

## Rotating the key

```bash
npx wrangler secret put OPENAI_API_KEY   # paste the new key; overwrites the old
```

No redeploy of the site needed — the key only lives in the Worker.
