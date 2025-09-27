

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { connectDB } from "./Database/db.js";

import paystackRouter from "./Routes/paystackroute2.js";
import artRoutes from "./Routes/artRoutes.js";
import userRoutes from "./Routes/userRoutes.js";
import paymentRoutes from "./Routes/payments.js";
import feedbackRoute from "./Routes/feedbackroute.js"


dotenv.config();

const app = express();

// Middleware
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

// Health check / root route
app.get("/", (req, res) => {
  res.send("Welcome to Unix guys");
});

// Routes
app.use("/api/art", artRoutes);
app.use("/api/payments/paystack", paystackRouter);
app.use("/api/users", userRoutes);
app.use("/api", paymentRoutes);
app.use("/api/feedback", feedbackRoute);

// Server start
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();