import mongoose from "mongoose";

const jobAlertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    savedSearchId: { type: mongoose.Schema.Types.ObjectId, ref: "SavedSearch", required: true },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

jobAlertSchema.index({ userId: 1, createdAt: -1 });
jobAlertSchema.index({ userId: 1, jobId: 1, savedSearchId: 1 }, { unique: true });

export default mongoose.model("JobAlert", jobAlertSchema);
