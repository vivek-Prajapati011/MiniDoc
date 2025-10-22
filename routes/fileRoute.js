// routes/fileRoute.js
import express from "express";
import { createWriteStream, statSync } from "fs";
import { rename, rm, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getSafePath } from "../utils/pathUtils.js";
import checkAuth from "../middleware/auth.js";
import { connectDb } from "../Storage/Db.js";

const router = express.Router();

// ✅ Protect all routes
router.use(checkAuth);

// ✅ Upload File → POST /files/{filename}
router.post("/{filename}", async (req, res) => {
  try {
    const db = await connectDb();
    const filesCol = db.collection("files");

    const { filename } = req.params;
    const userDir = path.join("Storage", req.user.id);
    await mkdir(userDir, { recursive: true });

    const fileId = crypto.randomUUID();
    const ext = path.extname(filename);
    const storedName = `${fileId}${ext}`;
    const storedPath = path.join(userDir, storedName);

    const writeStream = createWriteStream(storedPath);
    req.pipe(writeStream);

    req.on("end", async () => {
      const stats = statSync(storedPath);

      const fileDoc = {
        id: fileId,
        name: filename,
        storedName,
        size: stats.size,
        userId: req.user.id,
        dirId: req.body.dirId || "root", // optional parent directory reference
        createdAt: new Date(),
      };

      await filesCol.insertOne(fileDoc);

      res.json({
        message: "File uploaded successfully",
        file: { id: fileId, name: filename, size: stats.size },
      });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Download File → GET /files/{filename}
router.get("/{filename}", async (req, res) => {
  try {
    const db = await connectDb();
    const filesCol = db.collection("files");

    const { filename } = req.params;
    const fileMeta = await filesCol.findOne({
      name: filename,
      userId: req.user.id,
    });

    if (!fileMeta) return res.status(404).json({ message: "File not found" });

    const storedPath = getSafePath(
      path.join("Storage", req.user.id, fileMeta.storedName)
    );

    res.sendFile(storedPath);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// ✅ Rename File → PATCH /files/{filename}
router.patch("/{filename}", async (req, res) => {
  try {
    const db = await connectDb();
    const filesCol = db.collection("files");

    const { filename } = req.params;
    const { newName } = req.body;
    if (!newName)
      return res.status(400).json({ message: "New name is required" });

    const result = await filesCol.updateOne(
      { name: filename, userId: req.user.id },
      { $set: { name: newName, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ message: "File not found" });

    res.json({ message: "Renamed successfully", newName });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete File → DELETE /files/{filename}
router.delete("/{filename}", async (req, res) => {
  try {
    const db = await connectDb();
    const filesCol = db.collection("files");

    const { filename } = req.params;
    const fileMeta = await filesCol.findOne({
      name: filename,
      userId: req.user.id,
    });
    if (!fileMeta)
      return res.status(404).json({ message: "File not found" });

    const storedPath = getSafePath(
      path.join("Storage", req.user.id, fileMeta.storedName)
    );

    await rm(storedPath, { force: true });
    await filesCol.deleteOne({ id: fileMeta.id });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ List Files in a Directory → GET /files?dirId={dirId}
router.get("/", async (req, res) => {
  try {
    const db = await connectDb();
    const filesCol = db.collection("files");

    const dirId = req.query.dirId || "root";

    const files = await filesCol
      .find({ userId: req.user.id, dirId })
      .project({ _id: 0 })
      .toArray();

    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
