import {
    AlertTriangle,
    ArrowUpRight,
    ChevronRight,
    CloudRain,
    Database,
    FileWarning,
    MapPin,
    Megaphone,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { formatRelativeTime } from "../../lib/adminRules";
import { getOverview, subscribeToOverview } from "../../services/admin/overviewService";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import EmptyState from "../../components/admin/EmptyState";
import ErrorState from "../../components/admin/ErrorState";
import LoadingState from "../../components/admin/LoadingState";
import SectionPanel from "../../components/admin/SectionPanel";

const riskClasses = {
    safe: "bg-green-100 text-green-800",
    monitor: "bg-yellow-100 text-yellow-900",
    affected: "bg-orange-100 text-orange-900",
    evacuate: "bg-red-100 text-red-800",
};
const dotClasses = {
    safe: "bg-safe",
    monitor: "bg-risk-low",
    affected: "bg-risk-moderate",
    evacuate: "bg-risk-high",
};
const markerColors = {
    safe: "bg-safe",
    monitor: "bg-risk-low",
    affected: "bg-risk-moderate",
    evacuate: "bg-risk-high",
};

const actionLabels = {
    report_pending: "Report submitted",
    report_verified: "Report verified",
    report_rejected: "Report rejected",
    alert_published: "Alert published",
    alert_updated: "Alert updated",
};

function getActivityDetail(activity) {
    if (activity.details && typeof activity.details === "object") {
        const detail = Object.entries(activity.details)
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join(" · ");
        if (detail) return detail;
    }
    return activity.entity ? `${activity.entity} ${activity.entityId || ""}`.trim() : "Administrative action";
}

function formatAction(action) {
    const label = actionLabels[action] || action || "Administrative action";
    return label.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getMarkerStyle(latitude, longitude) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const left = Math.max(4, Math.min(92, ((lng - 120.95) / 0.2) * 100));
    const top = Math.max(8, Math.min(86, (1 - (lat - 13.70) / 0.15) * 100));
    return { left: `${left}%`, top: `${top}%` };
}

export default function AdminHome() {
    const [overview, setOverview] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        getOverview()
            .then((data) => {
                setOverview(data);
                setError("");
            })
            .catch((loadError) => {
                console.error("Unable to load dashboard overview.", loadError);
                setError("Live dashboard data is temporarily unavailable.");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        return subscribeToOverview(load);
    }, []);

    if (loading && !overview) {
        return (
            <section className="space-y-6">
                <AdminPageHeader
                    eyebrow="Admin / Dashboard"
                    title="Operations overview"
                    description="Monitor community safety and manage public updates from one operational view."
                />
                <LoadingState message="Loading live dashboard data..." />
            </section>
        );
    }

    if (error && !overview) {
        return (
            <section className="space-y-6">
                <AdminPageHeader
                    eyebrow="Admin / Dashboard"
                    title="Operations overview"
                    description="Monitor community safety and manage public updates from one operational view."
                />
                <ErrorState message={error} onRetry={load} />
            </section>
        );
    }

    const alerts = overview?.alerts || [];
    const conditions = overview?.conditions || [];
    const reports = overview?.reports?.items || [];
    const activities = overview?.activities || [];
    const immediateActionCount = alerts.filter((alert) => alert.severity === "evacuate").length;
    const sourceFailureCount = overview?.sourceFailures?.length || 0;
    const cards = [
        ["Active alerts", `${immediateActionCount} require immediate action`, overview?.activeAlerts || 0, Megaphone, "text-risk-high", "/admin/communications"],
        ["Pending community reports", "Awaiting review", overview?.reports?.pending || 0, FileWarning, "text-secondary", "/admin/reports?status=pending"],
        ["Affected barangays", "Current flood conditions", overview?.affectedLocations || 0, MapPin, "text-risk-moderate", "/admin/locations?view=hazards"],
        [
            "Connected data sources",
            sourceFailureCount ? `${sourceFailureCount} source needs attention` : "All sources online",
            overview?.connectedSources || 0,
            Database,
            "text-safe",
            "/admin/settings",
        ],
    ];
    const markerConditions = conditions
        .map((condition) => ({ ...condition, style: getMarkerStyle(condition.latitude, condition.longitude) }))
        .filter((condition) => condition.style);

    return (
        <section className="space-y-6">
            <AdminPageHeader
                eyebrow="Admin / Dashboard"
                title="Operations overview"
                description="Monitor community safety and manage public updates from one operational view."
                onRefresh={load}
                refreshing={loading}
                actions={
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-safe" /> Live data connected
                    </span>
                }
            />

            {error && <ErrorState message={error} onRetry={load} />}
            {overview?.sourceFailures?.length > 0 && (
                <p role="status" className="rounded-lg border border-risk-moderate/30 bg-risk-moderate/10 px-4 py-3 text-sm text-text/70">
                    {overview.sourceFailures.join(" and ")} data needs attention; showing available records.
                </p>
            )}

            {overview?.reports?.pending > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-l-4 border-risk-moderate bg-orange-50 px-4 py-3">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-risk-moderate" />
                        <div>
                            <p className="text-sm font-extrabold text-secondary">
                                {overview.reports.pending} pending report{overview.reports.pending === 1 ? "" : "s"} require review
                            </p>
                            <p className="text-xs text-text/65">Verify incoming reports before updating public advisories.</p>
                        </div>
                    </div>
                    <Link to="/admin/reports?status=pending" className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-primary px-4 text-xs font-bold text-white hover:bg-primary-hover">
                        Review reports <ArrowUpRight size={14} />
                    </Link>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map(([label, note, value, Icon, color, link]) => (
                    <Link key={label} to={link} className="group rounded-xl bg-card p-5 shadow-card transition-shadow hover:shadow-elevated">
                        <div className="flex items-start justify-between gap-3">
                            <p className="text-xs font-semibold text-text/60">{label}</p>
                            <Icon size={20} className={`${color} transition-transform group-hover:scale-110`} />
                        </div>
                        <p className={`mt-3 text-3xl font-extrabold ${color}`}>{value}</p>
                        <p className="mt-2 text-[11px] text-text/55">{note}</p>
                    </Link>
                ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
                <SectionPanel
                    title="Batangas City hazard overview"
                    description="Preview of flood conditions with available coordinates."
                    actions={<Link to="/admin/locations?view=hazards" className="text-xs font-bold text-primary">View monitoring <ArrowUpRight size={13} className="ml-1 inline" /></Link>}
                >
                    {markerConditions.length ? (
                        <div className="relative min-h-[310px] overflow-hidden bg-[#dcecef] p-5">
                            <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(30deg,transparent_45%,rgba(46,158,172,.15)_46%,transparent_48%),linear-gradient(150deg,transparent_45%,rgba(27,28,104,.1)_46%,transparent_48%)] [background-size:80px_80px]" />
                            {markerConditions.map((condition) => (
                                <span key={condition.id} style={condition.style} className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-secondary shadow-card">
                                    <span className={`h-2 w-2 rounded-full ${markerColors[condition.severity] || "bg-text/40"}`} />
                                    {condition.barangays?.name || condition.barangay_id}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className="p-5"><EmptyState title="No mapped conditions" message="No flood-condition records include usable coordinates." /></div>
                    )}
                </SectionPanel>

                <SectionPanel title="Active alerts" description="Published communications requiring public attention." actions={<Link to="/admin/communications" className="text-primary"><ChevronRight size={18} /></Link>}>
                    <div className="space-y-4 p-5">
                        {!alerts.length ? <EmptyState message="No active alerts." /> : alerts.map((alert) => (
                            <Link key={alert.id} to="/admin/communications" className="flex gap-3">
                                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dotClasses[alert.severity] || "bg-text/40"}`} />
                                <span className="min-w-0 flex-1">
                                    <span className="block text-xs font-bold text-secondary">{alert.title}</span>
                                    <span className="mt-1 block text-[11px] leading-relaxed text-text/60">{alert.description || "No description provided."}</span>
                                    <span className="mt-1 block text-[10px] text-text/45">{formatRelativeTime(alert.created_at || alert.starts_at)}</span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </SectionPanel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.8fr)]">
                <SectionPanel title="Barangay risk indicators" description="Current non-expired flood-condition records." actions={<Link to="/admin/locations?view=hazards" className="text-xs font-bold text-primary">View all <ArrowUpRight size={13} className="inline" /></Link>}>
                    {!conditions.length ? <div className="p-5"><EmptyState message="No current flood conditions." /></div> : (
                        <div className="overflow-x-auto p-5">
                            <table className="w-full min-w-[450px] text-left text-xs">
                                <thead className="border-b border-gray-200 text-[10px] uppercase tracking-wider text-text/50"><tr><th className="pb-3">Barangay</th><th className="pb-3">Risk level</th><th className="pb-3">Confidence / reports</th><th className="pb-3">Action</th></tr></thead>
                                <tbody className="divide-y divide-gray-100">
                                    {conditions.map((condition) => (
                                        <tr key={condition.id}>
                                            <td className="py-3 font-semibold">{condition.barangays?.name || condition.barangay_id || "Unknown"}</td>
                                            <td className="py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${riskClasses[condition.severity] || "bg-gray-100 text-gray-800"}`}>{formatAction(condition.severity) || "Unknown"}</span></td>
                                            <td className="py-3 text-text/65">{condition.confidence == null ? "—" : `${Math.round(Number(condition.confidence) * (Number(condition.confidence) <= 1 ? 100 : 1))}%`} · {condition.recent_report_count ?? "—"} reports</td>
                                            <td className="py-3"><Link to="/admin/locations?view=hazards" className="font-bold text-primary">Review</Link></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SectionPanel>

                <SectionPanel title="Pending reports" description="Recent community reports awaiting moderation." actions={<Link to="/admin/reports?status=pending" className="text-primary"><ChevronRight size={18} /></Link>}>
                    <div className="space-y-3 p-5">
                        {!reports.length ? <EmptyState message="No pending reports." /> : reports.map((report) => (
                            <Link key={report.id} to="/admin/reports?status=pending" className="flex items-center gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                <span className="rounded-lg bg-primary/10 p-2 text-primary"><CloudRain size={16} /></span>
                                <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-secondary">{report.type}</span><span className="block truncate text-[10px] text-text/55">{report.location || report.barangay} · {formatRelativeTime(report.createdAt)}</span></span>
                                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">{report.matchSummary?.distinctReporters || 1} report{(report.matchSummary?.distinctReporters || 1) === 1 ? "" : "s"}</span>
                            </Link>
                        ))}
                    </div>
                </SectionPanel>
            </div>

            <SectionPanel title="Recent administrative activity" description="Latest actions recorded by the admin system." actions={<Link to="/admin/settings" className="text-primary"><ChevronRight size={18} /></Link>}>
                {!activities.length ? <div className="p-5"><EmptyState message="No administrative activity recorded." /></div> : (
                    <div className="grid gap-3 p-5 sm:grid-cols-2">
                        {activities.map((activity) => (
                            <div key={activity.id} className="border-l-2 border-primary/30 pl-3">
                                <p className="text-[10px] text-text/45">{formatRelativeTime(activity.createdAt)}</p>
                                <p className="mt-1 text-xs font-bold text-secondary">{formatAction(activity.action)}</p>
                                <p className="mt-1 text-[10px] text-text/55">{getActivityDetail(activity)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </SectionPanel>

            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-primary/10 px-4 py-3 text-xs text-text/65">
                <span className="inline-flex items-center gap-1.5 font-semibold"><CloudRain size={14} className="text-primary" /> Open-Meteo <b className={overview?.weather ? "text-safe" : "text-risk-high"}>{overview?.weather ? "Online" : "Unavailable"}</b></span>
                <span className="inline-flex items-center gap-1.5 font-semibold"><Database size={14} className="text-primary" /> Supabase <b className={overview?.sourceFailures?.includes("Supabase") ? "text-risk-high" : "text-safe"}>{overview?.sourceFailures?.includes("Supabase") ? "Needs attention" : "Online"}</b></span>
            </div>
        </section>
    );
}
