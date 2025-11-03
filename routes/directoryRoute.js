// routes/directoryRoute.js
import express from "express";
import path from "path";
import { connectDb } from "../Storage/Db.js";
import checkAuth from "../middleware/auth.js";
import { getSafePath } from "../utils/pathUtils.js";
import { mkdir, rm } from "fs/promises";

const router = express.Router();

/* 
  ✅ Get all items (files + folders) in a directory
  Express 5 syntax: /{*path} — replaces :path(*)
*/
router.get("/{*path}", checkAuth, async (req, res) => {
  try {
    // Express 5 wildcard gives array if multiple levels — normalize to string
    const dirPath = Array.isArray(req.params.path)
      ? req.params.path.join("/")
      : req.params.path || "root";

    const db = await connectDb();
    const directories = db.collection("directories");
    const files = db.collection("files");

    // ✅ Fetch folders
    const dirs = await directories
      .find({ userId: req.user.id, parentId: dirPath })
      .project({ _id: 0, name: 1 })
      .toArray();

    // ✅ Fetch files
    const fileList = await files
      .find({ userId: req.user.id, dirPath: dirPath === "root" ? "" : dirPath })
      .project({ _id: 0, name: 1 })
      .toArray();

    // ✅ Combine both
    const items = [
      ...dirs.map((d) => ({ name: d.name, isDirectory: true })),
      ...fileList.map((f) => ({ name: f.name, isDirectory: false })),
    ];

    res.json(items);
  } catch (err) {
    console.error("Error listing directory items:", err);
    res.status(500).json({ message: err.message });
  }
});

/* 
  ✅ Create new directory
  POST /directory/
*/
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

    await directories.insertOne(newDir);

    // ✅ Also create the physical folder
    const folderPath = getSafePath(path.join("Storage", req.user.id, parentId, name));
    await mkdir(folderPath, { recursive: true });

    res.json({ message: "✅ Directory created", name });
  } catch (err) {
    console.error("Create folder error:", err);
    res.status(500).json({ message: err.message });
  }
});

/* 
  ✅ Delete a directory and all its contents
  DELETE /directory/{*path}
*/
router.delete("/{*path}", checkAuth, async (req, res) => {
  try {
    const dirPath = Array.isArray(req.params.path)
      ? req.params.path.join("/")
      : req.params.path;

    if (!dirPath) return res.status(400).json({ message: "Path required" });

    const db = await connectDb();
    const directories = db.collection("directories");
    const files = db.collection("files");

    // ✅ Delete from DB
    await files.deleteMany({ userId: req.user.id, dirPath });
    await directories.deleteMany({ userId: req.user.id, parentId: dirPath });

    // ✅ Delete physical folder
    const folderPath = getSafePath(path.join("Storage", req.user.id, dirPath));
    await rm(folderPath, { recursive: true, force: true });

    res.json({ message: "✅ Folder deleted successfully" });
  } catch (err) {
    console.error("Delete folder error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
