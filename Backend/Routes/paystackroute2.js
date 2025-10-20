

// import express from 'express';
// import axios from 'axios';


// const router = express.Router();


// router.post('/initialize', async (req, res) => {
// try {
// const { email, amount } = req.body;
// const paystackAmount = Math.round(amount * 100);


// const initRes = await axios.post(
// 'https://api.paystack.co/transaction/initialize',
// { email, amount: paystackAmount },
// {
// headers: {
// Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
// 'Content-Type': 'application/json',
// },
// }
// );


// const { authorization_url, reference } = initRes.data.data;
// res.json({ authorization_url, reference });
// } catch (err) {
// res.status(400).json({ error: err.response?.data?.message || err.message });
// }
// });



// // 2. Webhook (Paystack will hit this after payment)
// router.post('/webhook', express.json({ type: '*/*' }), async (req, res) => {
// try {
// console.log('🔔 Webhook received:', req.body);


// // Always respond quickly so Paystack doesn’t retry
// res.sendStatus(200);


// const event = req.body;


// if (event.event === 'charge.success') {
// const reference = event.data.reference;


// const verifyRes = await axios.get(
// `https://api.paystack.co/transaction/verify/${reference}`,
// {
// headers: {
// Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
// },
// }
// );


// const paymentData = verifyRes.data.data;


// if (paymentData.status === 'success') {
// console.log('✅ Payment verified via webhook:', paymentData);
// // TODO: Save paymentData to DB here
// } else {
// console.log('❌ Payment verification failed:', paymentData);
// }
// }
// } catch (err) {
// console.error('Webhook error:', err.message);
// }
// });



// // 3. Callback (user browser redirect after payment)
// router.get('/callback', async (req, res) => {
// try {
// const { reference } = req.query;


// const verifyRes = await axios.get(
// `https://api.paystack.co/transaction/verify/${reference}`,
// {
// headers: {
// Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
// },
// }
// );


// const paymentData = verifyRes.data.data;


// if (paymentData.status === 'success') {
// console.log('✅ Payment verified on callback:', paymentData);
// return res.redirect(`https://unix-delta.vercel.app/success?reference=${reference}`);
// } else {
// return res.redirect(`https://unix-delta.vercel.app/payment-failed?reference=${reference}`);
// }
// } catch (err) {
// console.error('Callback error:', err.message);
// return res.redirect('https://unix-delta.vercel.app/payment-failed');
// }
// });

// // 4. Paystack Verify Payment Route
// router.get('/paystack/verify/:reference', async (req, res) => {
//   try {
//     const { reference } = req.params;

//     // Call Paystack verify endpoint
//     const verifyRes = await axios.get(
//       `https://api.paystack.co/transaction/verify/${reference}`,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//         },
//       }
//     );

//     if (verifyRes.data.status && verifyRes.data.data.status === 'success') {
//       return res.json({
//         success: true,
//         data: verifyRes.data.data, // transaction details
//       });
//     } else {
//       return res.status(400).json({
//         success: false,
//         error: 'Payment not successful',
//         data: verifyRes.data.data,
//       });
//     }
//   } catch (err) {
//     console.error('Paystack Verify Error:', err.response?.data || err.message);
//     return res.status(500).json({
//       success: false,
//       error: err.response?.data?.message || 'Verification failed',
//     });
//   }
// });

// export default router;
//////////////////////////////////////////////////////////////

import express from 'express';
import axios from 'axios';
import checkJwt from '../Middlewares/checkJwt.js';
import Order from '../Models/Order.js';
import Art from '../Models/artModel.js';

const router = express.Router();

// 1. Initialize payment
router.post('/initialize', checkJwt, async (req, res) => {
  try {
    const { email, amount, artId, quantity } = req.body;
    const auth0Id = req.auth?.payload?.sub || req.user?.sub;

    if (!auth0Id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!artId) {
      return res.status(400).json({ error: "artId is required" });
    }

    const paystackAmount = Math.round(amount * 100); // Convert to kobo

    const initRes = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      { 
        email, 
        amount: paystackAmount,
        metadata: {
          auth0Id,
          artId,
          quantity: quantity || 1,
        }
      },
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
    console.error("Paystack initialize error:", err.response?.data || err.message);
    res.status(400).json({ error: err.response?.data?.message || err.message });
  }
});

// 2. Webhook (Paystack will hit this after payment)
router.post('/webhook', express.json({ type: '*/*' }), async (req, res) => {
  try {
    console.log('🔔 Webhook received:', req.body);

    // Always respond quickly so Paystack doesn't retry
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

        // Create order
        const { auth0Id, artId, quantity } = paymentData.metadata || {};

        if (auth0Id && artId) {
          try {
            // Check if order already exists
            const existingOrder = await Order.findOne({ reference });
            
            if (!existingOrder) {
              const art = await Art.findById(artId);
              
              if (art) {
                const order = await Order.create({
                  auth0Id,
                  artId,
                  artDetails: {
                    name: art.name,
                    image: art.image,
                    price: art.price,
                    author: art.author,
                    inventor: art.inventor,
                    type: art.type,
                  },
                  reference,
                  amount: paymentData.amount,
                  quantity: quantity || 1,
                  status: 'success',
                  paidAt: new Date(),
                  paymentData,
                });

                // Update art quantity
                if (art.quantity > 0) {
                  art.quantity -= quantity || 1;
                  await art.save();
                }

                console.log('✅ Order created:', order._id);
              }
            } else {
              console.log('ℹ️ Order already exists for reference:', reference);
            }
          } catch (err) {
            console.error('❌ Error creating order:', err);
          }
        }
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

    if (!reference) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/failure`);
    }

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

      // Create order if not already created by webhook
      const { auth0Id, artId, quantity } = paymentData.metadata || {};

      if (auth0Id && artId) {
        try {
          const existingOrder = await Order.findOne({ reference });
          
          if (!existingOrder) {
            const art = await Art.findById(artId);
            
            if (art) {
              await Order.create({
                auth0Id,
                artId,
                artDetails: {
                  name: art.name,
                  image: art.image,
                  price: art.price,
                  author: art.author,
                  inventor: art.inventor,
                  type: art.type,
                },
                reference,
                amount: paymentData.amount,
                quantity: quantity || 1,
                status: 'success',
                paidAt: new Date(),
                paymentData,
              });

              // Update art quantity
              if (art.quantity > 0) {
                art.quantity -= quantity || 1;
                await art.save();
              }
            }
          }
        } catch (err) {
          console.error('❌ Error creating order on callback:', err);
        }
      }

      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?reference=${reference}`);
    } else {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/failure?reference=${reference}`);
    }
  } catch (err) {
    console.error('Callback error:', err.message);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/failure`);
  }
});

// 4. Verify Payment Route
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

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
        data: verifyRes.data.data,
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


