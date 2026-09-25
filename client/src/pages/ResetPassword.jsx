import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const token = searchParams.get("token") || "";

  async function handleSubmit(event) {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post("/auth/reset-password", { token, password });
      toast.success(data.message);
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to reset password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="section-gap bg-neutral-50 dark:bg-neutral-950">
      <div className="page-shell grid place-items-center">
        <div className="card w-full max-w-md p-6">
          <span className="pill mb-4">Password reset</span>
          <h1 className="text-3xl font-black tracking-tight">Set a new password</h1>
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <div>
              <label className="label">New password</label>
              <input className="input" type="password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input className="input" type="password" minLength={6} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </div>
            <button type="submit" className="btn-primary" disabled={submitting || !token}>
              {submitting ? "Resetting..." : "Reset password"}
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
