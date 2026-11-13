import {
    AlertTriangle,
    ArrowUpRight,
    BusFront,
    CheckCircle2,
    ChevronRight,
    CircleAlert,
    CloudRain,
    Database,
    Droplets,
    FileWarning,
    MapPin,
    Megaphone,
    RefreshCw,
    Route,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
    getOverview,
    subscribeToOverview,
} from "../../services/admin/overviewService";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import SectionPanel from "../../components/admin/SectionPanel";

const summaryCards = [
    [
        "Active alerts",
        "1 requires immediate action",
        Megaphone,
        "text-risk-high",
        "/admin/communications",
    ],
    [
        "Pending community reports",
        "Awaiting review",
        FileWarning,
        "text-secondary",
        "/admin/reports?status=pending",
    ],
    [
        "Affected barangays",
        "Current flood conditions",
        MapPin,
        "text-risk-moderate",
        "/admin/locations?view=hazards",
    ],
    [
        "Connected data sources",
        "1 source needs attention",
        Database,
        "text-safe",
        "/admin/settings",
    ],
];

const barangays = [
    ["Sta. Rita", "Evacuate", "34 mm/hr", "bg-red-100 text-red-800"],
    ["Cuta", "Affected", "22 mm/hr", "bg-orange-100 text-orange-900"],
    ["Alangilan", "Monitor", "12 mm/hr", "bg-yellow-100 text-yellow-900"],
    ["Balagtas", "Safe", "4 mm/hr", "bg-green-100 text-green-800"],
];

const alerts = [
    [
        "Flooding reported in Sta. Rita",
        "Three community reports require verification.",
        "8 min ago",
        "bg-risk-high",
    ],
    [
        "Rainfall advisory published",
        "Moderate rainfall is expected to persist.",
        "35 min ago",
        "bg-risk-moderate",
    ],
    [
        "Route PB-03 affected",
        "Recommend the Kumintang diversion.",
        "1 hr ago",
        "bg-risk-low",
    ],
];

const reports = [
    ["Flooded road", "Brgy. Sta. Rita", "3 reports", "8 min ago", Droplets],
    [
        "Transport disruption",
        "BatStateU - PB",
        "2 reports",
        "18 min ago",
        BusFront,
    ],
    [
        "Road is passable",
        "Brgy. Alangilan",
        "1 report",
        "31 min ago",
        CheckCircle2,
    ],
];

const activities = [
    ["10:50 AM", "Flood status updated", "Alangilan set to Monitor"],
    ["10:35 AM", "New community report", "Flooding reported in Cuta"],
    ["10:12 AM", "Advisory published", "Heavy rainfall monitoring"],
    ["09:48 AM", "Route status updated", "Batangas - Alangilan affected"],
];

