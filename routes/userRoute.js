// routes/userRoute.js
import express from "express";
import crypto from "crypto";
import { connectDb } from "../Storage/Db.js";  // ✅ import Mongo connection
import checkAuth from "../middleware/auth.js";

const router = express.Router();

// ✅ Register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields required" });
  }

  try {
    const usersCol = db.collection("users");

    // check if user already exists
    const exists = await usersCol.findOne({ email });
    if (exists) return res.status(400).json({ error: "User already exists" });

    // create user
    const newUser = {
      id: crypto.randomUUID(),
      name,
      email,
      password, // ⚠️ ideally hash with bcrypt
      rootDirId: crypto.randomUUID(),
    };

    await usersCol.insertOne(newUser);

    res.json({ message: "Registered", user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const usersCol = db.collection("users");

    const user = await usersCol.findOne({ email, password });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    res.cookie("uid", user.id, { httpOnly: true });
    res.json({ message: "Login successful", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Logout
router.post("/logout", (req, res) => {
  res.clearCookie("uid");
  res.json({ message: "Logged out" });
});

export default router;
