import User from "../models/User.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

function parseArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    return JSON.parse(value);
  } catch (error) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

export async function getProfile(req, res) {
  res.json({ user: req.user });
}

export async function updateProfile(req, res, next) {
  try {
    const allowedFields = [
      "name",
      "phone",
      "whatsapp",
      "preferredCity",
      "experienceLevel",
      "companyName"
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        req.user[field] = req.body[field];
      }
    });

    if (req.body.skills !== undefined) {
      req.user.skills = parseArray(req.body.skills);
    }

    if (req.files?.profileImage?.[0]) {
      req.user.profileImage = await uploadToCloudinary(
        req.files.profileImage[0].buffer,
        "localhire/profile-images",
        "image"
      );
    }

    if (req.files?.resume?.[0]) {
      req.user.resume = await uploadToCloudinary(
        req.files.resume[0].buffer,
        "localhire/resumes",
        "auto"
      );
    }

    const updatedUser = await req.user.save();
    res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
}
