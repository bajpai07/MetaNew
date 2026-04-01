import express from 'express';
import multer from 'multer';
import { generateTryOn } from '../controllers/tryonController.js';

const router = express.Router();
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * POST /api/tryon
 * Generates AI Try-On using abstract aiService. Fallback protected.
 */
router.post('/', upload.fields([{ name: 'humanImage', maxCount: 1 }]), generateTryOn);

export default router;
