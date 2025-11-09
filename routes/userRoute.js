// routes/userRoute.js
import express from "express";
import crypto from "crypto";
import { connectDb } from "../Storage/Db.js";
import cookieParser from "cookie-parser";
import { loginInfo, logout, logUserInfo, userRegister } from "../controllers/userRouteController.js";

const router = express.Router();
router.use(cookieParser());

// ✅ Register
router.post("/register",userRegister );

// ✅ Login
router.post("/login",loginInfo);

// ✅ Logout
router.post("/logout", logout);

// ✅ Get Current User Info
router.get("/me",logUserInfo);

export default router;
