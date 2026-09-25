import express from "express";
import {
  createJob,
  deleteJob,
  getEmployerJobs,
  getFeaturedJobs,
  getJobById,
  getJobs,
  markJobFilled,
  updateJob
} from "../controllers/jobController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", getJobs);
router.get("/featured", getFeaturedJobs);
router.get("/employer/mine", protect, authorizeRoles("employer", "admin"), getEmployerJobs);
router.get("/:id", getJobById);
router.post("/", protect, authorizeRoles("employer", "admin"), upload.single("companyLogo"), createJob);
router.put("/:id", protect, authorizeRoles("employer", "admin"), upload.single("companyLogo"), updateJob);
router.delete("/:id", protect, authorizeRoles("employer", "admin"), deleteJob);
router.patch("/:id/filled", protect, authorizeRoles("employer", "admin"), markJobFilled);

export default router;
