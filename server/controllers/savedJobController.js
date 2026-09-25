import Job from "../models/Job.js";
import SavedJob from "../models/SavedJob.js";

export async function saveJob(req, res, next) {
  try {
    if (req.user.role !== "jobseeker") {
      return res.status(403).json({ message: "Only job seekers can save jobs" });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const existingSavedJob = await SavedJob.findOne({
      userId: req.user._id,
      jobId: job._id
    });

    if (existingSavedJob) {
      return res.json({ message: "Job already saved", savedJob: existingSavedJob });
    }

    const savedJob = await SavedJob.create({
      userId: req.user._id,
      jobId: job._id
    });

    res.status(201).json({ message: "Job saved", savedJob });
  } catch (error) {
    next(error);
  }
}

export async function getMySavedJobs(req, res, next) {
  try {
    const savedJobs = await SavedJob.find({ userId: req.user._id })
      .populate("jobId")
      .sort({ createdAt: -1 });

    res.json({ savedJobs });
  } catch (error) {
    next(error);
  }
}

export async function removeSavedJob(req, res, next) {
  try {
    await SavedJob.findOneAndDelete({
      userId: req.user._id,
      jobId: req.params.jobId
    });

    res.json({ message: "Saved job removed" });
  } catch (error) {
    next(error);
  }
}
