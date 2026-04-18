const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { scores, email } = req.body;
    if (!scores) return res.status(400).json({ error: 'Missing scores' });

    // Encode scores as a compact string to pass through Stripe metadata
    // scores = { confScore, socScore, quadrant, subscaleScores }
    const scoresEncoded = Buffer.from(JSON.stringify(scores)).toString('base64');

    const origin = req.headers.origin || 'https://opensourcecharisma.com';
    const successUrl = `${origin}/assessment.html?report=success&session_id={CHECKOUT_SESSION_ID}&s=${encodeURIComponent(scoresEncoded)}`;
    const cancelUrl  = `${origin}/assessment.html?report=cancelled`;

    const sessionParams = {
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { scores: scoresEncoded },
    };

    if (email) sessionParams.customer_email = email;

    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
