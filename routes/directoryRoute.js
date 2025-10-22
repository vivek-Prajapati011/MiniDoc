// routes/directoryRoute.js
import express from "express";
import { mkdir, rm } from "fs/promises";
import path from "path";
import checkAuth from "../middleware/auth.js";
import { getSafePath } from "../utils/pathUtils.js";
import { connectDb } from "../Storage/Db.js";

const router = express.Router();

/* 
   ✅ Get all root directories for the logged-in user
   GET /directory/
 */
router.get("/", checkAuth, async (req, res) => {
  try {
    const db = await connectDb();
    const directories = db.collection("directories");

    const rootDirs = await directories
      .find({ userId: req.user.id, parentId: "root" })
      .toArray();

    res.json(rootDirs);
  } catch (err) {
    console.error("Error listing root directories:", err);
    res.status(500).json({ message: err.message });
  }
});

/* 
   ✅ Get nested directories under a specific directory
   GET /directory/{dirId}
 */
router.get("/{dirId}", checkAuth, async (req, res) => {
  try {
    const { dirId } = req.params;
    const db = await connectDb();
    const directories = db.collection("directories");

    const subDirs = await directories
      .find({ userId: req.user.id, parentId: dirId })
      .toArray();

    res.json(subDirs);
  } catch (err) {
    console.error("Error fetching subdirectories:", err);
    res.status(500).json({ message: err.message });
  }
});

/* 
   ✅ Create a new directory
   POST /directory/
   Body: { name, parentId (optional) }
 */
router.post("/", checkAuth, async (req, res) => {
  try {
    const { name, parentId = "root" } = req.body;
    if (!name) return res.status(400).json({ message: "Directory name required" });

    const db = await connectDb();
    const directories = db.collection("directories");

    const newDir = {
      name,
      parentId,
      userId: req.user.id,
      createdAt: new Date(),
    };

    const result = await directories.insertOne(newDir);

    // Also create physical folder (optional)
    const userDirPath = getSafePath(path.join("Storage", req.user.id, name));
    await mkdir(userDirPath, { recursive: true });

    res.json({ message: "Directory created", id: result.insertedId, ...newDir });
  } catch (err) {
    console.error("Error creating directory:", err);
    res.status(500).json({ message: err.message });
  }
});

/* 
   ✅ Rename a directory
   PATCH /directory/{dirId}
   Body: { newName }
 */
router.patch("/{dirId}", checkAuth, async (req, res) => {
  try {
    const { dirId } = req.params;
    const { newName } = req.body;
    if (!newName) return res.status(400).json({ message: "New name required" });

    const db = await connectDb();
    const directories = db.collection("directories");

    const result = await directories.updateOne(
      { _id: dirId, userId: req.user.id },
      { $set: { name: newName } }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ message: "Directory not found" });

    res.json({ message: "Renamed successfully" });
  } catch (err) {
    console.error("Error renaming directory:", err);
    res.status(500).json({ message: err.message });
  }
});

/* 
   ✅ Recursively delete a directory and all its contents
   DELETE /directory/{dirId}
 */
router.delete("/{dirId}", checkAuth, async (req, res) => {
  try {
    const { dirId } = req.params;
    const db = await connectDb();
    const directories = db.collection("directories");
    const files = db.collection("files");

    // 1️⃣ Find target directory
    const target = await directories.findOne({ _id: dirId, userId: req.user.id });
    if (!target) return res.status(404).json({ message: "Directory not found" });

    // 2️⃣ Recursive function to get all subdirectories
    async function getAllSubDirs(parentId) {
      const subDirs = await directories.find({ parentId, userId: req.user.id }).toArray();
      let all = [...subDirs];
      for (const dir of subDirs) {
        const deeper = await getAllSubDirs(dir._id);
        all = all.concat(deeper);
      }
      return all;
    }

    const allSubDirs = await getAllSubDirs(dirId);
    const allDirIds = [dirId, ...allSubDirs.map((d) => d._id)];

    // 3️⃣ Delete all files in those directories (from DB + Disk)
    const userFiles = await files
      .find({ dirId: { $in: allDirIds }, userId: req.user.id })
      .toArray();

    for (const f of userFiles) {
      const filePath = getSafePath(path.join("Storage", req.user.id, f.storedName));
      await rm(filePath, { force: true });
    }

    await files.deleteMany({ dirId: { $in: allDirIds }, userId: req.user.id });

    // 4️⃣ Delete directories (from DB)
    await directories.deleteMany({ _id: { $in: allDirIds }, userId: req.user.id });

    // 5️⃣ Optionally remove folder from physical storage
    const folderPath = getSafePath(path.join("Storage", req.user.id, target.name));
    await rm(folderPath, { recursive: true, force: true });

    res.json({
      message: "Directory and all nested contents deleted successfully",
      deletedDirectories: allDirIds.length,
      deletedFiles: userFiles.length,
    });
  } catch (err) {
    console.error("Recursive delete error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
