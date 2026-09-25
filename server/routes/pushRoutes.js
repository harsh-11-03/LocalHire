import express from "express";
import { subscribeToPush, unsubscribeFromPush } from "../controllers/pushController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/subscribe", subscribeToPush);
router.delete("/subscribe", unsubscribeFromPush);

export default router;
