
import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import Product from '../Models/Product.js'

const router = Router()

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
})
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false)
    }
    cb(null, true)
  }
})

// POST /api/products - Add product
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, oldPrice, newPrice, category, description } = req.body
    const imageUrl = req.file ? `http://localhost:3000/uploads/${req.file.filename}` : ''
    const product = new Product({
      name,
      oldPrice,
      newPrice,
      category,
      imageUrl,
      description
    })
    await product.save()
    res.status(201).json(product)
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Image file too large. Max size is 2MB.' })
    }
    res.status(500).json({ error: err.message || 'Failed to add product.' })
  }
})

// GET /api/products - List products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 })
    res.json(products)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products.' })
  }
})

// DELETE /api/products/:id - Remove product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ error: 'Product not found.' })
    res.json({ message: 'Product removed.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove product.' })
  }
})

// GET /api/products/:id - Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' })
    }
    res.json(product)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product.' })
  }
})

// GET /api/products?category=...&search=...
// router.get('/', async (req, res) => {
//   try {
//     const { category, search } = req.query;
//     const query = {};
//     if (category) query.category = category;
//     if (search) query.name = { $regex: search, $options: 'i' };
//     const products = await Product.find(query).sort({ createdAt: -1 });
//     res.json(products);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch products.' });
//   }
// });
/////////////////////////////////////////
// router.get('/', async (req, res) => {
//   try {
//     const { category, search } = req.query;
//     const query = {};
//     if (category) {
//       // Case-insensitive category match
//       query.category = { $regex: `^${category}$`, $options: 'i' };
//     }
//     if (search) {
//       query.name = { $regex: search, $options: 'i' };
//     }
//     const products = await Product.find(query).sort({ createdAt: -1 });
//     res.json(products);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch products.' });
//   }
// });
/////////////////////////////////////////

// Escape regex special characters
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (category) {
      query.category = { $regex: escapeRegex(category), $options: 'i' };
    }
    if (search) {
      query.name = { $regex: escapeRegex(search), $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(query)
    ]);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: products
    });

  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products.'
    });
  }
});

export default router