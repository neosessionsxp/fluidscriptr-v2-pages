/**
 * FluidScriptr AI Proxy Worker
 * Deploy to Cloudflare Workers
 * Suggested route: fluidscriptr-ai.kerospad.workers.dev
 *
 * Lets licensed users generate WITHOUT their own Anthropic key.
 * Holds the shared Anthropic key as a secret, validates the Gumroad
 * license, meters usage against a monthly budget, forwards to Anthropic.
 *
 * Setup:
 *   1. wrangler kv namespace create USAGE
 *      → add the binding to wrangler.toml:
 *        [[kv_namespaces]]
 *        binding = "USAGE"
 *        id = "<namespace-id>"
 *   2. wrangler secret put ANTHROPIC_API_KEY
 *   3. (optional) wrangler secret put MASTER_LICENSE_KEY
 *      → same value/name as the MASTER_LICENSE_KEY secret on the
 *        license-worker (founder-access bypass there). Store it in
 *        ALL CAPS — this worker compares against the license key
 *        after it's uppercased. Entering it as your license key
 *        bypasses Gumroad validation, the monthly budget cap, and
 *        the rate limit. Usage still records to KV under that key.
 *   4. (optional) wrangler secret put FOUNDER_KEY_LIMITED
 *      → same value/name as the FOUNDER_KEY_LIMITED secret on the
 *        license-worker (gift/beta founder bypass there). Also bypasses
 *        Gumroad validation, the monthly budget cap, and the rate limit
 *        like the master key — but is capped to
 *        FOUNDER_LIMITED_GENERATIONS total full project runs, tracked in
 *        KV under `founder3:<key>`. The app signals the start of each
 *        full project run with { action: "start_project" }; once the cap
 *        is hit, start_project returns success:false and the app blocks
 *        further generation for that key.
 *   5. wrangler deploy
 *
 * Endpoints (all POST):
 *   { action: "generate", license_key, system, userMsg, maxTokens }
 *     → Anthropic /v1/messages response + fsr_credits {used, budget, remaining} (micro-dollars)
 *   { action: "usage", license_key }
 *     → { success, fsr_credits }
 *   { action: "start_project", license_key }
 *     → { success, founder_generations_remaining? } — call once per full
 *       project run (screenplay/novel/enhancement/adaptation). No-op
 *       (always success) for normal and master keys; enforces the 3-use
 *       cap for FOUNDER_KEY_LIMITED.
 */

const PRODUCT_ID = 'llu00k2-UthLljfBYrB9MQ==';
const ALLOWED_ORIGINS = [
  'https://fluidscriptr.app',
  'https://www.fluidscriptr.app',
  'https://v2.fluidscriptr.app',
  'https://fluidscriptr-v2-pages.pages.dev',
  'http://localhost',
  'null',
];

// ── Metering config ──────────────────────────────────────────
const MODEL = 'claude-sonnet-4-6';          // pinned server-side; client cannot change it
const MAX_OUTPUT_TOKENS = 4096;             // hard cap per request
const MAX_INPUT_CHARS = 500000;             // ~125k tokens; covers the 60k-word bible call
const MONTHLY_BUDGET_MICRO = 5_000_000;     // $5.00/month per license ≈ 2 full projects
const REQS_PER_MINUTE = 20;                 // per-license rate limit
const LICENSE_CACHE_TTL = 86400;            // re-verify with Gumroad once per day
const FOUNDER_LIMITED_GENERATIONS = 3;      // full project runs allowed on FOUNDER_KEY_LIMITED

