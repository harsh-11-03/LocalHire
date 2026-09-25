import express from "express";
import {
  adminDeleteJob,
  getAdminStats,
  getAllJobs,
  getAllUsers,
  getReports,
  moderateJob,
  resolveReport,
  toggleBlockUser,
  toggleVerifyEmployer,
  toggleVerifyJob,
  toggleVerifyUser
} from "../controllers/adminController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("admin"));

router.get("/stats", getAdminStats);
router.get("/users", getAllUsers);
router.get("/jobs", getAllJobs);
router.get("/reports", getReports);
router.patch("/users/:id/block", toggleBlockUser);
router.patch("/users/:id/verify-employer", toggleVerifyEmployer);
router.patch("/users/:id/verify", toggleVerifyUser);
router.patch("/jobs/:id/moderate", moderateJob);
router.patch("/jobs/:id/verify", toggleVerifyJob);
router.delete("/jobs/:id", adminDeleteJob);
router.patch("/reports/:id/resolve", resolveReport);

export default router;
