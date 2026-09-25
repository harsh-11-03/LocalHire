import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { useAuth } from "../context/AuthContext";
import { getDashboardPath } from "../utils/format";

export default function Login() {
  const [submitting, setSubmitting] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = location.state?.email || "";
  const [form, setForm] = useState({ email: initialEmail, password: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const user = await login(form);
      const fallback = getDashboardPath(user.role);
      navigate(location.state?.from?.pathname || fallback, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  const handleGoogleSuccess = useCallback(
    async (credential) => {
      try {
        const user = await googleLogin(credential);
        const fallback = getDashboardPath(user.role);
        navigate(location.state?.from?.pathname || fallback, { replace: true });
      } catch (error) {
        toast.error(error.response?.data?.message || "Google login failed");
      }
    },
    [googleLogin, location.state?.from?.pathname, navigate]
  );

  return (
    <section className="section-gap bg-neutral-50 dark:bg-neutral-950">
      <div className="page-shell grid place-items-center">
        <div className="card w-full max-w-md p-6">
          <span className="pill mb-4">Login</span>
          <h1 className="text-3xl font-black tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            Continue to your LocalHire account.
          </p>

          <div className="mt-6">
            <GoogleAuthButton onSuccess={handleGoogleSuccess} />
          </div>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            <span className="text-xs font-semibold uppercase text-neutral-500">or</span>
            <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                required
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Logging in..." : "Login"}
            </button>
          </form>

          <Link to="/forgot-password" className="mt-4 block text-center text-sm font-semibold underline">
            Forgot password?
          </Link>
          <Link to="/resend-verification" className="mt-2 block text-center text-sm font-semibold underline">
            Resend verification email
          </Link>

          <p className="mt-5 text-center text-sm text-neutral-600 dark:text-neutral-300">
            New here?{" "}
            <Link to="/register" className="font-bold text-neutral-950 underline dark:text-white">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
