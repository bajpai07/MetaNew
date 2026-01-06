import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    image: { type: String, required: true },

    // ✅ ONE PRICE FIELD FOR FRONTEND
    price: {
      type: Number,
      required: true
    },

    // Optional internal fields
    basePrice: Number,
    currentPrice: Number,

    stock: { type: Number, default: 10 },

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
