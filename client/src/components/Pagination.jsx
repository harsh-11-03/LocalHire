export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        type="button"
        className="btn-secondary px-4 py-2"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>
      <span className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold dark:border-neutral-800">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className="btn-secondary px-4 py-2"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
