import express from "express";
import { createWriteStream } from "fs";
import { rename, rm, mkdir } from "fs/promises";
import path from "path";
import { getSafePath } from "../utils/pathUtils.js";

const router = express.Router();

// Upload file
router.post("/*path", async (req, res) => {
  try {
    const segs = req.params.path || [];
    const relPath = Array.isArray(segs) ? segs.join("/") : segs;
    const fullPath = getSafePath(relPath);

    await mkdir(path.dirname(fullPath), { recursive: true });

    const writeStream = createWriteStream(fullPath);
    req.pipe(writeStream);

    req.on("end", () => {
      res.json({ message: "File Uploaded" });
    });

    req.on("error", (err) => {
      res.status(500).json({ message: err.message });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Download/Get file
router.get("/*path", (req, res) => {
  try {
    const segs = req.params.path || [];
    const relPath = Array.isArray(segs) ? segs.join("/") : segs;
    const fullPath = getSafePath(relPath);

    if (req.query.action === "download") {
      res.set("Content-Disposition", `attachment; filename="${path.basename(fullPath)}"`);
    }

    res.sendFile(fullPath);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// Rename file/folder
router.patch("/*path", async (req, res) => {
  try {
    const segs = req.params.path || [];
    const relPath = Array.isArray(segs) ? segs.join("/") : segs;

    const oldPath = getSafePath(relPath);
    const newPath = getSafePath(req.body.newFilename);

    await rename(oldPath, newPath);
    res.json({ message: "Renamed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete file/folder
router.delete("/*path", async (req, res) => {
  try {
    const segs = req.params.path || [];
    const relPath = Array.isArray(segs) ? segs.join("/") : segs;
    const fullPath = getSafePath(relPath);

    await rm(fullPath, { recursive: true, force: true });
    res.json({ message: "Deleted Successfully" });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

export default router;
