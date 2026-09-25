import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import NotificationBell from "./NotificationBell";
import { getDashboardPath } from "../utils/format";

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
      : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900"
  }`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    setOpen(false);
    navigate("/");
  }

  const dashboardPath = user ? getDashboardPath(user.role) : "/login";
  const canPost = user?.role === "employer" || user?.role === "admin";
  const showFindJobs = !user || user.role === "jobseeker" || user.role === "admin";
  const showDashboard = user && user.role !== "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <nav className="page-shell flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-950 text-sm font-black text-white dark:bg-white dark:text-neutral-950">
            LH
          </span>
          <span className="text-lg font-black tracking-tight">LocalHire</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {showFindJobs && (
            <NavLink to="/jobs" className={linkClass}>
              Find Jobs
            </NavLink>
          )}
          {canPost && (
            <NavLink to="/post-job" className={linkClass}>
              Post Job
            </NavLink>
          )}
          {showDashboard && (
            <NavLink to={dashboardPath} className={linkClass}>
              Dashboard
            </NavLink>
          )}
          {user?.role === "admin" && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            className="btn-secondary px-3 py-2"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            {darkMode ? "Light" : "Dark"}
          </button>
          {user ? (
            <>
              <NotificationBell />
              <span className="max-w-32 truncate text-sm font-medium text-neutral-600 dark:text-neutral-300">
                {user.name}
              </span>
              <button type="button" className="btn-secondary px-4 py-2" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary px-4 py-2">
                Login
              </Link>
              <Link to="/register" className="btn-primary px-4 py-2">
                Register
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="btn-secondary px-3 py-2 md:hidden"
          onClick={() => setOpen((current) => !current)}
          aria-label="Open menu"
        >
          {open ? "Close" : "Menu"}
        </button>
      </nav>

      {open && (
        <div className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 md:hidden">
          <div className="page-shell flex flex-col gap-2 py-4">
            {showFindJobs && (
              <NavLink to="/jobs" className={linkClass} onClick={() => setOpen(false)}>
                Find Jobs
              </NavLink>
            )}
            {canPost && (
              <NavLink to="/post-job" className={linkClass} onClick={() => setOpen(false)}>
                Post Job
              </NavLink>
            )}
            {showDashboard && (
              <NavLink to={dashboardPath} className={linkClass} onClick={() => setOpen(false)}>
                Dashboard
              </NavLink>
            )}
            {user?.role === "admin" && (
              <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>
                Admin
              </NavLink>
            )}
            {user && <NotificationBell />}
            <button type="button" className="btn-secondary w-full" onClick={toggleTheme}>
              {darkMode ? "Light mode" : "Dark mode"}
            </button>
            {user ? (
              <button type="button" className="btn-primary w-full" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" className="btn-secondary" onClick={() => setOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="btn-primary" onClick={() => setOpen(false)}>
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
