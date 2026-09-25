import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { applicationStatuses, cities } from "../data/options";
import { formatSalary } from "../utils/format";

export default function EmployerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [applicantsError, setApplicantsError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadJobs() {
    setLoading(true);
    try {
      const { data } = await api.get("/jobs/employer/mine");
      setJobs(data.jobs);
      setSelectedJob((current) => current || data.jobs[0]?._id || null);
    } catch (error) {
      toast.error("Unable to load employer dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadApplicants(jobId) {
    if (!jobId) {
      setApplicants([]);
      return;
    }

    setApplicantsLoading(true);
    setApplicantsError("");
    try {
      const { data } = await api.get(`/applications/job/${jobId}`);
      setApplicants(data.applications || []);
    } catch (error) {
      setApplicants([]);
      setApplicantsError(error.response?.data?.message || "Unable to load applicants");
    } finally {
      setApplicantsLoading(false);
    }
  }

  useEffect(() => {
    loadApplicants(selectedJob);
  }, [selectedJob]);

  const stats = useMemo(() => {
    const activeJobs = jobs.filter((job) => !job.isFilled && job.status === "active").length;
    const totalApplicants = jobs.reduce((total, job) => total + (job.applicantCount || 0), 0);
    const filledJobs = jobs.filter((job) => job.isFilled).length;
    const pendingJobs = jobs.filter((job) => job.status === "pending").length;

    return { activeJobs, totalApplicants, filledJobs, pendingJobs };
  }, [jobs]);

  async function deleteJob(jobId) {
    if (!window.confirm("Delete this job permanently?")) return;

    try {
      await api.delete(`/jobs/${jobId}`);
      toast.success("Job deleted");
      loadJobs();
    } catch (error) {
      toast.error("Unable to delete job");
    }
  }

  async function markFilled(jobId) {
    try {
      const { data } = await api.patch(`/jobs/${jobId}/filled`);
      setJobs((current) => current.map((job) => (job._id === jobId ? data.job : job)));
      toast.success(data.message);
    } catch (error) {
      toast.error("Unable to update job");
    }
  }

  async function updateStatus(applicationId, status) {
    try {
      await api.patch(`/applications/${applicationId}/status`, { status });
      toast.success("Application updated");
      setApplicants((current) =>
        current.map((item) => (item._id === applicationId ? { ...item, status } : item))
      );
    } catch (error) {
      toast.error("Unable to update application");
    }
  }

  return (
    <section className="section-gap bg-neutral-50 dark:bg-neutral-950">
      <div className="page-shell">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="pill mb-3 bg-white dark:bg-neutral-900">Employer dashboard</span>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-black tracking-tight">Manage your local hiring</h1>
              {(user?.isVerified || user?.isVerifiedEmployer) && <span className="pill">Verified employer</span>}
            </div>
            <p className="mt-3 text-neutral-600 dark:text-neutral-300">
              Post jobs, track applicants, mark roles as filled, and keep listings clean.
            </p>
          </div>
          <Link to="/post-job" className="btn-primary">
            Post new job
          </Link>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <StatCard label="Total active jobs" value={stats.activeJobs} />
          <StatCard label="Total applicants" value={stats.totalApplicants} />
          <StatCard label="Filled jobs" value={stats.filledJobs} />
          <StatCard label="Pending moderation" value={stats.pendingJobs} />
        </div>

        {loading ? (
          <LoadingSkeleton count={3} />
        ) : jobs.length ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
            <div className="card overflow-hidden">
              <div className="border-b border-neutral-200 p-5 dark:border-neutral-800">
                <h2 className="text-xl font-black">Your jobs</h2>
              </div>
              <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {jobs.map((job) => (
                  <div key={job._id} className="p-5">
                    <div className="flex flex-col justify-between gap-4 md:flex-row">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black">{job.title}</h3>
                          <span className="pill">{job.isFilled ? "Filled" : job.status}</span>
                        </div>
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                          {job.company} • {job.city}
                          {job.area ? `, ${job.area}` : ""} • {formatSalary(job)}
                        </p>
                        <p className="mt-2 text-sm text-neutral-500">
                          Applicants: {job.applicantCount || 0}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-secondary px-4 py-2"
                          onClick={() => navigate(`/employer/jobs/${job._id}/applicants`)}
                        >
                          {selectedJob === job._id && applicantsLoading ? "Loading applicants..." : "View applicants"}
                        </button>
                        <Link to={`/post-job/${job._id}/edit`} className="btn-secondary px-4 py-2">
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="btn-secondary px-4 py-2"
                          onClick={() => markFilled(job._id)}
                        >
                          {job.isFilled ? "Mark active" : "Mark filled"}
                        </button>
                        <button type="button" className="btn-danger" onClick={() => deleteJob(job._id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="card h-fit p-5">
              <h2 className="text-xl font-black">Recent applications</h2>
              <select
                className="input mt-4"
                value={selectedJob || ""}
                onChange={(event) => setSelectedJob(event.target.value)}
              >
                {jobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title}
                  </option>
                ))}
              </select>

              <div className="mt-4 grid gap-3">
                {applicantsLoading ? (
                  <p className="rounded-lg border border-dashed border-neutral-300 p-5 text-sm text-neutral-500 dark:border-neutral-700">
                    Loading applicants...
                  </p>
                ) : applicantsError ? (
                  <p className="rounded-lg border border-dashed border-red-300 p-5 text-sm text-red-600 dark:border-red-800">
                    {applicantsError}
                  </p>
                ) : applicants.length ? (
                  applicants.map((application) => (
                    <div key={application._id} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold">{application.userId?.name}</p>
                            {application.userId?.isVerified && <span className="pill">Verified</span>}
                          </div>
                          <p className="mt-1 text-sm text-neutral-500">{application.userId?.email}</p>
                          <Link
                            to={`/chat/${selectedJob}?seekerId=${application.userId?._id}`}
                            className="btn-secondary mt-3 inline-flex px-3 py-2 text-xs"
                          >
                            Chat with applicant
                          </Link>
                          <div className="mt-2">
                            <StatusBadge status={application.status} />
                          </div>
                        </div>
                      </div>
                      <select
                        className="input mt-3"
                        value={application.status}
                        onChange={(event) => updateStatus(application._id, event.target.value)}
                      >
                        {applicationStatuses.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-neutral-300 p-5 text-sm text-neutral-500 dark:border-neutral-700">
                    No applicants yet for this job.
                  </p>
                )}
              </div>
            </aside>
          </div>
        ) : (
          <EmptyState
            title="No jobs posted yet"
            text="Post your first job and start receiving local applications."
            action={
              <Link to="/post-job" className="btn-primary">
                Post job
              </Link>
            }
          />
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <h3 className="font-black">Top city</h3>
            <p className="mt-2 text-sm text-neutral-500">
              {cities.find((city) => jobs.some((job) => job.city === city)) || "No data yet"}
            </p>
          </div>
          <div className="card p-5">
            <h3 className="font-black">Best performing listing</h3>
            <p className="mt-2 text-sm text-neutral-500">
              {[...jobs].sort((a, b) => (b.applicantCount || 0) - (a.applicantCount || 0))[0]?.title ||
                "No applicants yet"}
            </p>
          </div>
          <div className="card p-5">
            <h3 className="font-black">Moderation note</h3>
            <p className="mt-2 text-sm text-neutral-500">
              Pending jobs become public once admin approves them.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
