// routes/userRoute.js
import express from "express";
import { writeFile, readFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import checkAuth from "../middleware/auth.js";

const router = express.Router();
const DB_PATH = path.join(process.cwd(), "usersDB.json");

// Load users data helper
async function loadUsersData() {
  try {
    const data = await readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Save users helper
async function saveUsers(data) {
  await writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// ✅ Register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields required" });
  }

  const usersData = await loadUsersData();
  const exists = usersData.find((u) => u.email === email);
  if (exists) return res.status(400).json({ error: "User already exists" });

  const newUser = {
    id: crypto.randomUUID(),
    name,
    email,
    password,
    rootDirId: crypto.randomUUID()
  };

  usersData.push(newUser);
  await saveUsers(usersData);

  res.json({ message: "Registered", user: newUser });
});

// ✅ Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const usersData = await loadUsersData();
  const user = usersData.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  // set cookie for session
  res.cookie("uid", user.id, { httpOnly: true });
  res.json({ message: "Login successful", user });
});

// ✅ Logout
router.post("/logout", (req, res) => {
  res.clearCookie("uid");
  res.json({ message: "Logged out" });
});

export default router;