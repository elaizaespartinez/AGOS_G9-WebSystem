import { useEffect, useMemo, useState } from "react";
import {
    Archive,
    Bell,
    Check,
    Clock3,
    Edit3,
    Megaphone,
    Plus,
    Radio,
    Send,
    XCircle,
} from "lucide-react";
import {
    ALERT_SEVERITIES,
    ANNOUNCEMENT_CATEGORIES,
    ANNOUNCEMENT_SEVERITIES,
    listAlerts,
    listCommunicationLocations,
    listCommunicationsAnnouncements,
    saveAlert,
    saveCommunicationAnnouncement,
    subscribeToCommunications,
    updateAlertStatus,
    updateCommunicationAnnouncementStatus,
} from "../../services/admin/communicationsService";
import ErrorState from "../../components/admin/ErrorState";
import Toast from "../../components/admin/Toast";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import LoadingState from "../../components/admin/LoadingState";

const emptyAlert = {
    title: "",
    severity: "monitor",
    description: "",
    affectedBarangays: "",
    startsAt: "",
    expiresAt: "",
    source: "",
    status: "draft",
};

const emptyAnnouncement = {
    title: "",
    category: "Advisory",
    content: "",
    affectedAreas: "",
    attachmentUrl: "",
    source: "",
    publishedAt: "",
    status: "draft",
};

