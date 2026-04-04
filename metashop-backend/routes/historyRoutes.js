import express from 'express';
import {
  getHistory,
  deleteHistoryItem,
  clearHistory
} from '../controllers/historyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getHistory);
router.delete('/:id', protect, deleteHistoryItem);
router.delete('/', protect, clearHistory);

export default router;
