import Directory from "../models/directoryModel.js";
import fs from "fs/promises";
import path from "path";
import { getSafePath } from "../utils/pathUtils.js";

// LIST
export const listDirectories = async (req, res) => {
  try {
    const parentDirId = req.params.parentDirId || null;
    const dirs = await Directory.find({ userId: req.user.id, parentDirId }).lean();
    res.json(dirs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE
export const createDirectory = async (req, res) => {
  try {
    const { name, parentDirId = null } = req.body;
    if (!name) return res.status(400).json({ message: "Directory name required" });

    const dir = await Directory.create({ name, userId: req.user.id, parentDirId });

    const userDir = getSafePath(path.join("Storage", req.user.id.toString(), name));
    await fs.mkdir(userDir, { recursive: true });

    res.json({ message: "✅ Directory created", dir });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE
export const deleteDirectory = async (req, res) => {
  try {
    const { dirId } = req.params;
    const dir = await Directory.findByIdAndDelete(dirId);
    if (!dir) return res.status(404).json({ message: "Directory not found" });
    res.json({ message: "✅ Directory deleted", dir });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
