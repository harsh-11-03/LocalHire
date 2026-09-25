import JobAlert from "../models/JobAlert.js";
import SavedSearch from "../models/SavedSearch.js";

function distanceKm(first, second) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const [firstLongitude, firstLatitude] = first;
  const [secondLongitude, secondLatitude] = second;
  const latitudeDelta = toRadians(secondLatitude - firstLatitude);
  const longitudeDelta = toRadians(secondLongitude - firstLongitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(firstLatitude)) * Math.cos(toRadians(secondLatitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function matchesSearch(job, search) {
  const keyword = search.keyword?.toLowerCase();
  const text = `${job.title} ${job.company} ${job.description} ${(job.skills || []).join(" ")}`.toLowerCase();

  if (keyword && !text.includes(keyword)) return false;
  if (search.city && search.city !== job.city) return false;
  if (search.category && search.category !== job.category) return false;
  if (search.jobType && search.jobType !== job.jobType) return false;
  if (search.experience && search.experience !== job.experienceRequired) return false;
  if (search.minSalary && job.salaryMin < search.minSalary) return false;
  if (search.maxSalary && job.salaryMin > search.maxSalary) return false;

  if (search.radiusKm) {
    if (!search.location?.coordinates?.length || !job.location?.coordinates?.length) return false;
    if (distanceKm(search.location.coordinates, job.location.coordinates) > search.radiusKm) return false;
  }

  return true;
}

export async function createAlertsForJob(job) {
  if (job.status !== "active" || job.isFilled) return;

  const searches = await SavedSearch.find({ isActive: true });
  const matches = searches.filter((search) => matchesSearch(job, search));

  if (matches.length) {
    await JobAlert.bulkWrite(
      matches.map((search) => ({
        updateOne: {
          filter: { userId: search.userId, jobId: job._id, savedSearchId: search._id },
          update: { $setOnInsert: { userId: search.userId, jobId: job._id, savedSearchId: search._id } },
          upsert: true
        }
      }))
    );
  }
}
