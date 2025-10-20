
// import mongoose from "mongoose";

// const artSchema = new mongoose.Schema(
//   {
//     image: { type: String, required: true }, // Cloudinary URL
//     publicId: { type: String, required: true }, // Cloudinary public_id for deletion
//     name: { type: String, required: true },
//     author: { type: String },
//     inventor: { type: String },
//     size: { type: String },
//     weight: { type: String },
//     type: { type: String },
//     description: { type: String },
//     price: { type: String },
//      auth0Id: { type: String, required: true }
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Art", artSchema);
///////////////////////////////////////////////////////////

import mongoose from "mongoose";

const artSchema = new mongoose.Schema(
  {
    image: { type: String, required: true }, // Cloudinary URL
    publicId: { type: String, required: true }, // Cloudinary public_id for deletion
    name: { type: String, required: true },
    author: { type: String },
    inventor: { type: String },
    size: { type: String },
    weight: { type: String },
    type: { type: String },
    description: { type: String },
    price: { type: String },
    quantity: { type: Number, default: 1 }, // Quantity available
    auth0Id: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Art", artSchema);

