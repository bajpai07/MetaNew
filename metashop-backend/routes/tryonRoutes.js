import express from 'express';
import multer from 'multer';
import { 
  generateTryOn,
  checkJobStatus,
  getVtonStats
} from '../controllers/tryonController.js';

const router = express.Router();

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Start generation — returns jobId instantly
router.post(
  '/generate',
  upload.fields([
    { name: 'humanImage', maxCount: 1 }
  ]),
  generateTryOn
);

// Poll for job status
router.get(
  '/status/:jobId',
  checkJobStatus
);

// Get system stats
router.get(
  '/stats',
  getVtonStats
);

export default router;
