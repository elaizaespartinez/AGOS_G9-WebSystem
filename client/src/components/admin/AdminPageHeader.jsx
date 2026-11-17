import { RefreshCw } from "lucide-react";

export default function AdminPageHeader({
    eyebrow = "Admin / Operations",
    title,
    description,
    onRefresh,
    refreshing = false,
    actions,
}) {
    return (
        <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary">
                    {eyebrow}
                </p>
                <h1 className="mt-1 text-2xl font-extrabold text-secondary md:text-3xl">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text/60">
                        {description}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2">
                {actions}
                {onRefresh && (
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={refreshing}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-secondary shadow-sm transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                        Refresh
                    </button>
                )}
            </div>
        </header>
    );
}
