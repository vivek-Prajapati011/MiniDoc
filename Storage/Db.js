import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://127.0.0.1:27017/storageApp");
let db;

export async function connectDb() {
  if (!db) {
    await client.connect();
    db = client.db("storageApp");

    console.log("✅ Connected to MongoDB");

    // === Apply Schema Validation on Collections ===
    await ensureCollectionsWithValidation(db);
  }
  return db;
}

async function ensureCollectionsWithValidation(db) {
  const collections = await db.listCollections().toArray();
  const names = collections.map(c => c.name);

  // ✅ USERS
  if (!names.includes("users")) {
    await db.createCollection("users", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["id", "name", "email", "password", "rootDirId"],
          properties: {
            id: { bsonType: "string" },
            name: { bsonType: "string" },
            email: { bsonType: "string", pattern: "^.+@.+\\..+$" },
            password: { bsonType: "string" },
            rootDirId: { bsonType: "string" },
            createdAt: { bsonType: "date" },
          },
        },
      },
    });
    console.log("✅ Created collection: users");
  }

  // ✅ DIRECTORIES
  if (!names.includes("directories")) {
    await db.createCollection("directories", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["name", "userId", "parentId"],
          properties: {
            name: { bsonType: "string" },
            userId: { bsonType: "string" },
            parentId: { bsonType: "string" },
            createdAt: { bsonType: "date" },
          },
        },
      },
    });
    console.log("✅ Created collection: directories");
  }

  // ✅ FILES
  if (!names.includes("files")) {
    await db.createCollection("files", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["id", "name", "storedName", "size", "userId"],
          properties: {
            id: { bsonType: "string" },
            name: { bsonType: "string" },
            storedName: { bsonType: "string" },
            size: { bsonType: "int" },
            userId: { bsonType: "string" },
            dirId: { bsonType: "string" },
            createdAt: { bsonType: "date" },
          },
        },
      },
    });
    console.log("✅ Created collection: files");
  }
}

process.on("SIGINT", async () => {
  await client.close();
  console.log("🛑 MongoDB connection closed");
  process.exit(0);
});
