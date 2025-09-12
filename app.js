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

const STORAGE_PATH = path.join(__dirname, "Storage");

// ========== 📂 Directory Routes ==========

// Root directory route
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


// Multi-level directory route using Express 5 wildcard syntax
app.get("/directory/*path", async (req, res) => {
  try {
    // req.params.path is an array of path segments
    const segs = req.params.path || [];
    const wildcardPath = Array.isArray(segs) ? segs.join("/") : segs;

    const fullDirPath = path.join(STORAGE_PATH, wildcardPath);

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

app.post("/directory/*path", async (req,res) => {
   const segs = req.params.path || [];
  try {
    const wildcardPath = Array.isArray(segs) ? segs.join("/") : segs;
    const fullDirPath = path.join(STORAGE_PATH, wildcardPath);
    await mkdir(fullDirPath);
    res.json({ message: "Directory Created" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }

})

// ========== 📄 File Routes ==========

// Upload file (supports nested paths like /files/folder/sub/file.txt)
app.post("/files/*path", (req, res) => {
  try {
    const segs = req.params.path || [];
    const relPath = Array.isArray(segs) ? segs.join("/") : segs;

    const fullPath = path.join(STORAGE_PATH, relPath);

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

// Download/Get file (multi-level support)
app.get("/files/*path", (req, res) => {
  try {
    const segs = req.params.path || [];
    const relPath = Array.isArray(segs) ? segs.join("/") : segs;

    const fullPath = path.join(STORAGE_PATH, relPath);

    if (req.query.action === "download") {
      res.set("Content-Disposition", "attachment");
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

    const oldPath = path.join(STORAGE_PATH, relPath);
    const newPath = path.join(STORAGE_PATH, req.body.newFilename);

    await rename(oldPath, newPath);
    res.json({ message: "Renamed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete file/folder (multi-level)
app.delete("/files/*path", async (req, res) => {
  try {
    const segs = req.params.path || [];
    const relPath = Array.isArray(segs) ? segs.join("/") : segs;

    const fullPath = path.join(STORAGE_PATH, relPath);

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
