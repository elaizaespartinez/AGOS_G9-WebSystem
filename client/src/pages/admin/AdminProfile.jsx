import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    CalendarDays,
    Clock,
    KeyRound,
    LoaderCircle,
    LogOut,
    Mail,
    Pencil,
    Phone,
    ShieldCheck,
    UserRound,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getProfileWithAddress } from "../../services/profileService";
import { signOut } from "../../services/authService";
import { getAuthErrorMessage } from "../../services/authError";
import { supabase } from "../../lib/supabaseClient";

const RESET_COOLDOWN_SECONDS = 60;

const getInitials = (name = "") => {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (!parts.length) return "AG";

    return parts
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
};

const formatDateTime = (value) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Manila",
    }).format(date);
};

// Only admins reach this page, so fall back to "Administrator"
const formatRole = (role) => {
    if (!role || role === "admin") return "Administrator";

    return String(role).charAt(0).toUpperCase() + String(role).slice(1);
};

const labelClass =
    "mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text/70";

const InfoItem = ({ icon: Icon, label, value, emptyText = "Not provided" }) => (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-background/60 p-4">
        <dt className={labelClass}>
            <Icon size={14} className="shrink-0 text-primary" aria-hidden="true" />
            {label}
        </dt>

        <dd className={`break-words text-sm font-semibold ${value ? "text-text" : "italic text-text/50"}`}>
            {value || emptyText}
        </dd>
    </div>
);

const PhoneInfoItem = ({ phoneNumber, isVerified }) => (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-background/60 p-4">
        <dt className={labelClass}>
            <Phone size={14} className="shrink-0 text-primary" aria-hidden="true" />
            Phone number
        </dt>

        <dd className="flex flex-wrap items-center gap-2">
            <span className={`text-sm font-semibold ${phoneNumber ? "text-text" : "italic text-text/50"}`}>
                {phoneNumber || "Not provided"}
            </span>

            {phoneNumber && (
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        isVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-900"
                    }`}
                >
                    <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 rounded-full ${isVerified ? "bg-green-600" : "bg-amber-600"}`}
                    />
                    {isVerified ? "Verified" : "Unverified"}
                </span>
            )}
        </dd>
    </div>
);

const PageShell = ({ children }) => (
    <div className="mx-auto w-full max-w-3xl">{children}</div>
);

