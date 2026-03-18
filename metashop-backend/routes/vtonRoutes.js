import express from "express";
import { generateVTONController, checkVTONStatus } from "../controllers/vtonController.js";

const router = express.Router();

router.post("/generate", generateVTONController);
router.get("/status/:id", checkVTONStatus);

export default router;
