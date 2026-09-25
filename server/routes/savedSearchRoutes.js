import express from "express";
import {
  createSavedSearch,
  deleteSavedSearch,
  getMyAlerts,
  getSavedSearches,
  markAlertRead
} from "../controllers/savedSearchController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("jobseeker"));
router.get("/alerts/me", getMyAlerts);
router.patch("/alerts/:id/read", markAlertRead);
router.get("/", getSavedSearches);
router.post("/", createSavedSearch);
router.delete("/:id", deleteSavedSearch);

export default router;
