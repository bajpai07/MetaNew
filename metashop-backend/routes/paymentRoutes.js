import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { mockPayOrder } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/mock", protect, mockPayOrder);

export default router;
