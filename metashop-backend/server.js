import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ES Module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
console.log('--- PATH CHECK: Current Dir is', __dirname);

import { connectDB } from "./config/db.js";

// routes
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import tryonRoutes from "./routes/tryonRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";
import { getMetrics } from "./controllers/tryonController.js";

const app = express();

/* ✅ BULLETPROOF CORS — MUST BE AT TOP */
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

/* middlewares */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

/* routes */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/tryon", tryonRoutes);
app.use("/api/vton", tryonRoutes);
app.use("/api/history", historyRoutes);
app.get("/api/metrics", getMetrics);

/* root */
app.get("/", (req, res) => {
  res.send("MetaShop API Running...");
});

/* DB */
connectDB(process.env.MONGO_URI);

/* server */
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
