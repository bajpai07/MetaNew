import mongoose from 'mongoose';

const tryOnHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null
    },
    productName: String,
    productImage: String,
    productPrice: Number,

    resultUrl: {
      type: String,
      required: true
    },

    fitScore: Number,
    generationTime: Number,

    status: {
      type: String,
      enum: ['completed', 'failed'],
      default: 'completed'
    }
  },
  { timestamps: true }
);

// TTL index (auto delete after 30 days)
tryOnHistorySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

// CRITICAL: compound index for fast queries
tryOnHistorySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model(
  'TryOnHistory',
  tryOnHistorySchema
);
