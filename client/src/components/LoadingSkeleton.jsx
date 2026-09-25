export default function LoadingSkeleton({ count = 3 }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card p-5">
          <div className="flex animate-pulse gap-4">
            <div className="h-14 w-14 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
            <div className="flex-1">
              <div className="mb-3 h-5 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="mb-4 h-4 w-1/3 rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
