import { useEffect, useState } from "react";
import { Building2, Plus, Trash2 } from "lucide-react";
import {
    listEvacuationCenters,
    saveEvacuationCenter,
    deleteEvacuationCenter,
} from "../../services/admin/evacuationCentersService";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import EmptyState from "../../components/admin/EmptyState";
import ErrorState from "../../components/admin/ErrorState";
import LoadingState from "../../components/admin/LoadingState";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import SectionPanel from "../../components/admin/SectionPanel";

const emptyForm = { name: "", address: "", capacity: "" };

const inputClass =
    "min-h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus-visible:ring-2 focus:ring-primary";

export default function AdminEvacuationCenters() {
    const [items, setItems] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [remove, setRemove] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const load = () => {
        setLoading(true);
        setError("");
        listEvacuationCenters()
            .then(setItems)
            .catch((loadError) =>
                setError(loadError.message || "Unable to load evacuation centers."),
            )
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    async function submit(event) {
        event.preventDefault();
        setSaving(true);
        try {
            await saveEvacuationCenter(form);
            setForm(emptyForm);
            setNotice("Evacuation center added successfully.");
            load();
        } catch (saveError) {
            setError(saveError.message || "Unable to save evacuation center.");
        } finally {
            setSaving(false);
        }
    }

    async function removeCenter() {
        try {
            await deleteEvacuationCenter(remove.id);
            setRemove(null);
            setNotice("Evacuation center removed.");
            load();
        } catch (deleteError) {
            setError(deleteError.message || "Unable to remove evacuation center.");
        }
    }

    if (loading) return <LoadingState message="Loading evacuation centers..." />;

    return (
        <section className="space-y-6">
            <AdminPageHeader
                eyebrow="Admin / Resources"
                title="Evacuation centers"
                description="Maintain shelter capacity information for residents who need a safe place during an incident."
                onRefresh={load}
                refreshing={loading}
            />

            {notice && (
                <p
                    role="status"
                    className="rounded-lg border border-safe/30 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
                >
                    {notice}
                </p>
            )}

            {error && <ErrorState message={error} onRetry={load} />}

            <SectionPanel
                title="Add an evacuation center"
                description="Capacity and occupancy are sample values until connected to an operations data source."
            >
                <form
                    onSubmit={submit}
                    className="grid gap-3 p-5 md:grid-cols-[1.2fr_1.4fr_0.7fr_auto]"
                >
                    <input
                        required
                        value={form.name}
                        onChange={(event) =>
                            setForm({ ...form, name: event.target.value })
                        }
                        placeholder="Center name"
                        className={inputClass}
                    />
                    <input
                        required
                        value={form.address}
                        onChange={(event) =>
                            setForm({ ...form, address: event.target.value })
                        }
                        placeholder="Address or barangay"
                        className={inputClass}
                    />
                    <input
                        required
                        min="1"
                        type="number"
                        value={form.capacity}
                        onChange={(event) =>
                            setForm({ ...form, capacity: event.target.value })
                        }
                        placeholder="Capacity"
                        className={inputClass}
                    />
                    <button
                        disabled={saving}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white disabled:opacity-60"
                    >
                        <Plus size={16} /> {saving ? "Adding..." : "Add center"}
                    </button>
                </form>
            </SectionPanel>

            {!items.length ? (
                <EmptyState
                    icon={Building2}
                    title="No evacuation centers configured"
                    message="Add a center above to make shelter information available."
                />
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {items.map((item) => {
                        const occupancy = item.capacity
                            ? Math.round((item.occupied / item.capacity) * 100)
                            : 0;

                        return (
                            <SectionPanel key={item.id} className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                                            <Building2 size={20} />
                                        </span>
                                        <div>
                                            <h2 className="font-extrabold text-secondary">
                                                {item.name}
                                            </h2>
                                            <p className="text-sm text-text/60">
                                                {item.address}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                                            item.status === "open"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-text/60"
                                        }`}
                                    >
                                        {item.status}
                                    </span>
                                </div>

                                <div className="mt-5 flex items-end justify-between">
                                    <div>
                                        <p className="text-xs text-text/55">Occupancy</p>
                                        <p className="mt-1 text-xl font-extrabold text-secondary">
                                            {item.occupied}{" "}
                                            <span className="text-sm font-semibold text-text/50">
                                                / {item.capacity}
                                            </span>
                                        </p>
                                    </div>
                                    <p className="text-sm font-bold text-secondary">
                                        {occupancy}%
                                    </p>
                                </div>

                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                                    <div
                                        className="h-full rounded-full bg-primary"
                                        style={{ width: `${Math.min(occupancy, 100)}%` }}
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setRemove(item)}
                                    className="mt-5 inline-flex min-h-10 items-center gap-1 rounded-lg px-3 text-xs font-bold text-risk-high hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-risk-high"
                                >
                                    <Trash2 size={15} /> Delete
                                </button>
                            </SectionPanel>
                        );
                    })}
                </div>
            )}

            <ConfirmDialog
                open={Boolean(remove)}
                title="Delete evacuation center"
                message={`Delete ${remove?.name}? This center will be removed from the admin directory.`}
                onCancel={() => setRemove(null)}
                onConfirm={removeCenter}
            />
        </section>
    );
}