

import express from 'express';
import axios from 'axios';


const router = express.Router();


router.post('/initialize', async (req, res) => {
try {
const { email, amount } = req.body;
const paystackAmount = Math.round(amount * 100);


const initRes = await axios.post(
'https://api.paystack.co/transaction/initialize',
{ email, amount: paystackAmount },
{
headers: {
Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
'Content-Type': 'application/json',
},
}
);


const { authorization_url, reference } = initRes.data.data;
res.json({ authorization_url, reference });
} catch (err) {
res.status(400).json({ error: err.response?.data?.message || err.message });
}
});



// 2. Webhook (Paystack will hit this after payment)
router.post('/webhook', express.json({ type: '*/*' }), async (req, res) => {
try {
console.log('🔔 Webhook received:', req.body);


// Always respond quickly so Paystack doesn’t retry
res.sendStatus(200);


const event = req.body;


if (event.event === 'charge.success') {
const reference = event.data.reference;


const verifyRes = await axios.get(
`https://api.paystack.co/transaction/verify/${reference}`,
{
headers: {
Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
},
}
);


const paymentData = verifyRes.data.data;


if (paymentData.status === 'success') {
console.log('✅ Payment verified via webhook:', paymentData);
// TODO: Save paymentData to DB here
} else {
console.log('❌ Payment verification failed:', paymentData);
}
}
} catch (err) {
console.error('Webhook error:', err.message);
}
});



// 3. Callback (user browser redirect after payment)
router.get('/callback', async (req, res) => {
try {
const { reference } = req.query;


const verifyRes = await axios.get(
`https://api.paystack.co/transaction/verify/${reference}`,
{
headers: {
Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
},
}
);


const paymentData = verifyRes.data.data;


if (paymentData.status === 'success') {
console.log('✅ Payment verified on callback:', paymentData);
return res.redirect(`http://localhost:5173/success?reference=${reference}`);
} else {
return res.redirect(`http://localhost:5173/payment-failed?reference=${reference}`);
}
} catch (err) {
console.error('Callback error:', err.message);
return res.redirect('http://localhost:5173/payment-failed');
}
});

// 4. Paystack Verify Payment Route
router.get('/paystack/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    // Call Paystack verify endpoint
    const verifyRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (verifyRes.data.status && verifyRes.data.data.status === 'success') {
      return res.json({
        success: true,
        data: verifyRes.data.data, // transaction details
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Payment not successful',
        data: verifyRes.data.data,
      });
    }
  } catch (err) {
    console.error('Paystack Verify Error:', err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      error: err.response?.data?.message || 'Verification failed',
    });
  }
});

export default router;

////////////////////////////////////////////////////////////////////////////////


// import express from "express";
// import axios from "axios";
// import crypto from "crypto";
// import Order from "../Models/Order.js"; // <-- you'll create this model

// const router = express.Router();

// // 1. Initialize Transaction
// router.post("/initialize", async (req, res) => {
//   try {
//     const { email, amount, artId, userId } = req.body;
//     const paystackAmount = Math.round(amount * 100); // kobo

//     const initRes = await axios.post(
//       "https://api.paystack.co/transaction/initialize",
//       { email, amount: paystackAmount },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const { authorization_url, reference } = initRes.data.data;

//     // Save a pending order in DB
//     await Order.create({
//       userId,
//       artId,
//       reference,
//       amount,
//       status: "pending",
//     });

//     res.json({ authorization_url, reference });
//   } catch (err) {
//     res
//       .status(400)
//       .json({ error: err.response?.data?.message || err.message });
//   }
// });

// // 2. Webhook (Paystack → server)
// router.post("/webhook", express.json({ type: "*/*" }), async (req, res) => {
//   const secret = process.env.PAYSTACK_SECRET_KEY;
//   const hash = crypto
//     .createHmac("sha512", secret)
//     .update(JSON.stringify(req.body))
//     .digest("hex");

//   if (hash !== req.headers["x-paystack-signature"]) {
//     return res.status(401).send("Invalid signature");
//   }

//   res.sendStatus(200); // acknowledge quickly

//   const event = req.body;

//   if (event.event === "charge.success") {
//     const reference = event.data.reference;

//     try {
//       const verifyRes = await axios.get(
//         `https://api.paystack.co/transaction/verify/${reference}`,
//         {
//           headers: {
//             Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//           },
//         }
//       );

//       const paymentData = verifyRes.data.data;

//       if (paymentData.status === "success") {
//         console.log("✅ Payment verified via webhook:", paymentData);

//         // Update order in DB
//         await Order.findOneAndUpdate(
//           { reference },
//           {
//             status: "success",
//             paidAt: new Date(paymentData.transaction_date),
//             paymentData,
//           }
//         );
//       } else {
//         console.log("❌ Payment verification failed:", paymentData);
//         await Order.findOneAndUpdate({ reference }, { status: "failed" });
//       }
//     } catch (err) {
//       console.error("Webhook verify error:", err.message);
//     }
//   }
// });

// // 3. Callback (user redirect after payment)
// router.get("/callback", async (req, res) => {
//   try {
//     const { reference } = req.query;

//     const verifyRes = await axios.get(
//       `https://api.paystack.co/transaction/verify/${reference}`,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//         },
//       }
//     );

//     const paymentData = verifyRes.data.data;

//     if (paymentData.status === "success") {
//       console.log("✅ Payment verified on callback:", paymentData);
//       return res.redirect(
//         `http://localhost:5173/success?reference=${reference}`
//       );
//     } else {
//       return res.redirect(
//         `http://localhost:5173/payment-failed?reference=${reference}`
//       );
//     }
//   } catch (err) {
//     console.error("Callback error:", err.message);
//     return res.redirect("http://localhost:5173/payment-failed");
//   }
// });

// // 4. Manual Verify Endpoint
// router.get("/paystack/verify/:reference", async (req, res) => {
//   try {
//     const { reference } = req.params;

//     const verifyRes = await axios.get(
//       `https://api.paystack.co/transaction/verify/${reference}`,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//         },
//       }
//     );

//     if (verifyRes.data.status && verifyRes.data.data.status === "success") {
//       return res.json({
//         success: true,
//         data: verifyRes.data.data,
//       });
//     } else {
//       return res.status(400).json({
//         success: false,
//         error: "Payment not successful",
//         data: verifyRes.data.data,
//       });
//     }
//   } catch (err) {
//     console.error("Paystack Verify Error:", err.response?.data || err.message);
//     return res.status(500).json({
//       success: false,
//       error: err.response?.data?.message || "Verification failed",
//     });
//   }
// });

// export default router;