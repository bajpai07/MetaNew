import dotenv from 'dotenv';
// CRITICAL: dotenv.config() MUST be called before any other imports that might use env variables
dotenv.config();

import mongoose from 'mongoose';
import Product from './models/Product.js';

const seedCloudDB = async () => {
  try {
    // Debugging: Check if the .env is actually loading
    console.log("-----------------------------------------");
    console.log("DEBUG: Connecting to ->", process.env.MONGO_URL ? "ATLAS URL DETECTED" : "UNDEFINED (Check your .env path)");
    console.log("-----------------------------------------");

    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL is not defined in .env file");
    }

    // Explicitly target 'metashop' database
    await mongoose.connect(process.env.MONGO_URL, {
      dbName: 'metashop',
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Successfully connected to MongoDB Atlas');

    const sampleProduct = {
      name: 'Premium Red Dress',
      price: 4999,
      description: 'A stunning premium red dress perfect for evening parties.',
      category: 'top',
      image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&q=80',
      modelUrl: '/assets/models/dress.glb',
      stock: 10 // Adding a default stock since your schema might require it
    };

    // Insert the product
    const created = await Product.create(sampleProduct);
    console.log(`🚀 Inserted product: ${created.name} (ID: ${created._id})`);

    console.log('--- CLOUD UPDATE SUCCESSFUL ---');
    process.exit(0);

  } catch (err) {
    console.error(`❌ Error connecting or inserting into cloud DB: ${err.message}`);
    process.exit(1);
  }
};

seedCloudDB();