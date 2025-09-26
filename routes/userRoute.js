// routes/userRoute.js
import express from "express";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getSafePath, STORAGE_PATH } from "../utils/pathUtils.js";

const router = express.Router();
const DB_PATH = path.join(process.cwd(), "usersDB.json"); // matches your existing file

// --- helpers ---
async function readUsers() {
  try {
    const data = await readFile(DB_PATH, "utf-8");
    return JSON.parse(data || "[]");
  } catch {
    return [];
  }
}

async function writeUsers(users) {
  await writeFile(DB_PATH, JSON.stringify(users, null, 2));
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`; // store "salt:hash"
}

function verifyPassword(stored, inputPassword) {
  const [salt, derived] = stored.split(":");
  if (!salt || !derived) return false;
  const inputDerived = crypto.scryptSync(inputPassword, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(inputDerived, "hex"), Buffer.from(derived, "hex"));
}

// --- Register ---
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }

    const users = await readUsers();
    if (users.find((u) => u.email === email)) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    const id = crypto.randomUUID();
    const rootDirId = crypto.randomUUID();
    const hashedPassword = hashPassword(password);

    const newUser = {
      id,
      name,
      email,
      password: hashedPassword,
      rootDirId
    };

    users.push(newUser);
    await writeUsers(users);

    // create user's root directory inside Storage (so each user has isolated folder)
    const userStorageRel = path.join(rootDirId); // relative inside STORAGE_PATH
    const userStorageFull = getSafePath(userStorageRel); // will throw if attempt path-traversal
    await mkdir(userStorageFull, { recursive: true });

    // respond (do NOT return password)
    res.json({
      message: "User registered",
      user: { id: newUser.id, name: newUser.name, email: newUser.email, rootDirId: newUser.rootDirId }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// optional: simple login endpoint (no JWT — returns ok; you can adapt to set cookie later)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    const users = await readUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = verifyPassword(user.password, password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    // success — you can set a cookie here or return user info
    // res.cookie("uid", user.id, { httpOnly: true }); // optional
    res.json({ message: "Login successful", user: { id: user.id, name: user.name, email: user.email, rootDirId: user.rootDirId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
