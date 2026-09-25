import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import LoadingSkeleton from "../components/LoadingSkeleton";
import StatCard from "../components/StatCard";
import api from "../services/api";
import { cities } from "../data/options";
import { formatSalary } from "../utils/format";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [reports, setReports] = useState([]);
  const [tab, setTab] = useState("users");
  const [jobCity, setJobCity] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAdminData(city = jobCity) {
    setLoading(true);
    try {
      const [statsResponse, usersResponse, jobsResponse, reportsResponse] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/jobs", { params: city ? { city } : {} }),
        api.get("/admin/reports")
      ]);

      setStats(statsResponse.data.stats);
      setUsers(usersResponse.data.users);
      setJobs(jobsResponse.data.jobs);
      setReports(reportsResponse.data.reports);
    } catch (error) {
      toast.error("Unable to load admin dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function blockUser(userId) {
    try {
      const { data } = await api.patch(`/admin/users/${userId}/block`);
      setUsers((current) => current.map((item) => (item._id === userId ? data.user : item)));
      toast.success(data.user.isBlocked ? "User blocked" : "User unblocked");
    } catch (error) {
      toast.error("Unable to update user");
    }
  }

  async function toggleVerifyUser(userId) {
    try {
      const { data } = await api.patch(`/admin/users/${userId}/verify`);
      setUsers((current) => current.map((item) => (item._id === userId ? data.user : item)));
      toast.success(data.message);
    } catch (error) {
      toast.error("Unable to verify employer");
    }
  }

  async function toggleVerifyJob(jobId) {
    try {
      const { data } = await api.patch(`/admin/jobs/${jobId}/verify`);
      setJobs((current) => current.map((job) => (job._id === jobId ? data.job : job)));
      toast.success(data.message);
    } catch (error) {
      toast.error("Unable to update job verification");
    }
  }

  async function moderateJob(jobId, status) {
    try {
      const { data } = await api.patch(`/admin/jobs/${jobId}/moderate`, { status });
      setJobs((current) => current.map((item) => (item._id === jobId ? data.job : item)));
      toast.success(data.message);
    } catch (error) {
      toast.error("Unable to update job moderation");
    }
  }

  async function deleteJob(jobId) {
    if (!window.confirm("Delete this fake or invalid job?")) return;

    try {
      await api.delete(`/admin/jobs/${jobId}`);
      setJobs((current) => current.filter((job) => job._id !== jobId));
      toast.success("Job deleted");
    } catch (error) {
      toast.error("Unable to delete job");
    }
  }

  async function toggleJobFilled(jobId) {
    try {
      const { data } = await api.patch(`/jobs/${jobId}/filled`);
      setJobs((current) => current.map((job) => (job._id === jobId ? data.job : job)));
      toast.success(data.message);
    } catch (error) {
      toast.error("Unable to update job");
    }
  }

  async function resolveReport(reportId) {
    try {
      const { data } = await api.patch(`/admin/reports/${reportId}/resolve`);
      setReports((current) =>
        current.map((report) => (report._id === reportId ? data.report : report))
      );
      toast.success(data.message);
    } catch (error) {
      toast.error("Unable to resolve report");
    }
  }

  return (
    <section className="section-gap bg-neutral-50 dark:bg-neutral-950">
      <div className="page-shell">
        <div className="mb-8">
          <span className="pill mb-3 bg-white dark:bg-neutral-900">Admin moderation</span>
          <h1 className="text-4xl font-black tracking-tight">Keep LocalHire trusted</h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-300">
            Review users, jobs, employer verification, and reported listings from one panel.
          </p>
        </div>

        {loading ? (
          <LoadingSkeleton count={4} />
        ) : (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-5">
              <StatCard label="Total users" value={stats?.totalUsers || 0} />
              <StatCard label="Total jobs" value={stats?.totalJobs || 0} />
              <StatCard label="Active jobs" value={stats?.activeJobs || 0} />
              <StatCard label="Pending jobs" value={stats?.pendingJobs || 0} />
              <StatCard label="Reported users" value={stats?.reportedUsers || 0} />
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {["users", "jobs", "reports"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={tab === item ? "btn-primary px-4 py-2" : "btn-secondary px-4 py-2"}
                  onClick={() => setTab(item)}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </button>
              ))}
            </div>

            {tab === "users" && (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                      <tr>
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {users.map((item) => (
                        <tr key={item._id}>
                          <td className="p-4 font-bold">{item.name}</td>
                          <td className="p-4">{item.email}</td>
                          <td className="p-4">{item.role}</td>
                          <td className="p-4">
                            <span className="pill">
                              {item.isBlocked ? "Blocked" : item.isVerified || item.isVerifiedEmployer ? "Verified" : "Active"}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="btn-secondary px-3 py-2"
                                onClick={() => blockUser(item._id)}
                              >
                                {item.isBlocked ? "Unblock" : "Block"}
                              </button>
                              <button
                                type="button"
                                className="btn-secondary px-3 py-2"
                                onClick={() => toggleVerifyUser(item._id)}
                              >
                                {item.isVerified || item.isVerifiedEmployer ? "Unverify" : "Verify"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "jobs" && (
              <div className="grid gap-4">
                <div className="card flex flex-wrap gap-4 p-5">
                  <select
                    className="input"
                    value={jobCity}
                    onChange={(event) => setJobCity(event.target.value)}
                  >
                    <option value="">All cities</option>
                    {cities.map((city) => <option key={city}>{city}</option>)}
                  </select>
                  <button type="button" className="btn-primary" onClick={() => loadAdminData(jobCity)}>
                    Filter jobs
                  </button>
                </div>
                {jobs.map((job) => (
                  <div key={job._id} className="card p-5">
                    <div className="flex flex-col justify-between gap-4 md:flex-row">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black">{job.title}</h3>
                          <span className="pill">{job.isFilled ? "Filled" : job.status}</span>
                          {job.isVerified && <span className="pill">Verified</span>}
                        </div>
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                          {job.company} • {job.city} • {formatSalary(job)}
                        </p>
                        <p className="mt-2 text-sm text-neutral-500">
                          Employer: {job.employerId?.name || "Unknown"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-secondary h-fit"
                          onClick={() => toggleVerifyJob(job._id)}
                        >
                          {job.isVerified ? "Unverify job" : "Verify job"}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary h-fit"
                          onClick={() => toggleJobFilled(job._id)}
                        >
                          {job.isFilled ? "Mark active" : "Mark filled"}
                        </button>
                        <button type="button" className="btn-danger h-fit" onClick={() => deleteJob(job._id)}>
                          Delete fake job
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "reports" && (
              <div className="grid gap-4">
                {reports.length ? (
                  reports.map((report) => (
                    <div key={report._id} className="card p-5">
                      <div className="flex flex-col justify-between gap-4 md:flex-row">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black">{report.jobId?.title || "Removed job"}</h3>
                            <span className="pill">{report.status}</span>
                          </div>
                          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                            Reported by {report.userId?.name || "Unknown user"}
                          </p>
                          <p className="mt-2 text-sm text-neutral-500">{report.reason}</p>
                        </div>
                        <button
                          type="button"
                          className="btn-secondary h-fit"
                          onClick={() => resolveReport(report._id)}
                        >
                          {report.status === "resolved" ? "Reopen" : "Resolve"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="card p-8 text-center text-neutral-500">No reports right now.</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
