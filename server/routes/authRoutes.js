import express from "express";
import rateLimit from "express-rate-limit";
import {
	forgotPassword,
	getMe,
	googleLogin,
	login,
	register,
	resendVerificationEmail,
	resetPassword,
	verifyEmail
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 20,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: { message: "Too many authentication attempts. Please try again later." }
});

router.post(["/register", "/login", "/google", "/resend-verification", "/forgot-password", "/reset-password"], authLimiter);
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getMe);

export default router;
