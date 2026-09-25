import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "jobseeker",
    adminSecret: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const user = await register(form);
      navigate("/login", { replace: true, state: { email: user.email } });
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  const handleGoogleSuccess = useCallback(
    async (credential, selectedRole) => {
      try {
        const user = await googleLogin(credential, selectedRole);
        navigate(getDashboardPath(user.role), { replace: true });
      } catch (error) {
        toast.error(error.response?.data?.message || "Google registration failed");
      }
    },
    [googleLogin, navigate]
  );

  return (
    <section className="section-gap bg-neutral-50 dark:bg-neutral-950">
      <div className="page-shell grid place-items-center">
        <div className="card w-full max-w-xl p-6">
          <span className="pill mb-4">Register</span>
          <h1 className="text-3xl font-black tracking-tight">Join LocalHire</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            Create a job seeker, employer, or admin account.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <div>
              <label className="label">Full name</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                  minLength={6}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Role</label>
              <select
                className="input"
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
              >
                <option value="jobseeker">Job Seeker</option>
                <option value="employer">Employer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {form.role === "admin" && (
              <div>
                <label className="label">Admin secret</label>
                <input
                  className="input"
                  value={form.adminSecret}
                  placeholder="Set ADMIN_REGISTER_SECRET in backend .env"
                  onChange={(event) => setForm({ ...form, adminSecret: event.target.value })}
                />
              </div>
            )}

            <div>
              <label className="label">
                Continue with Google {form.role !== "admin" ? `as ${form.role}` : ""}
              </label>
              <GoogleAuthButton
                role={form.role}
                onSuccess={handleGoogleSuccess}
                disabled={form.role === "admin"}
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
              <span className="text-xs font-semibold uppercase text-neutral-500">or use email</span>
              <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-neutral-600 dark:text-neutral-300">
            Already registered?{" "}
            <Link to="/login" className="font-bold text-neutral-950 underline dark:text-white">
              Login
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
