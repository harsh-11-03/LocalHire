const tone = {
  Applied: "border-neutral-300 text-neutral-700 dark:border-neutral-700 dark:text-neutral-200",
  Viewed: "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-200",
  "Interview Scheduled": "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-200",
  Rejected: "border-red-300 text-red-700 dark:border-red-700 dark:text-red-200",
  Hired: "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-200"
};

export default function StatusBadge({ status }) {
  return <span className={`pill ${tone[status] || tone.Applied}`}>{status}</span>;
}
