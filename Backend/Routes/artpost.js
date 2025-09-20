
import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import ArtPost from '../Models/ArtPost.js'

const router = Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})
const upload = multer({ storage })

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { artName, seller, price, description } = req.body
    // Construct image URL (assuming server runs on localhost:3000)
    const imageUrl = req.file ? `http://localhost:3000/uploads/${req.file.filename}` : ''
    const artPost = new ArtPost({
      artName,
      seller,
      imageUrl,
      price,
      description
    })
    await artPost.save()
    console.log(artPost)//
    res.status(201).json({ message: 'Art posted successfully!', artPost })
  } catch (err) {
    res.status(500).json({ error: 'Failed to save art post.' })
  }
})

router.get('/', async (req, res) => {
  try {
    const artPosts = await ArtPost.find().sort({ createdAt: -1 })
    res.json(artPosts)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch art posts.' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const artPost = await ArtPost.findById(req.params.id)
    if (!artPost) {
      return res.status(404).json({ error: 'Art post not found.' })
    }
    res.json(artPost)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch art post.' })
  }
})


export default router