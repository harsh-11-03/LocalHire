import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import JobCard from "../components/JobCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import Pagination from "../components/Pagination";
import { useAuth } from "../context/AuthContext";
import { cities, categories, experienceLevels, jobTypes, searchSuggestions } from "../data/options";
import useDebounce from "../hooks/useDebounce";
import api from "../services/api";

const defaultFilters = {
  keyword: "", city: "", category: "", jobType: "", minSalary: "", maxSalary: "", experience: "",
  latitude: "", longitude: "", radiusKm: ""
};

export default function Jobs() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => ({
    ...defaultFilters,
    keyword: searchParams.get("keyword") || "",
    city: searchParams.get("city") || "",
    category: searchParams.get("category") || ""
  }));
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [alertName, setAlertName] = useState("");
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [totalPages, setTotalPages] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const debouncedFilters = useDebounce(filters);

  const paramsObject = useMemo(() => {
    const params = { page, limit: 6 };
    Object.entries(debouncedFilters).forEach(([key, value]) => { if (value) params[key] = value; });
    return params;
  }, [debouncedFilters, page]);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(paramsObject).forEach(([key, value]) => { if (value) params.set(key, value); });
    setSearchParams(params, { replace: true });
  }, [paramsObject, setSearchParams]);

  useEffect(() => {
    async function loadJobs() {
      setLoading(true);
      try {
        setErrorMessage("");
        const { data } = await api.get("/jobs", { params: paramsObject });
        setJobs(data.jobs || []);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        setJobs([]);
        setTotalPages(1);
        setErrorMessage("Unable to load jobs. Please check that the backend server is running.");
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, [paramsObject]);

  function updateFilter(key, value) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error("Location is not available in this browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPage(1);
        setFilters((current) => ({ ...current, latitude: String(coords.latitude), longitude: String(coords.longitude), radiusKm: current.radiusKm || "10" }));
        setLocating(false);
      },
      () => {
        toast.error("We could not access your location. Check your browser permission.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  async function handleSave(job) {
    try {
      await api.post(`/saved-jobs/${job._id}`);
      toast.success("Job saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Please login as a job seeker");
    }
  }

  async function saveAlert() {
    if (!Object.entries(filters).some(([key, value]) => key !== "latitude" && key !== "longitude" && value)) {
      toast.error("Choose at least one filter before saving an alert");
      return;
    }
    try {
      await api.post("/saved-searches", { ...filters, name: alertName || "My job alert" });
      setAlertName("");
      toast.success("Job alert saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save job alert");
    }
  }

  return (
    <section className="section-gap bg-neutral-50 dark:bg-neutral-950">
      <div className="page-shell">
        <div className="mb-8">
          <span className="pill mb-3 bg-white dark:bg-neutral-900">Search jobs</span>
          <h1 className="text-4xl font-black tracking-tight">Find work close to home</h1>
          <p className="mt-3 max-w-2xl text-neutral-600 dark:text-neutral-300">
            Search by skill, city, and distance so your commute stays practical.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="card h-fit p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-black">Filters</h2>
              <button type="button" className="text-sm font-semibold" onClick={() => setFilters(defaultFilters)}>Reset</button>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="label">Search</label>
                <input className="input" value={filters.keyword} placeholder="Keyword or company" list="job-search-suggestions" onChange={(event) => updateFilter("keyword", event.target.value)} />
                <datalist id="job-search-suggestions">{searchSuggestions.map((item) => <option key={item} value={item} />)}</datalist>
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={filters.category} onChange={(event) => updateFilter("category", event.target.value)}>
                  <option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </div>
              <div>
                <label className="label">City</label>
                <select className="input" value={filters.city} onChange={(event) => updateFilter("city", event.target.value)}>
                  <option value="">All cities</option>{cities.map((city) => <option key={city}>{city}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Job type</label>
                <select className="input" value={filters.jobType} onChange={(event) => updateFilter("jobType", event.target.value)}>
                  <option value="">Any type</option>{jobTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Min salary</label><input className="input" type="number" value={filters.minSalary} onChange={(event) => updateFilter("minSalary", event.target.value)} /></div>
                <div><label className="label">Max salary</label><input className="input" type="number" value={filters.maxSalary} onChange={(event) => updateFilter("maxSalary", event.target.value)} /></div>
              </div>
              <div>
                <label className="label">Experience</label>
                <select className="input" value={filters.experience} onChange={(event) => updateFilter("experience", event.target.value)}>
                  <option value="">Any experience</option>{experienceLevels.map((level) => <option key={level}>{level}</option>)}
                </select>
              </div>
              <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
                <label className="label">Nearby jobs</label>
                <button type="button" className="btn-secondary w-full px-4 py-2" onClick={useMyLocation} disabled={locating}>
                  {locating ? "Finding location..." : filters.latitude ? "Location selected" : "Use my location"}
                </button>
                {filters.latitude && (
                  <div className="mt-3">
                    <label className="label">Within</label>
                    <select className="input" value={filters.radiusKm} onChange={(event) => updateFilter("radiusKm", event.target.value)}>
                      {[2, 5, 10, 20, 50].map((distance) => <option key={distance} value={distance}>{distance} km</option>)}
                    </select>
                  </div>
                )}
              </div>
              {user?.role === "jobseeker" && (
                <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
                  <label className="label">Save these filters as an alert</label>
                  <input className="input mb-3" value={alertName} placeholder="e.g. Nearby retail work" onChange={(event) => setAlertName(event.target.value)} />
                  <button type="button" className="btn-primary w-full px-4 py-2" onClick={saveAlert}>Save alert</button>
                </div>
              )}
            </div>
          </aside>

          <div>
            {loading ? <LoadingSkeleton count={4} /> : jobs.length ? (
              <>
                <p className="mb-4 text-sm text-neutral-500">{filters.latitude ? "Ordered by distance from your location." : "Newest verified jobs first."}</p>
                <div className="grid gap-4">{jobs.map((job) => <JobCard key={job._id} job={job} onSave={user?.role === "jobseeker" ? handleSave : undefined} />)}</div>
                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
              </>
            ) : (
              <EmptyState title={errorMessage ? "Jobs could not be loaded" : "No jobs found"} text={errorMessage || "Try increasing the search radius or adjusting your filters."} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
