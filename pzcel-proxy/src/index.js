/**
 * pzcel-proxy — Cloudflare Worker that answers Ask AI requests using
 * Cloudflare Workers AI (free tier, no external API key).
 *
 * The model runs inside the Worker via the `AI` binding (see wrangler.toml),
 * so there is NO OpenAI key, no billing, and no key exposed to the browser.
 * The Worker also sets CORS headers, so Ask AI works in every browser.
 *
 * Deploy: see ../README.md
 */

// Origins allowed to call this proxy from a browser. The add-in is served from
// greenhueblues.me, so requests from the Excel task pane carry that Origin.
const ALLOWED_ORIGINS = ["https://greenhueblues.me"];

// Workers AI model. Swap for a larger one (e.g.
// "@cf/meta/llama-3.3-70b-instruct-fp8-fast") for stronger answers — uses more
// of the daily free quota.
const MODEL = "@cf/meta/llama-3.1-8b-instruct";

const SYSTEM_PROMPT =
  "You are pzcel, an assistant embedded in Microsoft Excel. Help the user " +
  "analyze, format, and reason about their spreadsheet data. Be concise and practical.";

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, request);
    }

    if (!env.AI) {
      return json({ error: "Workers AI binding 'AI' is not configured (see wrangler.toml)." }, 500, request);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body." }, 400, request);
    }

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const context = typeof body.context === "string" ? body.context : "";
    if (!prompt) {
      return json({ error: "Missing 'prompt'." }, 400, request);
    }

    let aiResp;
    try {
      aiResp = await env.AI.run(MODEL, {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt + context },
        ],
      });
    } catch (err) {
      return json({ error: "AI request failed: " + (err?.message || err) }, 502, request);
    }

    const answer = (aiResp && aiResp.response) || "(No response returned.)";
    return json({ answer }, 200, request);
  },
};

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(obj, status, request) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(request) },
  });
}
