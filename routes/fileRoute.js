import express from "express";
import multer from "multer";
import checkAuth from "../middleware/auth.js";
import { uploadFile, handleFileDownload, renameFile, deleteFile, listFile } from "../controllers/fileRouteController.js";

const router = express.Router();
const upload = multer({ dest: "tempUploads/" });

router.use(checkAuth);

router.post("/{*filepath}", upload.single("file"), uploadFile);
router.get("/{*filepath}", handleFileDownload);
router.patch("/{*filepath}", renameFile);
router.delete("/{*filepath}", deleteFile);
router.get("/", listFile);

export default router;
