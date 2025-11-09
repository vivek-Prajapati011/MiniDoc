import crypto from "crypto";
import { connectDb } from "../Storage/Db.js";
import cookieParser from "cookie-parser";

export const userRegister = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const db = await connectDb(); // ✅ get DB here
    const usersCol = db.collection("users");

    const exists = await usersCol.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const newUser = {
      id: crypto.randomUUID(),
      name,
      email,
      password, // ⚠️ hash later with bcrypt
      rootDirId: crypto.randomUUID(),
    };

    await usersCol.insertOne(newUser);

    res.json({ message: "User registered successfully", user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export const loginInfo =  async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const db = await connectDb(); // ✅ get DB here
    const usersCol = db.collection("users");

    const user = await usersCol.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.cookie("uid", user.id, { httpOnly: true });
    res.json({ message: "Login successful", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export const logout = (req, res) => {
  res.clearCookie("uid");
  res.json({ message: "Logged out successfully" });
}

export const logUserInfo =  async (req, res) => {
  const { uid } = req.cookies;
  if (!uid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const db = await connectDb(); // ✅ get DB here
    const usersCol = db.collection("users");
    const user = await usersCol.findOne({ id: uid });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}