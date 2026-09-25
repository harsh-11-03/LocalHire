import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    company: {
      type: String,
      required: true,
      trim: true
    },
    salaryMin: {
      type: Number,
      required: true
    },
    salaryMax: Number,
    salaryText: String,
    city: {
      type: String,
      required: true,
      trim: true
    },
    area: String,
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: undefined
      },
      coordinates: {
        type: [Number],
        default: undefined
      }
    },
    category: {
      type: String,
      required: true
    },
    jobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Daily wage"],
      required: true
    },
    experienceRequired: {
      type: String,
      enum: ["Fresher", "0-1 years", "1-3 years", "3-5 years", "5+ years"],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    skills: [String],
    perks: [String],
    phoneNumber: {
      type: String,
      required: true
    },
    whatsappNumber: String,
    companyLogo: {
      url: String,
      publicId: String
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["active", "pending", "rejected"],
      default: "active"
    },
    isFilled: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    reportsCount: {
      type: Number,
      default: 0
    },
    views: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

jobSchema.index({ title: "text", company: "text", description: "text", city: "text" });
jobSchema.index({ location: "2dsphere" });

const Job = mongoose.model("Job", jobSchema);

export default Job;
