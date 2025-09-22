import express from "express";
import { readdir, stat, mkdir, rename, rm } from "fs/promises";
import path from "path";
import { getSafePath, STORAGE_PATH } from "../utils/pathUtils.js";

const router = express.Router();

// ✅ List root directory
router.get("/", async (req, res) => {
  try {
    const filesList = await readdir(STORAGE_PATH);
    const resData = [];

    for (const item of filesList) {
      const stats = await stat(path.join(STORAGE_PATH, item));
      resData.push({
        name: item,
        type: stats.isDirectory() ? "directory" : "file",
      });
    }

    res.json(resData);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// ✅ List multi-level directory
router.get("/*path", async (req, res) => {
  try {
    const segs = req.params.path || [];
    const relPath = Array.isArray(segs) ? segs.join("/") : segs;
    const fullDirPath = getSafePath(relPath);

    const filesList = await readdir(fullDirPath);
    const resData = [];

    for (const item of filesList) {
      const stats = await stat(path.join(fullDirPath, item));
      resData.push({
        name: item,
        type: stats.isDirectory() ? "directory" : "file",
      });
    }

    res.json(resData);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// ✅ Create directory (supports nested)
router.post("/*path", async (req, res) => {
  try {
    const segs = req.params.path || [];
    const relPath = Array.isArray(segs) ? segs.join("/") : segs;
    const fullDirPath = getSafePath(relPath);

    await mkdir(fullDirPath, { recursive: true });
    res.json({ message: "Directory Created" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Rename directory
router.put("/*path", async (req, res) => {
  try {
    const segs = req.params.path || [];
    const relPath = Array.isArray(segs) ? segs.join("/") : segs;
    const fullPath = getSafePath(relPath);

    const newName = req.body.newName;
    if (!newName) {
      return res.status(400).json({ message: "newName is required" });
    }

    const newPath = path.join(path.dirname(fullPath), newName);
    await rename(fullPath, newPath);

    res.json({ message: "Renamed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete directory (recursive)
router.delete("/*path", async (req, res) => {
  try {
    const segs = req.params.path || [];
    const relPath = Array.isArray(segs) ? segs.join("/") : segs;
    const fullPath = getSafePath(relPath);

    await rm(fullPath, { recursive: true, force: true });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
