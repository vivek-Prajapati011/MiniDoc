import express from "express";
import cors from "cors";
import { createWriteStream } from "fs";
import { readdir, rename, rm, stat, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// Root storage directory
const STORAGE_PATH = path.resolve(path.join(__dirname, "Storage"));

// ✅ Utility: Securely resolve and validate path
function getSafePath(relPath = "") {
  const fullPath = path.resolve(path.join(STORAGE_PATH, relPath));
  if (!fullPath.startsWith(STORAGE_PATH)) {
    throw new Error("Invalid path (path traversal attempt detected)");
  }
  return fullPath;
}

// ========== 📂 Directory Routes ==========

// List root directory
app.get("/directory", async (req, res) => {
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
app.get("/directory/*path", async (req, res) => {
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
app.post("/directory/*path", async (req, res) => {
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

// ========== 📄 File Routes ==========

// Upload file
app.post("/files/*path", async (req, res) => {
  try {
    const segs = req.params.path || [];
    const relPath = Array.isArray(segs) ? segs.join("/") : segs;
    const fullPath = getSafePath(relPath);

    // Ensure parent directory exists
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
app.get("/files/*path", (req, res) => {
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
app.patch("/files/*path", async (req, res) => {
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
app.delete("/files/*path", async (req, res) => {
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

// ========== 🚀 Start Server ==========
app.listen(PORT, () => {
  console.log(`✅ Server started on http://localhost:${PORT}`);
});
