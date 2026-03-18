import express from "express";
import {
  createOrder,
  getMyOrders,
  getSellerOrders,
  updateOrderStatus,
  getOrderById,
  getAllOrders,
  updateOrderStatusAdmin
} from "../controllers/orderController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", createOrder);
router.get("/my", protect, getMyOrders);
router.get("/user", protect, getMyOrders); // Alias as per requirements
router.get("/seller", protect, getSellerOrders);
router.get("/:id", getOrderById); // ✅ ADD THIS
router.put("/:id", protect, updateOrderStatus);

// Admin Routes
router.get("/admin/all", protect, isAdmin, getAllOrders);
router.put("/admin/:id/status", protect, isAdmin, updateOrderStatusAdmin);

export default router;
