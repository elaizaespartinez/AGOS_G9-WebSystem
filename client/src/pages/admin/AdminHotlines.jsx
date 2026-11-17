import { useEffect, useState } from "react";
import { Phone, Plus, Trash2 } from "lucide-react";
import {
    listHotlines,
    saveHotline,
    deleteHotline,
} from "../../services/admin/hotlinesService";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import EmptyState from "../../components/admin/EmptyState";
import ErrorState from "../../components/admin/ErrorState";
import LoadingState from "../../components/admin/LoadingState";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import SectionPanel from "../../components/admin/SectionPanel";

const emptyForm = { name: "", number: "", category: "" };

const formFields = [
    ["name", "Agency or service"],
    ["number", "Phone number"],
    ["category", "Category (optional)"],
];

export default function AdminHotlines() {
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
        listHotlines()
            .then(setItems)
            .catch((loadError) =>
                setError(loadError.message || "Unable to load hotlines."),
            )
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    async function submit(event) {
        event.preventDefault();
        setSaving(true);
        try {
            await saveHotline(form);
            setForm(emptyForm);
            setNotice("Hotline added successfully.");
            load();
        } catch (saveError) {
            setError(saveError.message || "Unable to save hotline.");
        } finally {
            setSaving(false);
        }
    }

    async function removeHotline() {
        try {
            await deleteHotline(remove.id);
            setRemove(null);
            setNotice("Hotline removed.");
            load();
        } catch (deleteError) {
            setError(deleteError.message || "Unable to remove hotline.");
        }
    }

    if (loading) return <LoadingState message="Loading emergency hotlines..." />;

    return (
        <section className="space-y-6">
            <AdminPageHeader
                eyebrow="Admin / Resources"
                title="Emergency hotlines"
                description="Keep public emergency contact details current and easy to reach."
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
                title="Add a hotline"
                description="Use a clear agency name and a number that commuters can call."
            >
                <form
                    onSubmit={submit}
                    className="grid gap-3 p-5 md:grid-cols-[1.4fr_1fr_1fr_auto]"
                >
                    {formFields.map(([key, placeholder]) => (
                        <input
                            key={key}
                            required={key !== "category"}
                            value={form[key]}
                            onChange={(event) =>
                                setForm({ ...form, [key]: event.target.value })
                            }
                            placeholder={placeholder}
                            className="min-h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        />
                    ))}
                    <button
                        disabled={saving}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white disabled:opacity-60"
                    >
                        <Plus size={16} /> {saving ? "Adding..." : "Add hotline"}
                    </button>
                </form>
            </SectionPanel>

            {!items.length ? (
                <EmptyState
                    icon={Phone}
                    title="No hotlines configured"
                    message="Add the first emergency contact above."
                />
            ) : (
                <SectionPanel
                    title="Published contacts"
                    description={`${items.length} contact${items.length === 1 ? "" : "s"} available in the admin directory.`}
                >
                    <div className="divide-y divide-gray-100">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="grid h-10 w-10 place-items-center rounded-full bg-green-100 text-green-700">
                                        <Phone size={18} />
                                    </span>
                                    <div>
                                        <p className="font-bold text-secondary">
                                            {item.name}
                                        </p>
                                        <p className="text-sm text-text/60">
                                            {item.number}
                                            {item.category
                                                ? ` · ${item.category}`
                                                : ""}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setRemove(item)}
                                    className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 text-xs font-bold text-risk-high hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-risk-high"
                                >
                                    <Trash2 size={15} /> Delete
                                </button>
                            </div>
                        ))}
                    </div>
                </SectionPanel>
            )}

            <ConfirmDialog
                open={Boolean(remove)}
                title="Delete hotline"
                message={`Delete ${remove?.name}? This contact will no longer appear in the directory.`}
                onCancel={() => setRemove(null)}
                onConfirm={removeHotline}
            />
        </section>
    );
}