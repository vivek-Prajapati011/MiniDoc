import express from "express";
import { readdir, stat, mkdir } from "fs/promises";
import path from "path";
import { getSafePath } from "../utils/pathUtils.js";
import checkAuth from "../middleware/auth.js";

const router = express.Router();

// ✅ List root directory
router.get("/", checkAuth, async (req, res) => {
  try {
    const userRoot = req.user.rootDirId;
    const fullPath = getSafePath(userRoot);

    const filesList = await readdir(fullPath);
    const resData = [];
    for (const item of filesList) {
      const stats = await stat(path.join(fullPath, item));
      resData.push({ name: item, type: stats.isDirectory() ? "directory" : "file" });
    }

    res.json(resData);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// ✅ List nested directories
router.get("/*path", checkAuth, async (req, res) => {
  try {
    const userRoot = req.user.rootDirId;
    const relPath = req.params.path || "";
    const fullDirPath = getSafePath(path.join(userRoot, relPath));

    const filesList = await readdir(fullDirPath);
    const resData = [];
    for (const item of filesList) {
      const stats = await stat(path.join(fullDirPath, item));
      resData.push({ name: item, type: stats.isDirectory() ? "directory" : "file" });
    }

    res.json(resData);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// ✅ Create nested directory
router.post("/*path", checkAuth, async (req, res) => {
  try {
    const userRoot = req.user.rootDirId;
    const relPath = req.params.path || "";
    const fullDirPath = getSafePath(path.join(userRoot, relPath));

    await mkdir(fullDirPath, { recursive: true });
    res.json({ message: "Directory created" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
