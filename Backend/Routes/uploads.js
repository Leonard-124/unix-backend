import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import mongoose from 'mongoose';

// Cloudinary config (replace with your credentials)
cloudinary.config({
  cloud_name: 'YOUR_CLOUD_NAME',
  api_key: 'YOUR_API_KEY',
  api_secret: 'YOUR_API_SECRET',
});

// Mongoose model
const imageSchema = new mongoose.Schema({
  url: String,
  public_id: String,
  author: String,
  price: String,
  description: String,
});
const Image = mongoose.model('Image', imageSchema);

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'uploads',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

const router = express.Router();

// POST: Upload image and data
router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image is required and must be <2MB' });
  const { author, price, description } = req.body;
  const newImg = new Image({
    url: req.file.path,
    public_id: req.file.filename,
    author,
    price,
    description,
  });
  await newImg.save();
  res.json(newImg);
});

// GET: All images
router.get('/', async (req, res) => {
  const images = await Image.find();
  res.json(images);
});

// DELETE: Remove image by id
router.delete('/:id', async (req, res) => {
  const img = await Image.findById(req.params.id);
  if (!img) return res.status(404).json({ error: 'Not found' });
  await cloudinary.uploader.destroy(img.public_id);
  await img.deleteOne();
  res.json({ success: true });
});

// PUT: Update image data (and optionally image)
router.put('/:id', upload.single('image'), async (req, res) => {
  const img = await Image.findById(req.params.id);
  if (!img) return res.status(404).json({ error: 'Not found' });
  const { author, price, description } = req.body;
  if (req.file) {
    await cloudinary.uploader.destroy(img.public_id);
    img.url = req.file.path;
    img.public_id = req.file.filename;
  }
  if (author) img.author = author;
  if (price) img.price = price;
  if (description) img.description = description;
  await img.save();
  res.json(img);
});

export default router;