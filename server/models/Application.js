import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["Applied", "Viewed", "Interview Scheduled", "Rejected", "Hired"],
      default: "Applied"
    },
    interview: {
      status: {
        type: String,
        enum: ["proposed", "accepted", "declined", "reschedule_requested"]
      },
      date: Date,
      method: {
        type: String,
        enum: ["Chat", "Phone", "Video", "In-person"]
      },
      location: String,
      notes: String,
      proposedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      respondedAt: Date
    }
  },
  { timestamps: true }
);

applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);

export default Application;
