import express from "express";
import { createWriteStream, statSync } from "fs";
import { rename, rm, mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import checkAuth from "../middleware/auth.js";
import { getSafePath, STORAGE_PATH } from "../utils/pathUtils.js";

const router = express.Router();
const DB_PATH = path.join(process.cwd(), "filedb", "files.json");

// ===== Helpers =====
async function readDB() {
  try {
    const data = await readFile(DB_PATH, "utf-8");
    return JSON.parse(data || "[]");
  } catch {
    return [];
  }
}
async function writeDB(data) {
  await writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// ===== Upload file =====
router.post("/*path", checkAuth, async (req, res) => {
  try {
    const userRoot = req.user.rootDirId;
    const segs = req.params.path || [];
    const relPath = Array.isArray(segs) ? segs.join("/") : segs;

    const fullPath = getSafePath(path.join(userRoot, relPath));
    await mkdir(path.dirname(fullPath), { recursive: true });

    const fileId = crypto.randomUUID();
    const ext = path.extname(fullPath);
    const storedName = `${fileId}${ext}`;
    const storedPath = path.join(path.dirname(fullPath), storedName);

    const writeStream = createWriteStream(storedPath);
    req.pipe(writeStream);

    req.on("end", async () => {
      try {
        const stats = statSync(storedPath);

        const fileDB = await readDB();
        fileDB.push({
          id: fileId,
          name: path.basename(fullPath),
          size: stats.size,
          dirId: path.dirname(relPath) || "root",
          storedName,
          owner: req.user.id, // ✅ track user
        });
        await writeDB(fileDB);

        res.json({ message: "File Uploaded" });
      } catch (e) {
        res.status(500).json({ message: e.message });
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== Get / Download file =====
router.get("/*path", checkAuth, async (req, res) => {
  try {
    const userRoot = req.user.rootDirId;
    const segs = req.params.path || [];
    const relPath = Array.isArray(segs) ? segs.join("/") : segs;
    const fullPath = getSafePath(path.join(userRoot, relPath));

    if (req.query.action === "download") {
      res.set("Content-Disposition", `attachment; filename="${path.basename(fullPath)}"`);
    }

    res.sendFile(fullPath);
  } catch {
    res.status(404).json({ message: "File not found" });
  }
});

// ===== Rename =====
router.patch("/*path", checkAuth, async (req, res) => {
  try {
    const userRoot = req.user.rootDirId;
    const segs = req.params.path || [];
    const relPath = Array.isArray(segs) ? segs.join("/") : segs;

    const fullPath = getSafePath(path.join(userRoot, relPath));
    const { newName } = req.body;
    if (!newName) return res.status(400).json({ message: "New name required" });

    const newPath = path.join(path.dirname(fullPath), newName);
    await rename(fullPath, newPath);

    res.json({ message: "File renamed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== Delete =====
router.delete("/*path", checkAuth, async (req, res) => {
  try {
    const userRoot = req.user.rootDirId;
    const segs = req.params.path || [];
    const relPath = Array.isArray(segs) ? segs.join("/") : segs;

    const fullPath = getSafePath(path.join(userRoot, relPath));
    await rm(fullPath, { force: true, recursive: true });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
