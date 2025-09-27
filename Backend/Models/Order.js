

// import mongoose from "mongoose";

// const orderSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "users", // assumes you have a User model
//       required: true,
//     },
//     artId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Art", // links to your Art schema
//       required: true,
//     },
//     reference: {
//       type: String,
//       required: true,
//       unique: true, // Paystack reference is unique
//     },
//     amount: {
//       type: Number,
//       required: true,
//     },
//     status: {
//       type: String,
//       enum: ["pending", "success", "failed"],
//       default: "pending",
//     },
//     paidAt: {
//       type: Date,
//     },
//     paymentData: {
//       type: Object, // raw Paystack response (optional but useful for debugging)
//     },
//   },
//   { timestamps: true }
// );

// // Virtual id for frontend convenience
// orderSchema.virtual("id").get(function () {
//   return this._id.toHexString();
// });

// orderSchema.set("toJSON", {
//   virtuals: true,
// });

// export default mongoose.model("Order", orderSchema);