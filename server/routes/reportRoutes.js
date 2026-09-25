import express from "express";
import { reportJob } from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:jobId", protect, reportJob);

export default router;
