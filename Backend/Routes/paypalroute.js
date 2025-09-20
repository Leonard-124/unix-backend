
// routes/paypalRoute.js
import express from 'express';
import axios from 'axios';
import Transaction from '../Models/Transaction.js'; // adjust path if necessary

const router = express.Router();

// FORCED sandbox for now
const PAYPAL_BASE = 'https://api-m.sandbox.paypal.com';

// ------------------------------
// Simple in-memory token cache
// ------------------------------
let tokenCache = {
  token: null,
  expiresAt: 0, // ms epoch
};

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const e = new Error('Missing PayPal credentials. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env');
    e.code = 'NO_CREDS';
    throw e;
  }

  // Return cached token if still valid (with 60s buffer)
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60000) {
    return tokenCache.token;
  }

  try {
    // Use axios auth to automatically set Basic header
    const resp = await axios({
      method: 'post',
      url: `${PAYPAL_BASE}/v1/oauth2/token`,
      auth: {
        username: clientId,
        password: clientSecret,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'Accept-Language': 'en_US',
      },
      data: 'grant_type=client_credentials',
      timeout: 10000,
    });

    const { access_token, expires_in } = resp.data;
    // cache token (expires_in is seconds)
    tokenCache.token = access_token;
    tokenCache.expiresAt = Date.now() + (Number(expires_in) || 3600) * 1000;
    return access_token;
  } catch (err) {
    // Build helpful error for debugging
    const details = err.response?.data || err.message || err;
    const msg = `Failed to obtain PayPal access token: ${JSON.stringify(details)}`;
    const e = new Error(msg);
    e.original = err;
    throw e;
  }
}

// ------------------------------
// Helpers
// ------------------------------
function formatAmount(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return null;
  // PayPal requires string with two decimals
  return n.toFixed(2);
}

