// routes/mpesa.js
import express from 'express';
import axios from 'axios';
import moment from 'moment';

const router = express.Router();

// Debug helper
function log(...args) {
  console.log('[MPESA]', ...args);
}

// Config
const MPESA_BASE = process.env.MPESA_BASE || 'https://sandbox.safaricom.co.ke';
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const SHORTCODE = process.env.MPESA_SHORTCODE;
const PASSKEY = process.env.MPESA_PASSKEY;
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || `${process.env.BASE_URL}/api/payments/mpesa/callback`;

if (!CONSUMER_KEY || !CONSUMER_SECRET || !SHORTCODE || !PASSKEY) {
  log('❌ Missing required environment variables. Please check your .env file.');
}

// Token cache
let mpesaTokenCache = { token: null, expiresAt: 0 };

async function getMpesaToken() {
  if (mpesaTokenCache.token && Date.now() < mpesaTokenCache.expiresAt - 60000) {
    return mpesaTokenCache.token;
  }
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  try {
    const resp = await axios.get(`${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    const token = resp.data.access_token;
    const expiresIn = resp.data.expires_in || 3600;
    mpesaTokenCache = { token, expiresAt: Date.now() + expiresIn * 1000 };
    log('✅ Token acquired');
    return token;
  } catch (err) {
    log('❌ Token error', err.response?.data || err.message);
    throw err;
  }
}

function normalizePhone(input) {
  if (!input) return null;
  let p = String(input).replace(/\s|-/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('0')) p = '254' + p.slice(1);
  if (p.startsWith('7') && p.length === 9) p = '254' + p;
  if (!/^2547\d{8}$/.test(p)) return null;
  return p;
}

function buildPassword(shortcode, passkey, timestamp) {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
}

// Debug test route
router.post('/debug', express.json(), (req, res) => {
  const { phone, amount } = req.body;
  res.json({
    received: req.body,
    normalizedPhone: normalizePhone(phone),
    parsedAmount: Number(amount)
  });
});

// Main STK Push
router.post('/', express.json(), async (req, res) => {
  log('Incoming body:', req.body);
  try {
    const { phone, amount } = req.body;
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'Invalid phone format. Use 2547XXXXXXXX', received: phone });
    }

    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      return res.status(400).json({ error: 'Invalid amount', received: amount });
    }

    const token = await getMpesaToken();
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = buildPassword(SHORTCODE, PASSKEY, timestamp);

    const body = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amountNum,
      PartyA: normalizedPhone,
      PartyB: SHORTCODE,
      PhoneNumber: normalizedPhone,
      CallBackURL: CALLBACK_URL,
      AccountReference: 'Order',
      TransactionDesc: 'Payment'
    };

    log('📤 Sending STK request:', body);

    const stkUrl = `${MPESA_BASE}/mpesa/stkpush/v1/processrequest`;
    const stkRes = await axios.post(stkUrl, body, {
      headers: { Authorization: `Bearer ${token}` }
    });

    log('✅ STK success:', stkRes.data);
    res.json(stkRes.data);
  } catch (err) {
    log('❌ STK error response:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: 'STK request failed',
      details: err.response?.data || err.message
    });
  }
});

// Callback route to handle Safaricom response
router.post('/callback', express.json(), (req, res) => {
  log('📥 Callback received:', JSON.stringify(req.body, null, 2));

  // Acknowledge receipt to Safaricom
  res.json({ ResultCode: 0, ResultDesc: 'Callback received successfully' });

  // TODO: Save transaction status to DB (req.body.Body.stkCallback)
});

export default router;
