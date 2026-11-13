import { useEffect, useMemo, useState } from "react";
import {
    Check,
    Copy,
    FileWarning,
    Flag,
    Image as ImageIcon,
    X,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
    aggregateReports,
    listReports,
    subscribeToReports,
    updateReportStatus,
} from "../../services/admin/reportsService";
import {
    formatRelativeTime,
    getReportMatchSummary,
    isExpired,
} from "../../lib/adminRules";
import EmptyState from "../../components/admin/EmptyState";
import ErrorState from "../../components/admin/ErrorState";
import StatusPill from "../../components/admin/StatusPill";
import Toast from "../../components/admin/Toast";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import LoadingState from "../../components/admin/LoadingState";

const reportTypes = [
    "Flooded road",
    "Transport disruption",
    "Road is passable",
    "Heavy rainfall",
    "Unsafe route",
];
const barangays = ["Sta. Rita", "Alangilan", "Kumintang", "Cuta"];
const statuses = ["all", "pending", "verified", "rejected"];
const risks = ["safe", "monitor", "affected", "evacuate"];

const fieldClass =
    "mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

function AdminReports() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [reports, setReports] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [filters, setFilters] = useState({
        type: "",
        barangay: "",
        date: "",
        status: searchParams.get("status") || "all",
        risk: "",
    });
    const [rejectReason, setRejectReason] = useState("");
    const [assessedSeverity, setAssessedSeverity] = useState("monitor");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);

    const loadReports = () => {
        setLoading(true);
        setError("");
        listReports({
            ...filters,
            status: filters.status === "all" ? "" : filters.status,
        })
            .then((data) => {
                setReports(data);
                setSelectedId((current) =>
                    data.some((report) => report.id === current)
                        ? current
                        : data[0]?.id || null,
                );
                setAssessedSeverity("monitor");
                setLastUpdated(new Date());
            })
            .catch((loadError) => setError(loadError.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadReports();
        const unsubscribe = subscribeToReports(loadReports);
        const refreshTimer = window.setInterval(loadReports, 30000);
        const handleVisibility = () => {
            if (document.visibilityState === "visible") loadReports();
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () => {
            unsubscribe();
            window.clearInterval(refreshTimer);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [filters]);

    const selected = reports.find(({ id }) => id === selectedId) || null;
    const summary = aggregateReports(reports);
    const nearbyReports = selected
        ? reports.filter((report) => report.location === selected.location)
        : [];
    const matchSummary = getReportMatchSummary(nearbyReports);
    const aggregationMessage = matchSummary.conflicts
        ? "Conflicting reports"
        : matchSummary.distinctReporters >= 3
          ? "Likely affected until you verify or reject"
          : "Possible incident — one report does not trigger a major warning";

    const counts = useMemo(
        () => ({
            all: reports.length,
            pending: reports.filter((report) => report.status === "pending")
                .length,
            verified: reports.filter((report) => report.status === "verified")
                .length,
            rejected: reports.filter((report) => report.status === "rejected")
                .length,
        }),
        [reports],
    );

    const updateFilter = (key, value) => {
        setFilters((current) => ({ ...current, [key]: value }));
        if (key === "status") {
            setSearchParams(value === "all" ? {} : { status: value });
        }
    };

    const moderate = async (status, reason = "", severity = assessedSeverity) => {
        if (!selected) return;
        if (status === "rejected" && !reason.trim()) {
            setToast("A rejection reason is required.");
            return;
        }

        try {
            await updateReportStatus(selected.id, status, reason, severity);
            setRejectReason("");
            setToast(`Report marked as ${status}.`);
            loadReports();
        } catch (actionError) {
            setToast(actionError.message);
        }
    };

    if (loading) return <LoadingState message="Loading community reports..." />;
    if (error) return <ErrorState message={error} onRetry={loadReports} />;

    return (
        <section>
            <AdminPageHeader
                title="Community reports"
                description="Review incoming reports without treating one unverified claim as a major alert."
                onRefresh={loadReports}
                refreshing={loading}
            />
            {lastUpdated && (
                <p className="text-right text-[11px] text-text/50">
                    Updated {lastUpdated.toLocaleTimeString()}
                </p>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Summary label="Total reports" value={summary.total} />
                <Summary label="Pending" value={summary.pending} />
                <Summary label="Verified" value={summary.verified} />
                <Summary label="Rejected" value={summary.rejected} />
                <Summary label="Expired" value={summary.expired} />
            </div>

            <div className="mt-6 rounded-xl bg-white p-4 shadow-card">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <Select
                        label="Report type"
                        value={filters.type}
                        onChange={(value) => updateFilter("type", value)}
                        options={reportTypes}
                    />
                    <Select
                        label="Barangay"
                        value={filters.barangay}
                        onChange={(value) => updateFilter("barangay", value)}
                        options={barangays}
                    />
                    <label className="text-xs font-bold text-text/70">
                        Submission date
                        <input
                            type="date"
                            value={filters.date}
                            onChange={(event) =>
                                updateFilter("date", event.target.value)
                            }
                            className={fieldClass}
                        />
                    </label>
                    <Select
                        label="Severity"
                        value={filters.risk}
                        onChange={(value) => updateFilter("risk", value)}
                        options={risks}
                    />
                    <Select
                        label="Verification status"
                        value={filters.status}
                        onChange={(value) => updateFilter("status", value)}
                        options={statuses}
                    />
                </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.4fr)]">
                <div className="rounded-xl bg-white p-3 shadow-card">
                    <div
                        className="mb-3 flex flex-wrap gap-2"
                        role="tablist"
                        aria-label="Report status tabs"
                    >
                        {statuses.map((status) => (
                            <button
                                key={status}
                                type="button"
                                role="tab"
                                aria-selected={filters.status === status}
                                onClick={() => updateFilter("status", status)}
                                className={`min-h-10 cursor-pointer rounded-lg px-3 text-xs font-bold capitalize focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                    filters.status === status
                                        ? "bg-secondary text-white"
                                        : "bg-background text-secondary"
                                }`}
                            >
                                {status} ({counts[status]})
                            </button>
                        ))}
                    </div>

                    {!reports.length ? (
                        <EmptyState message="No reports match the selected filters." />
                    ) : (
                        <div className="space-y-2" aria-label="Report queue">
                            {reports.map((report) => (
                                <button
                                    key={report.id}
                                    type="button"
                                    onClick={() => setSelectedId(report.id)}
                                    className={`block min-h-24 w-full cursor-pointer rounded-lg border p-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                        selectedId === report.id
                                            ? "border-primary bg-primary/5"
                                            : "border-gray-100 hover:bg-background/50"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <span>
                                            <span className="block text-xs font-extrabold text-secondary">
                                                {report.type}
                                            </span>
                                            <span className="mt-1 block text-[11px] text-text/60">
                                                {report.location}
                                            </span>
                                        </span>
                                        <StatusPill
                                            status={
                                                isExpired(report)
                                                    ? "expired"
                                                    : report.status
                                            }
                                        />
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-[10px] text-text/50">
                                        <span>
                                            {formatRelativeTime(
                                                report.createdAt,
                                            )}
                                        </span>
                                        <span>
                                            {
                                                getReportMatchSummary(
                                                    reports.filter(
                                                        (item) =>
                                                            item.location ===
                                                            report.location,
                                                    ),
                                                ).distinctReporters
                                            }{" "}
                                            nearby reporter(s)
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-xl bg-white p-5 shadow-card">
                    {!selected ? (
                        <EmptyState message="Select a report to view details." />
                    ) : (
                        <ReportDetails
                            report={selected}
                            nearbyReports={nearbyReports}
                            aggregationMessage={aggregationMessage}
                            rejectReason={rejectReason}
                            setRejectReason={setRejectReason}
                            assessedSeverity={assessedSeverity}
                            setAssessedSeverity={setAssessedSeverity}
                            onAction={moderate}
                        />
                    )}
                </div>
            </div>

            <Toast message={toast} onClose={() => setToast("")} />
        </section>
    );
}

function ReportDetails({
    report,
    nearbyReports,
    aggregationMessage,
    rejectReason,
    setRejectReason,
    assessedSeverity,
    setAssessedSeverity,
    onAction,
}) {
    return (
        <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        Report details
                    </p>
                    <h2 className="mt-1 text-xl font-extrabold text-secondary">
                        {report.type}
                    </h2>
                    <p className="text-sm text-text/60">
                        {report.id} · {report.location}
                    </p>
                </div>
                <StatusPill
                    status={isExpired(report) ? "expired" : report.status}
                />
            </div>

            <div
                className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs font-semibold text-secondary"
                role="status"
            >
                {aggregationMessage}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Detail label="Category" value={report.type} />
                <Detail
                    label="Barangay"
                    value={report.barangay || report.location}
                />
                <Detail
                    label="Submitted"
                    value={new Date(report.createdAt).toLocaleString()}
                />
                <Detail label="Reporter" value={report.reporter} />
                <Detail label="Severity" value={report.risk} />
                <Detail
                    label="Nearby reports"
                    value={`${nearbyReports.length} report(s)`}
                />
            </div>

            <label className="mt-5 block text-xs font-bold text-text/70">
                Assessed severity
                <select
                    value={assessedSeverity}
                    onChange={(event) => setAssessedSeverity(event.target.value)}
                    className={`${fieldClass} capitalize`}
                >
                    {risks.map((severity) => (
                        <option key={severity} value={severity}>
                            {severity}
                        </option>
                    ))}
                </select>
            </label>

            <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-text/50">
                    Description
                </p>
                <p className="mt-2 rounded-lg bg-background p-3 text-sm leading-relaxed">
                    {report.description || "No description provided."}
                </p>
            </div>

            <div className="mt-4 flex min-h-28 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-background text-xs text-text/50">
                {report.photoUrl ? (
                    <img
                        src={report.photoUrl}
                        alt="Submitted report"
                        className="max-h-40 object-contain"
                    />
                ) : (
                    <span className="inline-flex items-center gap-2">
                        <ImageIcon size={16} /> No photo submitted
                    </span>
                )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => onAction("verified")}
                    className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-safe px-3 text-xs font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-safe"
                >
                    <Check size={15} /> Verify
                </button>
                <button
                    type="button"
                    onClick={() => onAction("rejected", "Marked as duplicate")}
                    className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-primary px-3 text-xs font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    <Copy size={15} /> Duplicate
                </button>
                <button
                    type="button"
                    onClick={() =>
                        onAction("rejected", "Marked as false or misleading")
                    }
                    className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-risk-moderate px-3 text-xs font-bold text-risk-moderate focus:outline-none focus-visible:ring-2 focus-visible:ring-risk-moderate"
                >
                    <Flag size={15} /> False or misleading
                </button>
                <button
                    type="button"
                    onClick={() => onAction("expired", "Manually expired")}
                    className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 text-xs font-bold text-text/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    <X size={15} /> Expire
                </button>
            </div>

            {report.status === "pending" && (
                <div className="mt-4">
                    <label
                        className="text-xs font-bold text-text/70"
                        htmlFor="reject-reason"
                    >
                        Reject reason
                    </label>
                    <textarea
                        id="reject-reason"
                        value={rejectReason}
                        onChange={(event) => setRejectReason(event.target.value)}
                        rows="2"
                        className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        placeholder="Required when rejecting"
                    />
                    <button
                        type="button"
                        onClick={() => onAction("rejected", rejectReason)}
                        className="mt-2 min-h-11 cursor-pointer rounded-lg bg-risk-high px-4 text-xs font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-risk-high"
                    >
                        Reject report
                    </button>
                </div>
            )}
        </div>
    );
}

function Select({ label, value, onChange, options }) {
    return (
        <label className="text-xs font-bold capitalize text-text/70">
            {label}
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={`${fieldClass} capitalize`}
            >
                <option value="">All</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </label>
    );
}

function Summary({ label, value }) {
    return (
        <div className="rounded-xl bg-white p-4 shadow-card">
            <p className="text-xs font-bold uppercase tracking-wider text-text/55">
                {label}
            </p>
            <p className="mt-2 text-2xl font-extrabold text-secondary">
                {value}
            </p>
        </div>
    );
}

function Detail({ label, value }) {
    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text/50">
                {label}
            </p>
            <p className="mt-1 text-sm font-semibold capitalize text-secondary">
                {value}
            </p>
        </div>
    );
}

export default AdminReports;