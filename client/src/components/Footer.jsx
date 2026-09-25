import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Footer() {
  const { user } = useAuth();
  const canPost = !user || user.role === "employer" || user.role === "admin";

  return (
    <footer className="border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="page-shell grid gap-8 py-10 md:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-950 text-sm font-black text-white dark:bg-white dark:text-neutral-950">
              LH
            </span>
            <span className="text-lg font-black">LocalHire</span>
          </div>
          <p className="max-w-md text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            Hyperlocal hiring for shops, offices, clinics, cafes, delivery teams, and neighborhood
            businesses.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold">Platform</h3>
          <div className="grid gap-2 text-sm text-neutral-600 dark:text-neutral-300">
            <Link to="/jobs" className="hover:text-neutral-950 dark:hover:text-white">
              Find Jobs
            </Link>
            {canPost && (
              <Link to="/post-job" className="hover:text-neutral-950 dark:hover:text-white">
                Post Job
              </Link>
            )}
            {!user && (
              <Link to="/register" className="hover:text-neutral-950 dark:hover:text-white">
                Create Account
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
