/**
 * FluidScriptr License Validation Worker
 * Deploy to Cloudflare Workers
 * Route: fluidscriptr-license.kerospad.workers.dev
 *
 * Validates Gumroad license keys for FluidScriptr.
 * Called by the tool on first unlock and periodically to verify.
 */

const PRODUCT_ID = 'llu00k2-UthLljfBYrB9MQ==';
const ALLOWED_ORIGINS = [
  'https://fluidscriptr.app',
  'https://www.fluidscriptr.app',
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

    // ── Verify with Gumroad ──────────────────────────────────
    try {
      const params = new URLSearchParams({
        product_id: PRODUCT_ID,
        license_key: license_key.trim().toUpperCase(),
        increment_uses_count: 'false', // don't increment on every page load
      });

      const gumroadRes = await fetch('https://api.gumroad.com/v2/licenses/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      const data = await gumroadRes.json();

      if (!data.success) {
        return json({ success: false, error: 'Invalid license key.' }, 200, corsHeaders);
      }

      // Check the purchase wasn't refunded or chargedback
      const purchase = data.purchase;
      if (purchase.refunded || purchase.chargebacked) {
        return json({ success: false, error: 'This license is no longer valid.' }, 200, corsHeaders);
      }

      // All good
      return json({
        success: true,
        email: purchase.email,
        created_at: purchase.created_at,
      }, 200, corsHeaders);

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
