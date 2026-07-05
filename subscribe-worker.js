/**
 * FluidScriptr Subscribe Worker
 * Deploy to Cloudflare Workers
 * Route: fluidscriptr-subscribe.kerospad.workers.dev
 *
 * Receives Gumroad sale webhooks and adds buyers to MailerLite.
 * Set MAILERLITE_API_KEY as a Worker secret (wrangler secret put MAILERLITE_API_KEY).
 *
 * Gumroad webhook setup:
 *   Product → Edit → Advanced → Webhooks → add this Worker's URL
 */

const MAILERLITE_GROUP_ID = '190921445546657778';
const MAILERLITE_API = 'https://connect.mailerlite.com/api';

export default {
  async fetch(request, env) {

    // Only accept POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Parse Gumroad's form-encoded webhook payload
    let params;
    try {
      const text = await request.text();
      params = new URLSearchParams(text);
    } catch {
      return new Response('Bad request', { status: 400 });
    }

    const email     = params.get('email');
    const firstName = params.get('full_name')?.split(' ')[0] || '';
    const lastName  = params.get('full_name')?.split(' ').slice(1).join(' ') || '';
    const product   = params.get('product_name') || 'FluidScriptr';
    const saleId    = params.get('sale_id') || '';

    if (!email) {
      return new Response('No email in payload', { status: 400 });
    }

    // Add subscriber to MailerLite group
    try {
      const mlRes = await fetch(`${MAILERLITE_API}/subscribers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.MAILERLITE_API_KEY}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email,
          fields: {
            name: firstName,
            last_name: lastName,
          },
          groups: [MAILERLITE_GROUP_ID],
          status: 'active',
        }),
      });

      const mlData = await mlRes.json();

      if (!mlRes.ok) {
        console.error('MailerLite error:', JSON.stringify(mlData));
        return new Response('MailerLite error', { status: 502 });
      }

      console.log(`Subscribed ${email} (sale ${saleId}) to group ${MAILERLITE_GROUP_ID}`);
      return new Response('OK', { status: 200 });

    } catch (err) {
      console.error('Worker error:', err.message);
      return new Response('Internal error', { status: 500 });
    }
  }
};
