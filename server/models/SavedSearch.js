import mongoose from "mongoose";

const savedSearchSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    keyword: { type: String, trim: true },
    city: { type: String, trim: true },
    category: { type: String, trim: true },
    jobType: { type: String, trim: true },
    experience: { type: String, trim: true },
    minSalary: Number,
    maxSalary: Number,
    radiusKm: { type: Number, min: 1, max: 100 },
    location: { type: { type: String, enum: ["Point"] }, coordinates: [Number] },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

savedSearchSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("SavedSearch", savedSearchSchema);
