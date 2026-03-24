import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed." });
    return;
  }

  try {
    const { email } = req.body || {};

    if (!email) {
      res.status(400).json({ message: "Missing email." });
      return;
    }

    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    const customer = customers.data?.[0];

    if (!customer) {
      res.status(404).json({ message: "Stripe customer not found." });
      return;
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 10,
    });

    const subscription =
      subscriptions.data.find((item) =>
        ["active", "trialing", "past_due", "canceled", "unpaid"].includes(
          String(item.status || "").toLowerCase()
        )
      ) || null;

    if (!subscription) {
      res.status(404).json({ message: "Subscription not found." });
      return;
    }

    const currentPeriodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
          .toISOString()
          .slice(0, 10)
      : null;

    const interval =
      subscription.items?.data?.[0]?.price?.recurring?.interval || null;

    res.status(200).json({
      subscription: {
        customerId: customer.id,
        subscriptionId: subscription.id,
        status: subscription.status,
        interval,
        currentPeriodEnd,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error?.message || "Failed to sync Stripe subscription.",
    });
  }
}