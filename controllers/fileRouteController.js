import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import File from "../models/fileModel.js";
import { getSafePath } from "../utils/pathUtils.js";

// UPLOAD
export const uploadFile = async (req, res) => {
  try {
    const filepath = req.params.filepath.join("/");
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
      storedName,
      size: req.file.size,
      userId: req.user.id,
    });

    res.json({ message: "✅ Uploaded successfully", file: fileDoc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DOWNLOAD / OPEN
export const handleFileDownload = async (req, res) => {
  try {
    const filepath = req.params.filepath.join("/");
    const filename = path.basename(filepath);
    const file = await File.findOne({ name: filename, userId: req.user.id });
    if (!file) return res.status(404).json({ message: "File not found" });

    const storedPath = getSafePath(path.join("Storage", req.user.id, file.storedName));
    if (req.query.action === "open") return res.sendFile(path.resolve(storedPath));

    res.download(path.resolve(storedPath), filename);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// RENAME
export const renameFile = async (req, res) => {
  try {
    const filepath = req.params.filepath.join("/");
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
    res.status(500).json({ message: err.message });
  }
};

// DELETE
export const deleteFile = async (req, res) => {
  try {
    const filepath = req.params.filepath.join("/");
    const filename = path.basename(filepath);

    const file = await File.findOneAndDelete({ name: filename, userId: req.user.id });
    if (!file) return res.status(404).json({ message: "File not found" });

    const storedPath = getSafePath(path.join("Storage", req.user.id, file.storedName));
    await fs.rm(storedPath, { force: true });

    res.json({ message: "✅ Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LIST
export const listFile = async (req, res) => {
  try {
    const files = await File.find({ userId: req.user.id }).lean();
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
