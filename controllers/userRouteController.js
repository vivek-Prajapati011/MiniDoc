import crypto from "crypto";
import User from "../models/userModel.js";

// REGISTER
export const userRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ name, email, password, rootDirId: crypto.randomUUID() });
    res.json({ message: "✅ Registered", user: { id: user._id, name, email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LOGIN
export const loginInfo = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    res.cookie("uid", user._id.toString(), { httpOnly: true });
    res.json({ message: "✅ Login successful", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LOGOUT
export const logout = (req, res) => {
  res.clearCookie("uid");
  res.json({ message: "✅ Logged out" });
};

// CURRENT USER
export const logUserInfo = async (req, res) => {
  const { uid } = req.cookies;
  if (!uid) return res.status(401).json({ message: "Not logged in" });

  const user = await User.findById(uid).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({ user });
};
