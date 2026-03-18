import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const fixIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      dbName: 'metashop'
    });
    console.log('✅ Connected to MongoDB Atlas');

    const db = mongoose.connection.db;
    const collections = await db.collections();
    
    // Check if carts collection exists and drop it to clear old schema indexes
    const cartCollection = collections.find(c => c.collectionName === 'carts');
    if (cartCollection) {
        await cartCollection.drop();
        console.log('🗑️ Dropped old carts collection to clear obsolete unique indexes.');
    } else {
        console.log('Carts collection not found, skipping drop.');
    }

    console.log('--- INDEX FIX SUCCESSFUL ---');
    process.exit(0);
  } catch (err) {
    console.error(`❌ Error fixing indexes: ${err.message}`);
    process.exit(1);
  }
};

fixIndexes();