// Sonnet 4.6 pricing in micro-dollars per token
const PRICE = {
  input: 3,          // $3.00 / M
  output: 15,        // $15.00 / M
  cache_write: 3.75, // $3.75 / M
  cache_read: 0.3,   // $0.30 / M
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405, corsHeaders);

    let body;
    try { body = await request.json(); }
    catch { return json({ success: false, error: 'Invalid JSON' }, 400, corsHeaders); }

    const license = (body.license_key || '').trim().toUpperCase();
    if (license.length < 10) {
      return json({ success: false, error: 'Missing or invalid license key', code: 'bad_license' }, 400, corsHeaders);
    }

    // ── Master key: bypasses Gumroad check, budget cap, rate limit ──
    // Same secret as license-worker.js's MASTER_LICENSE_KEY founder bypass.
    const isMaster = !!env.MASTER_LICENSE_KEY && license === env.MASTER_LICENSE_KEY.trim().toUpperCase();

    // ── Limited founder key: same bypasses as master, but capped to
    // FOUNDER_LIMITED_GENERATIONS full project runs (see start_project below).
    // Same secret as license-worker.js's FOUNDER_KEY_LIMITED founder bypass.
    const isLimitedFounder = !isMaster && !!env.FOUNDER_KEY_LIMITED &&
      license === env.FOUNDER_KEY_LIMITED.trim().toUpperCase();
    const isFounder = isMaster || isLimitedFounder;

    // ── Validate license (KV-cached, daily re-verify) ────────
    const licStatus = isFounder ? { valid: true } : await checkLicense(license, env);
    if (!licStatus.valid) {
      return json({ success: false, error: licStatus.error, code: 'bad_license' }, 403, corsHeaders);
    }

    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    const usageKey = `use:${license}:${month}`;

    // ── Usage query ──────────────────────────────────────────
    if (body.action === 'usage') {
      if (isLimitedFounder) {
        const remaining = await getFounderRemaining(env, license);
        return json({ success: true, fsr_credits: { unlimited: true, founder_generations_remaining: remaining } }, 200, corsHeaders);
      }
      const u = await getUsage(env, usageKey);
      return json({ success: true, fsr_credits: creditInfo(u) }, 200, corsHeaders);
    }

    // ── Start of a full project run (screenplay/novel/enhancement/
    // adaptation) — only meaningful for FOUNDER_KEY_LIMITED, which is
    // capped to a fixed number of full runs. No-op success for every
    // other key; the app calls this once per run regardless of key type.
    if (body.action === 'start_project') {
      if (!isLimitedFounder) return json({ success: true }, 200, corsHeaders);

      const founderKey = `founder3:${license}`;
      const used = parseInt(await env.USAGE.get(founderKey)) || 0;
      if (used >= FOUNDER_LIMITED_GENERATIONS) {
        return json({
          success: false,
          code: 'founder_limit_reached',
          error: `This founder key's ${FOUNDER_LIMITED_GENERATIONS} free generations have all been used.`,
        }, 402, corsHeaders);
      }
      await env.USAGE.put(founderKey, String(used + 1), { expirationTtl: 31536000 }); // 1 year
      return json({ success: true, founder_generations_remaining: FOUNDER_LIMITED_GENERATIONS - (used + 1) }, 200, corsHeaders);
    }

    // ── Generate ─────────────────────────────────────────────
    const system = typeof body.system === 'string' ? body.system : '';
    const userMsg = typeof body.userMsg === 'string' ? body.userMsg : '';
    if (!system || !userMsg) {
      return json({ success: false, error: 'Missing system or userMsg', code: 'bad_request' }, 400, corsHeaders);
    }
    if (system.length + userMsg.length > MAX_INPUT_CHARS) {
      return json({ success: false, error: 'Input too large', code: 'too_large' }, 413, corsHeaders);
    }
    const maxTokens = Math.min(Math.max(parseInt(body.maxTokens) || 2000, 1), MAX_OUTPUT_TOKENS);

    // Rate limit (soft, per minute) — skipped for master/founder keys
    if (!isFounder) {
      const rlKey = `rl:${license}:${Math.floor(Date.now() / 60000)}`;
      const rlCount = parseInt(await env.USAGE.get(rlKey)) || 0;
      if (rlCount >= REQS_PER_MINUTE) {
        return json({ success: false, error: 'Too many requests — slow down a moment.', code: 'rate_limited' }, 429, corsHeaders);
      }
      await env.USAGE.put(rlKey, String(rlCount + 1), { expirationTtl: 120 });
    }

    // Budget check (soft cap — checked before, recorded after) — skipped for master/founder keys
    const usage = await getUsage(env, usageKey);
    if (!isFounder && usage.cost >= MONTHLY_BUDGET_MICRO) {
      return json({
        success: false,
        code: 'credits_exhausted',
        error: 'Monthly included AI credits used up. Add your own Anthropic API key (🔑 API Key) for unlimited generation — credits reset next month.',
        fsr_credits: creditInfo(usage),
      }, 402, corsHeaders);
    }

    // ── Forward to Anthropic ─────────────────────────────────
    let res, data;
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'prompt-caching-2024-07-31',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: maxTokens,
          system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content: userMsg }],
        }),
      });
      data = await res.json();
    } catch {
      return json({ success: false, error: 'AI service unavailable. Try again.', code: 'upstream_error' }, 502, corsHeaders);
    }

    if (!res.ok || data.type === 'error') {
      const msg = data?.error?.message || 'Generation failed. Try again.';
      return json({ success: false, error: msg, code: 'upstream_error' }, 502, corsHeaders);
    }

    // ── Record usage ─────────────────────────────────────────
    const u = data.usage || {};
    const costMicro = Math.ceil(
      (u.input_tokens || 0) * PRICE.input +
      (u.output_tokens || 0) * PRICE.output +
      (u.cache_creation_input_tokens || 0) * PRICE.cache_write +
      (u.cache_read_input_tokens || 0) * PRICE.cache_read
    );
    const updated = {
      in: usage.in + (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0),
      out: usage.out + (u.output_tokens || 0),
      cost: usage.cost + costMicro,
    };
    // 62-day TTL: keeps KV clean, key naturally expires after the month ends
    await env.USAGE.put(usageKey, JSON.stringify(updated), { expirationTtl: 5356800 });

    const fsr_credits = isLimitedFounder
      ? { unlimited: true, founder_generations_remaining: await getFounderRemaining(env, license) }
      : creditInfo(updated);

    return json({ ...data, success: true, fsr_credits }, 200, corsHeaders);
  },
};

