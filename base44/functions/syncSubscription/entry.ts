import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return Response.json({ subscription: null });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customer = customers.data[0];

    if (!customer) {
      return Response.json({ subscription: null });
    }

    // Get latest subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 1,
      expand: ['data.items.data.price'],
    });

    const sub = subscriptions.data[0];

    if (!sub) {
      return Response.json({ subscription: null });
    }

    const interval = sub.items?.data?.[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly';
    const currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString().split('T')[0];

    const subscription = {
      status: sub.status, // active, trialing, past_due, canceled, etc.
      currentPeriodEnd,
      interval,
      customerId: customer.id,
      subscriptionId: sub.id,
    };

    // Update UserStats in the database
    const statsList = await base44.asServiceRole.entities.UserStats.filter({ created_by: user.email });
    const stats = statsList?.[0];

    const isActive = ['active', 'trialing'].includes(sub.status);

    const updatePayload = {
      is_premium: isActive,
      premium_expiry: currentPeriodEnd,
      billing_status: sub.status,
      billing_interval: interval,
    };

    if (stats?.id) {
      await base44.asServiceRole.entities.UserStats.update(stats.id, updatePayload);
    } else {
      await base44.asServiceRole.entities.UserStats.create({
        cooking_skill_level: 1,
        pantry_items: [],
        estimated_calories_avoided: 0,
        estimated_money_saved: 0,
        saved_recipes_count: 0,
        saved_restaurants_count: 0,
        ...updatePayload,
      });
    }

    return Response.json({ subscription });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});