
// Quick test script to check if your CONSUMER_KEY and CONSUMER_SECRET are valid
import axios from 'axios';

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const MPESA_BASE = process.env.MPESA_BASE || 'https://sandbox.safaricom.co.ke';

(async () => {
  try {
    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      console.error('❌ Missing CONSUMER_KEY or CONSUMER_SECRET in .env');
      return;
    }

    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    const url = `${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`;

    console.log('🔑 Testing token request at:', url);

    const res = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json'
      }
    });

    console.log('✅ Token response:', res.data);
  } catch (err) {
    console.error('❌ Token request failed');
    console.error('Status:', err.response?.status);
    console.error('Data:', err.response?.data);
  }
})();