async function savePendingTransaction(payment) {
  try {
    await Transaction.findOneAndUpdate(
      { paymentId: payment.id },
      {
        provider: 'paypal',
        paymentId: payment.id,
        amount: payment.transactions?.[0]?.amount?.total ?? null,
        currency: payment.transactions?.[0]?.amount?.currency ?? 'USD',
        status: 'pending',
        raw: payment
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.warn('Warning: unable to persist pending PayPal transaction:', err.message);
  }
}

// ------------------------------
// Debug endpoint: confirm token works
// GET /api/payments/paypal/debug/token
// ------------------------------
router.get('/debug/token', async (req, res) => {
  try {
    const token = await getAccessToken();
    return res.json({
      ok: true,
      token_mask: token ? `${token.slice(0, 6)}...${token.slice(-6)}` : null,
      expiresAt: tokenCache.expiresAt,
    });
  } catch (err) {
    const details = err.message || err;
    return res.status(400).json({ ok: false, error: 'token_error', details });
  }
});

// ------------------------------
// Create Payment (GET/POST)
// Accepts: ?amount=10  or { amount: 10 } body
// If query param redirect=1 or redirect=true, server redirects to PayPal approval URL.
// Otherwise returns { approval_url, payment } JSON
// ------------------------------
async function createHandler(req, res) {
  const rawAmount = (req.method === 'GET') ? req.query.amount : req.body.amount;
  const redirectToPayPal = ((req.query && (req.query.redirect === '1' || req.query.redirect === 'true')) ||
                            (req.body && (req.body.redirect === true || req.body.redirect === '1')));

  if (!rawAmount) return res.status(400).json({ error: 'amount is required (query param or JSON body)' });

  const amount = formatAmount(rawAmount);
  if (!amount) return res.status(400).json({ error: 'invalid amount (must be numeric)' });

  try {
    const token = await getAccessToken();

    const body = {
      intent: 'sale',
      payer: { payment_method: 'paypal' },
      redirect_urls: {
        // PayPal will redirect browser to these after approval/cancel
        return_url: `${process.env.BASE_URL}/api/payments/paypal/success`,
        cancel_url: `${process.env.BASE_URL}/api/payments/paypal/cancel`
      },
      transactions: [{
        amount: { total: amount, currency: 'USD' },
        description: `Payment of $${amount}`
      }]
    };

    const createRes = await axios({
      method: 'post',
      url: `${PAYPAL_BASE}/v1/payments/payment`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      data: body,
      timeout: 12000,
    });

    const payment = createRes.data;
    const approval = payment.links && payment.links.find(l => l.rel === 'approval_url');

    if (!approval) {
      console.error('PayPal create: no approval_url', payment);
      return res.status(500).json({ error: 'No approval_url returned by PayPal', raw: payment });
    }

    // save pending transaction (non-blocking)
    savePendingTransaction(payment).catch(e => console.warn('pending save failed', e.message));

    if (redirectToPayPal) return res.redirect(approval.href);
    return res.json({ approval_url: approval.href, payment });
  } catch (err) {
    // Surface PayPal response details for debugging
    const status = err.response?.status || 400;
    const details = err.response?.data || err.message || err;
    console.error('PayPal create error:', status, details);
    // If auth issue
    if (status === 401) {
      // clear cached token in case it was bad
      tokenCache.token = null;
      tokenCache.expiresAt = 0;
      return res.status(401).json({ error: 'PayPal authentication failed (401)', details });
    }
    return res.status(status).json({ error: 'PayPal create failed', details });
  }
}
router.get('/create', createHandler);
router.post('/create', express.json(), createHandler);

// ------------------------------
// Success (execute payment after user approves on PayPal UI)
// PayPal redirects with ?paymentId=...&PayerID=...
// ------------------------------
router.get('/success', async (req, res) => {
  // Accept common variations
  const paymentId = req.query.paymentId || req.query.paymentID || req.query.payment_id;
  const PayerID = req.query.PayerID || req.query.PAYERID || req.query.PayerId;

  if (!paymentId || !PayerID) {
    console.warn('PayPal success missing params', req.query);
    return res.redirect(`${process.env.FRONTEND_URL}/payment-failed?reason=missing_params`);
  }

  try {
    const token = await getAccessToken();

    const execRes = await axios({
      method: 'post',
      url: `${PAYPAL_BASE}/v1/payments/payment/${encodeURIComponent(paymentId)}/execute`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      data: { payer_id: PayerID },
      timeout: 12000,
    });

    const payment = execRes.data;

    // Idempotent save / update
    try {
      const existing = await Transaction.findOne({ paymentId: payment.id });
      if (existing && existing.status === 'success') {
        console.log('PayPal payment already recorded as success:', payment.id);
      } else {
        await Transaction.findOneAndUpdate(
          { paymentId: payment.id },
          {
            provider: 'paypal',
            paymentId: payment.id,
            payerId: PayerID,
            amount: payment.transactions?.[0]?.amount?.total ?? null,
            currency: payment.transactions?.[0]?.amount?.currency ?? null,
            status: payment.state ?? 'completed',
            email: payment.payer?.payer_info?.email ?? null,
            raw: payment,
            paidAt: new Date()
          },
          { upsert: true, new: true }
        );
        console.log('Saved PayPal transaction:', payment.id);
      }
    } catch (dbErr) {
      console.error('DB save error (execute):', dbErr.message);
      // still continue
    }

    // Redirect user to frontend success
    return res.redirect(`${process.env.FRONTEND_URL}/success?paymentId=${paymentId}`);
  } catch (err) {
    const status = err.response?.status || 400;
    const details = err.response?.data || err.message || err;
    console.error('PayPal execute error:', status, details);
    if (status === 401) {
      tokenCache.token = null; tokenCache.expiresAt = 0;
    }
    return res.redirect(`${process.env.FRONTEND_URL}/payment-failed?error=execute_failed`);
  }
});

// ------------------------------
// Cancel
// ------------------------------
router.get('/cancel', (req, res) => {
  return res.redirect(`${process.env.FRONTEND_URL}/checkout?status=cancelled`);
});

// ------------------------------
// Webhook (signature verification + idempotent processing)
// Use express.raw to get the raw body required for signature verification
// ------------------------------
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // ACK quickly
  res.sendStatus(200);

  try {
    const rawBody = req.body; // Buffer
    const webhookEvent = JSON.parse(rawBody.toString('utf8'));

    const transmissionId = req.header('paypal-transmission-id') || req.header('PAYPAL-TRANSMISSION-ID');
    const transmissionTime = req.header('paypal-transmission-time') || req.header('PAYPAL-TRANSMISSION-TIME');
    const certUrl = req.header('paypal-cert-url') || req.header('PAYPAL-CERT-URL');
    const authAlgo = req.header('paypal-auth-algo') || req.header('PAYPAL-AUTH-ALGO');
    const transmissionSig = req.header('paypal-transmission-sig') || req.header('PAYPAL-TRANSMISSION-SIG');
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    if (!webhookEvent) {
      console.warn('Empty webhook body received');
      return;
    }

    if (!webhookId) {
      console.warn('PAYPAL_WEBHOOK_ID not set — webhook signature verification skipped (not recommended)');
    } else {
      // verify signature with PayPal
      try {
        const token = await getAccessToken();
        const verifyBody = {
          auth_algo: authAlgo,
          cert_url: certUrl,
          transmission_id: transmissionId,
          transmission_sig: transmissionSig,
          transmission_time: transmissionTime,
          webhook_id: webhookId,
          webhook_event: webhookEvent
        };

        const verifyResp = await axios({
          method: 'post',
          url: `${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          data: verifyBody,
          timeout: 10000,
        });

        if (verifyResp.data.verification_status !== 'SUCCESS') {
          console.warn('PayPal webhook verification failed:', verifyResp.data);
          return; // do not process if invalid
        }
      } catch (vErr) {
        console.error('Webhook signature verification error:', vErr.response?.data || vErr.message);
        return;
      }
    }

    // process event(s)
    const eventType = webhookEvent.event_type;
    console.log('PayPal webhook event:', eventType);

    if (eventType === 'PAYMENT.SALE.COMPLETED' || eventType === 'PAYMENT.SALE.PENDING') {
      const sale = webhookEvent.resource;
      const paymentId = sale.parent_payment;
      const saleId = sale.id;

      try {
        const existing = await Transaction.findOne({ paymentId, 'raw.id': saleId });
        if (existing) {
          console.log('Webhook: transaction already recorded for sale id', saleId);
        } else {
          const t = await Transaction.create({
            provider: 'paypal',
            paymentId,
            payerId: saleId,
            amount: sale.amount?.total,
            currency: sale.amount?.currency,
            status: sale.state,
            email: sale?.payer?.payer_info?.email ?? null,
            raw: sale,
            paidAt: new Date()
          });
          console.log('Webhook: saved transaction', t.paymentId, t.payerId);
        }
      } catch (dbErr) {
        console.error('Webhook DB save error:', dbErr.message);
      }
    } else {
      console.log('Unhandled PayPal webhook event type:', eventType);
    }
  } catch (err) {
    console.error('Error processing PayPal webhook:', err.message || err);
  }
});

export default router;
