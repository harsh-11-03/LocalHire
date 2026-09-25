import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams, useSearchParams } from "react-router-dom";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Chat() {
  const { jobId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const seekerId = searchParams.get("seekerId");

  async function loadChat(showLoading = false) {
    if (showLoading) setLoading(true);
    try {
      const params = user?.role === "employer" && seekerId ? { seekerId } : undefined;
      const { data } = await api.get(`/chats/job/${jobId}`, { params });
      setJob(data.job);
      setMessages(data.messages || []);
    } catch (error) {
      if (showLoading) toast.error(error.response?.data?.message || "Unable to open chat");
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    loadChat(true);
    const interval = window.setInterval(() => loadChat(), 5000);
    return () => window.clearInterval(interval);
  }, [jobId, seekerId, user?.role]);

  async function sendMessage(event) {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || sending) return;

    setSending(true);
    try {
      const { data } = await api.post(`/chats/job/${jobId}/messages`, {
        message: trimmedMessage,
        ...(user?.role === "employer" ? { seekerId } : {})
      });
      setMessages((current) => [...current, data.message]);
      setMessage("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to send message");
    } finally {
      setSending(false);
    }
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

  return (
    <section className="section-gap bg-neutral-50 dark:bg-neutral-950">
      <div className="page-shell mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to={user?.role === "employer" ? "/employer/dashboard" : "/seeker/dashboard"} className="text-sm font-semibold underline">
              Back to dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-black">{job?.title || "Job chat"}</h1>
            <p className="mt-1 text-neutral-600 dark:text-neutral-300">{job?.company}</p>
          </div>
          <span className="pill">Private chat</span>
        </div>

        <div className="card p-5">
          <div className="grid min-h-96 content-start gap-3 overflow-y-auto">
            {messages.length ? (
              messages.map((item) => {
                const ownMessage = item.senderId?._id === user?._id;
                return (
                  <div key={item._id} className={`flex ${ownMessage ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-lg px-4 py-3 ${ownMessage ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950" : "bg-neutral-100 dark:bg-neutral-800"}`}>
                      <div className="mb-1 flex items-center gap-2 text-xs opacity-70">
                        <span>{item.senderId?.name || "User"}</span>
                        {(item.senderId?.isVerified || item.senderId?.isVerifiedEmployer) && <span>Verified</span>}
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{item.message}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="grid min-h-80 place-items-center text-center text-sm text-neutral-500">
                Start the conversation about this job.
              </p>
            )}
          </div>

          <form onSubmit={sendMessage} className="mt-5 flex gap-3 border-t border-neutral-200 pt-5 dark:border-neutral-800">
            <input
              className="input"
              value={message}
              maxLength={2000}
              placeholder="Write a message"
              onChange={(event) => setMessage(event.target.value)}
            />
            <button type="submit" className="btn-primary shrink-0 px-5" disabled={sending || !message.trim()}>
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
