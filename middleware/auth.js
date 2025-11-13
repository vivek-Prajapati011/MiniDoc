import User from "../models/userModel.js";

export default async function checkAuth(req, res, next) {
  try {
    const { uid } = req.cookies;
    if (!uid) return res.status(401).json({ message: "Not logged in" });

    const user = await User.findById(uid).select("-password");
    if (!user) return res.status(401).json({ message: "Invalid user" });

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ message: "Auth failed", error: err.message });
  }
}
