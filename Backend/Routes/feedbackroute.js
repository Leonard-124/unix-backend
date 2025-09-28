
import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

router.post("/", async (req, res) => {
  const { message, email } = req.body;

  try {
    // ✅ Use Gmail SMTP with STARTTLS on port 587
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // STARTTLS
      requireTLS: true
      auth: {
        user: process.env.EMAIL_USER, // your Gmail address
        pass: process.env.EMAIL_PASS, // your Gmail App Password
      },
    });

    await transporter.sendMail({
      from: email || process.env.EMAIL_USER, // show sender if provided
      to: "loluoch710@gmail.com", // your receiving Gmail
      subject: "📩 New Feedback from Unix App",
      text: `From: ${email || "Anonymous"}\n\n${message}`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Email send error:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to send email" });
  }
});

export default router;