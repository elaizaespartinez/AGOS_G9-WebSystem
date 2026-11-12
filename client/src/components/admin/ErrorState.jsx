import { AlertCircle } from "lucide-react";

export default function ErrorState({
    message = "Unable to load data.",
    onRetry,
}) {
    return (
        <div className="rounded-xl border border-risk-high/30 bg-risk-high/5 p-8 text-center">
            <AlertCircle size={24} className="mx-auto text-risk-high" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-risk-high">{message}</p>
            {onRetry && (
                <button
                    type="button"
                    className="mt-4 rounded-lg border border-risk-high/30 bg-white px-4 py-2 text-xs font-bold text-risk-high transition hover:bg-risk-high/5"
                    onClick={onRetry}
                >
                    Try again
                </button>
            )}
        </div>
    );
}
