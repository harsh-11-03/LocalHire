import Job from "../models/Job.js";
import Report from "../models/Report.js";

export async function reportJob(req, res, next) {
  try {
    const reason = typeof req.body.reason === "string" ? req.body.reason.trim() : "";

    if (!reason) {
      return res.status(400).json({ message: "Report reason is required" });
    }

    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const report = await Report.create({
      userId: req.user._id,
      jobId: job._id,
      reason
    });

    job.reportsCount = (job.reportsCount || 0) + 1;
    await job.save();

    res.status(201).json({ message: "Report submitted", report });
  } catch (error) {
    next(error);
  }
}
