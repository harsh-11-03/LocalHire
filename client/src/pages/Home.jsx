import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import JobCard from "../components/JobCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useAuth } from "../context/AuthContext";
import { categories, cities, searchSuggestions } from "../data/options";
import api from "../services/api";

const benefits = [
  {
    title: "Nearby jobs first",
    text: "Search by city and neighborhood so job seekers can find practical daily commute options."
  },
  {
    title: "Direct employer contact",
    text: "Call or WhatsApp local businesses without a long hiring chain."
  },
  {
    title: "Simple dashboards",
    text: "Employers, applicants, and admins get focused controls without complex workflows."
  }
];

export default function Home() {
  const [form, setForm] = useState({ keyword: "", city: "", category: "" });
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const canPost = !user || user.role === "employer" || user.role === "admin";

  useEffect(() => {
    async function loadFeaturedJobs() {
      try {
        const { data } = await api.get("/jobs/featured");
        setFeaturedJobs(data.jobs || []);
      } catch (error) {
        setFeaturedJobs([]);
      } finally {
        setLoading(false);
      }
    }

    loadFeaturedJobs();
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    Object.entries(form).forEach(([key, value]) => value && params.set(key, value));
    navigate(`/jobs?${params.toString()}`);
  }

  return (
    <>
      <section className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="page-shell grid min-h-[calc(70vh-4rem)] items-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <span className="pill mb-5 bg-white dark:bg-neutral-900">Hyperlocal hiring platform</span>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-6xl">
              Find your next local opportunity
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-600 dark:text-neutral-300">
              Connect directly with businesses in your neighborhood.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 rounded-lg border border-neutral-200 bg-white p-3 shadow-soft dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr_auto]">
                <div className="relative">
                  <input
                    className="input"
                    placeholder="Job title or keyword"
                    value={form.keyword}
                    onChange={(event) => setForm({ ...form, keyword: event.target.value })}
                    list="home-search-suggestions"
                  />
                  <datalist id="home-search-suggestions">
                    {searchSuggestions.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>
                <select
                  className="input"
                  value={form.city}
                  onChange={(event) => setForm({ ...form, city: event.target.value })}
                >
                  <option value="">City</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <select
                  className="input"
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                >
                  <option value="">Category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn-primary whitespace-nowrap">
                  Search jobs
                </button>
              </div>
            </form>
          </motion.div>

        </div>
      </section>

      <section className="section-gap">
        <div className="page-shell">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="pill mb-3">Popular categories</span>
              <h2 className="text-3xl font-black tracking-tight">Browse by work type</h2>
            </div>
            <Link to="/jobs" className="btn-secondary">
              View all jobs
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category}
                to={`/jobs?category=${category}`}
                className="card p-5 text-center font-bold hover:-translate-y-1 hover:shadow-soft"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-gap bg-neutral-50 dark:bg-neutral-900/40">
        <div className="page-shell">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="pill mb-3 bg-white dark:bg-neutral-950">Featured jobs</span>
              <h2 className="text-3xl font-black tracking-tight">Fresh openings near you</h2>
            </div>
            <Link to="/jobs" className="btn-primary">
              Start applying
            </Link>
          </div>
          {loading ? (
            <LoadingSkeleton count={3} />
          ) : featuredJobs.length ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {featuredJobs.slice(0, 3).map((job) => (
                <JobCard key={job._id} job={job} compact />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No featured jobs yet"
              text="Once an employer posts an active job, it will show here."
              action={canPost ? (
                <Link to="/post-job" className="btn-primary">
                  Post first job
                </Link>
              ) : null}
            />
          )}
        </div>
      </section>

      <section className="section-gap">
        <div className="page-shell grid gap-4 md:grid-cols-3">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="card p-6">
              <h3 className="text-xl font-black">{benefit.title}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                {benefit.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {canPost && (
        <section className="section-gap bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
          <div className="page-shell flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Hiring for your local business?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-300 dark:text-neutral-700">
                Post nearby roles, view applicants, and close jobs once the position is filled.
              </p>
            </div>
            <Link
              to="/post-job"
              className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:-translate-y-0.5 hover:bg-neutral-200 dark:bg-neutral-950 dark:text-white"
            >
              Post a job
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
