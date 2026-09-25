import PushSubscription from "../models/PushSubscription.js";

export async function subscribeToPush(req, res, next) {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: "A valid push subscription is required" });
    }

    const subscription = await PushSubscription.findOneAndUpdate(
      { endpoint },
      { userId: req.user._id, endpoint, keys },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ subscription });
  } catch (error) {
    next(error);
  }
}

export async function unsubscribeFromPush(req, res, next) {
  try {
    await PushSubscription.deleteOne({ userId: req.user._id, endpoint: req.body.endpoint });
    res.json({ message: "Push notifications disabled" });
  } catch (error) {
    next(error);
  }
}
