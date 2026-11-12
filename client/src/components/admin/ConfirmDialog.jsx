export default function ConfirmDialog({
  open,
  title = "Confirm action",
  message,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-secondary/50 p-4">
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-elevated"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <h2 id="confirm-title" className="text-lg font-bold text-secondary">
          {title}
        </h2>
        <p className="mt-2 text-sm text-text/70">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="cursor-pointer rounded-lg bg-risk-high px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-risk-high"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}