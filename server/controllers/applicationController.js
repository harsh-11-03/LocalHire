import Application from "../models/Application.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import { createNotification } from "../utils/notifications.js";

export async function applyForJob(req, res, next) {
  try {
    if (req.user.role !== "jobseeker") {
      return res.status(403).json({ message: "Only job seekers can apply for jobs" });
    }

    const job = await Job.findById(req.params.jobId);

    if (!job || job.status !== "active" || job.isFilled) {
      return res.status(404).json({ message: "This job is not available" });
    }

    const employer = await User.findById(job.employerId).select("isBlocked");
    if (!employer || employer.isBlocked) {
      return res.status(404).json({ message: "This job is not available" });
    }

    const existingApplication = await Application.findOne({
      userId: req.user._id,
      jobId: job._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: "You have already applied for this job" });
    }

    const application = await Application.create({
      userId: req.user._id,
      jobId: job._id,
      employerId: job.employerId
    });

    res.status(201).json({ message: "Application sent", application });
  } catch (error) {
    next(error);
  }
}

export async function getMyApplications(req, res, next) {
  try {
    const applications = await Application.find({ userId: req.user._id })
      .populate("jobId")
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (error) {
    next(error);
  }
}

export async function withdrawApplication(req, res, next) {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    await application.deleteOne();
    res.json({ message: "Application withdrawn" });
  } catch (error) {
    next(error);
  }
}

export async function getApplicationsForJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const isOwner = job.employerId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only view applicants for your own jobs" });
    }

    const applications = await Application.find({ jobId: job._id })
      .populate("userId", "name email phone skills resume isVerified")
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (error) {
    next(error);
  }
}

export async function updateApplicationStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowedStatuses = ["Applied", "Viewed", "Interview Scheduled", "Rejected", "Hired"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid application status" });
    }

    const application = await Application.findById(req.params.id).populate("jobId");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const isOwner = application.employerId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only update your own applicants" });
    }

    application.status = status;
    await application.save();
    await createNotification({
      userId: application.userId,
      type: "application",
      title: "Application status updated",
      message: `${application.jobId.title} is now marked as ${status}`,
      link: "/seeker/dashboard"
    });
    res.json({ message: "Application status updated", application });
  } catch (error) {
    next(error);
  }
}

export async function scheduleInterview(req, res, next) {
  try {
    const { date, method, location = "", notes = "" } = req.body;
    const allowedMethods = ["Chat", "Phone", "Video", "In-person"];
    const interviewDate = new Date(date);

    if (!date || Number.isNaN(interviewDate.getTime()) || interviewDate <= new Date()) {
      return res.status(400).json({ message: "Choose a future interview date and time" });
    }
    if (!allowedMethods.includes(method)) {
      return res.status(400).json({ message: "Choose a valid interview method" });
    }

    const application = await Application.findById(req.params.id).populate("jobId", "title");
    if (!application) return res.status(404).json({ message: "Application not found" });

    const isOwner = application.employerId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only schedule interviews for your own applicants" });
    }

    application.status = "Interview Scheduled";
    application.interview = {
      status: "proposed",
      date: interviewDate,
      method,
      location: String(location).trim().slice(0, 500),
      notes: String(notes).trim().slice(0, 2000),
      proposedBy: req.user._id
    };
    await application.save();
    await createNotification({
      userId: application.userId,
      type: "application",
      title: "Interview invitation",
      message: `An interview was proposed for ${application.jobId.title}`,
      link: "/seeker/dashboard"
    });
    res.json({ message: "Interview scheduled", application });
  } catch (error) {
    next(error);
  }
}

export async function respondToInterview(req, res, next) {
  try {
    const { status } = req.body;
    const allowedStatuses = ["accepted", "declined", "reschedule_requested"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Choose a valid interview response" });
    }

    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate("jobId", "title");
    if (!application) return res.status(404).json({ message: "Application not found" });
    if (application.interview?.status !== "proposed") {
      return res.status(400).json({ message: "This interview is no longer awaiting a response" });
    }

    application.interview.status = status;
    application.interview.respondedAt = new Date();
    await application.save();
    await createNotification({
      userId: application.employerId,
      type: "application",
      title: "Interview response",
      message: `${req.user.name} ${status.replace("_", " ")} the interview for ${application.jobId.title}`,
      link: `/employer/jobs/${application.jobId._id}/applicants`
    });
    res.json({ message: "Interview response saved", application });
  } catch (error) {
    next(error);
  }
}
