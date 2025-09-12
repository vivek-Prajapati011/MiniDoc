import express from "express";
import { readdir, stat, mkdir } from "fs/promises";
import path from "path";
import { getSafePath, STORAGE_PATH } from "../utils/pathUtils.js";

const router = express.Router();

// List root directory
router.get("/", async (req, res) => {
  try {
    const filesList = await readdir(STORAGE_PATH);
    const resData = [];

    for (const item of filesList) {
      const stats = await stat(path.join(STORAGE_PATH, item));
      resData.push({ name: item, isDirectory: stats.isDirectory() });
    }

    res.json(resData);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// List multi-level directory
router.get("/*path", async (req, res) => {
  try {
    const segs = req.params.path || [];
    const relPath = Array.isArray(segs) ? segs.join("/") : segs;
    const fullDirPath = getSafePath(relPath);

    const filesList = await readdir(fullDirPath);
    const resData = [];

    for (const item of filesList) {
      const stats = await stat(path.join(fullDirPath, item));
      resData.push({ name: item, isDirectory: stats.isDirectory() });
    }

    res.json(resData);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// Create directory (supports nested)
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

export default router;