// ── Helpers ────────────────────────────────────────────────
async function checkLicense(license, env) {
  const cacheKey = `lic:${license}`;
  const cached = await env.USAGE.get(cacheKey);
  if (cached === 'valid') return { valid: true };
  if (cached === 'invalid') return { valid: false, error: 'This license is not valid.' };

  try {
    const params = new URLSearchParams({
      product_id: PRODUCT_ID,
      license_key: license,
      increment_uses_count: 'false',
    });
    const gr = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await gr.json();
    const ok = data.success && !data.purchase?.refunded && !data.purchase?.chargebacked;
    await env.USAGE.put(cacheKey, ok ? 'valid' : 'invalid', { expirationTtl: LICENSE_CACHE_TTL });
    return ok ? { valid: true } : { valid: false, error: 'This license is not valid.' };
  } catch {
    // Gumroad down — fail open for known-cached users only; here, fail closed politely
    return { valid: false, error: 'License verification unavailable. Try again shortly.' };
  }
}

async function getUsage(env, key) {
  try {
    const raw = await env.USAGE.get(key);
    if (raw) {
      const p = JSON.parse(raw);
      return { in: p.in || 0, out: p.out || 0, cost: p.cost || 0 };
    }
  } catch { /* fall through */ }
  return { in: 0, out: 0, cost: 0 };
}

async function getFounderRemaining(env, license) {
  const used = parseInt(await env.USAGE.get(`founder3:${license}`)) || 0;
  return Math.max(0, FOUNDER_LIMITED_GENERATIONS - used);
}

function creditInfo(u) {
  return {
    used_micro: u.cost,
    budget_micro: MONTHLY_BUDGET_MICRO,
    remaining_micro: Math.max(0, MONTHLY_BUDGET_MICRO - u.cost),
    used_pct: Math.min(100, Math.round((u.cost / MONTHLY_BUDGET_MICRO) * 100)),
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}
