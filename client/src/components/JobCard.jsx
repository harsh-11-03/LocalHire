import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatSalary, timeAgo } from "../utils/format";

export default function JobCard({ job, onSave, compact = false, saveLabel = "Save" }) {
  const { user } = useAuth();
  const logo = job.companyLogo?.url || job.companyLogo || "";
  const whatsappNumber = job.whatsappNumber || job.phoneNumber;
  const canContact = user?.role === "jobseeker" || user?.role === "admin";
  const primaryLabel = user?.role === "jobseeker" ? "Apply" : "View details";

  return (
    <article className="card p-5 hover:-translate-y-1 hover:shadow-soft">
      <div className="flex gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 text-lg font-black dark:border-neutral-800 dark:bg-neutral-800">
          {logo ? (
            <img src={logo} alt={job.company} className="h-full w-full object-cover" />
          ) : (
            job.company?.charAt(0) || "L"
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <Link
                to={`/jobs/${job._id}`}
                className="text-lg font-black tracking-tight hover:underline"
              >
                {job.title}
              </Link>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{job.company}</p>
              {job.isVerified && <span className="pill mt-2 inline-flex">Verified job</span>}
              {(job.employerId?.isVerified || job.employerId?.isVerifiedEmployer) && (
                <span className="pill mt-2 ml-2 inline-flex">Verified employer</span>
              )}
            </div>
            <span className="pill">{job.jobType}</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-sm text-neutral-700 dark:text-neutral-200">
            <span className="pill">{formatSalary(job)}</span>
            <span className="pill">
              {job.city}
              {job.area ? `, ${job.area}` : ""}
            </span>
            <span className="pill">{timeAgo(job.createdAt)}</span>
          </div>

          {!compact && (
            <p className="mt-4 line-clamp-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
              {job.description}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <Link to={`/jobs/${job._id}`} className="btn-primary px-4 py-2">
              {primaryLabel}
            </Link>
            {user?.role === "jobseeker" && (
              <Link to={`/chat/${job._id}`} className="btn-secondary px-4 py-2">
                Chat with employer
              </Link>
            )}
            {canContact && whatsappNumber && (
              <a
                href={`https://wa.me/91${whatsappNumber}`}
                className="btn-secondary px-4 py-2"
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            )}
            {onSave && (
              <button type="button" className="btn-secondary px-4 py-2" onClick={() => onSave(job)}>
                {saveLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
