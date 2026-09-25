import express from "express";
import { getChatMessages, sendChatMessage } from "../controllers/chatController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("jobseeker", "employer"));
router.get("/job/:jobId", getChatMessages);
router.post("/job/:jobId/messages", sendChatMessage);

export default router;
