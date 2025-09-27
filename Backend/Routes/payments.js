


import express from "express";
import axios from "axios";
import crypto from "crypto";
import User from "../Models/users.js";

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
