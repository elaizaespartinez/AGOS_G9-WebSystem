function StatCard({ variant = "safe", title, value, note }) {
    const variants = {
        high: "bg-risk-high",
        moderate: "bg-risk-moderate",
        low: "bg-risk-low",
        safe: "bg-safe",
        evacuate: "bg-risk-high",
        alert: "bg-risk-moderate",
        monitor: "bg-risk-low",
        normal: "bg-safe",
    };

    const borderVariants = {
        high: "border-risk-high",
        moderate: "border-risk-moderate",
        low: "border-risk-low",
        safe: "border-safe",
        evacuate: "border-risk-high",
        alert: "border-risk-moderate",
        monitor: "border-risk-low",
        normal: "border-safe",
    };

    return (
        <article className={`rounded-xl border-l-4 bg-card p-2.5 shadow-card ${borderVariants[variant] || "border-safe"}`}>
            <div className={`mb-1.5 h-2 w-2 rounded-full ${variants[variant] || "bg-safe"}`} />
            <h2 className="text-[11px] font-semibold text-text/70">{title}</h2>
            <div className="mt-0.5 flex items-baseline justify-between gap-1">
                <p className="text-lg font-bold text-text">{value ?? "-"}</p>
                {note && <span className="flood-stat-note text-[10px]">{note}</span>}
            </div>
        </article>
    );
}

export default StatCard;
