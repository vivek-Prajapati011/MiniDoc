import express from "express";
import cookieParser from "cookie-parser";
import { userRegister, loginInfo, logout, logUserInfo } from "../controllers/userRouteController.js";

const router = express.Router();
router.use(cookieParser());

router.post("/register", userRegister);
router.post("/login", loginInfo);
router.post("/logout", logout);
router.get("/me", logUserInfo);

export default router;