const mapMarkers = [
    ["Sta. Rita", "left-[32%] top-[35%]", "bg-risk-high"],
    ["Cuta", "right-[26%] top-[27%]", "bg-risk-moderate"],
    ["Alangilan", "left-[21%] bottom-[23%]", "bg-risk-low"],
    ["Evacuation center", "right-[17%] bottom-[22%]", "bg-safe"],
];

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

    const values = [
        overview?.activeAlerts,
        overview?.reports?.pending,
        overview?.affectedLocations,
        overview?.connectedSources,
    ];

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
                        <span className="h-1.5 w-1.5 rounded-full bg-safe" />{" "}
                        Live data connected
                    </span>
                }
            />

            {error && (
                <p
                    role="alert"
                    className="rounded-lg border border-risk-moderate/30 bg-risk-moderate/10 px-4 py-3 text-sm text-text/70"
                >
                    {error}
                </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-l-4 border-risk-moderate bg-orange-50 px-4 py-3">
                <div className="flex items-start gap-3">
                    <AlertTriangle
                        size={20}
                        className="mt-0.5 shrink-0 text-risk-moderate"
                    />
                    <div>
                        <p className="text-sm font-extrabold text-secondary">
                            Flooding reported in Cuta
                        </p>
                        <p className="text-xs text-text/65">
                            Verify incoming reports and keep public advisories
                            up to date.
                        </p>
                    </div>
                </div>
                <Link
                    to="/admin/reports?status=pending"
                    className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-primary px-4 text-xs font-bold text-white hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    Review reports <ArrowUpRight size={14} />
                </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map(([label, note, Icon, color, link], index) => (
                    <Link
                        key={label}
                        to={link}
                        className="group rounded-xl bg-card p-5 shadow-card transition-shadow hover:shadow-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <p className="text-xs font-semibold text-text/60">
                                {label}
                            </p>
                            <Icon
                                size={20}
                                className={`${color} transition-transform group-hover:scale-110`}
                            />
                        </div>
                        <p className={`mt-3 text-3xl font-extrabold ${color}`}>
                            {values[index] ?? (loading ? "..." : "0")}
                        </p>
                        <p className="mt-2 text-[11px] text-text/55">{note}</p>
                    </Link>
                ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
                <SectionPanel
                    title="Batangas City hazard overview"
                    description="Visual preview based on monitoring records. This is not a geographic map."
                    actions={
                        <Link
                            to="/admin/locations?view=hazards"
                            className="text-xs font-bold text-primary"
                        >
                            View monitoring{" "}
                            <ArrowUpRight size={13} className="ml-1 inline" />
                        </Link>
                    }
                >
                    <div className="relative min-h-[310px] overflow-hidden bg-[#dcecef] p-5">
                        <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(30deg,transparent_45%,rgba(46,158,172,.15)_46%,transparent_48%),linear-gradient(150deg,transparent_45%,rgba(27,28,104,.1)_46%,transparent_48%)] [background-size:80px_80px]" />
                        <div className="absolute left-[18%] top-[25%] h-28 w-36 rotate-12 rounded-[45%] border-4 border-primary/40 bg-primary/20" />
                        <div className="absolute right-[20%] top-[18%] h-24 w-32 -rotate-12 rounded-[45%] border-4 border-risk-moderate/40 bg-risk-moderate/20" />
                        <div className="absolute bottom-[18%] left-[42%] h-24 w-40 rotate-6 rounded-[45%] border-4 border-risk-high/40 bg-risk-high/15" />

                        {mapMarkers.map(([label, position, color]) => (
                            <span
                                key={label}
                                className={`absolute ${position} z-10 flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-secondary shadow-card`}
                            >
                                <span
                                    className={`h-2 w-2 rounded-full ${color}`}
                                />
                                {label}
                            </span>
                        ))}

                        <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-2 rounded-lg bg-white/90 p-2 text-[10px] font-semibold text-text/70">
                            <span>
                                <i className="mr-1 inline-block h-2 w-2 rounded-full bg-risk-high" />
                                Evacuate
                            </span>
                            <span>
                                <i className="mr-1 inline-block h-2 w-2 rounded-full bg-risk-moderate" />
                                Affected
                            </span>
                            <span>
                                <i className="mr-1 inline-block h-2 w-2 rounded-full bg-safe" />
                                Evacuation center
                            </span>
                        </div>
                    </div>
                </SectionPanel>

                <SectionPanel
                    title="Active alerts"
                    description="Published communications requiring public attention."
                    actions={
                        <Link to="/admin/communications" className="text-primary">
                            <ChevronRight size={18} />
                        </Link>
                    }
                >
                    <div className="space-y-4 p-5">
                        {alerts.map(([title, detail, time, color]) => (
                            <Link
                                key={title}
                                to="/admin/communications"
                                className="flex gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <span
                                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${color}`}
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="block text-xs font-bold text-secondary">
                                        {title}
                                    </span>
                                    <span className="mt-1 block text-[11px] leading-relaxed text-text/60">
                                        {detail}
                                    </span>
                                    <span className="mt-1 block text-[10px] text-text/45">
                                        {time}
                                    </span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </SectionPanel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.8fr)]">
                <SectionPanel
                    title="Barangay risk indicators"
                    description="Sample rainfall and risk indicators for the dashboard preview."
                    actions={
                        <Link
                            to="/admin/locations?view=hazards"
                            className="text-xs font-bold text-primary"
                        >
                            View all <ArrowUpRight size={13} className="inline" />
                        </Link>
                    }
                >
                    <div className="overflow-x-auto p-5">
                        <table className="w-full min-w-[450px] text-left text-xs">
                            <thead className="border-b border-gray-200 text-[10px] uppercase tracking-wider text-text/50">
                                <tr>
                                    <th className="pb-3">Barangay</th>
                                    <th className="pb-3">Risk level</th>
                                    <th className="pb-3">Rainfall</th>
                                    <th className="pb-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {barangays.map(
                                    ([name, risk, rainfall, riskClass]) => (
                                        <tr key={name}>
                                            <td className="py-3 font-semibold">
                                                {name}
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${riskClass}`}
                                                >
                                                    {risk}
                                                </span>
                                            </td>
                                            <td className="py-3 text-text/65">
                                                {rainfall}
                                            </td>
                                            <td className="py-3">
                                                <Link
                                                    to="/admin/locations?view=hazards"
                                                    className="font-bold text-primary"
                                                >
                                                    Review
                                                </Link>
                                            </td>
                                        </tr>
                                    ),
                                )}
                            </tbody>
                        </table>
                    </div>
                </SectionPanel>

                <SectionPanel
                    title="Pending reports"
                    description="Recent community reports awaiting moderation."
                    actions={
                        <Link
                            to="/admin/reports?status=pending"
                            className="text-primary"
                        >
                            <ChevronRight size={18} />
                        </Link>
                    }
                >
                    <div className="space-y-3 p-5">
                        {reports.map(([type, location, matches, time, Icon]) => (
                            <Link
                                key={type}
                                to="/admin/reports?status=pending"
                                className="flex items-center gap-3 rounded-lg border-b border-gray-100 pb-3 last:border-0 last:pb-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <span className="rounded-lg bg-primary/10 p-2 text-primary">
                                    <Icon size={16} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-xs font-bold text-secondary">
                                        {type}
                                    </span>
                                    <span className="block truncate text-[10px] text-text/55">
                                        {location} · {time}
                                    </span>
                                </span>
                                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                                    {matches}
                                </span>
                            </Link>
                        ))}
                    </div>
                </SectionPanel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <SectionPanel
                    title="Locations with outdated data"
                    description="Mock freshness warning for the monitoring workflow."
                    actions={
                        <Link
                            to="/admin/locations?view=hazards"
                            className="text-primary"
                        >
                            <ChevronRight size={18} />
                        </Link>
                    }
                >
                    <div className="m-5 rounded-lg border border-orange-200 bg-orange-50 p-3">
                        <div className="flex items-start gap-3">
                            <CircleAlert
                                size={18}
                                className="mt-0.5 text-risk-moderate"
                            />
                            <div>
                                <p className="text-xs font-bold text-secondary">
                                    Brgy. Balagtas
                                </p>
                                <p className="mt-1 text-[11px] text-text/65">
                                    Last update was 3 hr ago. Data may be
                                    outdated.
                                </p>
                            </div>
                            <Link
                                to="/admin/locations?view=hazards"
                                className="ml-auto text-[10px] font-bold text-primary"
                            >
                                Review
                            </Link>
                        </div>
                    </div>
                </SectionPanel>

                <SectionPanel
                    title="Recent administrative activity"
                    description="Recent actions from the dashboard preview."
                    actions={
                        <Link to="/admin/settings" className="text-primary">
                            <ChevronRight size={18} />
                        </Link>
                    }
                >
                    <div className="grid gap-3 p-5 sm:grid-cols-2">
                        {activities.map(([time, title, detail]) => (
                            <div
                                key={title}
                                className="border-l-2 border-primary/30 pl-3"
                            >
                                <p className="text-[10px] text-text/45">{time}</p>
                                <p className="mt-1 text-xs font-bold text-secondary">
                                    {title}
                                </p>
                                <p className="mt-1 text-[10px] text-text/55">
                                    {detail}
                                </p>
                            </div>
                        ))}
                    </div>
                </SectionPanel>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary/10 px-4 py-3 text-xs">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-text/65">
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                        <CloudRain size={14} className="text-primary" />
                        Rainfall monitoring <b className="text-safe">Online</b>
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                        <Route size={14} className="text-primary" />
                        Transport feed{" "}
                        <b className="text-risk-moderate">Sample</b>
                    </span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-text/55">
                    <RefreshCw size={13} />
                    Refresh to sync latest records
                </span>
            </div>
        </section>
    );
}