import express from "express";
import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItemQty
} from "../controllers/cartController.js";

const router = express.Router();

router.get("/", getCart);
router.post("/add", addToCart);
router.patch("/update", updateCartItemQty);
router.delete("/:productId", removeFromCart);

export default router;
