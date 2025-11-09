// routes/fileRoute.js
import express from "express";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import checkAuth from "../middleware/auth.js";
import { getSafePath } from "../utils/pathUtils.js";
import { connectDb } from "../Storage/Db.js";
import { deleteFile, handleFileDownload, listFile, renameFile, uploadFile } from "../controllers/fileRouteController.js";


const router = express.Router();
const upload = multer({ dest: "tempUploads/" });

// ✅ Protect all routes
router.use(checkAuth);

/* ===========================================================
   ✅ Upload File → POST /files/{*filepath}
=========================================================== */
router.post("/{*filepath}", upload.single("file"), uploadFile);

/* ===========================================================
   ✅ Download or Open File → GET /files/{*filepath}?action=open|download
=========================================================== */
router.get("/{*filepath}", handleFileDownload);

/* ===========================================================
   ✅ Rename File → PATCH /files/{*filepath}
=========================================================== */
router.patch("/{*filepath}",renameFile);

/* ===========================================================
   ✅ Delete File → DELETE /files/{*filepath}
=========================================================== */
router.delete("/{*filepath}", deleteFile);

/* ===========================================================
   ✅ List Files in a Directory → GET /files?dirPath=subfolder
=========================================================== */
router.get("/", listFile);

export default router;