function AdminCommunications() {
    const [activeTab, setActiveTab] = useState("alerts");
    const [alerts, setAlerts] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [locations, setLocations] = useState([]);
    const [editing, setEditing] = useState(null);
    const [toast, setToast] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        Promise.all([listAlerts(), listCommunicationsAnnouncements(), listCommunicationLocations()])
            .then(([nextAlerts, nextAnnouncements, nextLocations]) => {
                setAlerts(nextAlerts);
                setAnnouncements(nextAnnouncements);
                setLocations(nextLocations);
            })
            .catch((loadError) => setError(loadError.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        const unsubscribe = subscribeToCommunications(load);
        return unsubscribe;
    }, []);

    const items = activeTab === "alerts" ? alerts : announcements;
    const activeCount = useMemo(
        () => alerts.filter(({ status }) => status === "active").length,
        [alerts],
    );

    const save = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const values = Object.fromEntries(formData.entries());
        const submittedStatus = event.nativeEvent.submitter?.value;
        if (submittedStatus) values.status = submittedStatus;
        const isAlert = editing.type === "alert";
        const required = isAlert
            ? ["title", "description", "startsAt", "expiresAt", "source"]
            : ["title", "content", "source"];

        if (required.some((field) => !String(values[field] || "").trim())) {
            setToast("Please complete all required fields.");
            return;
        }

        try {
            if (isAlert) {
                if (new Date(values.expiresAt) <= new Date(values.startsAt)) {
                    setToast("Expiration must be later than the start date.");
                    return;
                }
                await saveAlert({
                    ...values,
                    affectedBarangays: formData.getAll("affectedBarangays"),
                }, editing.item?.id);
            } else {
                await saveCommunicationAnnouncement({
                    ...values,
                    affectedAreas: formData.getAll("affectedAreas"),
                }, editing.item?.id);
            }
            setEditing(null);
            setToast("Communication saved.");
            load();
        } catch (saveError) {
            setToast(saveError.message);
        }
    };

    const changeStatus = async (item, status) => {
        try {
            if (activeTab === "alerts") {
                await updateAlertStatus(item.id, status);
            } else {
                await updateCommunicationAnnouncementStatus(item.id, status);
            }
            setToast(`Item ${status}.`);
            load();
        } catch (statusError) {
            setToast(statusError.message);
        }
    };

    if (loading) return <LoadingState message="Loading alerts and announcements..." />;
    if (error) return <ErrorState message={error} onRetry={load} />;

    return (
        <section>
            <AdminPageHeader
                title="Alerts & announcements"
                description="Publish verified public information separately from automated monitoring."
                onRefresh={load}
                refreshing={loading}
                actions={
                    <button type="button" onClick={() => setEditing({ type: activeTab === "alerts" ? "alert" : "announcement", item: null })} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-white hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        <Plus size={16} /> Create {activeTab === "alerts" ? "alert" : "announcement"}
                    </button>
                }
            />

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Summary label="Active alerts" value={activeCount} />
                <Summary label="Announcements" value={announcements.length} />
                <Summary label="Drafts" value={[...alerts, ...announcements].filter(({ status }) => status === "draft").length} />
            </div>

            <div className="mt-6 rounded-xl bg-white p-2 shadow-card" role="tablist" aria-label="Communication type">
                <button type="button" role="tab" aria-selected={activeTab === "alerts"} onClick={() => setActiveTab("alerts")} className={`min-h-11 w-1/2 cursor-pointer rounded-lg px-4 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeTab === "alerts" ? "bg-secondary text-white" : "text-text/60 hover:bg-background"}`}>
                    <Bell size={16} className="mr-2 inline" /> Alerts
                </button>
                <button type="button" role="tab" aria-selected={activeTab === "announcements"} onClick={() => setActiveTab("announcements")} className={`min-h-11 w-1/2 cursor-pointer rounded-lg px-4 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeTab === "announcements" ? "bg-secondary text-white" : "text-text/60 hover:bg-background"}`}>
                    <Megaphone size={16} className="mr-2 inline" /> Announcements
                </button>
            </div>

            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-text/70">
                <Radio size={15} className="mr-2 inline text-primary" />
                Automated weather and monitoring observations remain on the public announcements page. This workspace manages only manually reviewed communications.
            </div>

            {!items.length ? (
                <div className="mt-6 rounded-xl bg-white p-10 text-center shadow-card">
                    <p className="text-sm text-text/60">No {activeTab} have been created yet.</p>
                </div>
            ) : (
                <div className="mt-6 space-y-3">
                    {items.map((item) => (
                        <article key={item.id} className="rounded-xl bg-white p-5 shadow-card">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-base font-extrabold text-secondary">{item.title}</h2>
                                        <Status status={item.status} />
                                        {activeTab === "announcements" && <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">{item.category}</span>}
                                    </div>
                                    <p className="mt-2 text-sm leading-relaxed text-text/70">{item.description || item.content}</p>
                                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text/55">
                                        <span>Source: {item.source}</span>
                                        <span>Issued by: {item.issuingAdministrator}</span>
                                        <span><Clock3 size={12} className="mr-1 inline" />{item.publishedAt ? new Date(item.publishedAt).toLocaleString() : "Not published"}</span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" onClick={() => setEditing({ type: activeTab === "alerts" ? "alert" : "announcement", item })} className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-lg border border-primary px-3 text-xs font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Edit3 size={14} /> Edit</button>
                                    {activeTab === "alerts" ? <><ActionButton icon={Check} label="Activate" onClick={() => changeStatus(item, "active")} hidden={item.status === "active"} /><ActionButton icon={XCircle} label="Expire" onClick={() => changeStatus(item, "expired")} hidden={item.status === "expired"} /><ActionButton icon={XCircle} label="Cancel" onClick={() => changeStatus(item, "cancelled")} hidden={item.status === "cancelled"} /></> : <><ActionButton icon={Send} label="Publish" onClick={() => changeStatus(item, "published")} hidden={item.status === "published"} /><ActionButton icon={Archive} label="Archive" onClick={() => changeStatus(item, "archived")} hidden={item.status === "archived"} /></>}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {editing && <CommunicationForm type={editing.type} item={editing.item} locations={locations} onSubmit={save} onCancel={() => setEditing(null)} />}
            <Toast message={toast} onClose={() => setToast("")} />
        </section>
    );
}

function CommunicationForm({ type, item, locations, onSubmit, onCancel }) {
    const alert = type === "alert";
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-secondary/50 p-4">
            <form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-elevated md:p-7">
                <div className="flex items-start justify-between gap-3">
                    <div><p className="text-[11px] font-bold uppercase tracking-wider text-primary">Manual communication</p><h2 className="mt-1 text-xl font-extrabold text-secondary">{item ? "Edit" : "Create"} {alert ? "alert" : "announcement"}</h2></div>
                    <button type="button" onClick={onCancel} aria-label="Close communication form" className="cursor-pointer rounded-lg p-2 text-text/60 hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"><XCircle size={20} /></button>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field label="Title" name="title" defaultValue={item?.title} required />
                    {alert ? <Field label="Severity" name="severity" type="select" defaultValue={item?.severity || "monitor"} options={ALERT_SEVERITIES} required /> : <><Field label="Category" name="category" type="select" defaultValue={item?.category || ANNOUNCEMENT_CATEGORIES[3]} options={ANNOUNCEMENT_CATEGORIES} required /><Field label="Severity" name="severity" type="select" defaultValue={item?.severity || "low"} options={ANNOUNCEMENT_SEVERITIES} required /></>}
                    <Field label={alert ? "Description" : "Content"} name={alert ? "description" : "content"} defaultValue={item?.[alert ? "description" : "content"]} type="textarea" required wide />
                    <LocationField
                        label={alert ? "Affected barangays" : "Affected areas"}
                        name={alert ? "affectedBarangays" : "affectedAreas"}
                        options={locations}
                        selected={item?.[alert ? "affectedBarangays" : "affectedAreas"] || []}
                    />
                    {alert && <><Field label="Start date/time" name="startsAt" type="datetime-local" defaultValue={item?.startsAt?.slice(0, 16)} required /><Field label="Expiration date/time" name="expiresAt" type="datetime-local" defaultValue={item?.expiresAt?.slice(0, 16)} required /></>}
                    {!alert && <Field label="Publication date" name="publishedAt" type="datetime-local" defaultValue={item?.publishedAt?.slice(0, 16)} />}
                    <Field label={alert ? "Source" : "Source / issuing agency"} name="source" defaultValue={item?.source} required />
                    {!alert && <Field label="Optional image or attachment URL" name="attachmentUrl" defaultValue={item?.attachmentUrl} wide />}
                </div>
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                    <button type="submit" name="status" value="draft" className="min-h-11 cursor-pointer rounded-lg border border-primary px-4 text-xs font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">Save draft</button>
                    <button type="submit" name="status" value={alert ? "active" : "published"} className="min-h-11 cursor-pointer rounded-lg bg-primary px-4 text-xs font-bold text-white hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">{alert ? "Activate" : "Publish"}</button>
                </div>
            </form>
        </div>
    );
}

function LocationField({ label, name, options, selected }) {
    return (
        <fieldset className="text-xs font-bold text-text/70 sm:col-span-2">
            <legend>{label}</legend>
            <div className="mt-1 grid max-h-36 gap-2 overflow-y-auto rounded-lg border border-gray-300 bg-white p-3 sm:grid-cols-2">
                {options.length ? options.map(({ id, name: locationName, value }) => {
                    const locationValue = value || locationName;
                    return (
                    <label key={id} className="flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 font-normal text-text hover:bg-background">
                        <input type="checkbox" name={name} value={locationValue} defaultChecked={selected.includes(locationValue)} className="h-4 w-4 accent-secondary" />
                        {locationName}
                    </label>
                    );
                }) : <p className="text-text/60">No locations available.</p>}
            </div>
        </fieldset>
    );
}

function Field({ label, name, type = "text", defaultValue, options = [], required = false, wide = false }) {
    const common = "mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-text focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";
    return <label className={`text-xs font-bold text-text/70 ${wide ? "sm:col-span-2" : ""}`}>{label}{type === "textarea" ? <textarea name={name} defaultValue={defaultValue} required={required} rows="4" className={`${common} resize-y py-3`} /> : type === "select" ? <select name={name} defaultValue={defaultValue} required={required} className={`${common} capitalize`}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input name={name} type={type} defaultValue={defaultValue} required={required} className={common} />}</label>;
}

function ActionButton({ icon: Icon, label, onClick, hidden }) {
    if (hidden) return null;
    return <button type="button" onClick={onClick} className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-lg border border-gray-300 px-3 text-xs font-bold text-text/70 hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Icon size={14} />{label}</button>;
}

function Summary({ label, value }) {
    return <div className="rounded-xl bg-white p-4 shadow-card"><p className="text-xs font-bold uppercase tracking-wider text-text/55">{label}</p><p className="mt-2 text-2xl font-extrabold text-secondary">{value}</p></div>;
}

function Status({ status }) {
    const colors = {
        active: "bg-green-100 text-green-800",
        published: "bg-green-100 text-green-800",
        draft: "bg-yellow-100 text-yellow-900",
        expired: "bg-gray-100 text-gray-700",
        archived: "bg-gray-100 text-gray-700",
        cancelled: "bg-red-100 text-red-800",
    };
    return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${colors[status] || "bg-background text-text/70"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span>;
}

export default AdminCommunications;
