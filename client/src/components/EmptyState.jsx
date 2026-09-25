export default function EmptyState({ title, text, action }) {
  return (
    <div className="card grid place-items-center px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-lg bg-neutral-950 text-xl font-black text-white dark:bg-white dark:text-neutral-950">
        LH
      </div>
      <h3 className="mt-5 text-xl font-black">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-neutral-600 dark:text-neutral-300">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
