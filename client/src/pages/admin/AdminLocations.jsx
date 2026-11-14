import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import EmptyState from "../../components/admin/EmptyState";
import FloodReportEntryMap from "../../components/admin/FloodReportEntryMap";
import StatusPill from "../../components/admin/StatusPill";
import {
    createFloodReport,
    deleteFloodReport,
    listFloodReports,
    resolveFloodReport,
} from "../../services/floodReportsService";

const fieldClass = "mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const levelOptions = ["Evacuate", "Alert", "Monitor"];
const initialForm = {
    locationName: "",
    level: "Monitor",
    radiusMeters: "",
    depthCm: "",
    note: "",
    source: "",
    expiryHours: "6",
    lat: null,
    lng: null,
};

function formatPht(value) {
    return new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Manila",
    }).format(new Date(value));
}

function levelStatus(level) {
    return level.toLowerCase();
}

export default function AdminLocations() {
    const { session } = useAuth();
    const [reports, setReports] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});

    async function loadReports() {
        setLoading(true);
        try {
            setReports(await listFloodReports());
            setError("");
        } catch (loadError) {
            console.error("Unable to load flood reports.", loadError);
            setError(loadError.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadReports();
        const timer = window.setInterval(loadReports, 60 * 1000);
        return () => window.clearInterval(timer);
    }, []);

    function updateForm(changes) {
        setForm((current) => ({ ...current, ...changes }));
    }

    function selectPoint(point) {
        if (point instanceof Error) {
            setError(point.message);
            return;
        }
        updateForm(point);
        setError("");
    }

    async function submit(event) {
        event.preventDefault();
        setMessage("");
        setError("");
        setFieldErrors({});
        if (form.lat === null || form.lng === null) {
            setError("Choose a location on the map first.");
            return;
        }
        setSaving(true);
        try {
            const expiresAt = new Date(
                Date.now() + Number(form.expiryHours) * 60 * 60 * 1000,
            ).toISOString();
            await createFloodReport({
                locationName: form.locationName,
                level: form.level,
                radiusMeters: form.radiusMeters,
                depthCm: form.depthCm,
                note: form.note,
                source: form.source,
                lat: form.lat,
                lng: form.lng,
                expiresAt,
            }, session);
            setForm(initialForm);
            setMessage("Flood report entered.");
            await loadReports();
        } catch (saveError) {
            console.error("Unable to enter flood report.", saveError);
            setError(saveError.message);
            setFieldErrors(saveError.fields || {});
        } finally {
            setSaving(false);
        }
    }

    async function resolve(report) {
        setMessage("");
        setError("");
        try {
            await resolveFloodReport(report.id, session);
            setMessage("Flood report resolved.");
            await loadReports();
        } catch (actionError) {
            console.error("Unable to resolve flood report.", actionError);
            setError(actionError.message);
        }
    }

    async function remove(report) {
        setMessage("");
        setError("");
        try {
            await deleteFloodReport(report.id, session);
            setMessage("Flood report deleted.");
            await loadReports();
        } catch (actionError) {
            console.error("Unable to delete flood report.", actionError);
            setError(actionError.message);
        }
    }

    return (
        <section className="space-y-6">
            <AdminPageHeader
                eyebrow="Admin / Overview"
                title="Flood reports"
                description="Enter and manage active administrator-confirmed flood reports."
                onRefresh={loadReports}
                refreshing={loading}
            />

            {message && <p role="status" className="rounded-lg border border-safe/30 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">{message}</p>}
            {error && (
                <div role="alert" className="rounded-lg border border-risk-high/30 bg-red-50 px-4 py-3 text-sm font-semibold text-risk-high">
                    <p>{error}</p>
                    {Object.entries(fieldErrors).length > 0 && (
                        <ul className="mt-2 list-inside list-disc font-normal">
                            {Object.entries(fieldErrors).map(([field, messageForField]) => (
                                <li key={field}>{field}: {messageForField}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <form onSubmit={submit} className="rounded-xl bg-white p-5 shadow-card">
                <h2 className="text-lg font-extrabold text-secondary">Enter flood report</h2>
                <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-xs font-bold text-text/70">
                            Location name
                            <input required maxLength={160} value={form.locationName} onChange={(event) => updateForm({ locationName: event.target.value })} className={fieldClass} aria-invalid={Boolean(fieldErrors.locationName)} />
                        </label>
                        <label className="text-xs font-bold text-text/70">
                            Level
                            <select value={form.level} onChange={(event) => updateForm({ level: event.target.value })} className={fieldClass}>
                                {levelOptions.map((level) => <option key={level}>{level}</option>)}
                            </select>
                        </label>
                        <label className="text-xs font-bold text-text/70">
                            Radius (meters)
                            <input required type="number" min="50" max="5000" step="1" value={form.radiusMeters} onChange={(event) => updateForm({ radiusMeters: event.target.value })} className={fieldClass} aria-invalid={Boolean(fieldErrors.radiusMeters)} />
                        </label>
                        <label className="text-xs font-bold text-text/70">
                            Depth (cm, optional)
                            <input type="number" min="0" max="1000" step="1" value={form.depthCm} onChange={(event) => updateForm({ depthCm: event.target.value })} className={fieldClass} aria-invalid={Boolean(fieldErrors.depthCm)} />
                        </label>
                        <label className="text-xs font-bold text-text/70">
                            Source
                            <input required maxLength={160} value={form.source} onChange={(event) => updateForm({ source: event.target.value })} className={fieldClass} />
                        </label>
                        <label className="text-xs font-bold text-text/70">
                            Expires in
                            <select value={form.expiryHours} onChange={(event) => updateForm({ expiryHours: event.target.value })} className={fieldClass}>
                                <option value="1">1 hour</option>
                                <option value="6">6 hours</option>
                                <option value="12">12 hours</option>
                                <option value="24">24 hours</option>
                            </select>
                        </label>
                        <label className="text-xs font-bold text-text/70 sm:col-span-2">
                            Note
                            <textarea maxLength={1000} rows="3" value={form.note} onChange={(event) => updateForm({ note: event.target.value })} className={fieldClass} />
                        </label>
                        <button type="submit" disabled={saving} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2">
                            {saving ? "Saving..." : "Enter flood report"}
                        </button>
                    </div>
                    <FloodReportEntryMap
                        latitude={form.lat}
                        longitude={form.lng}
                        level={form.level}
                        radiusMeters={form.radiusMeters}
                        onSelect={selectPoint}
                    />
                </div>
            </form>

            <section className="rounded-xl bg-white p-5 shadow-card">
                <h2 className="text-lg font-extrabold text-secondary">Active flood reports</h2>
                <div className="mt-4 space-y-3">
                    {!loading && !reports.length && <EmptyState message="No active flood reports" />}
                    {reports.map((report) => (
                        <article key={report.id} className="rounded-lg border border-gray-200 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-extrabold text-secondary">{report.locationName}</h3>
                                    <p className="mt-1 text-xs text-text/60">{report.source} · Entered {formatPht(report.createdAt)} PHT</p>
                                </div>
                                <StatusPill status={levelStatus(report.level)} />
                            </div>
                            <p className="mt-3 text-sm text-text/75">{report.note || "No note provided."}</p>
                            <p className="mt-2 text-xs text-text/55">Expires {formatPht(report.expiresAt)} PHT · Radius {report.radiusMeters} m{report.depthCm === undefined ? "" : ` · Depth ${report.depthCm} cm`}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <button type="button" onClick={() => resolve(report)} className="min-h-10 rounded-lg border border-safe px-3 text-xs font-bold text-safe">Resolve</button>
                                <button type="button" onClick={() => remove(report)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-risk-high px-3 text-xs font-bold text-risk-high"><Trash2 size={14} /> Delete</button>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </section>
    );
}
