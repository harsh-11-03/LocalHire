import Application from "../models/Application.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import { createAlertsForJob } from "../utils/jobAlerts.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

function parseArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
}

function pointFromBody(body) {
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return undefined;
  return { type: "Point", coordinates: [longitude, latitude] };
}

function canManageJob(user, job) {
  return user.role === "admin" || job.employerId.toString() === user._id.toString();
}

export async function getJobs(req, res, next) {
  try {
    const { keyword, city, category, jobType, minSalary, maxSalary, experience, latitude, longitude, radiusKm, page = 1, limit = 6 } = req.query;
    const blockedEmployerIds = await User.find({ isBlocked: true }).distinct("_id");
    const filter = { status: "active", isFilled: false, employerId: { $nin: blockedEmployerIds } };
    if (keyword) filter.$text = { $search: keyword };
    if (city) filter.city = city;
    if (category) filter.category = category;
    if (jobType) filter.jobType = jobType;
    if (experience) filter.experienceRequired = experience;
    if (minSalary || maxSalary) {
      filter.salaryMin = {};
      if (minSalary) filter.salaryMin.$gte = Number(minSalary);
      if (maxSalary) filter.salaryMin.$lte = Number(maxSalary);
    }

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    const parsedRadiusKm = Number(radiusKm);
    const hasLocation = Number.isFinite(parsedLatitude) && Number.isFinite(parsedLongitude) && Number.isFinite(parsedRadiusKm);
    if (hasLocation) {
      filter.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [parsedLongitude, parsedLatitude] },
          $maxDistance: Math.min(Math.max(parsedRadiusKm, 1), 100) * 1000
        }
      };
    }

    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.min(Math.max(Number(limit), 1), 24);
    const skip = (pageNumber - 1) * pageSize;
    const jobsQuery = Job.find(filter).populate("employerId", "name isVerified isVerifiedEmployer").skip(skip).limit(pageSize);
    if (!hasLocation) jobsQuery.sort({ createdAt: -1 });

    const countFilter = { ...filter };
    if (hasLocation) {
      countFilter.location = {
        $geoWithin: {
          $centerSphere: [[parsedLongitude, parsedLatitude], Math.min(Math.max(parsedRadiusKm, 1), 100) / 6371]
        }
      };
    }
    const [jobs, total] = await Promise.all([jobsQuery, Job.countDocuments(countFilter)]);
    res.json({ jobs, page: pageNumber, totalPages: Math.ceil(total / pageSize) || 1, total });
  } catch (error) {
    next(error);
  }
}

export async function getFeaturedJobs(req, res, next) {
  try {
    const blockedEmployerIds = await User.find({ isBlocked: true }).distinct("_id");
    const jobs = await Job.find({
      status: "active",
      isFilled: false,
      employerId: { $nin: blockedEmployerIds }
    }).sort({ createdAt: -1 }).limit(6);
    res.json({ jobs });
  } catch (error) {
    next(error);
  }
}

export async function getJobById(req, res, next) {
  try {
    const blockedEmployerIds = await User.find({ isBlocked: true }).distinct("_id");
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, employerId: { $nin: blockedEmployerIds } },
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate("employerId", "name email isVerified isVerifiedEmployer");
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json({ job });
  } catch (error) {
    next(error);
  }
}

export async function createJob(req, res, next) {
  try {
    const requiredFields = ["title", "company", "salaryMin", "city", "category", "jobType", "experienceRequired", "description", "phoneNumber"];
    const missing = requiredFields.find((field) => !req.body[field]);
    if (missing) return res.status(400).json({ message: "Please fill all required fields" });

    const jobData = {
      ...req.body,
      salaryMin: Number(req.body.salaryMin),
      salaryMax: req.body.salaryMax ? Number(req.body.salaryMax) : undefined,
      skills: parseArray(req.body.skills),
      perks: parseArray(req.body.perks),
      employerId: req.user._id,
      location: pointFromBody(req.body),
      status: req.user.role === "admin" || req.user.isVerified || req.user.isVerifiedEmployer ? "active" : "pending"
    };
    if (req.file) jobData.companyLogo = await uploadToCloudinary(req.file.buffer, "localhire/company-logos", "image");

    const job = await Job.create(jobData);
    await createAlertsForJob(job);
    res.status(201).json({ message: job.status === "pending" ? "Job submitted for review" : "Job created", job });
  } catch (error) {
    next(error);
  }
}

export async function updateJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (!canManageJob(req.user, job)) return res.status(403).json({ message: "You can only edit your own jobs" });

    const editableFields = ["title", "company", "salaryMin", "salaryMax", "city", "area", "category", "jobType", "experienceRequired", "description", "phoneNumber", "whatsappNumber"];
    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        job[field] = ["salaryMin", "salaryMax"].includes(field) && req.body[field] !== "" ? Number(req.body[field]) : req.body[field];
      }
    });
    if (req.body.skills !== undefined) job.skills = parseArray(req.body.skills);
    if (req.body.perks !== undefined) job.perks = parseArray(req.body.perks);
    const location = pointFromBody(req.body);
    if (location) job.location = location;
    if (req.file) job.companyLogo = await uploadToCloudinary(req.file.buffer, "localhire/company-logos", "image");
    if (req.user.role !== "admin" && !req.user.isVerified && !req.user.isVerifiedEmployer) job.status = "pending";

    const updatedJob = await job.save();
    await createAlertsForJob(updatedJob);
    res.json({ message: updatedJob.status === "pending" ? "Job updated and submitted for review" : "Job updated", job: updatedJob });
  } catch (error) {
    next(error);
  }
}

export async function deleteJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (!canManageJob(req.user, job)) return res.status(403).json({ message: "You can only delete your own jobs" });
    await Application.deleteMany({ jobId: job._id });
    await job.deleteOne();
    res.json({ message: "Job deleted" });
  } catch (error) {
    next(error);
  }
}

export async function markJobFilled(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (!canManageJob(req.user, job)) return res.status(403).json({ message: "You can only update your own jobs" });
    job.isFilled = !job.isFilled;
    await job.save();
    res.json({ message: job.isFilled ? "Job marked as filled" : "Job marked as active", job });
  } catch (error) {
    next(error);
  }
}

export async function getEmployerJobs(req, res, next) {
  try {
    const jobs = await Job.find({ employerId: req.user._id }).sort({ createdAt: -1 });
    const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
      const applicantCount = await Application.countDocuments({ jobId: job._id });
      return { ...job.toObject(), applicantCount };
    }));
    res.json({ jobs: jobsWithCounts });
  } catch (error) {
    next(error);
  }
}
