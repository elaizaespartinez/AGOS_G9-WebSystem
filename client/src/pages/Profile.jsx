import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, UserRound } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getProfileData } from "../services/profileService";

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "AG";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-gray-200 bg-background p-4">
    <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-text/60">
      <Icon size={14} className="text-primary" />
      {label}
    </div>
    <p className="text-sm font-semibold text-text">{value}</p>
  </div>
);


export default function Profile() {
    const { user, loading: authLoading } = useAuth();

    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setProfile(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            const data = getProfileData(user);
            setProfile(data);
        } catch (error) {
            console.error("Unable to load profile data.", error);
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    }, [user, authLoading]);

    if (authLoading || isLoading) {
        return (
            <main className="min-h-[calc(100vh-14rem)] bg-white px-4 py-6 md:px-8">
                <div className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-text/70 shadow-elevated">
                    Loading profile...
                </div>
            </main>
        );
    }

    if (!user || !profile) {
        return (
            <main className="min-h-[calc(100vh-14rem)] bg-white px-4 py-6 md:px-8">
                <div className="mx-auto max-w-4xl rounded-2xl border border-dashed border-primary/30 bg-white p-8 text-center shadow-elevated">
                    <h1 className="mb-2 text-xl font-bold text-text">
                        Sign in to view your profile
                    </h1>

                    <p className="mb-4 text-sm text-text/70">
                        You can continue using AGOS's public disaster information without an account.
                    </p>

                    <Link
                        to="/login"
                        className="inline-flex rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary-hover"
                    >
                        Log in
                    </Link>
                </div>
            </main>
        );
    }

    // Keep the rest of your existing profile JSX below this point.


  return (
    <main className="min-h-[calc(100vh-14rem)] bg-white px-4 py-6 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-primary">
            Profile
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-text">My Profile</h1>
        </div>

        <section className="rounded-2xl bg-white p-5 shadow-elevated md:p-7">
          <div className="flex items-center gap-4 border-b border-gray-200 pb-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-extrabold text-white">
              {getInitials(profile.name)}
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-text">{profile.name}</h2>
              <p className="text-sm text-text/70">{profile.email}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <InfoItem icon={UserRound} label="Full name" value={profile.name} />
            <InfoItem icon={Mail} label="Email" value={profile.email} />
            <InfoItem icon={MapPin} label="Province" value={profile.province} />
            <InfoItem icon={MapPin} label="City" value={profile.city} />
            <div className="md:col-span-2">
              <InfoItem icon={MapPin} label="Barangay" value={profile.barangay} />
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-primary/5 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/80">
              Address
            </p>
            <p className="mt-2 text-base font-semibold text-text">
              {profile.barangay}, {profile.city}, {profile.province}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}