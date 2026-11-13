
import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, UserCircle } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import { useAuth } from "../../contexts/AuthContext";
import { signOut } from "../../services/authService";

export default function AdminLayout() {
    const [open, setOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [logoutError, setLogoutError] = useState("");
    const navigate = useNavigate();
    const { user } = useAuth();

    const name =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email ||
        "Administrator";
    const email = user?.email || "No email available";
    const role = user?.user_metadata?.role || "Administrator";
    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    const handleLogout = async () => {
        setLogoutError("");

        try {
            await signOut();
            navigate("/admin/login", { replace: true });
        } catch (error) {
            console.error("Admin logout error:", error);
            setLogoutError("Unable to log out. Please try again.");
        }
    };

    return (
        <div className="flex min-h-dvh bg-background">
            <AdminSidebar
                open={open}
                onClose={() => setOpen(false)}
            />

            <div className="min-w-0 flex-1">
                <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-8">
                    <button
                        type="button"
                        className="text-secondary md:hidden"
                        onClick={() => setOpen(true)}
                        aria-label="Open admin menu"
                    >
                        <Menu size={24} />
                    </button>

                    <Link
                        to="/admin"
                        className="font-bold text-secondary md:hidden"
                    >
                        AGOS ADMIN
                    </Link>

                    <div className="relative ml-auto">
                        <button
                            type="button"
                            onClick={() => setAccountOpen((isOpen) => !isOpen)}
                            aria-expanded={accountOpen}
                            aria-haspopup="menu"
                            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-xs font-extrabold text-white">
                                {initials || "A"}
                            </span>
                            <span className="hidden sm:block">
                                <span className="block text-sm font-bold text-primary">
                                    {name}
                                </span>
                                <span className="block text-xs text-text/60">
                                    Administrator
                                </span>
                            </span>
                            <ChevronDown
                                size={16}
                                className={`text-text/60 transition-transform ${accountOpen ? "rotate-180" : ""}`}
                                aria-hidden="true"
                            />
                        </button>

                        {accountOpen && (
                            <div
                                role="menu"
                                className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-elevated"
                            >
                                <div className="flex items-center gap-3 border-b border-gray-100 px-2 pb-3">
                                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-sm font-extrabold text-white">
                                        {initials || "A"}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-text">{name}</p>
                                        <p className="truncate text-xs text-text/60">{email}</p>
                                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-secondary">
                                            {role}
                                        </p>
                                    </div>
                                </div>

                                <Link
                                    to="/profile"
                                    role="menuitem"
                                    onClick={() => setAccountOpen(false)}
                                    className="mt-2 flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-text/80 hover:bg-background hover:text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    <UserCircle size={17} aria-hidden="true" />
                                    View profile
                                </Link>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={handleLogout}
                                    className="mt-1 flex min-h-10 w-full items-center gap-2 rounded-lg px-2 text-sm font-semibold text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                >
                                    <LogOut size={17} aria-hidden="true" />
                                    Log out
                                </button>
                                {logoutError && (
                                    <p role="alert" className="mt-2 px-2 text-xs text-red-700">
                                        {logoutError}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </header>

                <main className="mx-auto max-w-7xl p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
