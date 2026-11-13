import { useMemo, useState } from "react";
import {
    CirclePlus,
    Crosshair,
    Filter,
    MapPin,
    Pencil,
    RotateCcw,
    Search,
    Trash2,
} from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import EmptyState from "../../components/admin/EmptyState";
import HazardMap from "../../components/admin/HazardMap";
import HazardZoneForm, {
    defaultHazardZone,
} from "../../components/admin/HazardZoneForm";
import SectionPanel from "../../components/admin/SectionPanel";
import StatusPill from "../../components/admin/StatusPill";
import {
    mockHazardZones,
    hazardSeverities,
    hazardStatuses,
    hazardTypes,
} from "../../data/hazardZonesData";

const severityStatusStyles = {
    Low: "safe",
    Moderate: "monitor",
    High: "affected",
    Critical: "evacuate",
};

const selectClass = "min-h-10 rounded-lg border border-gray-300 px-2 text-xs";

const toLocalDateTime = (date) => {
    if (!date) return "";
    const local = new Date(date);
    const offset = local.getTimezoneOffset() * 60000;
    return new Date(local.getTime() - offset).toISOString().slice(0, 16);
};

const zoneToForm = (zone) => ({
    title: zone.title,
    type: zone.type,
    severity: zone.severity,
    description: zone.description,
    latitude: zone.latitude,
    longitude: zone.longitude,
    radius: zone.radius,
    radiusUnit: zone.radiusUnit,
    status: zone.status,
    expiresAt: toLocalDateTime(zone.expiresAt),
    location: zone.location,
});

const radiusLabel = (zone) =>
    `${zone.radius} ${zone.radiusUnit === "kilometers" ? "km" : "m"}`;

const coordinateLabel = (zone) =>
    `${Number(zone.latitude).toFixed(4)}, ${Number(zone.longitude).toFixed(4)}`;

