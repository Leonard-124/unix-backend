

// // models/artModel.js
// import mongoose from "mongoose";

// const artSchema = new mongoose.Schema(
//   {
//     src: { type: String, required: true }, // Cloudinary URL or file path
//     name: { type: String, required: true },

//     // Either author or inventor will be filled depending on personType
//     author: { type: String },
//     inventor: { type: String },

//     size: { type: String },
//     weight: { type: String }, // only relevant for inventor items
//     type: { type: String },
//     description: { type: String },
//     price: { type: String },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Art", artSchema);
///////////////////////////////////////////////////////////////////


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
     auth0Id: { type: String, required: true }
  },
  { timestamps: true }
);

// // Virtual to map _id → id
// artSchema.virtual("id").get(function () {
//   return this._id.toHexString();
// });

// // Ensure virtuals are included when converting to JSON
// artSchema.set("toJSON", {
//   virtuals: true,
// });


export default mongoose.model("Art", artSchema);