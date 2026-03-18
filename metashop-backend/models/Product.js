import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, default: "Uncategorized", index: true },
    image: { type: String, required: true },

    // ✅ ONE PRICE FIELD FOR FRONTEND
    price: {
      type: Number,
      required: true
    },

    // 3D Model URL for Virtual Try-On
    modelUrl: { type: String, default: "" },

    // Optional internal fields
    basePrice: Number,
    currentPrice: Number,

    stock: { type: Number, default: 10 },

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
