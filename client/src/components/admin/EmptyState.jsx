import { Inbox } from "lucide-react";

export default function EmptyState({
    message = "No records found.",
    title = "Nothing here yet",
}) {
    return (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <Inbox size={28} className="mx-auto text-text/30" aria-hidden="true" />
            <p className="mt-3 text-sm font-extrabold text-secondary">{title}</p>
            <p className="mt-1 text-sm text-text/60">{message}</p>
        </div>
    );
}
