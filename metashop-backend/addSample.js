import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "./config/db.js";
import Product from "./models/Product.js";

const seed = async () => {
  await connectDB(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/metashop");

  const sample = [
    {
      name: "Smart Lamp",
      description: "Ambient smart lamp with WiFi",
      price: 1299,
      image: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=1200",
      model3dUrl: "",
      category: "home"
    },
    {
      name: "VR Headset",
      description: "Immersive VR headset",
      price: 4999,
      image: "https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?w=1200",
      model3dUrl: "",
      category: "electronics"
    }
  ];

  await Product.deleteMany({});
  await Product.insertMany(sample);
  console.log("Sample products inserted");
  process.exit(0);
};

seed();
