
import express from 'express';
import axios from 'axios';
import Payment from '../models/Payment.js';

const router = express.Router();
 
// POST /initialize
// Body: { email, amount, userId? }
router.post('/initialize', async (req, res) => {
  try {
    const { email, amount, userId } = req.body;
    if (!email || !amount) return res.status(400).json({ error: 'email and amount required' });

    // Convert to kobo/cents
    const paystackAmount = Math.round(Number(amount) * 100);

    const initRes = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: paystackAmount,
        callback_url: `${process.env.BASE_URL}/api/payments/paystack/callback`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { authorization_url, reference } = initRes.data.data;

    // Save pending payment
    try {
      await Payment.create({
        userId: userId || null,
        email,
        amount: Number(amount),
        reference,
        status: 'pending',
      });
    } catch (e) {
      // non-fatal: log and continue
      console.warn('Payment DB save warning:', e.message);
    }

    return res.json({ authorization_url, reference });
  } catch (err) {
    console.error('Initialize error:', err.response?.data || err.message);
    return res.status(400).json({ error: err.response?.data?.message || err.message });
  }
});

// POST /webhook
// Paystack server-to-server events
router.post('/webhook', express.json({ type: '*/*' }), async (req, res) => {
  // ACK immediately
  res.sendStatus(200);

  try {
    const event = req.body;
    console.log('Paystack webhook event:', event.event);

    if (event.event === 'charge.success') {
      const reference = event.data.reference;

      // verify with Paystack
      const verifyRes = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
      );

      const paymentData = verifyRes.data.data;

      if (paymentData && paymentData.status === 'success') {
        await Payment.findOneAndUpdate(
          { reference },
          { status: 'success', paidAt: new Date(), rawData: paymentData },
          { upsert: false }
        );
        console.log('Payment marked success (webhook):', reference);
      } else {
        await Payment.findOneAndUpdate(
          { reference },
          { status: 'failed', rawData: paymentData },
          { upsert: false }
        );
        console.log('Payment marked failed (webhook):', reference);
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err.response?.data || err.message);
  }
});

// GET /callback
// Browser redirect after checkout -> verify and redirect to frontend
router.get('/callback', async (req, res) => {
  try {
    const { reference } = req.query;
    if (!reference) return res.status(400).send('missing reference');

    const verifyRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    const paymentData = verifyRes.data.data;

    if (paymentData && paymentData.status === 'success') {
      await Payment.findOneAndUpdate(
        { reference },
        { status: 'success', paidAt: new Date(), rawData: paymentData },
        { upsert: false }
      );
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?reference=${reference}`);
    }

    await Payment.findOneAndUpdate(
      { reference },
      { status: 'failed', rawData: paymentData },
      { upsert: false }
    );
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failed?reference=${reference}`);
  } catch (err) {
    console.error('Callback error:', err.response?.data || err.message);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failed?error=server`);
  }
});

// GET /verify/:reference
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const verifyRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    const paymentData = verifyRes.data.data;

    if (paymentData && paymentData.status === 'success') {
      await Payment.findOneAndUpdate(
        { reference },
        { status: 'success', paidAt: new Date(), rawData: paymentData },
        { upsert: false }
      );
      return res.json({ success: true, data: paymentData });
    }

    await Payment.findOneAndUpdate(
      { reference },
      { status: 'failed', rawData: paymentData },
      { upsert: false }
    );
    return res.status(400).json({ success: false, data: paymentData });
  } catch (err) {
    console.error('Verify error:', err.response?.data || err.message);
    return res.status(500).json({ success: false, error: err.response?.data?.message || 'Verification failed' });
  }
});

export default router;
