export default function StatCard({ label, value, note }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
      {note && <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{note}</p>}
    </div>
  );
}
