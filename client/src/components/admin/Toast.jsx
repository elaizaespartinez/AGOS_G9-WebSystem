export default function Toast({ message, onClose }) {
  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-lg bg-secondary px-4 py-3 text-sm font-semibold text-white shadow-elevated"
    >
      {message}
      <button
        onClick={onClose}
        aria-label="Close notification"
        className="cursor-pointer text-lg focus:outline-none focus:ring-2 focus:ring-primary"
      >
        ×
      </button>
    </div>
  );
}