// middleware/auth.js
// middleware/auth.js
import { db } from "../db.js"; // ✅ import db connection

export default async function checkAuth(req, res, next) {
  try {
    const { uid } = req.cookies;

    if (!uid) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const usersCol = db.collection("users");
    const user = await usersCol.findOne({ id: uid });

    if (!user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    req.user = user; // attach user info to request
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(500).json({ error: "Authentication error" });
  }
}
