// routes/directoryRoute.js
import express from "express";
import path from "path";
import { connectDb } from "../Storage/Db.js";
import checkAuth from "../middleware/auth.js";
import { getSafePath } from "../utils/pathUtils.js";
import { mkdir, rm } from "fs/promises";
import { deleteDirectory, listDirItem,createDirectory } from "../controllers/directoryController.js";

const router = express.Router();

/* 
  ✅ Get all items (files + folders) in a directory
  Express 5 syntax: /{*path} — replaces :path(*)
*/
router.get("/{*path}", checkAuth,listDirItem);
/* 
  ✅ Create new directory
  POST /directory/
*/
router.post("/", checkAuth, createDirectory);

/* 
  ✅ Delete a directory and all its contents
  DELETE /directory/{*path}
*/
router.delete("/{*path}", checkAuth, deleteDirectory );

export default router;
