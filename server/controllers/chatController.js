import Application from "../models/Application.js";
import ChatMessage from "../models/ChatMessage.js";
import Job from "../models/Job.js";
import { createNotification } from "../utils/notifications.js";

async function getChatContext(req) {
  const job = await Job.findById(req.params.jobId).select("title company employerId");
  if (!job) return { error: { status: 404, message: "Job not found" } };

  if (req.user.role === "employer") {
    const seekerId = req.query.seekerId || req.body?.seekerId;
    if (!seekerId || job.employerId.toString() !== req.user._id.toString()) {
      return { error: { status: 403, message: "You can only chat with applicants for your own jobs" } };
    }

    const application = await Application.findOne({ jobId: job._id, userId: seekerId });
    if (!application) return { error: { status: 403, message: "This user has not applied for the job" } };
    return { job, seekerId, employerId: req.user._id.toString() };
  }

  if (req.user.role === "jobseeker") {
    const application = await Application.findOne({ jobId: job._id, userId: req.user._id });
    if (!application) return { error: { status: 403, message: "Apply for this job before starting a chat" } };
    return { job, seekerId: req.user._id.toString(), employerId: job.employerId.toString() };
  }

  return { error: { status: 403, message: "Chat is only available to job seekers and employers" } };
}

export async function getChatMessages(req, res, next) {
  try {
    const context = await getChatContext(req);
    if (context.error) return res.status(context.error.status).json({ message: context.error.message });

    const messages = await ChatMessage.find({
      jobId: context.job._id,
      $or: [
        { senderId: context.seekerId, receiverId: context.employerId },
        { senderId: context.employerId, receiverId: context.seekerId }
      ]
    })
      .populate("senderId", "name role isVerified isVerifiedEmployer")
      .sort({ createdAt: 1 });

    res.json({ job: context.job, messages });
  } catch (error) {
    next(error);
  }
}

export async function sendChatMessage(req, res, next) {
  try {
    const context = await getChatContext(req);
    if (context.error) return res.status(context.error.status).json({ message: context.error.message });

    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
    if (!message) return res.status(400).json({ message: "Message is required" });
    if (message.length > 2000) return res.status(400).json({ message: "Message must be 2000 characters or fewer" });

    const receiverId = req.user.role === "employer" ? context.seekerId : context.employerId;
    const chatMessage = await ChatMessage.create({
      jobId: context.job._id,
      senderId: req.user._id,
      receiverId,
      message
    });

    await chatMessage.populate("senderId", "name role isVerified isVerifiedEmployer");
    const chatLink = req.user.role === "jobseeker"
      ? `/chat/${context.job._id}?seekerId=${req.user._id}`
      : `/chat/${context.job._id}`;
    await createNotification({
      userId: receiverId,
      type: "chat",
      title: "New chat message",
      message: `${req.user.name} sent you a message about ${context.job.title}`,
      link: chatLink
    });
    res.status(201).json({ message: chatMessage });
  } catch (error) {
    next(error);
  }
}
