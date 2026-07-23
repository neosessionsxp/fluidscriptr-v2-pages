/**
 * FluidScriptr License Validation Worker
 * Deploy to Cloudflare Workers
 * Route: fluidscriptr-license.kerospad.workers.dev
 *
 * Validates Gumroad license keys for FluidScriptr.
 * Called by the tool on first unlock and periodically to verify.
 */

const PRODUCT_ID = 'llu00k2-UthLljfBYrB9MQ==';
// Adaptation Package add-on ($50 add-on / $99 standalone).
// Create the product on Gumroad, then paste its product_id here.
const ADAPTATION_PRODUCT_ID = '0BJYCZCCveNLbqY4VrYLrg==';
const ALLOWED_ORIGINS = [
  'https://fluidscriptr.app',
  'https://www.fluidscriptr.app',
  'https://v2.fluidscriptr.app',
  'https://fluidscriptr-v2-pages.pages.dev',
  'http://localhost',       // local testing
  'null',                   // file:// opens
];

export default {
  async fetch(request, env) {
    // ── CORS preflight ───────────────────────────────────────
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return json({ success: false, error: 'Method not allowed' }, 405, corsHeaders);
    }

    // ── Parse body ───────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ success: false, error: 'Invalid JSON' }, 400, corsHeaders);
    }

    const { license_key } = body;

    if (!license_key || typeof license_key !== 'string' || license_key.trim().length < 10) {
      return json({ success: false, error: 'Missing or invalid license key' }, 400, corsHeaders);
    }

    // ── Master key bypass (founder access, no Gumroad purchase) ──
    if (env.MASTER_LICENSE_KEY && license_key.trim() === env.MASTER_LICENSE_KEY) {
      return json({
        success: true,
        email: 'snowmuji@gmail.com',
        created_at: new Date().toISOString(),
      }, 200, corsHeaders);
    }

    // ── Limited founder key bypass (gift/beta access, no Gumroad purchase) ──
    // Unlocks the tool same as the master key, but the ai-proxy-worker caps
    // this specific key to a fixed number of full generations (see
    // FOUNDER_KEY_LIMITED / FOUNDER_LIMITED_GENERATIONS there). This worker
    // only gates the unlock screen, so it always lets the key in — the
    // generation cap is enforced at generate time, not here.
    if (env.FOUNDER_KEY_LIMITED && license_key.trim().toUpperCase() === env.FOUNDER_KEY_LIMITED.trim().toUpperCase()) {
      return json({
        success: true,
        email: 'founder-gift@fluidscriptr.app',
        created_at: new Date().toISOString(),
      }, 200, corsHeaders);
    }

    // Which product(s) to accept:
    //  - product: 'adaptation' → ONLY the Adaptation Package key unlocks the
    //    adaptation section inside the tool.
    //  - core gate (no product field) → accept EITHER key. A $49 core buyer OR
    //    a $99 standalone Adaptation Package buyer should both get into the tool.
    const productIds = body.product === 'adaptation'
      ? [ADAPTATION_PRODUCT_ID]
      : [PRODUCT_ID, ADAPTATION_PRODUCT_ID];

    // ── Verify with Gumroad (try each accepted product) ──────
    try {
      let lastData = null;

      for (const productId of productIds) {
        const params = new URLSearchParams({
          product_id: productId,
          license_key: license_key.trim().toUpperCase(),
          increment_uses_count: 'false', // don't increment on every page load
        });

        const gumroadRes = await fetch('https://api.gumroad.com/v2/licenses/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });

        const data = await gumroadRes.json();
        lastData = data;

        if (!data.success) continue; // key isn't valid for this product — try the next

        // Check the purchase wasn't refunded or chargedback
        const purchase = data.purchase;
        if (purchase.refunded || purchase.chargebacked) {
          return json({ success: false, error: 'This license is no longer valid.' }, 200, corsHeaders);
        }

        // Valid for this product — unlock
        return json({
          success: true,
          email: purchase.email,
          created_at: purchase.created_at,
        }, 200, corsHeaders);
      }

      // Not valid for any accepted product
      return json({ success: false, error: 'Invalid license key.' }, 200, corsHeaders);

    } catch (err) {
      return json({ success: false, error: 'Verification service unavailable. Try again.' }, 502, corsHeaders);
    }
  }
};

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}
