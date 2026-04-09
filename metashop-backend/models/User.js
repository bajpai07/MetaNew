import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "customer", "seller", "admin"], default: "user" },
    measurements: {
      height: {
        type: Number,
        min: 100,
        max: 250,
        default: null
      },
      weight: {
        type: Number, 
        min: 30,
        max: 250,
        default: null
      },
      savedAt: {
        type: Date,
        default: null
      }
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
