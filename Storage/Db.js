import { MongoClient } from "mongodb";
const client = new MongoClient("mongodb://127.0.0.1:27017/storageApp");

 export async function connectDb() {
  await client.connect();
  const db = client.db();
  return db
}
