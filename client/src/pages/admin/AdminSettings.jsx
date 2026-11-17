import { useState } from "react";
import {
    Bell,
    Database,
    Globe2,
    Save,
    ShieldCheck,
} from "lucide-react";

import AdminPageHeader from "../../components/admin/AdminPageHeader";
import SectionPanel from "../../components/admin/SectionPanel";

const sources = [
    {
        name: "Community reports",
        detail: "User-submitted flood and transport observations",
        status: "Connected",
    },
    {
        name: "Weather monitoring",
        detail: "Rainfall and weather advisory provider",
        status: "Needs setup",
    },
    {
        name: "Transport feed",
        detail: "Route availability and disruption updates",
        status: "Sample data",
    },
];

export default function AdminSettings() {
    const [settings, setSettings] = useState({
        notifications: true,
        autoRefresh: true,
        publicPreview: false,
    });

    const [notice, setNotice] = useState("");

    function toggle(key) {
        setSettings((current) => ({
            ...current,
            [key]: !current[key],
        }));

        setNotice("Settings saved for this preview session.");
    }

    return (
        <section className="space-y-6">
            <AdminPageHeader
                eyebrow="Admin / Administration"
                title="Portal settings"
                description="Configure how the operations portal presents updates. Backend integrations and permissions remain managed separately."
            />

            {notice && (
                <p
                    role="status"
                    className="rounded-lg border border-safe/30 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
                >
                    {notice}
                </p>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <SectionPanel
                    title="Operations preferences"
                    description="These controls are local preview settings until connected to an administrator profile."
                >
                    <div className="divide-y divide-gray-100">
                        {[
                            [
                                "notifications",
                                "Admin notifications",
                                "Show new report and review notifications.",
                                Bell,
                            ],
                            [
                                "autoRefresh",
                                "Automatic refresh",
                                "Refresh operational data when the page becomes visible.",
                                Save,
                            ],
                            [
                                "publicPreview",
                                "Public preview mode",
                                "Show sample content when a live source is unavailable.",
                                Globe2,
                            ],
                        ].map(([key, label, detail, Icon]) => (
                            <div
                                key={key}
                                className="flex items-center justify-between gap-4 px-5 py-4"
                            >
                                <div className="flex items-start gap-3">
                                    <Icon
                                        size={18}
                                        className="mt-0.5 text-primary"
                                    />

                                    <div>
                                        <p className="text-sm font-bold text-secondary">
                                            {label}
                                        </p>

                                        <p className="mt-1 text-xs text-text/60">
                                            {detail}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    aria-pressed={settings[key]}
                                    onClick={() => toggle(key)}
                                    className={`relative h-6 w-11 rounded-full transition ${
                                        settings[key]
                                            ? "bg-primary"
                                            : "bg-gray-300"
                                    }`}
                                >
                                    <span
                                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                            settings[key]
                                                ? "left-6"
                                                : "left-1"
                                        }`}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                </SectionPanel>

                <SectionPanel
                    title="Data sources"
                    description="Connection status helps the team understand where operational information comes from."
                >
                    <div className="divide-y divide-gray-100">
                        {sources.map((source) => (
                            <div
                                key={source.name}
                                className="flex items-start justify-between gap-3 px-5 py-4"
                            >
                                <div className="flex items-start gap-3">
                                    <Database
                                        size={18}
                                        className="mt-0.5 text-primary"
                                    />

                                    <div>
                                        <p className="text-sm font-bold text-secondary">
                                            {source.name}
                                        </p>

                                        <p className="mt-1 text-xs text-text/60">
                                            {source.detail}
                                        </p>
                                    </div>
                                </div>

                                <span
                                    className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-bold ${
                                        source.status === "Connected"
                                            ? "bg-green-100 text-green-800"
                                            : source.status === "Needs setup"
                                              ? "bg-red-100 text-red-800"
                                              : "bg-amber-100 text-amber-800"
                                    }`}
                                >
                                    {source.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </SectionPanel>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-secondary">
                <ShieldCheck
                    size={18}
                    className="mt-0.5 shrink-0 text-primary"
                />

                <p>
                    <b>Security reminder:</b> keep role checks, RLS policies,
                    and service credentials in the backend. Do not expose
                    secrets through these frontend settings.
                </p>
            </div>
        </section>
    );
}
