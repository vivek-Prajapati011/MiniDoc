import express from "express";
import { createWriteStream, statSync } from "fs";
import { rename, rm, mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getSafePath } from "../utils/pathUtils.js";

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
router.post("/*path", async (req, res) => {
  try {
    const segs = req.params.path || [];
    const relPath = Array.isArray(segs) ? segs.join("/") : segs;
    const fullPath = getSafePath(relPath);

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
          storedName
        });
        await writeDB(fileDB);

        res.json({
          message: "File Uploaded",
          file: {
            id: fileId,
            originalName: path.basename(fullPath),
            storedName,
            size: stats.size,
            dirId: path.dirname(relPath) || "root"
          }
        });
      } catch (e) {
        res.status(500).json({ message: e.message });
      }
    });

    req.on("error", (err) => {
      res.status(500).json({ message: err.message });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== Get / Download file =====
router.get("/*path", async (req, res) => {
  try {
    const segs = req.params.path || [];
    const relPath = Array.isArray(segs) ? segs.join("/") : segs;
    const fullPath = getSafePath(relPath);

    if (req.query.action === "download") {
      res.set(
        "Content-Disposition",
        `attachment; filename="${path.basename(fullPath)}"`
      );
    }

    res.sendFile(fullPath);
  } catch (err) {
    res.status(404).json({ message: "File not found" });
  }
});

// ===== Rename file =====
router.patch("/*path", async (req, res) => {
  try {
    const segs = req.params.path || [];
    const relPath = Array.isArray(segs) ? segs.join("/") : segs;
    const fullPath = getSafePath(relPath);

    const { newName } = req.body;
    if (!newName) return res.status(400).json({ message: "New name required" });

    const newPath = path.join(path.dirname(fullPath), newName);

    await rename(fullPath, newPath);

    // Update DB
    const fileDB = await readDB();
    const fileIndex = fileDB.findIndex(f => f.storedName === path.basename(fullPath));
    if (fileIndex !== -1) {
      fileDB[fileIndex].name = newName;
      fileDB[fileIndex].storedName = newName; // Keep consistent if you want
      await writeDB(fileDB);
    }

    res.json({ message: "File renamed", newPath });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== Delete file =====
router.delete("/*path", async (req, res) => {
  try {
    const segs = req.params.path || [];
    const relPath = Array.isArray(segs) ? segs.join("/") : segs;
    const fullPath = getSafePath(relPath);

    await rm(fullPath, { force: true, recursive: true });

    // Update DB
    const fileDB = await readDB();
    const updatedDB = fileDB.filter(f => f.storedName !== path.basename(fullPath));
    await writeDB(updatedDB);

    res.json({ message: "File deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
