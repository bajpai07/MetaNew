import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

const fixProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to MongoDB for patching.");

        const products = await Product.find({});
        for (let p of products) {
            let updated = false;

            if (!p.category || p.category === 'Uncategorized') {
                if (p.name.toLowerCase().includes('dress')) p.category = "Women";
                else if (p.name.toLowerCase().includes('shirt') || p.name.toLowerCase().includes('hoodie')) p.category = "Men";
                else if (p.name.toLowerCase().includes('lamp') || p.name.toLowerCase().includes('headset')) p.category = "Accessories";
                else p.category = "Accessories";
                updated = true;
            }

            if (!p.price) {
                p.price = p.currentPrice || p.basePrice || Math.floor(Math.random() * 2000) + 500;
                updated = true;
            }

            if (updated) {
                await p.save();
                console.log(`Patched Product: ${p.name} - ${p.category} - ₹${p.price}`);
            }
        }

        console.log("Database Patch Complete.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixProducts();
