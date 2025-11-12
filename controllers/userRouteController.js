import crypto from "crypto";
import cookieParser from "cookie-parser";
import User from "../models/userModel.js"; // ← now using your Mongoose model

// ✅ Register User
export const userRegister = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if user exists
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password, // ⚠️ you can later hash this with bcrypt
      rootDirId: crypto.randomUUID(), // temporary unique ID if not using Directory model yet
    });

    await newUser.save();

    res.json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Login User
export const loginInfo = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const user = await User.findOne({ email, password }); // later use bcrypt.compare()
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.cookie("uid", user._id.toString(), { httpOnly: true });
    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Logout User
export const logout = (req, res) => {
  res.clearCookie("uid");
  res.json({ message: "Logged out successfully" });
};

// ✅ Get Logged-In User Info
export const logUserInfo = async (req, res) => {
  const { uid } = req.cookies;

  if (!uid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const user = await User.findById(uid).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
