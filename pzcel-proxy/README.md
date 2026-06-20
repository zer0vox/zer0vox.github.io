# pzcel-proxy

A tiny Cloudflare Worker that powers the pzcel Excel add-in's **Ask AI** using
**Cloudflare Workers AI** — a free, built-in model that runs *inside* the Worker.
No OpenAI account, no API key, no billing, and nothing secret in the browser.
The Worker also sets CORS headers, so Ask AI works in every browser.

```
Excel add-in  →  pzcel-proxy (Cloudflare Worker, runs the model)  →  answer
```

## One-time deploy

From this folder (`pzcel-proxy/`):

```bash
npm install            # installs wrangler locally
npx wrangler login     # opens the browser to authorize Cloudflare (free account)
npx wrangler deploy
```

That's it — **no secret to set**, because Workers AI needs no key.

`wrangler deploy` prints a URL like:

```
https://pzcel-proxy.<your-subdomain>.workers.dev
```

That URL is safe to share (it's not a secret).

## Wire it into the add-in

Paste the Worker URL into `PROXY_URL` in
`../public/pzcel-addin/index.html`, then redeploy the site. After that, Ask AI
works for everyone with no key required.

## Free tier

Workers AI includes **10,000 Neurons/day** free — plenty for a personal tool.
To use a stronger model, change `MODEL` in `src/index.js` (e.g.
`@cf/meta/llama-3.3-70b-instruct-fp8-fast`); larger models spend more neurons.

## Other free options (if you ever want better quality)

These need a (free) API key held as a Worker secret — same pattern, one extra step:

- **Groq** — free, very fast, runs Llama 3.3 70B. `wrangler secret put GROQ_API_KEY`.
- **Google Gemini** — free tier, Gemini 2.0 Flash. `wrangler secret put GEMINI_API_KEY`.

Ask and I'll switch the Worker to either.
