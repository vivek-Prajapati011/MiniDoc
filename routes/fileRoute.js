import express from "express";
import { createWriteStream, statSync } from "fs";
import { rename, rm, mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { getSafePath } from "../utils/pathUtils.js";
import crypto from "crypto";  // ✅ use built-in

const router = express.Router();

const DB_PATH = path.join(process.cwd(), "filedb", "files.json");

// helper: read DB
async function readDB() {
  try {
    const data = await readFile(DB_PATH, "utf-8");
    return JSON.parse(data || "[]");
  } catch {
    return [];
  }
}

// helper: write DB
async function writeDB(data) {
  await writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// Upload file
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
          name: path.basename(fullPath), // original filename
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

export default router;
