import mongoose from 'mongoose';
import TryOnHistory from '../models/TryOnHistory.js';

// GET history with pagination
export const getHistory = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }

    const page = Number(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const history = await TryOnHistory
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      history,
      page,
      hasMore: history.length === limit
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Could not fetch history"
    });
  }
};

// DELETE single item
export const deleteHistoryItem = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid ID"
      });
    }

    const item = await TryOnHistory.findOne({
      _id: id,
      userId
    });

    if (!item) {
      return res.status(404).json({
        error: "Item not found"
      });
    }

    await TryOnHistory.deleteOne({ _id: id });

    return res.json({
      success: true
    });

  } catch (err) {
    return res.status(500).json({
      error: "Delete failed"
    });
  }
};

// CLEAR ALL
export const clearHistory = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;

    await TryOnHistory.deleteMany({ userId });

    return res.json({
      success: true
    });

  } catch (err) {
    return res.status(500).json({
      error: "Clear failed"
    });
  }
};
