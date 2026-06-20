/**
 * pzcel-proxy — Cloudflare Worker that forwards Ask AI requests to OpenAI.
 *
 * The OpenAI API key is stored as a Worker SECRET (env.OPENAI_API_KEY) and is
 * NEVER present in this file or the client. The add-in calls this Worker; the
 * Worker adds the key and calls OpenAI. This keeps the key off the public site
 * and fixes the in-browser CORS problem.
 *
 * Deploy: see ../README.md
 */

// Origins allowed to call this proxy from a browser. The add-in is served from
// greenhueblues.me, so requests from the Excel task pane carry that Origin.
const ALLOWED_ORIGINS = ["https://greenhueblues.me"];

const MODEL = "gpt-4o-mini";
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

    if (!env.OPENAI_API_KEY) {
      return json({ error: "Proxy is missing the OPENAI_API_KEY secret." }, 500, request);
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

    let openaiRes;
    try {
      openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt + context },
          ],
        }),
      });
    } catch (err) {
      return json({ error: "Upstream request failed: " + (err?.message || err) }, 502, request);
    }

    const data = await openaiRes.json().catch(() => ({}));
    if (!openaiRes.ok) {
      const msg = data?.error?.message || `OpenAI HTTP ${openaiRes.status}`;
      return json({ error: msg }, openaiRes.status, request);
    }

    const answer = data?.choices?.[0]?.message?.content ?? "(No response returned.)";
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
