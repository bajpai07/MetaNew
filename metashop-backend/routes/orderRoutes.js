import express from "express";
import {
  createOrder,
  getMyOrders,
  getSellerOrders,
  updateOrderStatus,
  getOrderById,
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/my", protect, getMyOrders);
router.get("/seller", protect, getSellerOrders);
router.get("/:id", protect, getOrderById); // ✅ ADD THIS
router.put("/:id", protect, updateOrderStatus);

export default router;
