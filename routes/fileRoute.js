// routes/fileRoute.js
import express from "express";
import { createWriteStream, statSync } from "fs";
import { rename, rm, mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getSafePath } from "../utils/pathUtils.js";
import checkAuth from "../middleware/auth.js";

const router = express.Router();
const DB_PATH = path.join(process.cwd(), "filedb", "files.json");

// Helpers
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

// ✅ All routes protected
router.use(checkAuth);

// ===== Upload file =====
router.post("/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const userDir = path.join("Storage", req.user.id); // ✅ user-specific folder
    await mkdir(userDir, { recursive: true });

    const fileId = crypto.randomUUID();
    const ext = path.extname(filename);
    const storedName = `${fileId}${ext}`;
    const storedPath = path.join(userDir, storedName);

    const writeStream = createWriteStream(storedPath);
    req.pipe(writeStream);

    req.on("end", async () => {
      const stats = statSync(storedPath);
      const fileDB = await readDB();

      fileDB.push({
        id: fileId,
        name: filename,
        storedName,
        size: stats.size,
        userId: req.user.id, // ✅ owner reference
      });

      await writeDB(fileDB);

      res.json({
        message: "File Uploaded",
        file: { id: fileId, name: filename, size: stats.size },
      });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== Download file =====
router.get("/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const fileDB = await readDB();
    const fileMeta = fileDB.find(
      (f) => f.name === filename && f.userId === req.user.id
    );
    if (!fileMeta) return res.status(404).json({ message: "File not found" });

    const storedPath = getSafePath(
      path.join("Storage", req.user.id, fileMeta.storedName)
    );

    res.sendFile(storedPath);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// ===== Rename file =====
router.patch("/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const { newName } = req.body;
    const fileDB = await readDB();
    const fileMeta = fileDB.find(
      (f) => f.name === filename && f.userId === req.user.id
    );
    if (!fileMeta) return res.status(404).json({ message: "File not found" });

    fileMeta.name = newName;
    await writeDB(fileDB);
    res.json({ message: "Renamed", newName });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== Delete file =====
router.delete("/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const fileDB = await readDB();
    const index = fileDB.findIndex(
      (f) => f.name === filename && f.userId === req.user.id
    );
    if (index === -1)
      return res.status(404).json({ message: "File not found" });

    const fileMeta = fileDB[index];
    const storedPath = getSafePath(
      path.join("Storage", req.user.id, fileMeta.storedName)
    );

    await rm(storedPath, { force: true });
    fileDB.splice(index, 1);
    await writeDB(fileDB);

    res.json({ message: "Deleted Successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
