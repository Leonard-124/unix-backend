

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true, unique: true },
  username: { type: String },
  fullname: { type: String },
  email: { type: String, required: true },
  hasPaid: {type: Boolean, default: false}
}, { timestamps: true });

export default mongoose.model("User", userSchema);