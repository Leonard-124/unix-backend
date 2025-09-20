
import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema({
    name: String,
    oldPrice: Number,
    newPrice: Number,
    category: String,
    imageUrl: String,
    description: String,
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Product', ProductSchema)