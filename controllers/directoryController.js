import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import File from "../models/fileModel.js";
import { getSafePath } from "../utils/pathUtils.js";

// ✅ Upload file
export const uploadFile = async (req, res) => {
  try {
    const filepath = req.params.path || "";
    const filename = path.basename(filepath);
    const dirPath = path.dirname(filepath) === "." ? "" : path.dirname(filepath);

    const userDir = getSafePath(path.join("Storage", req.user.id, dirPath));
    await fs.mkdir(userDir, { recursive: true });

    const fileId = crypto.randomUUID();
    const ext = path.extname(req.file.originalname);
    const storedName = `${fileId}${ext}`;
    const storedPath = path.join(userDir, storedName);
    await fs.rename(req.file.path, storedPath);

    const fileDoc = await File.create({
      name: filename,
      extension: ext,
      userId: req.user.id,
      parentDirId: null,
      storedName,
      size: req.file.size,
    });

    res.json({ message: "✅ Uploaded successfully", file: fileDoc });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Download or open file
export const handleFileDownload = async (req, res) => {
  try {
    const filepath = req.params.path;
    const filename = path.basename(filepath);
    const dirPath = path.dirname(filepath) === "." ? "" : path.dirname(filepath);

    const file = await File.findOne({ name: filename, userId: req.user.id });
    if (!file) return res.status(404).json({ message: "File not found" });

    const storedPath = getSafePath(path.join("Storage", req.user.id, dirPath, file.storedName));
    const action = req.query.action || "download";

    if (action === "open") {
      return res.sendFile(path.resolve(storedPath));
    }

    res.download(path.resolve(storedPath), filename);
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Rename file
export const renameFile = async (req, res) => {
  try {
    const filepath = req.params.path;
    const filename = path.basename(filepath);
    const { newName } = req.body;

    const updated = await File.findOneAndUpdate(
      { name: filename, userId: req.user.id },
      { name: newName },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "File not found" });
    res.json({ message: "✅ Renamed", file: updated });
  } catch (err) {
    console.error("Rename error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Delete file
export const deleteFile = async (req, res) => {
  try {
    const filepath = req.params.path;
    const filename = path.basename(filepath);

    const file = await File.findOneAndDelete({ name: filename, userId: req.user.id });
    if (!file) return res.status(404).json({ message: "File not found" });

    const storedPath = getSafePath(path.join("Storage", req.user.id, file.storedName));
    await fs.rm(storedPath, { force: true });

    res.json({ message: "✅ Deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ List all files (for a user or directory)
export const listFile = async (req, res) => {
  try {
    const dirPath = req.query.dirPath || "";
    const files = await File.find({ userId: req.user.id, dirPath }).lean();
    res.json(files);
  } catch (err) {
    console.error("List error:", err);
    res.status(500).json({ message: err.message });
  }
};
