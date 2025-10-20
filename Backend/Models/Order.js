
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    auth0Id: {
      type: String,
      required: true,
      index: true, // For faster queries
    },
    artId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Art",
      required: true,
    },
    artDetails: {
      // Store snapshot of art details at time of purchase
      name: { type: String },
      image: { type: String },
      price: { type: String },
      author: { type: String },
      inventor: { type: String },
      type: { type: String },
    },
    reference: {
      type: String,
      required: true,
      unique: true, // Paystack reference is unique
    },
    amount: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    paidAt: {
      type: Date,
    },
    paymentData: {
      type: Object, // Raw Paystack response
    },
  },
  { timestamps: true }
);

// Virtual id for frontend convenience
orderSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

orderSchema.set("toJSON", {
  virtuals: true,
});

export default mongoose.model("Order", orderSchema);
