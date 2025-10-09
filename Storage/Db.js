// Storage/Db.js
import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://127.0.0.1:27017/storageApp");
let db;

export async function connectDb() {
  if (!db) {
    await client.connect();
    db = client.db("storageApp");
    console.log("✅ Connected to MongoDB");
  }
  return db;
}

process.on("SIGINT", async () => {
  await client.close();
  console.log("🛑 MongoDB connection closed");
  process.exit(0);
});
