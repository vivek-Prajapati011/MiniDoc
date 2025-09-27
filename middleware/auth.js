// middleware/auth.js
import { readFile } from 'fs/promises';
import path from 'path';

const usersDBPath = path.join(process.cwd(), 'usersDB.json');

export default async function checkAuth(req, res, next) {
  try {
    const { uid } = req.cookies;
    
    if (!uid) {
      return res.status(401).json({ error: "Not logged in" });
    }

    // Read users data
    const usersData = JSON.parse(await readFile(usersDBPath, 'utf8'));
    const user = usersData.find((u) => u.id === uid);

    if (!user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: "Authentication error" });
  }
}