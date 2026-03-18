import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URL; // Using current MONGO_URL
console.log("URI:", uri);

async function listDatabases() {
    try {
        const conn = await mongoose.createConnection(uri).asPromise();
        console.log("Connected.");
        const admin = conn.db.admin();
        const info = await admin.listDatabases();
        
        console.log("--- DATABASES ---");
        for (const db of info.databases) {
            console.log(`\n📄 Database: ${db.name} (Size: ${db.sizeOnDisk} bytes)`);
            
            // List collections in this db
            const dbRef = conn.useDb(db.name);
            const collections = await dbRef.db.listCollections().toArray();
            console.log("  Collections:", collections.map(c => c.name).join(', '));
            
            // For Users or Products, let's print counts if they exist
            if (collections.some(c => c.name === 'users' || c.name === 'products')) {
                const users = dbRef.collection('users');
                const products = dbRef.collection('products');
                const userCount = await users.countDocuments();
                const productCount = await products.countDocuments();
                console.log(`  -> Users count: ${userCount}`);
                console.log(`  -> Products count: ${productCount}`);
                
                if (userCount > 0) {
                    const sampleUser = await users.findOne();
                    if (sampleUser) console.log("     Sample User Email:", sampleUser.email);
                }
            }
        }
        await conn.close();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
listDatabases();
