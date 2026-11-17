import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, UserRound, Pencil } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getProfileWithAddress } from "../services/profileService";

const getInitials = (name = "") => {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (!parts.length) return "AG";

    return parts
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
};

const labelClass =
    "mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text/70";

const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-background/60 p-4">
        <dt className={labelClass}>
            <Icon size={14} className="shrink-0 text-primary" aria-hidden="true" />
            {label}
        </dt>

        <dd className={`break-words text-sm font-semibold ${value ? "text-text" : "italic text-text/50"}`}>
            {value || "Not provided"}
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
    <main className="md:mx-32 p-2 bg-background">
        <div className="mx-auto w-full max-w-3xl">{children}</div>
    </main>
);

export default function Profile() {
    const { user, loading: authLoading } = useAuth();

    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

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
                console.error("Unable to load profile data:", error);

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

    // Signed out
    if (!user) {
        return (
            <PageShell>
                <div className="rounded-2xl bg-card p-8 text-center shadow-card">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <UserRound className="h-7 w-7 text-primary" aria-hidden="true" />
                    </div>

                    <h1 className="mb-2 text-xl font-extrabold text-text">
                        Sign in to view your profile
                    </h1>

                    <p className="mx-auto mb-5 max-w-sm text-sm text-text/70">
                        You can continue using AGOS's public disaster information without an account.
                    </p>

                    <Link
                        to="/login"
                        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-secondary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-secondary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                    >
                        Log in
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

    return (
        <PageShell>
            <div className="mb-6">
                <p className="text-xs font-extrabold uppercase tracking-wider text-primary">
                    Account
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
                        </div>
                    </div>

                    <Link
                        to="/edit-profile"
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

                {/* Address */}
                <h3 className="mb-3 mt-8 text-sm font-extrabold text-text">
                    Address
                </h3>

                <dl className="grid gap-4 md:grid-cols-3">
                    <InfoItem
                        icon={MapPin}
                        label="Barangay"
                        value={profile.barangay}
                    />

                    <InfoItem
                        icon={MapPin}
                        label="City"
                        value={profile.city}
                    />

                    <InfoItem
                        icon={MapPin}
                        label="Province"
                        value={profile.province}
                    />
                </dl>
            </section>
        </PageShell>
    );
}