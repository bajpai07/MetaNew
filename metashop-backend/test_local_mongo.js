import mongoose from 'mongoose';
async function listDatabases() {
    try {
        const uri = "mongodb://127.0.0.1:27017";
        const conn = await mongoose.createConnection(uri).asPromise();
        console.log("Connected to Local MongoDB");
        
        const dbRef = conn.useDb('metashop');
        const collections = await dbRef.db.listCollections().toArray();
        console.log("Collections in local metashop:", collections.map(c => c.name).join(', '));
        
        if (collections.some(c => c.name === 'users' || c.name === 'products')) {
            const users = dbRef.collection('users');
            const products = dbRef.collection('products');
            console.log(`-> Local Users count: ${await users.countDocuments()}`);
            console.log(`-> Local Products count: ${await products.countDocuments()}`);
        }
        await conn.close();
        process.exit(0);
    } catch (err) {
        console.error("Local MongoDB Error:", err.message);
        process.exit(1);
    }
}
listDatabases();
