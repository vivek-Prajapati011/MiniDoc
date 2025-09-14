import express from "express";
import { readdir, stat, mkdir } from "fs/promises";
import path from "path";
import { getSafePath, STORAGE_PATH } from "../utils/pathUtils.js";

const router = express.Router();

/**
 * List root directory
 * GET /directory/
 */
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

/**
 * List nested directory
 * Example: GET /directory/foo/bar
 */
router.get("/*", async (req, res) => {
  try {
    const relPath = req.params[0] || ""; // wildcard capture
    const fullDirPath = getSafePath(relPath);

    const stats = await stat(fullDirPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ message: "Not a directory" });
    }

    const filesList = await readdir(fullDirPath);
    const resData = [];

    for (const item of filesList) {
      const itemStats = await stat(path.join(fullDirPath, item));
      resData.push({ name: item, isDirectory: itemStats.isDirectory() });
    }

    res.json(resData);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

/**
 * Create nested directory
 * Example: POST /directory/foo/bar
 */
router.post("/*", async (req, res) => {
  try {
    const relPath = req.params[0] || "";
    const fullDirPath = getSafePath(relPath);

    await mkdir(fullDirPath, { recursive: true });
    res.json({ message: "Directory Created", path: relPath });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
