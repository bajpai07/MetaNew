import express from 'express';
import multer from 'multer';
import { generateTryOn } from '../controllers/vtonController.js';

const router = express.Router();
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/generate',
  upload.fields([
    { name: 'humanImage', maxCount: 1 }
  ]),
  generateTryOn
);

export default router;
