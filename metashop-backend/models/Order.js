import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Set to false to allow guest checkout
    },
    userId: {
      type: String, // To store guest_user_123
    },
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: String,
        image: String,
        price: Number,
        qty: Number,
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    status: {
  type: String,
  enum: ["Pending", "Processing", "Shipped", "Delivered", "PLACED", "SHIPPED"], // Kept old ones for existing DB compatibility
  default: "Pending",
},

    paymentMethod: {
      type: String,
      default: "Virtual Gateway",
    },
    transactionId: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
