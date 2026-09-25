import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { applicationStatuses } from "../data/options";
import api from "../services/api";

export default function Applicants() {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schedulingId, setSchedulingId] = useState(null);
  const [interviewForm, setInterviewForm] = useState({ date: "", method: "Chat", location: "", notes: "" });

  useEffect(() => {
    async function loadApplicants() {
      setLoading(true);
      try {
        const [jobResponse, applicationsResponse] = await Promise.all([
          api.get(`/jobs/${jobId}`),
          api.get(`/applications/job/${jobId}`)
        ]);
        setJob(jobResponse.data.job);
        setApplicants(applicationsResponse.data.applications || []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load applicants");
      } finally {
        setLoading(false);
      }
    }

    loadApplicants();
  }, [jobId]);

  async function updateStatus(applicationId, status) {
    try {
      const { data } = await api.patch(`/applications/${applicationId}/status`, { status });
      setApplicants((current) =>
        current.map((item) =>
          item._id === applicationId ? { ...item, status: data.application.status } : item
        )
      );
      toast.success("Application updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update application");
    }
  }

  function startScheduling(application) {
    setSchedulingId(application._id);
    setInterviewForm({ date: "", method: "Chat", location: "", notes: "" });
  }

  async function scheduleInterview(event, applicationId) {
    event.preventDefault();
    try {
      const { data } = await api.patch(`/applications/${applicationId}/interview`, interviewForm);
      setApplicants((current) =>
        current.map((item) =>
          item._id === applicationId
            ? { ...item, status: data.application.status, interview: data.application.interview }
            : item
        )
      );
      setSchedulingId(null);
      toast.success("Interview scheduled");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to schedule interview");
    }
  }

  if (loading) {
    return (
      <section className="section-gap">
        <div className="page-shell">
          <LoadingSkeleton count={3} />
        </div>
      </section>
    );
  }

  return (
    <section className="section-gap bg-neutral-50 dark:bg-neutral-950">
      <div className="page-shell">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Link to="/employer/dashboard" className="text-sm font-semibold underline">
              Back to employer dashboard
            </Link>
            <h1 className="mt-3 text-4xl font-black tracking-tight">All applicants</h1>
            <p className="mt-2 text-neutral-600 dark:text-neutral-300">
              {job?.title} {job?.company ? `at ${job.company}` : ""}
            </p>
          </div>
          <span className="pill">{applicants.length} applicants</span>
        </div>

        {applicants.length ? (
          <div className="grid gap-4">
            {applicants.map((application) => (
              <article key={application._id} className="card p-5">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black">{application.userId?.name || "Unknown applicant"}</h2>
                      {application.userId?.isVerified && <span className="pill">Verified</span>}
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">{application.userId?.email}</p>
                    {application.userId?.phone && (
                      <p className="mt-1 text-sm text-neutral-500">{application.userId.phone}</p>
                    )}
                    <div className="mt-3">
                      <StatusBadge status={application.status} />
                    </div>
                    {application.interview?.status && (
                      <div className="mt-4 rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
                        <p className="font-bold">Interview: {application.interview.status.replace("_", " ")}</p>
                        <p className="mt-1 text-neutral-500">
                          {application.interview.date ? new Date(application.interview.date).toLocaleString() : "No date"} · {application.interview.method}
                        </p>
                        {application.interview.location && <p className="mt-1 text-neutral-500">{application.interview.location}</p>}
                        {application.interview.notes && <p className="mt-1 text-neutral-500">{application.interview.notes}</p>}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 sm:min-w-72">
                    <label className="label">Application status</label>
                    <select
                      className="input"
                      value={application.status}
                      onChange={(event) => updateStatus(application._id, event.target.value)}
                    >
                      {applicationStatuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                    <button type="button" className="btn-secondary" onClick={() => startScheduling(application)}>
                      {application.interview ? "Reschedule interview" : "Schedule interview"}
                    </button>
                    {schedulingId === application._id && (
                      <form onSubmit={(event) => scheduleInterview(event, application._id)} className="grid gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                        <label className="label">Date and time</label>
                        <input
                          className="input"
                          type="datetime-local"
                          required
                          value={interviewForm.date}
                          onChange={(event) => setInterviewForm((current) => ({ ...current, date: event.target.value }))}
                        />
                        <label className="label">Method</label>
                        <select
                          className="input"
                          value={interviewForm.method}
                          onChange={(event) => setInterviewForm((current) => ({ ...current, method: event.target.value }))}
                        >
                          {['Chat', 'Phone', 'Video', 'In-person'].map((method) => <option key={method}>{method}</option>)}
                        </select>
                        <input
                          className="input"
                          placeholder="Location or meeting link"
                          value={interviewForm.location}
                          onChange={(event) => setInterviewForm((current) => ({ ...current, location: event.target.value }))}
                        />
                        <textarea
                          className="input min-h-20"
                          placeholder="Notes for the applicant"
                          value={interviewForm.notes}
                          onChange={(event) => setInterviewForm((current) => ({ ...current, notes: event.target.value }))}
                        />
                        <div className="flex gap-2">
                          <button type="submit" className="btn-primary">Save interview</button>
                          <button type="button" className="btn-secondary" onClick={() => setSchedulingId(null)}>Cancel</button>
                        </div>
                      </form>
                    )}
                    <Link
                      to={`/chat/${jobId}?seekerId=${application.userId?._id}`}
                      className="btn-primary text-center"
                    >
                      Chat with applicant
                    </Link>
                    {application.userId?.resume?.url && (
                      <a
                        href={application.userId.resume.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary text-center"
                      >
                        View resume
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No applicants yet" text="Applicants for this job will appear here." />
        )}

        {user?.role === "admin" && (
          <button type="button" className="btn-secondary mt-6" onClick={() => navigate("/admin") }>
            Back to admin
          </button>
        )}
      </div>
    </section>
  );
}
