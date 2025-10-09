// middleware/auth.js
import { connectDb } from "../Storage/Db.js"; // ✅ import DB connection

export default async function checkAuth(req, res, next) {
  try {
    const { uid } = req.cookies;

    if (!uid) {
      return res.status(401).json({ error: "Not logged in" });
    }

    // ✅ Get DB instance
    const db = await connectDb();
    const usersCol = db.collection("users");

    // ✅ Check if user exists
    const user = await usersCol.findOne({ id: uid });

    if (!user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    // ✅ Attach user info to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(500).json({ error: "Authentication error" });
  }
}
