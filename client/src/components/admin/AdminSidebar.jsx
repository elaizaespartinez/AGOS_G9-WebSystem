import {
    BusFront,
    ClipboardList,
    LayoutDashboard,
    Map,
    MapPin,
    Megaphone,
    Settings,
    X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import logo from "../../assets/agos_logo.png";

const sections = [
    {
        label: "Overview",
        items: [
            { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { to: "/admin/locations", label: "Hazard Monitoring", icon: Map, query: "hazards" },
        ],
    },
    {
        label: "Operations",
        items: [
            { to: "/admin/reports", label: "Community Reports", icon: ClipboardList },
            { to: "/admin/communications", label: "Alerts & Announcements", icon: Megaphone },
            { to: "/admin/transportation", label: "Transportation", icon: BusFront },
        ],
    },
    {
        label: "Resources",
        items: [
            { to: "/admin/locations", label: "Locations & Hotlines", icon: MapPin, query: "resources" },
        ],
    },
    {
        label: "Administration",
        items: [
            { to: "/admin/settings", label: "Settings", icon: Settings },
        ],
    },
];

function isActivePath(pathname, to) {
    if (to === "/admin/dashboard") {
        return pathname === "/admin" || pathname === "/admin/dashboard";
    }

    if (to === "/admin") return pathname === "/admin";
    return pathname === to || pathname.startsWith(`${to}/`);
}

export default function AdminSidebar({ open, onClose }) {
    return (
        <aside
            className={`fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r border-gray-200 bg-white px-4 py-6 text-text shadow-elevated transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 md:shadow-none ${
                open ? "translate-x-0" : ""
            }`}
        >
            <div className="flex items-start justify-between px-2">
                <NavLink
                    to="/admin"
                    onClick={onClose}
                    className="flex items-center gap-2"
                    aria-label="AGOS administration dashboard"
                >
                    <img src={logo} alt="AGOS" className="h-12 w-auto object-contain" />
                </NavLink>

                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-2 text-secondary hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
                    aria-label="Close admin menu"
                >
                    <X size={20} />
                </button>
            </div>

            <p className="mb-5 mt-5 px-2 text-[10px] font-extrabold uppercase tracking-wider text-text/60">
                Admin portal
            </p>

            <nav className="flex flex-1 flex-col gap-5 overflow-y-auto" aria-label="Admin navigation">
                {sections.map(({ label, items }) => (
                    <div key={label}>
                        <p className="mb-2 px-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-text/45">
                            {label}
                        </p>
                        <div className="flex flex-col gap-1">
                            {items.map(({ to, label: itemLabel, icon: Icon, query }) => (
                                <NavLink
                                    key={itemLabel}
                                    to={query ? `${to}?view=${query}` : to}
                                    end={to === "/admin"}
                                    onClick={onClose}
                                    className={({ isActive }) => {
                                        const active = query
                                            ? isActivePath(window.location.pathname, to) &&
                                              new URLSearchParams(window.location.search).get("view") === query
                                            : isActive;

                                        return `group flex min-h-11 items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                            active
                                                ? "bg-primary text-white shadow-card"
                                                : "text-text/70 hover:bg-background hover:text-primary"
                                        }`;
                                    }}
                                >
                                    {({ isActive }) => {
                                        const active = query
                                            ? isActivePath(window.location.pathname, to) &&
                                              new URLSearchParams(window.location.search).get("view") === query
                                            : isActive;

                                        return (
                                            <>
                                                <Icon
                                                    size={17}
                                                    strokeWidth={active ? 2.5 : 2}
                                                    className={active ? "text-white" : "text-primary"}
                                                    aria-hidden="true"
                                                />
                                                <span className="truncate">{itemLabel}</span>
                                            </>
                                        );
                                    }}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="mt-5 border-t border-gray-200 px-2 pt-4">
                <p className="text-xs font-bold text-secondary">Batangas City</p>
                <p className="mt-1 text-[10px] text-text/55">Disaster response team</p>
                <NavLink
                    to="/"
                    onClick={onClose}
                    className="mt-4 inline-flex text-[10px] font-semibold text-primary hover:text-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    View public website <span className="ml-1" aria-hidden="true">↗</span>
                </NavLink>
            </div>
        </aside>
    );
}