export default function AdminLocations() {
    const [zones, setZones] = useState(mockHazardZones);
    const [selectedZone, setSelectedZone] = useState(null);
    const [form, setForm] = useState(null);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All types");
    const [severityFilter, setSeverityFilter] = useState("All severities");
    const [statusFilter, setStatusFilter] = useState("All statuses");
    const [showZones, setShowZones] = useState(true);
    const [focusRequest, setFocusRequest] = useState(null);
    const [resetRequest, setResetRequest] = useState(0);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [notice, setNotice] = useState("");

    const visibleZones = useMemo(() => {
        const query = search.trim().toLowerCase();
        return zones.filter((zone) => {
            const matchesSearch =
                !query ||
                `${zone.title} ${zone.location}`.toLowerCase().includes(query);
            return (
                matchesSearch &&
                (typeFilter === "All types" || zone.type === typeFilter) &&
                (severityFilter === "All severities" ||
                    zone.severity === severityFilter) &&
                (statusFilter === "All statuses" ||
                    zone.status === statusFilter)
            );
        });
    }, [search, severityFilter, statusFilter, typeFilter, zones]);

    const draftPoint =
        form &&
        Number.isFinite(Number(form.latitude)) &&
        Number.isFinite(Number(form.longitude))
            ? {
                  latitude: Number(form.latitude),
                  longitude: Number(form.longitude),
              }
            : null;

    const draftZone =
        draftPoint && form && Number(form.radius) > 0
            ? {
                  severity: form.severity,
                  radius: Number(form.radius),
                  radiusUnit: form.radiusUnit,
              }
            : null;

    function selectZone(zone) {
        setSelectedZone(zone);
        setNotice("");
        setFocusRequest({
            id: zone.id,
            latitude: zone.latitude,
            longitude: zone.longitude,
        });
    }

    function selectMapPoint(point) {
        setSelectedZone(null);
        setNotice("");
        setForm((current) => ({
            ...(current || defaultHazardZone),
            latitude: point.latitude.toFixed(6),
            longitude: point.longitude.toFixed(6),
        }));
    }

    function startCreate() {
        setSelectedZone(null);
        setNotice("");
        setForm({ ...defaultHazardZone });
    }

    function startEdit(zone) {
        selectZone(zone);
        setForm(zoneToForm(zone));
    }

    function clearPoint() {
        setForm((current) =>
            current ? { ...current, latitude: "", longitude: "" } : current,
        );
    }

    function updateForm(changes) {
        setForm((current) => ({ ...current, ...changes }));
    }

    function saveZone(event) {
        event.preventDefault();
        if (!form || !draftPoint || Number(form.radius) <= 0) return;

        const normalized = {
            ...form,
            latitude: Number(form.latitude),
            longitude: Number(form.longitude),
            radius: Number(form.radius),
            expiresAt: form.expiresAt
                ? new Date(form.expiresAt).toISOString()
                : null,
            location: form.location || "Selected map location",
        };

        if (selectedZone) {
            const updated = { ...selectedZone, ...normalized };
            setZones((current) =>
                current.map((zone) =>
                    zone.id === selectedZone.id ? updated : zone,
                ),
            );
            setSelectedZone(updated);
            setFocusRequest({
                id: updated.id,
                latitude: updated.latitude,
                longitude: updated.longitude,
            });
            setNotice("Hazard zone updated in this frontend preview.");
        } else {
            const created = {
                ...normalized,
                id: `HZ-${Date.now()}`,
                createdAt: new Date().toISOString(),
            };
            setZones((current) => [created, ...current]);
            setSelectedZone(created);
            setFocusRequest({
                id: created.id,
                latitude: created.latitude,
                longitude: created.longitude,
            });
            setNotice("Hazard zone created in this frontend preview.");
        }
        setForm(null);
    }

    function resolveZone(zone) {
        const resolved = { ...zone, status: "Resolved" };
        setZones((current) =>
            current.map((item) => (item.id === zone.id ? resolved : item)),
        );
        setSelectedZone(resolved);
        setNotice("Hazard zone marked as resolved in this frontend preview.");
    }

    function deleteZone() {
        setZones((current) =>
            current.filter((zone) => zone.id !== confirmDelete.id),
        );
        if (selectedZone?.id === confirmDelete.id) setSelectedZone(null);
        if (form && selectedZone?.id === confirmDelete.id) setForm(null);
        setConfirmDelete(null);
        setNotice("Hazard zone deleted from this frontend preview.");
    }

    return (
        <section className="space-y-6">
            <AdminPageHeader
                eyebrow="Admin / Overview"
                title="Hazard monitoring"
                description="Create radius-based hazard zones around Batangas City for operational review. Demonstration data only."
                actions={
                    <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
                        Frontend preview
                    </span>
                }
            />

            {notice && (
                <p
                    role="status"
                    className="rounded-lg border border-safe/30 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
                >
                    {notice}
                </p>
            )}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.8fr)]">
                <SectionPanel
                    title="Hazard zone map"
                    description="Click the map to choose a center point. Circles show the configured affected radius."
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowZones((current) => !current)
                                }
                                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-secondary"
                            >
                                {showZones ? "Hide zones" : "Show zones"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setResetRequest((current) => current + 1);
                                    setSelectedZone(null);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-secondary"
                            >
                                <RotateCcw size={14} /> Reset view
                            </button>
                        </div>
                    }
                >
                    <HazardMap
                        zones={visibleZones}
                        selectedZone={selectedZone}
                        draftPoint={form ? draftPoint : null}
                        draftZone={draftZone}
                        showZones={showZones}
                        onMapClick={selectMapPoint}
                        onSelectZone={selectZone}
                        focusRequest={focusRequest}
                        resetRequest={resetRequest}
                    />
                </SectionPanel>

                <div className="space-y-6">
                    <SectionPanel
                        title="Zone management"
                        description="Search and filter the mock hazard zones."
                    >
                        <div className="space-y-3 p-5">
                            <label className="relative block">
                                <Search
                                    size={16}
                                    className="absolute left-3 top-3 text-text/45"
                                />
                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search hazard or location"
                                    className="min-h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                />
                            </label>

                            <div className="flex items-center gap-2 text-xs font-bold text-text/55">
                                <Filter size={14} /> Filters
                            </div>

                            <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                                <select
                                    value={typeFilter}
                                    onChange={(event) =>
                                        setTypeFilter(event.target.value)
                                    }
                                    className={selectClass}
                                >
                                    <option>All types</option>
                                    {hazardTypes.map((type) => (
                                        <option key={type}>{type}</option>
                                    ))}
                                </select>
                                <select
                                    value={severityFilter}
                                    onChange={(event) =>
                                        setSeverityFilter(event.target.value)
                                    }
                                    className={selectClass}
                                >
                                    <option>All severities</option>
                                    {hazardSeverities.map((severity) => (
                                        <option key={severity}>
                                            {severity}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(event.target.value)
                                    }
                                    className={selectClass}
                                >
                                    <option>All statuses</option>
                                    {hazardStatuses.map((status) => (
                                        <option key={status}>{status}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={startCreate}
                                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-primary-hover"
                            >
                                <CirclePlus size={17} /> Create hazard zone
                            </button>
                        </div>
                    </SectionPanel>

                    <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                        {!visibleZones.length ? (
                            <EmptyState
                                icon={MapPin}
                                title="No matching hazard zones"
                                message="Try a different search or filter."
                            />
                        ) : (
                            visibleZones.map((zone) => (
                                <button
                                    key={zone.id}
                                    type="button"
                                    onClick={() => selectZone(zone)}
                                    className={`w-full rounded-xl bg-white p-4 text-left shadow-card transition hover:shadow-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                        selectedZone?.id === zone.id
                                            ? "ring-2 ring-primary"
                                            : ""
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate font-extrabold text-secondary">
                                                {zone.title}
                                            </p>
                                            <p className="mt-1 truncate text-xs text-text/55">
                                                {zone.type} · {zone.location}
                                            </p>
                                        </div>
                                        <StatusPill
                                            status={
                                                severityStatusStyles[
                                                    zone.severity
                                                ]
                                            }
                                        />
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-xs text-text/60">
                                        <span>{radiusLabel(zone)} radius</span>
                                        <span className="capitalize">
                                            {zone.status}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {form && (
                <SectionPanel title="" className="p-5">
                    <HazardZoneForm
                        value={form}
                        editing={Boolean(selectedZone)}
                        saving={false}
                        onChange={updateForm}
                        onSubmit={saveZone}
                        onCancel={() => setForm(null)}
                        onClearPoint={clearPoint}
                    />
                </SectionPanel>
            )}

            {selectedZone && !form && (
                <SectionPanel
                    title="Selected hazard zone"
                    description="Click Edit to adjust the center, radius, or hazard details."
                    actions={
                        <button
                            type="button"
                            onClick={() => setSelectedZone(null)}
                            className="text-xs font-bold text-text/55"
                        >
                            Clear selection
                        </button>
                    }
                >
                    <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto]">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-extrabold text-secondary">
                                    {selectedZone.title}
                                </h2>
                                <StatusPill
                                    status={
                                        severityStatusStyles[
                                            selectedZone.severity
                                        ]
                                    }
                                />
                                <StatusPill
                                    status={selectedZone.status.toLowerCase()}
                                />
                            </div>
                            <p className="mt-2 text-sm text-text/70">
                                {selectedZone.description}
                            </p>
                            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                                <div>
                                    <dt className="text-xs text-text/50">
                                        Hazard type
                                    </dt>
                                    <dd className="font-bold text-secondary">
                                        {selectedZone.type}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-text/50">
                                        Affected radius
                                    </dt>
                                    <dd className="font-bold text-secondary">
                                        {radiusLabel(selectedZone)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-text/50">
                                        Center coordinates
                                    </dt>
                                    <dd className="font-mono text-xs font-bold text-secondary">
                                        {coordinateLabel(selectedZone)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-text/50">
                                        Expiration
                                    </dt>
                                    <dd className="font-bold text-secondary">
                                        {selectedZone.expiresAt
                                            ? new Date(
                                                  selectedZone.expiresAt,
                                              ).toLocaleString()
                                            : "Not set"}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="flex flex-wrap items-start gap-2 lg:flex-col">
                            <button
                                type="button"
                                onClick={() => startEdit(selectedZone)}
                                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary px-3 text-xs font-bold text-primary"
                            >
                                <Pencil size={14} /> Edit
                            </button>
                            {selectedZone.status === "Active" && (
                                <button
                                    type="button"
                                    onClick={() => resolveZone(selectedZone)}
                                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-safe px-3 text-xs font-bold text-safe"
                                >
                                    <Crosshair size={14} /> Resolve
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(selectedZone)}
                                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-risk-high px-3 text-xs font-bold text-risk-high"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    </div>
                </SectionPanel>
            )}

            <ConfirmDialog
                open={Boolean(confirmDelete)}
                title="Delete hazard zone"
                message={`Delete ${confirmDelete?.title}? This will remove it from the frontend preview.`}
                onCancel={() => setConfirmDelete(null)}
                onConfirm={deleteZone}
            />
        </section>
    );
}