import Job from "../models/Job.js";
import Report from "../models/Report.js";
import User from "../models/User.js";
import { createAlertsForJob } from "../utils/jobAlerts.js";

export async function getAdminStats(req, res, next) {
  try {
    const [totalUsers, totalJobs, activeJobs, pendingJobs, reportedJobIds] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Job.countDocuments({ status: "active", isFilled: false }),
      Job.countDocuments({ status: "pending" }),
      Report.distinct("jobId", { status: "open" })
    ]);
    const reportedEmployerIds = await Job.distinct("employerId", { _id: { $in: reportedJobIds } });
    res.json({ stats: { totalUsers, totalJobs, activeJobs, pendingJobs, reportedUsers: reportedEmployerIds.length } });
  } catch (error) {
    next(error);
  }
}

export async function getAllUsers(req, res, next) {
  try {
    res.json({ users: await User.find().select("-password").sort({ createdAt: -1 }) });
  } catch (error) {
    next(error);
  }
}

export async function getAllJobs(req, res, next) {
  try {
    const { city } = req.query;
    const filter = {};
    if (city) filter.city = city;
    const jobs = await Job.find(filter)
      .populate("employerId", "name email isVerified isVerifiedEmployer")
      .sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (error) {
    next(error);
  }
}

export async function toggleBlockUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot block your own account" });
    }
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ message: "User updated", user });
  } catch (error) {
    next(error);
  }
}

export async function toggleVerifyEmployer(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user || user.role !== "employer") return res.status(404).json({ message: "Employer not found" });
    user.isVerifiedEmployer = !user.isVerifiedEmployer;
    await user.save();
    res.json({ message: "Employer verification updated", user });
  } catch (error) {
    next(error);
  }
}

export async function toggleVerifyUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot change your own verification" });
    }

    user.isVerified = !user.isVerified;
    if (user.role === "employer") user.isVerifiedEmployer = user.isVerified;
    await user.save();
    res.json({ message: user.isVerified ? "User verified" : "User unverified", user });
  } catch (error) {
    next(error);
  }
}

export async function moderateJob(req, res, next) {
  try {
    const { status } = req.body;
    if (!["active", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Choose an approval or rejection status" });
    }

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    job.status = status;
    await job.save();
    if (status === "active") await createAlertsForJob(job);

    res.json({ message: status === "active" ? "Job approved" : "Job rejected", job });
  } catch (error) {
    next(error);
  }
}

export async function toggleVerifyJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    job.isVerified = !job.isVerified;
    await job.save();
    res.json({ message: job.isVerified ? "Job verified" : "Job unverified", job });
  } catch (error) {
    next(error);
  }
}

export async function adminDeleteJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    await job.deleteOne();
    res.json({ message: "Job deleted" });
  } catch (error) {
    next(error);
  }
}

export async function getReports(req, res, next) {
  try {
    const reports = await Report.find()
      .populate("userId", "name email")
      .populate("jobId", "title company city")
      .sort({ createdAt: -1 });
    res.json({ reports });
  } catch (error) {
    next(error);
  }
}

export async function resolveReport(req, res, next) {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });
    report.status = report.status === "resolved" ? "open" : "resolved";
    await report.save();
    res.json({ message: report.status === "resolved" ? "Report resolved" : "Report reopened", report });
  } catch (error) {
    next(error);
  }
}
