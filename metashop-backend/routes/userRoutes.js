import express from "express";
import { saveMeasurements, getMeasurements } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Save measurements
router.put("/measurements", protect, saveMeasurements);

// Get measurements  
router.get("/measurements", protect, getMeasurements);

export default router;
