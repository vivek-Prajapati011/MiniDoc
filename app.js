import express from "express";
import { createWriteStream } from "fs";
import { readdir, rename, rm, stat } from "fs/promises";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

// Read directory contents - handle both root and subdirectories
app.get("/directory", async (req, res) => {
  try {
    const fullDirPath = `./Storage/`;
    const filesList = await readdir(fullDirPath);
    const resData = [];
    for (const item of filesList) {
      const stats = await stat(`${fullDirPath}/${item}`);
      resData.push({ name: item, isDirectory: stats.isDirectory() });
    }
    res.json(resData);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

app.get("/directory/:dirname", async (req, res) => {
  try {
    const { dirname } = req.params;
    const fullDirPath = `./Storage/${dirname}`;
    const filesList = await readdir(fullDirPath);
    const resData = [];
    for (const item of filesList) {
      const stats = await stat(`${fullDirPath}/${item}`);
      resData.push({ name: item, isDirectory: stats.isDirectory() });
    }
    res.json(resData);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// Upload file
app.post("/files/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    const writeStream = createWriteStream(`./Storage/${filename}`);
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

// Get/Download file
app.get("/files/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    if (req.query.action === "download") {
      res.set("Content-Disposition", "attachment");
    }
    res.sendFile(`${import.meta.dirname}/Storage/${filename}`);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// Rename file
app.patch("/files/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    await rename(`./Storage/${filename}`, `./Storage/${req.body.newFilename}`);
    res.json({ message: "Renamed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete file
app.delete("/files/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    await rm(`./Storage/${filename}`, { recursive: true });
    res.json({ message: "File Deleted Successfully" });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

app.listen(3000, () => {
  console.log(`Server Started on port 3000`);
});