import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMapEvents } from "react-leaflet";
import { BusFront, CheckCircle2, Clock3, Pencil, Route, Trash2, TriangleAlert, Undo2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import EmptyState from "../../components/admin/EmptyState";
import ErrorState from "../../components/admin/ErrorState";
import LoadingState from "../../components/admin/LoadingState";
import SectionPanel from "../../components/admin/SectionPanel";
import StatusPill from "../../components/admin/StatusPill";
import { formatRelativeTime } from "../../lib/adminRules";
import { listFloodReports, subscribeToFloodReports } from "../../services/floodReportsService";
import {
    deleteRoute,
    getEffectiveRoute,
    listRoutes,
    saveRoute,
    setRouteStatus,
    subscribeToRoutes,
} from "../../services/transportRoutesService";

const BATANGAS_CENTER = [13.7565, 121.0583];
const routeTypes = ["Local jeepney", "Tricycle"];
const statusOptions = ["safe", "monitor", "affected", "evacuate"];
const fieldClass = "mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const emptyForm = { id: null, code: "", name: "", routeType: routeTypes[0], waypoints: [] };

function WaypointClickHandler({ onAdd }) {
    useMapEvents({ click: ({ latlng }) => onAdd([latlng.lat, latlng.lng]) });
    return null;
}

function WaypointMap({ waypoints, onAdd }) {
    return (
        <div className="relative h-72 overflow-hidden rounded-xl border border-gray-200">
            <MapContainer center={BATANGAS_CENTER} zoom={13} scrollWheelZoom className="h-full w-full">
                <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <WaypointClickHandler onAdd={onAdd} />
                {waypoints.length > 1 && <Polyline positions={waypoints} pathOptions={{ color: "#1d4ed8", weight: 4 }} />}
                {waypoints.map((point, index) => (
                    <CircleMarker key={`${point[0]}-${point[1]}-${index}`} center={point} radius={7} pathOptions={{ color: "#fff", fillColor: "#1d4ed8", fillOpacity: 1, weight: 2 }}>
                        <span>{index + 1}</span>
                    </CircleMarker>
                ))}
            </MapContainer>
            <p className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-text/70 shadow-card">
                Click the map to add ordered waypoints.
            </p>
        </div>
    );
}

export default function AdminTransportation() {
    const [routes, setRoutes] = useState([]);
    const [floodReports, setFloodReports] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [reasons, setReasons] = useState({});
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    async function loadData() {
        setLoading(true);
        try {
            const [routeData, reportData] = await Promise.all([listRoutes(), listFloodReports()]);
            setRoutes(routeData);
            setFloodReports(reportData);
            setError("");
        } catch (loadError) {
            console.error("Unable to load transportation data.", loadError);
            setError(loadError.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
        const unsubscribeRoutes = subscribeToRoutes(loadData);
        const unsubscribeReports = subscribeToFloodReports(loadData);
        return () => {
            unsubscribeRoutes();
            unsubscribeReports();
        };
    }, []);

    const visibleRoutes = useMemo(
        () => filter === "all" ? routes : routes.filter((route) => route.status === filter),
        [filter, routes],
    );
    const routesWithOverlap = routes.map((route) => getEffectiveRoute(route, floodReports));
    const attentionCount = routes.filter((route) => ["affected", "evacuate"].includes(route.status)).length;

    function updateForm(changes) {
        setForm((current) => ({ ...current, ...changes }));
    }

    function editRoute(route) {
        setForm({
            id: route.id,
            code: route.code,
            name: route.name,
            routeType: route.routeType,
            waypoints: route.waypoints,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function addWaypoint(point) {
        updateForm({ waypoints: [...form.waypoints, point] });
    }

    function undoWaypoint() {
        updateForm({ waypoints: form.waypoints.slice(0, -1) });
    }

    async function submit(event) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setNotice("");
        try {
            await saveRoute(form);
            setForm(emptyForm);
            setNotice("Route saved.");
            await loadData();
        } catch (saveError) {
            console.error("Unable to save transport route.", saveError);
            setError(saveError.message);
        } finally {
            setSaving(false);
        }
    }

    async function changeStatus(route, status) {
        const reason = reasons[route.id] || "";
        try {
            const updated = await setRouteStatus(route.id, status, reason);
            setRoutes((current) => current.map((item) => item.id === updated.id ? updated : item));
            setNotice("Route status updated.");
        } catch (actionError) {
            setError(actionError.message);
        }
    }

    async function removeRoute(route) {
        if (!window.confirm(`Remove ${route.code} from public routes?`)) return;
        try {
            await deleteRoute(route.id);
            setRoutes((current) => current.filter((item) => item.id !== route.id));
            setNotice("Route removed.");
        } catch (actionError) {
            setError(actionError.message);
        }
    }

    if (loading) return <LoadingState message="Loading transportation routes..." />;
    if (error && !routes.length) return <ErrorState message={error} onRetry={loadData} />;

    return (
        <section className="space-y-6">
            <AdminPageHeader
                eyebrow="Admin / Operations"
                title="Transportation monitoring"
                description="Manage local routes and publish current operating conditions."
                onRefresh={loadData}
                refreshing={loading}
            />
            {error && <p role="alert" className="rounded-lg border border-risk-high/30 bg-red-50 px-4 py-3 text-sm font-semibold text-risk-high">{error}</p>}
            {notice && <p role="status" className="rounded-lg border border-safe/30 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">{notice}</p>}

            <form onSubmit={submit} className="rounded-xl bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-extrabold text-secondary">{form.id ? "Edit route" : "Add local route"}</h2>
                        <p className="mt-1 text-xs text-text/60">Map at least two waypoints to calculate the road path.</p>
                    </div>
                    {form.id && <button type="button" onClick={() => setForm(emptyForm)} className="text-xs font-bold text-primary">Cancel edit</button>}
                </div>
                <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-xs font-bold text-text/70">Code<input required maxLength={40} value={form.code} onChange={(event) => updateForm({ code: event.target.value })} className={fieldClass} /></label>
                        <label className="text-xs font-bold text-text/70">Name<input required maxLength={160} value={form.name} onChange={(event) => updateForm({ name: event.target.value })} className={fieldClass} /></label>
                        <label className="text-xs font-bold text-text/70 sm:col-span-2">Type<select value={form.routeType} onChange={(event) => updateForm({ routeType: event.target.value })} className={fieldClass}>{routeTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
                        <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                            <span className="text-xs font-semibold text-text/60">{form.waypoints.length} waypoint{form.waypoints.length === 1 ? "" : "s"}</span>
                            <button type="button" onClick={undoWaypoint} disabled={!form.waypoints.length} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-bold text-text/70 disabled:opacity-40"><Undo2 size={14} /> Undo</button>
                            <button type="button" onClick={() => updateForm({ waypoints: [] })} disabled={!form.waypoints.length} className="min-h-9 rounded-lg border border-gray-200 px-3 text-xs font-bold text-text/70 disabled:opacity-40">Clear</button>
                        </div>
                        <button type="submit" disabled={saving} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2">{saving ? "Saving..." : form.id ? "Save route changes" : "Add route"}</button>
                    </div>
                    <WaypointMap waypoints={form.waypoints} onAdd={addWaypoint} />
                </div>
            </form>

            <div className="grid gap-4 sm:grid-cols-3">
                {[
                    ["Routes tracked", routes.length, Route],
                    ["Need attention", attentionCount, TriangleAlert],
                    ["Operating normally", routes.filter((route) => route.status === "safe").length, CheckCircle2],
                ].map(([label, value, Icon]) => <div key={label} className="rounded-xl bg-white p-5 shadow-card"><Icon size={20} className="text-primary" /><p className="mt-3 text-xs font-semibold text-text/60">{label}</p><p className="mt-1 text-2xl font-extrabold text-secondary">{value}</p></div>)}
            </div>

            <SectionPanel title="Route status" description="Non-safe statuses require a reason.">
                <div className="flex flex-wrap gap-2 border-b border-gray-100 px-5 py-4">
                    {["all", ...statusOptions].map((option) => <button key={option} type="button" onClick={() => setFilter(option)} className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${filter === option ? "bg-primary text-white" : "bg-background text-text/65 hover:text-primary"}`}>{option === "all" ? "All routes" : option}</button>)}
                </div>
                {!visibleRoutes.length ? <EmptyState message="No active routes match this filter." /> : (
                    <div className="divide-y divide-gray-100">
                        {visibleRoutes.map((route) => {
                            const effective = routesWithOverlap.find((item) => item.id === route.id);
                            return <div key={route.id} className="px-5 py-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><BusFront size={20} /></span><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-extrabold text-secondary">{route.name}</h3><span className="text-xs font-bold text-text/45">{route.code}</span></div><p className="mt-1 text-xs text-text/60">{route.routeType} · {route.reason}</p><p className="mt-2 flex items-center gap-1 text-xs text-text/45"><Clock3 size={13} /> Updated {formatRelativeTime(route.updatedAt)}</p></div></div>
                                    <div className="flex flex-wrap items-center gap-2"><StatusPill status={route.status} />{effective?.overlap && <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-900">Flood report overlaps</span>}</div>
                                </div>
                                <div className="mt-4 flex flex-wrap items-center gap-2 sm:justify-end">{statusOptions.map((status) => <button key={status} type="button" onClick={() => changeStatus(route, status)} className={`rounded-lg border px-3 py-2 text-xs font-bold capitalize ${route.status === status ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-text/60 hover:border-primary hover:text-primary"}`}>{status}</button>)}<button type="button" onClick={() => editRoute(route)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-text/70"><Pencil size={14} /> Edit</button><button type="button" onClick={() => removeRoute(route)} className="inline-flex items-center gap-1 rounded-lg border border-risk-high px-3 py-2 text-xs font-bold text-risk-high"><Trash2 size={14} /> Remove</button></div>
                                {route.status !== "safe" && <input aria-label={`Reason for ${route.code}`} value={reasons[route.id] || ""} onChange={(event) => setReasons((current) => ({ ...current, [route.id]: event.target.value }))} placeholder="Reason required for non-safe status" className={fieldClass} />}
                            </div>;
                        })}
                    </div>
                )}
            </SectionPanel>
        </section>
    );
}
