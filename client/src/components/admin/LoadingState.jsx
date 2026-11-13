import { LoaderCircle } from "lucide-react";

export default function LoadingState({ message = "Loading data..." }) {
    return (
        <div
            className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-8 text-center shadow-card"
            role="status"
            aria-live="polite"
        >
            <LoaderCircle size={24} className="animate-spin text-primary" />
            <p className="mt-3 text-sm font-semibold text-text/60">{message}</p>
        </div>
    );
}
