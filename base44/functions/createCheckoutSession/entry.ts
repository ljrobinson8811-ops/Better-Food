import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interval, successUrl, cancelUrl } = await req.json();

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Price lookup based on interval — create these in your Stripe dashboard
    const PRICE_MAP = {
      monthly: Deno.env.get('STRIPE_PRICE_MONTHLY'),
      yearly: Deno.env.get('STRIPE_PRICE_YEARLY'),
    };

    const priceId = PRICE_MAP[interval];
    if (!priceId) {
      return Response.json({ error: `No Stripe price configured for interval: ${interval}` }, { status: 400 });
    }

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customer = customers.data[0];
    if (!customer) {
      customer = await stripe.customers.create({ email: user.email, name: user.full_name || undefined });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: successUrl || `${req.headers.get('origin') || ''}/Profile?checkout=success`,
      cancel_url: cancelUrl || `${req.headers.get('origin') || ''}/Profile?checkout=cancel`,
      allow_promotion_codes: true,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});