export default function AdminProfile() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    // Password reset
    const [isSendingReset, setIsSendingReset] = useState(false);
    const [resetCooldown, setResetCooldown] = useState(0);
    const [resetMessage, setResetMessage] = useState("");
    const [resetError, setResetError] = useState("");

    // Sign out
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [signOutError, setSignOutError] = useState("");

    useEffect(() => {
        let isMounted = true;

        const loadProfile = async () => {
            if (authLoading) return;

            if (!user) {
                setProfile(null);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setLoadError(false);

            try {
                const profileData = await getProfileWithAddress(user);

                if (isMounted) {
                    setProfile(profileData);
                }
            } catch (error) {
                console.error("Unable to load admin profile data:", error);

                if (isMounted) {
                    setProfile(null);
                    setLoadError(true);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadProfile();

        return () => {
            isMounted = false;
        };
    }, [user, authLoading, reloadKey]);

    // Countdown for the password reset button
    useEffect(() => {
        if (resetCooldown <= 0) return;

        const timer = window.setTimeout(
            () => setResetCooldown((seconds) => seconds - 1),
            1000
        );

        return () => window.clearTimeout(timer);
    }, [resetCooldown]);

    const handleSendReset = async () => {
        if (isSendingReset || resetCooldown > 0 || !user?.email) return;

        setResetMessage("");
        setResetError("");
        setIsSendingReset(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setResetMessage(`A password reset link was sent to ${user.email}.`);
            setResetCooldown(RESET_COOLDOWN_SECONDS);
        } catch (error) {
            console.error("Admin password reset error:", error);

            setResetError(
                getAuthErrorMessage(
                    error,
                    "We couldn't send the reset link. Please try again."
                )
            );
        } finally {
            setIsSendingReset(false);
        }
    };

    const handleSignOut = async () => {
        if (isSigningOut) return;

        setSignOutError("");
        setIsSigningOut(true);

        try {
            await signOut();
            navigate("/admin/login", { replace: true });
        } catch (error) {
            console.error("Admin sign out error:", error);
            setSignOutError("Unable to sign out. Please try again.");
        } finally {
            setIsSigningOut(false);
        }
    };

    // Loading skeleton
    if (authLoading || isLoading) {
        return (
            <PageShell>
                <div role="status" aria-busy="true" aria-label="Loading profile">
                    <div className="mb-6 h-9 w-48 animate-pulse rounded-lg bg-gray-200" />

                    <div className="rounded-2xl bg-card p-5 shadow-card md:p-8">
                        <div className="flex items-center gap-4 border-b border-gray-200 pb-6">
                            <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200" />
                            <div className="flex-1 space-y-2">
                                <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
                                <div className="h-4 w-56 max-w-full animate-pulse rounded bg-gray-200" />
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
                            ))}
                        </div>
                    </div>
                </div>
            </PageShell>
        );
    }

    // Signed out (AdminRoute normally prevents this)
    if (!user) {
        return (
            <PageShell>
                <div className="rounded-2xl bg-card p-8 text-center shadow-card">
                    <h1 className="mb-2 text-xl font-extrabold text-text">
                        Sign in to view your profile
                    </h1>

                    <Link
                        to="/admin/login"
                        className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg bg-secondary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-secondary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                    >
                        Admin login
                    </Link>
                </div>
            </PageShell>
        );
    }

    // Signed in, but the profile could not be loaded
    if (loadError || !profile) {
        return (
            <PageShell>
                <div role="alert" className="rounded-2xl bg-card p-8 text-center shadow-card">
                    <h1 className="mb-2 text-xl font-extrabold text-text">
                        We couldn't load your profile
                    </h1>

                    <p className="mx-auto mb-5 max-w-sm text-sm text-text/70">
                        Something went wrong while loading your information. Please try again.
                    </p>

                    <button
                        type="button"
                        onClick={() => setReloadKey((key) => key + 1)}
                        className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-secondary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-secondary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                    >
                        Try again
                    </button>
                </div>
            </PageShell>
        );
    }

    const roleLabel = formatRole(profile.role ?? user.app_metadata?.role);

    return (
        <PageShell>
            <div className="mb-6">
                <p className="text-xs font-extrabold uppercase tracking-wider text-primary">
                    Admin account
                </p>

                <h1 className="mt-1 text-3xl font-extrabold text-text">
                    My Profile
                </h1>
            </div>

            <section className="rounded-2xl bg-card p-5 shadow-card md:p-8">
                {/* Profile header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-6">
                    <div className="flex min-w-0 items-center gap-4">
                        <div
                            aria-hidden="true"
                            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-secondary text-xl font-extrabold text-white"
                        >
                            {getInitials(profile.name)}
                        </div>

                        <div className="min-w-0">
                            <h2 className="truncate text-2xl font-extrabold text-text">
                                {profile.name}
                            </h2>

                            <p className="truncate text-sm text-text/70">
                                {profile.email}
                            </p>

                            <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
                                <ShieldCheck size={14} aria-hidden="true" />
                                {roleLabel}
                            </span>
                        </div>
                    </div>

                    <Link
                        to="/admin/edit-profile"
                        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-secondary px-4 py-2 text-sm font-semibold text-secondary transition-colors hover:bg-secondary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                    >
                        <Pencil size={16} aria-hidden="true" />
                        Edit Profile
                    </Link>
                </div>

                {/* Personal information */}
                <h3 className="mb-3 mt-6 text-sm font-extrabold text-text">
                    Personal information
                </h3>

                <dl className="grid gap-4 md:grid-cols-2">
                    <InfoItem
                        icon={UserRound}
                        label="Full name"
                        value={profile.name}
                    />

                    <InfoItem
                        icon={Mail}
                        label="Email"
                        value={profile.email}
                    />

                    <div className="md:col-span-2">
                        <PhoneInfoItem
                            phoneNumber={profile.phone_number}
                            isVerified={profile.phone_verified}
                        />
                    </div>
                </dl>

                {/* Account */}
                <h3 className="mb-3 mt-8 text-sm font-extrabold text-text">
                    Account
                </h3>

                <dl className="grid gap-4 md:grid-cols-3">
                    <InfoItem
                        icon={ShieldCheck}
                        label="Role"
                        value={roleLabel}
                    />

                    <InfoItem
                        icon={CalendarDays}
                        label="Member since"
                        value={formatDateTime(user.created_at)}
                        emptyText="Not available"
                    />

                    <InfoItem
                        icon={Clock}
                        label="Last sign-in"
                        value={formatDateTime(user.last_sign_in_at)}
                        emptyText="Not available"
                    />
                </dl>

                {/* Security and session */}
                <h3 className="mb-3 mt-8 text-sm font-extrabold text-text">
                    Security and session
                </h3>

                <div className="divide-y divide-gray-200 rounded-xl border border-gray-200">
                    {/* Password */}
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                            <KeyRound size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />

                            <div>
                                <p className="text-sm font-semibold text-text">Password</p>
                                <p className="text-xs text-text/70">
                                    We'll email you a link to set a new password.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleSendReset}
                            disabled={isSendingReset || resetCooldown > 0}
                            aria-busy={isSendingReset}
                            className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-secondary px-4 py-2 text-sm font-semibold text-secondary transition-colors hover:bg-secondary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-secondary"
                        >
                            {isSendingReset
                                ? "Sending..."
                                : resetCooldown > 0
                                    ? `Resend in ${resetCooldown}s`
                                    : "Send reset link"}
                            {isSendingReset && <LoaderCircle className="animate-spin" size={16} />}
                        </button>
                    </div>

                    {(resetMessage || resetError) && (
                        <div className="p-4">
                            {resetMessage && (
                                <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                                    {resetMessage}
                                </p>
                            )}

                            {resetError && (
                                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                    {resetError}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Sign out */}
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                            <LogOut size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />

                            <div>
                                <p className="text-sm font-semibold text-text">Sign out</p>
                                <p className="text-xs text-text/70">
                                    End your admin session on this device.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleSignOut}
                            disabled={isSigningOut}
                            aria-busy={isSigningOut}
                            className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-700 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-red-700"
                        >
                            {isSigningOut ? "Signing out..." : "Sign out"}
                            {isSigningOut && <LoaderCircle className="animate-spin" size={16} />}
                        </button>
                    </div>

                    {signOutError && (
                        <div className="p-4">
                            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                {signOutError}
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </PageShell>
    );
}