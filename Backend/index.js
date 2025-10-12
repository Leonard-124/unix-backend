

// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import morgan from "morgan";
// import { connectDB } from "./Database/db.js";

// import paystackRouter from "./Routes/paystackroute2.js";
// import artRoutes from "./Routes/artRoutes.js";
// import userRoutes from "./Routes/userRoutes.js";
// import paymentRoutes from "./Routes/payments.js";
// import feedbackRoute from "./Routes/feedbackroute.js"


// dotenv.config();

// const app = express();

// // Middleware
// const FRONTEND_URL = process.env.FRONTEND_URL || "https://unix-delta.vercel.app";
// //const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5174";
// const LOCAL_URL = process.env.LOCAL_URL || "http://localhost:5174"
// app.use(
//   cors({
//     origin:[
//       FRONTEND_URL,
//       LOCAL_URL
//     ],
//     credentials: true,
//   })
// );
// app.use(express.json());
// app.use(morgan("dev"));

// // Health check / root route
// app.get("/", (req, res) => {
//   res.send("Welcome to Unix guys");
// });

// // Routes
// app.use("/api/art", artRoutes);
// app.use("/api/payments/paystack", paystackRouter);
// app.use("/api/users", userRoutes);
// app.use("/api", paymentRoutes);
// app.use("/api/feedback", feedbackRoute);

// // Server start
// const PORT = process.env.PORT || 3000;

// async function start() {
//   try {
//     await connectDB();
//     app.listen(PORT, () => {
//       console.log(`✅ Server is running on http://localhost:${PORT}`);
//     });
//   } catch (err) {
//     console.error("❌ Failed to start server:", err);
//     process.exit(1);
//   }
// }

// start();


import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { connectDB } from "./Database/db.js";

import paystackRouter from "./Routes/paystackroute2.js";
import artRoutes from "./Routes/artRoutes.js";
import userRoutes from "./Routes/userRoutes.js";
import paymentRoutes from "./Routes/payments.js";
import feedbackRoute from "./Routes/feedbackroute.js";

dotenv.config();

const app = express();

// Collect allowed origins from env
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.LOCAL_URL,
  process.env.ALT_LOCAL_URL,
].filter(Boolean); // removes undefined

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like curl, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));

// Health check
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
      console.log("Allowed origins:", allowedOrigins);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();