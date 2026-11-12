import { useMemo, useState } from "react";
import {
    BusFront,
    CheckCircle2,
    Clock3,
    MapPin,
    RefreshCw,
    Route,
    TriangleAlert,
} from "lucide-react";

import AdminPageHeader from "../../components/admin/AdminPageHeader";
import SectionPanel from "../../components/admin/SectionPanel";
import StatusPill from "../../components/admin/StatusPill";

const initialRoutes = [
    {
        id: "PB-03",
        name: "Batangas City - Alangilan",
        operator: "Local jeepney route",
        status: "affected",
        reason: "Flooding near BatStateU - PB",
        updated: "18 min ago",
    },
    {
        id: "PB-07",
        name: "Grand Terminal - Kumintang",
        operator: "Local jeepney route",
        status: "safe",
        reason: "Operating normally",
        updated: "32 min ago",
    },
    {
        id: "TR-02",
        name: "Batangas Port - City Center",
        operator: "Tricycle route",
        status: "monitor",
        reason: "Moderate rainfall along the route",
        updated: "41 min ago",
    },
    {
        id: "PB-11",
        name: "Balagtas - Diversion Road",
        operator: "Local jeepney route",
        status: "safe",
        reason: "Operating normally",
        updated: "1 hr ago",
    },
];

const statusOptions = ["safe", "monitor", "affected", "evacuate"];

export default function AdminTransportation() {
    const [routes, setRoutes] = useState(initialRoutes);
    const [filter, setFilter] = useState("all");
    const [notice, setNotice] = useState("");

    const visibleRoutes = useMemo(
        () =>
            filter === "all"
                ? routes
                : routes.filter((route) => route.status === filter),
        [filter, routes]
    );

    function updateStatus(id, status) {
        setRoutes((current) =>
            current.map((route) =>
                route.id === id
                    ? {
                          ...route,
                          status,
                          reason:
                              status === "safe"
                                  ? "Operating normally"
                                  : route.reason,
                          updated: "just now",
                      }
                    : route
            )
        );

        setNotice(
            "Route status updated in this preview. Connect a transport feed to persist it."
        );
    }

    return (
        <section className="space-y-6">
            <AdminPageHeader
                eyebrow="Admin / Operations"
                title="Transportation monitoring"
                description="Review route conditions and prepare commuter-facing guidance. This page currently uses sample route data."
                actions={
                    <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
                        Sample data
                    </span>
                }
                onRefresh={() =>
                    setNotice("Sample route data is already up to date.")
                }
            />

            {notice && (
                <p
                    role="status"
                    className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-secondary"
                >
                    {notice}
                </p>
            )}

            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                {[
                    ["Routes tracked", routes.length, Route],
                    [
                        "Need attention",
                        routes.filter((route) =>
                            ["affected", "evacuate"].includes(route.status)
                        ).length,
                        TriangleAlert,
                    ],
                    [
                        "Operating normally",
                        routes.filter((route) => route.status === "safe").length,
                        CheckCircle2,
                    ],
                ].map(([label, value, Icon]) => (
                    <div
                        key={label}
                        className="rounded-xl bg-white p-5 shadow-card"
                    >
                        <Icon size={20} className="text-primary" />

                        <p className="mt-3 text-xs font-semibold text-text/60">
                            {label}
                        </p>

                        <p className="mt-1 text-2xl font-extrabold text-secondary">
                            {value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Route status */}
            <SectionPanel
                title="Route status"
                description="Use verified reports and field updates before changing a route status."
            >
                {/* Filters */}
                <div className="flex flex-wrap gap-2 border-b border-gray-100 px-5 py-4">
                    {["all", ...statusOptions].map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setFilter(option)}
                            className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
                                filter === option
                                    ? "bg-primary text-white"
                                    : "bg-background text-text/65 hover:text-primary"
                            }`}
                        >
                            {option === "all" ? "All routes" : option}
                        </button>
                    ))}
                </div>

                {/* Route list */}
                {!visibleRoutes.length ? (
                    <div className="p-8">
                        <p className="text-center text-sm text-text/60">
                            No routes match this filter.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {visibleRoutes.map((route) => (
                            <div key={route.id} className="px-5 py-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                                            <BusFront size={20} />
                                        </span>

                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-extrabold text-secondary">
                                                    {route.name}
                                                </h3>

                                                <span className="text-xs font-bold text-text/45">
                                                    {route.id}
                                                </span>
                                            </div>

                                            <p className="mt-1 text-xs text-text/60">
                                                {route.operator} · {route.reason}
                                            </p>

                                            <p className="mt-2 flex items-center gap-1 text-xs text-text/45">
                                                <Clock3 size={13} />
                                                Updated {route.updated}
                                            </p>
                                        </div>
                                    </div>

                                    <StatusPill status={route.status} />
                                </div>

                                {/* Status controls */}
                                <div className="mt-4 flex flex-wrap items-center gap-2 sm:justify-end">
                                    {statusOptions.map((status) => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() =>
                                                updateStatus(route.id, status)
                                            }
                                            className={`rounded-lg border px-3 py-2 text-xs font-bold capitalize ${
                                                route.status === status
                                                    ? "border-primary bg-primary/5 text-primary"
                                                    : "border-gray-200 text-text/60 hover:border-primary hover:text-primary"
                                            }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SectionPanel>

            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <MapPin size={18} className="mt-0.5 shrink-0" />

                <p>
                    <b>Next integration:</b> connect route statuses to verified
                    community reports and an external transport feed so updates
                    do not rely solely on manual entry.
                </p>
            </div>
        </section>
    );
}
