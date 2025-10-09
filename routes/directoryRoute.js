import express from "express";
import { readdir, stat, mkdir } from "fs/promises";
import path from "path";
import { getSafePath } from "../utils/pathUtils.js";
import checkAuth from "../middleware/auth.js";

const router = express.Router();

/**
 * ✅ List root directory (user-specific)
 * GET /directory/
 */
router.get("/", checkAuth, async (req, res) => {
  try {
    const userRoot = req.user.rootDirId;
    const fullPath = getSafePath(userRoot);

    const filesList = await readdir(fullPath);
    const result = [];

    for (const item of filesList) {
      const stats = await stat(path.join(fullPath, item));
      result.push({
        name: item,
        type: stats.isDirectory() ? "directory" : "file",
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * ✅ List nested directories
 * Express 5 uses `{*path}` instead of `/*path`
 * Example: /directory/folderA/folderB
 */
router.get("/{*path}", checkAuth, async (req, res) => {
  try {
    const userRoot = req.user.rootDirId;
    const relPath = req.params.path || "";
    const fullDirPath = getSafePath(path.join(userRoot, relPath));

    const filesList = await readdir(fullDirPath);
    const result = [];

    for (const item of filesList) {
      const stats = await stat(path.join(fullDirPath, item));
      result.push({
        name: item,
        type: stats.isDirectory() ? "directory" : "file",
      });
    }

    res.json(result);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

/**
 * ✅ Create nested directory
 * Express 5: use `{*path}` not `/*path`
 */
router.post("/{*path}", checkAuth, async (req, res) => {
  try {
    const userRoot = req.user.rootDirId;
    const relPath = req.params.path || "";
    const fullDirPath = getSafePath(path.join(userRoot, relPath));

    await mkdir(fullDirPath, { recursive: true });
    res.json({ message: "Directory created successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
