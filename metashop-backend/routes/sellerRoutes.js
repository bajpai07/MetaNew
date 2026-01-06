import express from "express";
import { createProduct, getSellerProducts } from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/products", protect, createProduct);
router.get("/products", protect, getSellerProducts);

export default router;
