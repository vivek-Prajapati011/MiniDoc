// routes/directoryRoute.js
import express from "express";
import checkAuth from "../middleware/auth.js";
import {
  listDirectories,
  createDirectory,
  deleteDirectory,
} from "../controllers/directoryController.js";

const router = express.Router();

// ✅ Get all directories (optional param in Express 5)
router.get("/{parentDirId}?", checkAuth, listDirectories);

// ✅ Create a new directory
router.post("/", checkAuth, createDirectory);

// ✅ Delete a directory by ID (Express 5 syntax)
router.delete("/{dirId}", checkAuth, deleteDirectory);

export default router;
