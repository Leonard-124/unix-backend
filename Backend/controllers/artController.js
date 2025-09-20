

import Art from "../Models/Art.js";
import cloudinary from "../config/cloudinary.js";

// POST: Upload image to Cloudinary + save metadata to MongoDB
export const createArt = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Image file is required" });

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "artworks",
    });

    // Save to MongoDB
    const newArt = new Art({
      src: uploadResult.secure_url,
      name: req.body.name,
      author: req.body.author,
      size: req.body.size,
      description: req.body.description,
      price: req.body.price,
    });

    const savedArt = await newArt.save();
    res.status(201).json(savedArt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET: Fetch all artworks
export const getAllArt = async (req, res) => {
  try {
    const artworks = await Art.find().sort({ createdAt: -1 });
    res.json(artworks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};