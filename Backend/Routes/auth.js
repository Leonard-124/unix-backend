

// import { Router } from 'express';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import nodemailer from 'nodemailer';
// import rateLimit from 'express-rate-limit';
// import User from '../Models/User.js';
// import { requireAuth } from '../middleware/auth.js';


// const router = Router();

// // Rate limiter: max 5 requests per 10 minutes per IP
// const limiter = rateLimit({
//   windowMs: 10 * 60 * 1000,
//   max: 5,
//   message: 'Too many signup attempts, please try again later.'
// });
// router.post('/signup', limiter, async (req, res) => {
//   const { name, email, phone, password, confirmPassword } = req.body;
//   if (!name || !email || !phone || !password || !confirmPassword)
//     return res.status(400).json({ error: 'All fields are required.' });
//   if (password !== confirmPassword)
//     return res.status(400).json({ error: 'Passwords do not match.' });
//   if (!/^\S+@\S+\.\S+$/.test(email))
//     return res.status(400).json({ error: 'Invalid email.' });
//   if (!/^254\d{9}$/.test(phone))
//     return res.status(400).json({ error: 'Phone must be in format 254XXXXXXXXX.' });

//   try {
//     const existing = await User.findOne({ email });
//     if (existing) return res.status(400).json({ error: 'Email already registered.' });

//     const hash = await bcrypt.hash(password, 12);
//     const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });

//     const user = new User({
//       name,
//       email,
//       phone,
//       password: hash,
//       verificationToken
//     });
//     await user.save();

//     // Send verification email
//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//       }
//     });
//     const verifyUrl = `${process.env.BASE_URL}/api/auth/verify?token=${verificationToken}`;
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: 'Verify your account',
//       html: `<p>Hello ${name},<br>Please verify your account by clicking <a href="${verifyUrl}">here</a>.</p>`
//     });

//     res.json({ message: 'Signup successful! Please check your email to verify your account.' });
//   } catch (err) {
//     res.status(500).json({ error: 'Signup failed.' });
//   }
// });

// // Email verification route
// router.get('/verify', async (req, res) => {
//   const { token } = req.query;
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findOne({ email: decoded.email, verificationToken: token });
//     if (!user) return res.status(400).json({ error: 'Invalid or expired token.' });
//     user.isVerified = true;
//     user.verificationToken = undefined;
//     await user.save();
//     res.json({ message: 'Account verified! You can now log in.' });
//   } catch (err) {
//     res.status(400).json({ error: 'Verification failed.' });
//   }
// });

// // Login route
// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password)
//     return res.status(400).json({ error: 'Email and password are required.' });

//   try {
//     const user = await User.findOne({ email });
//     if (!user)
//       return res.status(400).json({ error: 'Invalid email or password.' });

//     if (!user.isVerified)
//       return res.status(403).json({ error: 'Account not verified. Check your email.' });

//     const valid = await bcrypt.compare(password, user.password);
//     if (!valid)
//       return res.status(400).json({ error: 'Invalid email or password.' });

//     // Create JWT token
//     const token = jwt.sign(
//       { userId: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     res.json({ message: 'Login successful!', token });
//   } catch (err) {
//     res.status(500).json({ error: 'Login failed.' });
//   }
// });

// //Backend code for  protected route
// router.get('/protected', requireAuth, (req, res) => {
//   res.json({ message: 'This is a protected route.', user: req.user });
// });

// export default router;
///////////////////////////////////////////////////////////////////////

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import User from '../Models/User.js';
import { requireAuth } from '../Middlewares/auth.js'
import dotenv from 'dotenv';
dotenv.config();


const router = Router();

// Rate limiters
const signupLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: { error: 'Too many signup attempts, please try again later.' }
});

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: { error: 'Too many login attempts, please try again later.' }
});

// Helpers
const generateToken = (size = 32) => crypto.randomBytes(size).toString('hex');
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Reuse one transporter (avoid creating one per request)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationEmail = async (to, name, userId, rawToken) => {
  const base = process.env.BASE_URL?.replace(/\/+$/, '') || '';
  const verifyUrl = `${base}/api/auth/verify?userId=${userId}&token=${rawToken}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Verify your account',
    html: `<p>Hello ${name},<br>Please verify your account by clicking <a href="${verifyUrl}">here</a> (valid for 24 hours).</p>`
  });
};

// Signup
router.post('/signup', signupLimiter, async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    // Basic validation
    if (!name || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email.' });
    }
    if (!/^254\d{9}$/.test(phone)) {
      return res.status(400).json({ error: 'Phone must be in format 254XXXXXXXXX.' });
    }

    // Normalize email early (schema also lowercases on save)
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email exists
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // Generate verification token
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);

    // Create user with plain password — pre-save hook hashes it
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone,
      password, // pre-save hook will hash
      verificationTokenHash: tokenHash,
      verificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    // Send verification email
    await sendVerificationEmail(user.email, user.name, user._id, rawToken);

    return res.json({ message: 'Signup successful! Please check your email to verify your account.' });
  } catch (err) {
    console.error(err);
    if (err?.code === 11000 && err?.keyPattern?.email) {
      return res.status(400).json({ error: 'Email already registered.' });
    }
    return res.status(500).json({ error: 'Signup failed.' });
  }
});

// Email verification
router.get('/verify', async (req, res) => {
  try {
    const { userId, token } = req.query;
    if (!userId || !token) {
      return res.status(400).json({ error: 'Invalid verification link.' });
    }

    const tokenHash = hashToken(token);

    const user = await User.findOne({
      _id: userId,
      verificationTokenHash: tokenHash,
      verificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token.' });
    }

    user.isVerified = true;
    user.verificationTokenHash = undefined;
    user.verificationExpires = undefined;
    await user.save();

    return res.json({ message: 'Account verified! You can now log in.' });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Verification failed.' });
  }
});

// Login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Account not verified. Check your email.' });
    }

    // Use the schema method (bcrypt compare inside)
    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ message: 'Login successful!', token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Login failed.' });
  }
});

// Protected route
router.get('/protected', requireAuth, (req, res) => {
  return res.json({ message: 'This is a protected route.', user: req.user });
});

export default router;
