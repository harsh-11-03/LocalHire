import express from "express";
import {
  applyForJob,
  getApplicationsForJob,
  getMyApplications,
  respondToInterview,
  scheduleInterview,
  updateApplicationStatus,
  withdrawApplication
} from "../controllers/applicationController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:jobId", protect, authorizeRoles("jobseeker"), applyForJob);
router.get("/me", protect, authorizeRoles("jobseeker", "admin"), getMyApplications);
router.delete("/:id", protect, authorizeRoles("jobseeker"), withdrawApplication);
router.get("/job/:jobId", protect, authorizeRoles("employer", "admin"), getApplicationsForJob);
router.patch("/:id/interview", protect, authorizeRoles("employer", "admin"), scheduleInterview);
router.patch("/:id/interview/respond", protect, authorizeRoles("jobseeker"), respondToInterview);
router.patch("/:id/status", protect, authorizeRoles("employer", "admin"), updateApplicationStatus);

export default router;
