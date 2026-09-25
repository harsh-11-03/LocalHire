import express from "express";
import { getMySavedJobs, removeSavedJob, saveJob } from "../controllers/savedJobController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, authorizeRoles("jobseeker", "admin"), getMySavedJobs);
router.post("/:jobId", protect, authorizeRoles("jobseeker"), saveJob);
router.delete("/:jobId", protect, authorizeRoles("jobseeker", "admin"), removeSavedJob);

export default router;
