import JobAlert from "../models/JobAlert.js";
import SavedSearch from "../models/SavedSearch.js";

function pointFromBody(body) {
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return undefined;
  return { type: "Point", coordinates: [longitude, latitude] };
}

export async function getSavedSearches(req, res, next) {
  try {
    const searches = await SavedSearch.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ searches });
  } catch (error) {
    next(error);
  }
}

export async function createSavedSearch(req, res, next) {
  try {
    const radiusKm = req.body.radiusKm ? Number(req.body.radiusKm) : undefined;
    if (radiusKm && (!Number.isFinite(radiusKm) || radiusKm < 1 || radiusKm > 100)) {
      return res.status(400).json({ message: "Choose a radius between 1 and 100 km" });
    }

    const search = await SavedSearch.create({
      userId: req.user._id,
      name: req.body.name || "Job alert",
      keyword: req.body.keyword || undefined,
      city: req.body.city || undefined,
      category: req.body.category || undefined,
      jobType: req.body.jobType || undefined,
      experience: req.body.experience || undefined,
      minSalary: req.body.minSalary ? Number(req.body.minSalary) : undefined,
      maxSalary: req.body.maxSalary ? Number(req.body.maxSalary) : undefined,
      radiusKm,
      location: pointFromBody(req.body)
    });

    res.status(201).json({ message: "Job alert saved", search });
  } catch (error) {
    next(error);
  }
}

export async function deleteSavedSearch(req, res, next) {
  try {
    const search = await SavedSearch.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!search) return res.status(404).json({ message: "Job alert not found" });
    await JobAlert.deleteMany({ savedSearchId: search._id });
    res.json({ message: "Job alert removed" });
  } catch (error) {
    next(error);
  }
}

export async function getMyAlerts(req, res, next) {
  try {
    const alerts = await JobAlert.find({ userId: req.user._id })
      .populate("jobId")
      .populate("savedSearchId", "name")
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ alerts: alerts.filter((alert) => alert.jobId) });
  } catch (error) {
    next(error);
  }
}

export async function markAlertRead(req, res, next) {
  try {
    const alert = await JobAlert.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!alert) return res.status(404).json({ message: "Alert not found" });
    res.json({ alert });
  } catch (error) {
    next(error);
  }
}
