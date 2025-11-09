 import fs from "fs/promises";
 import path from "path";
 import crypto from "crypto";
 import { getSafePath } from "../utils/pathUtils.js";
 import { connectDb } from "../Storage/Db.js";

 export const uploadFile = async (req, res) => {
  try {
    const db = await connectDb();
    const filesCol = db.collection("files");

    // Normalize filepath
    const filepath = Array.isArray(req.params.filepath)
      ? req.params.filepath.join("/")
      : req.params.filepath;

    const filename = path.basename(filepath);
    const dirPath = path.dirname(filepath) === "." ? "" : path.dirname(filepath);

    const userDir = getSafePath(path.join("Storage", req.user.id, dirPath));
    await fs.mkdir(userDir, { recursive: true });

    const fileId = crypto.randomUUID();
    const ext = path.extname(req.file.originalname);
    const storedName = `${fileId}${ext}`;
    const storedPath = path.join(userDir, storedName);

    // Move file from tempUploads → actual location
    await fs.rename(req.file.path, storedPath);

    const fileDoc = {
      id: fileId,
      name: filename,
      storedName,
      dirPath,
      userId: req.user.id,
      size: req.file.size,
      createdAt: new Date(),
    };

    await filesCol.insertOne(fileDoc);

    res.json({
      message: "✅ File uploaded successfully",
      file: { id: fileId, name: filename, size: req.file.size },
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: err.message });
  }
}

export const handleFileDownload = async (req, res) => {
  try {
    const db = await connectDb();
    const filesCol = db.collection("files");

    const filepath = Array.isArray(req.params.filepath)
      ? req.params.filepath.join("/")
      : req.params.filepath;

    const filename = path.basename(filepath);
    const dirPath = path.dirname(filepath) === "." ? "" : path.dirname(filepath);

    const fileMeta = await filesCol.findOne({
      name: filename,
      dirPath,
      userId: req.user.id,
    });

    if (!fileMeta) return res.status(404).json({ message: "File not found" });

    const storedPath = getSafePath(
      path.join("Storage", req.user.id, dirPath, fileMeta.storedName)
    );

    const action = req.query.action || "download";
    if (action === "open") {
      res.sendFile(path.resolve(storedPath));
    } else {
      res.download(path.resolve(storedPath), filename);
    }
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const renameFile =  async (req, res) => {
  try {
    const db = await connectDb();
    const filesCol = db.collection("files");

    const filepath = Array.isArray(req.params.filepath)
      ? req.params.filepath.join("/")
      : req.params.filepath;

    const filename = path.basename(filepath);
    const dirPath = path.dirname(filepath) === "." ? "" : path.dirname(filepath);
    const { newName } = req.body;

    if (!newName) return res.status(400).json({ message: "New name required" });

    const result = await filesCol.updateOne(
      { name: filename, dirPath, userId: req.user.id },
      { $set: { name: newName, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ message: "File not found" });

    res.json({ message: "✅ Renamed successfully", newName });
  } catch (err) {
    console.error("Rename error:", err);
    res.status(500).json({ message: err.message });
  }
}

export const deleteFile = async (req, res) => {
  try {
    const db = await connectDb();
    const filesCol = db.collection("files");

    const filepath = Array.isArray(req.params.filepath)
      ? req.params.filepath.join("/")
      : req.params.filepath;

    const filename = path.basename(filepath);
    const dirPath = path.dirname(filepath) === "." ? "" : path.dirname(filepath);

    const fileMeta = await filesCol.findOne({
      name: filename,
      dirPath,
      userId: req.user.id,
    });

    if (!fileMeta) return res.status(404).json({ message: "File not found" });

    const storedPath = getSafePath(
      path.join("Storage", req.user.id, dirPath, fileMeta.storedName)
    );

    await fs.rm(storedPath, { force: true });
    await filesCol.deleteOne({ id: fileMeta.id });

    res.json({ message: "✅ Deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: err.message });
  }
}

export const listFile =  async (req, res) => {
  try {
    const db = await connectDb();
    const filesCol = db.collection("files");

    const dirPath = req.query.dirPath || "";
    const files = await filesCol
      .find({ userId: req.user.id, dirPath })
      .project({ _id: 0 })
      .toArray();

    res.json(files);
  } catch (err) {
    console.error("List error:", err);
    res.status(500).json({ message: err.message });
  }
}