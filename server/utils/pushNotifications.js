import webpush from "web-push";
import PushSubscription from "../models/PushSubscription.js";

const pushConfigured = Boolean(
  process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT
);

if (pushConfigured) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function sendPushToUser(userId, payload) {
  if (!pushConfigured) return;

  const subscriptions = await PushSubscription.find({ userId });
  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: subscription.keys },
          JSON.stringify(payload)
        );
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await subscription.deleteOne();
        }
      }
    })
  );
}
