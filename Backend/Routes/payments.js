
// import { Router } from 'express';
// import paypal from 'paypal-rest-sdk';
// import axios from 'axios';
// import moment from 'moment';

// const router = Router();

// // Paystack (Visa/Mastercard)
// router.post('/paystack', async (req, res) => {
//   try {
//     const { email, card, amount } = req.body; // card: {number, cvv, expiry_month, expiry_year}
//     const paystackAmount = Math.round(amount * 100);

//     // Initialize transaction
//     const initRes = await axios.post(
//       'https://api.paystack.co/transaction/initialize',
//       {
//         email,
//         amount: paystackAmount,
//         channels: ['card'],
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     const { reference, access_code } = initRes.data.data;

//     // Charge card
//     const chargeRes = await axios.post(
//       'https://api.paystack.co/charge',
//       {
//         email,
//         amount: paystackAmount,
//         card,
//         reference,
//         access_code,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     if (chargeRes.data.status === 'success' || chargeRes.data.data.status === 'success') {
//       res.json({ success: true, reference });
//     } else {
//       res.status(400).json({ error: chargeRes.data.message || 'Paystack payment failed.' });
//     }
//   } catch (err) {
//     res.status(400).json({ error: err.response?.data?.message || err.message });
//   }
// });

// // PayPal
// paypal.configure({
//   mode: 'sandbox', // or 'live'
//   client_id: process.env.PAYPAL_CLIENT_ID,
//   client_secret: process.env.PAYPAL_CLIENT_SECRET
// });

// router.get('/paypal', (req, res) => {
//   const { amount } = req.query;
//   const create_payment_json = {
//     intent: "sale",
//     payer: { payment_method: "paypal" },
//     redirect_urls: {
//       return_url: "http://localhost:3000/success",
//       cancel_url: "http://localhost:3000/checkout"
//     },
//     transactions: [{
//       amount: { currency: "USD", total: amount },
//       description: "Payment"
//     }]
//   };
//   paypal.payment.create(create_payment_json, function (error, payment) {
//     if (error) {
//       res.status(400).json({ error: error.message });
//     } else {
//       for (let link of payment.links) {
//         if (link.rel === 'approval_url') {
//           return res.redirect(link.href);
//         }
//       }
//       res.status(400).json({ error: 'No approval url found.' });
//     }
//   });
// });

// // Mpesa Daraja STK Push
// router.post('/mpesa', async (req, res) => {
//   try {
//     const { phone, amount } = req.body;
//     const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
//     const tokenRes = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
//       headers: { Authorization: `Basic ${auth}` }
//     });
//     const access_token = tokenRes.data.access_token;

//     const timestamp = moment().format('YYYYMMDDHHmmss');
//     const password = Buffer.from(
//       process.env.MPESA_SHORTCODE + process.env.MPESA_PASSKEY + timestamp
//     ).toString('base64');

//     const stkRes = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
//       BusinessShortCode: process.env.MPESA_SHORTCODE,
//       Password: password,
//       Timestamp: timestamp,
//       TransactionType: 'CustomerPayBillOnline',
//       Amount: amount,
//       PartyA: phone,
//       PartyB: process.env.MPESA_SHORTCODE,
//       PhoneNumber: phone,
//       CallBackURL: 'https://Leonard4.netlify.app',
//       AccountReference: 'Order',
//       TransactionDesc: 'Payment'
//     }, {
//       headers: { Authorization: `Bearer ${access_token}` }
//     });

//     if (stkRes.data.ResponseCode === '0') {
//       res.json({ success: true });
//     } else {
//       res.status(400).json({ error: 'Mpesa payment failed.' });
//     }
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// export default router;


import express from "express";
import axios from "axios";
import crypto from "crypto";
import User from "../Models/User.js";

const router = express.Router();


router.post("/payments/paystack/verify", async (req, res) => {
  const { reference } = req.body;

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      }
    );

    const { status, customer } = response.data.data;

    if (status === "success") {
      await User.findOneAndUpdate(
        { email: customer.email },
        { hasPaid: true },
        { new: true }
      );
      return res.json({ success: true, message: "Payment verified" });
    } else {
      return res.status(400).json({ success: false, message: "Payment failed" });
    }
  } catch (error) {
    console.error("Paystack verification error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * 2. Webhook (most reliable)
 */
router.post("/payments/paystack/webhook", express.json({ type: "*/*" }), async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  // Validate Paystack signature
  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;

  try {
    if (event.event === "charge.success") {
      const customerEmail = event.data.customer.email;

      await User.findOneAndUpdate(
        { email: customerEmail },
        { hasPaid: true },
        { upsert: true, new: true }
      );

      console.log(`✅ User ${customerEmail} marked as paid.`);
    }
    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook handling error:", error.message);
    res.sendStatus(500);
  }
});

/**
 * 3. Protected premium service
 */
router.get("/premium-service", async (req, res) => {
  const user = await User.findOne({ auth0Id: req.user.sub });

  if (!user || !user.hasPaid) {
    return res.status(403).json({ message: "Access denied. Complete payment." });
  }

  res.json({ message: "🎉 Welcome to Premium Service!" });
});

export default router;
