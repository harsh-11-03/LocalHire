export function formatSalary(job) {
  if (job?.salaryText) return job.salaryText;

  const min = Number(job?.salaryMin || 0);
  const max = Number(job?.salaryMax || 0);

  if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
  if (min) return `From ₹${min.toLocaleString()}`;
  if (max) return `Up to ₹${max.toLocaleString()}`;
  return "Salary not disclosed";
}

export function timeAgo(date) {
  if (!date) return "Recently";

  const now = new Date();
  const posted = new Date(date);
  const diff = Math.floor((now - posted) / (1000 * 60 * 60 * 24));

  if (diff <= 0) return "Today";
  if (diff === 1) return "1 day ago";
  if (diff < 30) return `${diff} days ago`;
  return posted.toLocaleDateString();
}

export function csvToArray(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getDashboardPath(role) {
  if (role === "employer") return "/employer/dashboard";
  if (role === "admin") return "/admin";
  return "/seeker/dashboard";
}
