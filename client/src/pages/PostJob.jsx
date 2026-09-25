import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { categories, cities, experienceLevels, jobTypes } from "../data/options";
import api from "../services/api";
import { csvToArray } from "../utils/format";

const emptyForm = {
  title: "",
  category: "",
  jobType: "",
  city: "",
  area: "",
  latitude: "",
  longitude: "",
  salaryMin: "",
  salaryMax: "",
  experienceRequired: "",
  description: "",
  skills: "",
  perks: "",
  company: "",
  phoneNumber: "",
  whatsappNumber: "",
  companyLogo: null
};

export default function PostJob() {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  useEffect(() => {
    async function loadJob() {
      if (!isEdit) return;

      setLoading(true);
      try {
        const { data } = await api.get(`/jobs/${id}`);
        const job = data.job;
        setForm({
          title: job.title || "",
          category: job.category || "",
          jobType: job.jobType || "",
          city: job.city || "",
          area: job.area || "",
          latitude: job.location?.coordinates?.[1]?.toString() || "",
          longitude: job.location?.coordinates?.[0]?.toString() || "",
          salaryMin: job.salaryMin || "",
          salaryMax: job.salaryMax || "",
          experienceRequired: job.experienceRequired || "",
          description: job.description || "",
          skills: (job.skills || []).join(", "),
          perks: (job.perks || []).join(", "),
          company: job.company || "",
          phoneNumber: job.phoneNumber || "",
          whatsappNumber: job.whatsappNumber || "",
          companyLogo: null
        });
      } catch (error) {
        toast.error("Unable to load this job");
      } finally {
        setLoading(false);
      }
    }

    loadJob();
  }, [id, isEdit]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    const requiredFields = [
      "title",
      "category",
      "jobType",
      "city",
      "salaryMin",
      "experienceRequired",
      "description",
      "company",
      "phoneNumber"
    ];

    const missing = requiredFields.find((field) => !form[field]);
    if (missing) {
      toast.error("Please fill all required fields");
      return false;
    }

    const hasLatitude = Boolean(form.latitude);
    const hasLongitude = Boolean(form.longitude);
    if (hasLatitude !== hasLongitude) {
      toast.error("Enter both latitude and longitude for the exact location");
      return false;
    }

    if (hasLatitude && (Number(form.latitude) < -90 || Number(form.latitude) > 90)) {
      toast.error("Latitude must be between -90 and 90");
      return false;
    }

    if (hasLongitude && (Number(form.longitude) < -180 || Number(form.longitude) > 180)) {
      toast.error("Longitude must be between -180 and 180");
      return false;
    }

    return true;
  }

  function captureJobLocation() {
    if (!navigator.geolocation) {
      toast.error("Location is not available in this browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((current) => ({ ...current, latitude: String(coords.latitude), longitude: String(coords.longitude) }));
        toast.success("Job location added");
      },
      () => toast.error("We could not access your location. Check browser permission.")
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "companyLogo") {
        if (value) payload.append(key, value);
        return;
      }

      if (key === "skills" || key === "perks") {
        payload.append(key, JSON.stringify(csvToArray(value)));
        return;
      }

      payload.append(key, value);
    });

    setSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/jobs/${id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Job updated");
      } else {
        await api.post("/jobs", payload, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Job posted");
      }

      navigate("/employer/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save job");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="section-gap bg-neutral-50 dark:bg-neutral-950">
      <div className="page-shell">
        <div className="mb-8">
          <span className="pill mb-3 bg-white dark:bg-neutral-900">{isEdit ? "Edit job" : "Post job"}</span>
          <h1 className="text-4xl font-black tracking-tight">
            {isEdit ? "Update local job" : "Create a new local job"}
          </h1>
          <p className="mt-3 max-w-2xl text-neutral-600 dark:text-neutral-300">
            Keep the details clear so applicants understand pay, area, experience, and contact options.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card grid gap-6 p-6">
          {loading ? (
            <div className="h-40 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Job title *</label>
                  <input
                    className="input"
                    value={form.title}
                    onChange={(event) => updateField("title", event.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Category *</label>
                  <select
                    className="input"
                    value={form.category}
                    onChange={(event) => updateField("category", event.target.value)}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Job type *</label>
                  <select
                    className="input"
                    value={form.jobType}
                    onChange={(event) => updateField("jobType", event.target.value)}
                  >
                    <option value="">Select type</option>
                    {jobTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">City *</label>
                  <select
                    className="input"
                    value={form.city}
                    onChange={(event) => updateField("city", event.target.value)}
                  >
                    <option value="">Select city</option>
                    {cities.map((city) => (
                      <option key={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Area / neighborhood</label>
                  <input
                    className="input"
                    value={form.area}
                    onChange={(event) => updateField("area", event.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Experience required *</label>
                  <select
                    className="input"
                    value={form.experienceRequired}
                    onChange={(event) => updateField("experienceRequired", event.target.value)}
                  >
                    <option value="">Select experience</option>
                    {experienceLevels.map((level) => (
                      <option key={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <label className="label">Exact job location</label>
                    <p className="text-sm text-neutral-500">
                      Add coordinates so nearby job search can find this listing.
                    </p>
                  </div>
                  <button type="button" className="btn-secondary px-4 py-2" onClick={captureJobLocation}>
                    Use current location
                  </button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">Latitude</label>
                    <input
                      className="input"
                      type="number"
                      step="any"
                      value={form.latitude}
                      onChange={(event) => updateField("latitude", event.target.value)}
                      placeholder="e.g. 19.0760"
                    />
                  </div>
                  <div>
                    <label className="label">Longitude</label>
                    <input
                      className="input"
                      type="number"
                      step="any"
                      value={form.longitude}
                      onChange={(event) => updateField("longitude", event.target.value)}
                      placeholder="e.g. 72.8777"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Minimum salary *</label>
                  <input
                    className="input"
                    type="number"
                    value={form.salaryMin}
                    onChange={(event) => updateField("salaryMin", event.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Maximum salary</label>
                  <input
                    className="input"
                    type="number"
                    value={form.salaryMax}
                    onChange={(event) => updateField("salaryMax", event.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Description *</label>
                <textarea
                  className="input min-h-36"
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Skills required</label>
                  <input
                    className="input"
                    placeholder="Communication, billing, driving"
                    value={form.skills}
                    onChange={(event) => updateField("skills", event.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Perks</label>
                  <input
                    className="input"
                    placeholder="Meals, uniform, incentives"
                    value={form.perks}
                    onChange={(event) => updateField("perks", event.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Company name *</label>
                  <input
                    className="input"
                    value={form.company}
                    onChange={(event) => updateField("company", event.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Company logo upload</label>
                  <input
                    className="input"
                    type="file"
                    accept="image/*"
                    onChange={(event) => updateField("companyLogo", event.target.files[0])}
                  />
                </div>
                <div>
                  <label className="label">Phone number *</label>
                  <input
                    className="input"
                    value={form.phoneNumber}
                    onChange={(event) => updateField("phoneNumber", event.target.value)}
                  />
                </div>
                <div>
                  <label className="label">WhatsApp number</label>
                  <input
                    className="input"
                    value={form.whatsappNumber}
                    onChange={(event) => updateField("whatsappNumber", event.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : isEdit ? "Update job" : "Post job"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </section>
  );
}
