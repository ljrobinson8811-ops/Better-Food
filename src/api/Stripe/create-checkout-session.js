import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed." });
    return;
  }

  try {
    const { email, priceId, successUrl, cancelUrl } = req.body || {};

    if (!email || !priceId || !successUrl || !cancelUrl) {
      res.status(400).json({ message: "Missing required fields." });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });

    res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    res.status(500).json({
      message: error?.message || "Stripe checkout session creation failed.",
    });
  }
}