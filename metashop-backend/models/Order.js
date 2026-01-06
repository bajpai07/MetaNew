import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
  enum: ["PLACED", "SHIPPED", "DELIVERED"],
  default: "PLACED",
},

    paymentMethod: {
      type: String,
      default: "MOCK",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
