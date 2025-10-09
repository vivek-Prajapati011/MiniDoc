// routes/directoryRoute.js
import express from "express";
import { mkdir } from "fs/promises";
import path from "path";
import checkAuth from "../middleware/auth.js";
import { getSafePath } from "../utils/pathUtils.js";
import { connectDb } from "../Storage/Db.js";

const router = express.Router();

// ✅ List root directories
router.get("/", checkAuth, async (req, res) => {
  try {
    const db = await connectDb();
    const directories = db.collection("directories");

    // get user's root dirs
    const rootDirs = await directories
      .find({ userId: req.user.id, parentId: "root" })
      .toArray();

    res.json(rootDirs);
  } catch (err) {
    console.error("Error listing root directories:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ List nested directories
router.get("/{dirId}", checkAuth, async (req, res) => {
  try {
    const { dirId } = req.params;
    const db = await connectDb();
    const directories = db.collection("directories");

    // find subdirectories of given directory
    const subDirs = await directories
      .find({ userId: req.user.id, parentId: dirId })
      .toArray();

    res.json(subDirs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Create new directory
router.post("/", checkAuth, async (req, res) => {
  try {
    const { name, parentId = "root" } = req.body;
    if (!name) return res.status(400).json({ message: "Directory name required" });

    const db = await connectDb();
    const directories = db.collection("directories");

    const newDir = {
      name,
      parentId,
      userId: req.user.id,
      createdAt: new Date(),
    };

    const result = await directories.insertOne(newDir);

    // optional: also create actual folder in file system
    const userDirPath = getSafePath(path.join(req.user.id, name));
    await mkdir(userDirPath, { recursive: true });

    res.json({ message: "Directory created", id: result.insertedId, ...newDir });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Rename directory
router.patch("/{dirId}", checkAuth, async (req, res) => {
  try {
    const { dirId } = req.params;
    const { newName } = req.body;
    if (!newName) return res.status(400).json({ message: "New name required" });

    const db = await connectDb();
    const directories = db.collection("directories");

    const result = await directories.updateOne(
      { _id: dirId, userId: req.user.id },
      { $set: { name: newName } }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ message: "Directory not found" });

    res.json({ message: "Renamed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete directory (recursively)
router.delete("/{dirId}", checkAuth, async (req, res) => {
  try {
    const { dirId } = req.params;
    const db = await connectDb();
    const directories = db.collection("directories");

    const target = await directories.findOne({ _id: dirId, userId: req.user.id });
    if (!target) return res.status(404).json({ message: "Directory not found" });

    // remove directory and all its subdirectories
    await directories.deleteMany({ $or: [{ _id: dirId }, { parentId: dirId }] });

    res.json({ message: "Directory deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
