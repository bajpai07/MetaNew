import process from 'process';
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" }
});
const User = mongoose.model("User", userSchema);

async function check() {
  await mongoose.connect(process.env.MONGO_URL);
  const users = await User.find({}, 'name email password');
  console.log("Users:", JSON.stringify(users, null, 2));
  process.exit(0);
}
check();
