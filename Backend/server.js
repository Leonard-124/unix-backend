import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import morgan from 'morgan'
import mongoose from 'mongoose'
import { connectDB } from './Database/db.js';
import paystackRouter from './Routes/paystackroute2.js';
//import uploadRoute from './Routes/uploads.js'
import artRoutes from "./Routes/artRoutes.js";
import artRoute2 from "./Routes/artRoute2.js"
import userRoutes from "./Routes/userRoutes.js";
import paymentRoutes from "./Routes/payments.js";



dotenv.config();

const app = express()
app.use(cors());
app.use(express.json())
app.use(morgan('dev'));

app.get("/", (req, res) => {
    res.send("Hello from Backend")
})

const PORT = process.env.PORT || 3000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use("/api/art", artRoutes);
app.use("/api/art2", artRoute2)
app.use('/api/payments/paystack', paystackRouter);
app.use("/api/users", userRoutes);
app.use("/api", paymentRoutes);


async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();