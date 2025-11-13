import mongoose from "mongoose";

await mongoose.connect("mongodb://127.0.0.1:27017/storageApp");


mongoose.connection.on("connected", () => console.log("✅ MongoDB Connected"));
mongoose.connection.on("error", (err) => console.error("❌ MongoDB Error:", err));
