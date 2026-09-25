import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { formatSalary, timeAgo } from "../utils/format";

export default function JobDetails() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentJobs, setRecentJobs] = useState([]);

  useEffect(() => {
    async function loadJob() {
      setLoading(true);
      try {
        const { data } = await api.get(`/jobs/${id}`);
        setJob(data.job);
      } catch (error) {
        setJob(null);
      } finally {
        setLoading(false);
      }
    }

    loadJob();
  }, [id]);

  useEffect(() => {
    async function loadApplication() {
      if (!user || user.role !== "jobseeker" || !job) return;

      try {
        const { data } = await api.get("/applications/me");
        setApplication(data.applications.find((item) => item.jobId?._id === job._id) || null);
      } catch (error) {
        setApplication(null);
      }
    }

    loadApplication();
  }, [job, user]);

  useEffect(() => {
    if (!job) return;

    const stored = JSON.parse(localStorage.getItem("localhire_recent_jobs") || "[]").filter(
      (item) => !String(item._id || "").startsWith("demo-")
    );
    const next = [job, ...stored.filter((item) => item._id !== job._id)].slice(0, 4);
    localStorage.setItem("localhire_recent_jobs", JSON.stringify(next));
    setRecentJobs(next.filter((item) => item._id !== job._id));
  }, [job]);

  async function applyForJob() {
    try {
      const { data } = await api.post(`/applications/${job._id}`);
      setApplication(data.application);
      toast.success("Application sent");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login as a job seeker to apply");
    }
  }

  async function withdrawApplication() {
    if (!window.confirm("Are you sure you want to withdraw this application?")) return;

    try {
      await api.delete(`/applications/${application._id}`);
      setApplication(null);
      toast.success("Application withdrawn");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to withdraw application");
    }
  }

  async function saveJob() {
    try {
      await api.post(`/saved-jobs/${job._id}`);
      toast.success("Job saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login as a job seeker to save");
    }
  }

  async function reportJob() {
    const reason = window.prompt("Why are you reporting this job?");
    if (!reason) return;

    try {
      await api.post(`/reports/${job._id}`, { reason });
      toast.success("Report submitted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to report this job");
    }
  }

  async function shareJob() {
    const shareData = {
      title: job.title,
      text: `${job.title} at ${job.company}`,
      url: window.location.href
    };

    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
    toast.success("Job link copied");
  }

  if (loading) {
    return (
      <section className="section-gap">
        <div className="page-shell">
          <LoadingSkeleton count={2} />
        </div>
      </section>
    );
  }

  if (!job) {
    return (
      <section className="section-gap">
        <div className="page-shell">
          <EmptyState title="Job not found" text="This real job may have been removed or filled." />
        </div>
      </section>
    );
  }

  const whatsappNumber = job.whatsappNumber || job.phoneNumber;
  const isJobSeeker = user?.role === "jobseeker";

  return (
    <section className="section-gap bg-neutral-50 dark:bg-neutral-950">
      <div className="page-shell grid gap-6 lg:grid-cols-[1fr_360px]">
        <article className="card p-6">
          <div className="flex flex-col gap-5 border-b border-neutral-200 pb-6 dark:border-neutral-800 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="pill mb-4">{job.category}</span>
              <h1 className="text-4xl font-black tracking-tight">{job.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <p className="text-lg text-neutral-600 dark:text-neutral-300">{job.company}</p>
                {job.isVerified && <span className="pill">Verified job</span>}
                {(job.employerId?.isVerified || job.employerId?.isVerifiedEmployer) && (
                  <span className="pill">Verified employer</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {isJobSeeker && (
                <button type="button" className="btn-secondary px-4 py-2" onClick={saveJob}>
                  Save
                </button>
              )}
              <button type="button" className="btn-secondary px-4 py-2" onClick={shareJob}>
                Share
              </button>
              {user && (
                <button type="button" className="btn-secondary px-4 py-2" onClick={reportJob}>
                  Report
                </button>
              )}
            </div>
          </div>

          <div className="my-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <p className="text-xs text-neutral-500">Salary</p>
              <p className="mt-1 font-black">{formatSalary(job)}</p>
            </div>
            <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <p className="text-xs text-neutral-500">Location</p>
              <p className="mt-1 font-black">
                {job.city}
                {job.area ? `, ${job.area}` : ""}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <p className="text-xs text-neutral-500">Experience</p>
              <p className="mt-1 font-black">{job.experienceRequired}</p>
            </div>
            <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <p className="text-xs text-neutral-500">Posted</p>
              <p className="mt-1 font-black">{timeAgo(job.createdAt)}</p>
            </div>
          </div>

          <div className="grid gap-8">
            <section>
              <h2 className="text-xl font-black">Full description</h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-neutral-700 dark:text-neutral-200">
                {job.description}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black">Skills required</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(job.skills || []).map((skill) => (
                  <span key={skill} className="pill">
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-black">Benefits and perks</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(job.perks || []).map((perk) => (
                  <span key={perk} className="pill">
                    {perk}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </article>

        <aside className="grid h-fit gap-4">
          <div className="card p-5">
            {!user ? (
              <>
                <h2 className="text-xl font-black">Login to continue</h2>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                  Create an account or login to apply and contact this employer.
                </p>
                <div className="mt-5 grid gap-2">
                  <Link to="/login" state={{ from: location }} className="btn-primary">
                    Login
                  </Link>
                  <Link to="/register" className="btn-secondary">
                    Register
                  </Link>
                </div>
              </>
            ) : isJobSeeker ? (
              <>
                <h2 className="text-xl font-black">Contact employer</h2>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                  Apply first, then contact the employer directly for faster local hiring.
                </p>
                <div className="mt-5 grid gap-2">
                  {application ? (
                    <button type="button" className="btn-secondary" onClick={withdrawApplication}>
                      Withdraw application
                    </button>
                  ) : (
                    <button type="button" className="btn-primary" onClick={applyForJob}>
                      Apply now
                    </button>
                  )}
                  {application && (
                    <Link to={`/chat/${job._id}`} className="btn-secondary">
                      Chat with employer
                    </Link>
                  )}
                  {whatsappNumber && (
                    <a
                      href={`https://wa.me/91${whatsappNumber}?text=Hi, I saw your ${encodeURIComponent(
                        job.title
                      )} job on LocalHire.`}
                      className="btn-secondary"
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp employer
                    </a>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-black">Job seeker access</h2>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                  Only job seeker accounts can apply and contact employers from this page.
                </p>
              </>
            )}
            {user?.role === "employer" && (
              <p className="mt-4 text-xs text-neutral-500">
                Employers can manage applicants from the employer dashboard.
              </p>
            )}
          </div>

          {recentJobs.length > 0 && (
            <div className="card p-5">
              <h2 className="text-xl font-black">Recently viewed</h2>
              <div className="mt-4 grid gap-3">
                {recentJobs.map((item) => (
                  <Link
                    key={item._id}
                    to={`/jobs/${item._id}`}
                    className="rounded-lg border border-neutral-200 p-3 hover:border-neutral-950 dark:border-neutral-800 dark:hover:border-white"
                  >
                    <p className="font-bold">{item.title}</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {item.company} - {item.city}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
