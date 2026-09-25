import Notification from "../models/Notification.js";
import { sendPushToUser } from "./pushNotifications.js";

export async function createNotification({ userId, type, title, message, link }) {
  const notification = await Notification.create({ userId, type, title, message, link });
  await sendPushToUser(userId, { title, message, link });
  return notification;
}
