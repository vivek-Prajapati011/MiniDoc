import express from "express";
import checkAuth from "../middleware/auth.js";
import {
  listDirectories,
  createDirectory,
  deleteDirectory,
} from "../controllers/directoryController.js";

const router = express.Router();

// ✅ Get root-level directories
router.get("/", checkAuth, listDirectories);

// ✅ Get child directories by parent ID
router.get("/{parentDirId}", checkAuth, listDirectories);

// ✅ Create a new directory
router.post("/", checkAuth, createDirectory);

// ✅ Delete a directory by ID
router.delete("/{dirId}", checkAuth, deleteDirectory);

export default router;
