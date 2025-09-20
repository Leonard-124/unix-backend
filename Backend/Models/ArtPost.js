
import mongoose from 'mongoose'

const ArtPostSchema = new mongoose.Schema({
  artName: String,
  seller: String,
  imageUrl: String, // Store image URL
  price: Number,
  description: String,
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('ArtPost', ArtPostSchema)