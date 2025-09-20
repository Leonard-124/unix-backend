
import mongoose from "mongoose";

const artSchema = new mongoose.Schema({
  src: { type: String, required: true }, // Cloudinary URL
  name: { type: String, required: true },
  author: { type: String, required: true },
  size: { type: String },
  description: { type: String },
  price: { type: String },
}, { timestamps: true });

export default mongoose.model("Art", artSchema);