import express from 'express'
const app = express()
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import {connectDB} from './Database/db.js'
import signUp from './Database/signUp.js'
import routes from './Routes/routes.js'
import multer from 'multer'
import cors from 'cors'
import artpostsRoute from './Routes/artpost.js'
import productsRoute from './Routes/products.js'
import paymentsRoute from './Routes/payments.js';
import paystackRouter from './Routes/paystackroute2.js'
import paypalRouter from './Routes/paypalroute2.js'
import morgan from 'morgan'

/////////////////////////////////
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
/////////////////////////////////

dotenv.config()
app.use(express.json())

app.use('/', routes)
app.use('/signup', routes)
app.use('/signin', routes)

// Allow requests from your frontend origin
app.use(cors({
  origin: 'http://localhost:5173', // or use '*' for all origins (not recommended for production)
  credentials: true
}));





console.log('PAYPAL_MODE=', process.env.PAYPAL_MODE);
console.log('PAYPAL_CLIENT_ID present=', !!process.env.PAYPAL_CLIENT_ID);
console.log('PAYPAL_CLIENT_SECRET present=', !!process.env.PAYPAL_CLIENT_SECRET);



app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/api/artposts', artpostsRoute)
app.use('/api/products', productsRoute)
app.use('/api/payments', paymentsRoute);
app.use('/api/payments/paystack', paystackRouter);
app.use('/api/payments/paypal', paypalRouter);
app.use(morgan('dev')); // Log requests to console

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    connectDB()
    console.log(`Server is running on http://localhost:${PORT}`)
})