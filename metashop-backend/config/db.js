import mongoose from "mongoose";

export const connectDB = async (mongoUrl) => {
  try {
    await mongoose.connect(mongoUrl, {
      // options can be here if needed
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};
