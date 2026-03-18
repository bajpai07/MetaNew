import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Product from './models/Product.js';

const removeDuplicates = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL is not defined in .env file");
    }

    await mongoose.connect(process.env.MONGO_URL, {
      dbName: 'metashop'
    });
    console.log('✅ Successfully connected to MongoDB Atlas');

    const products = await Product.find({});
    console.log(`Found ${products.length} total products in the database.`);

    const seenNames = new Set();
    const duplicatesToDelete = [];

    for (const product of products) {
      if (seenNames.has(product.name)) {
        duplicatesToDelete.push(product._id);
      } else {
        seenNames.add(product.name);
      }
    }

    if (duplicatesToDelete.length > 0) {
      const result = await Product.deleteMany({ _id: { $in: duplicatesToDelete } });
      console.log(`🗑️ Deleted ${result.deletedCount} duplicate products.`);
    } else {
      console.log('✨ No duplicates found. Database is clean.');
    }

    console.log('--- CLEANUP SUCCESSFUL ---');
    process.exit(0);
  } catch (err) {
    console.error(`❌ Error cleaning database: ${err.message}`);
    process.exit(1);
  }
};

removeDuplicates();
