import { useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to request password reset");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="section-gap bg-neutral-50 dark:bg-neutral-950">
      <div className="page-shell grid place-items-center">
        <div className="card w-full max-w-md p-6">
          <span className="pill mb-4">Password reset</span>
          <h1 className="text-3xl font-black tracking-tight">Forgot your password?</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            Enter your email and we will send reset instructions if the account exists.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Sending..." : "Send reset link"}
            </button>
          </form>
          <Link to="/login" className="mt-5 block text-center text-sm font-semibold underline">
            Back to login
          </Link>
        </div>
      </div>
    </section>
  );
}
