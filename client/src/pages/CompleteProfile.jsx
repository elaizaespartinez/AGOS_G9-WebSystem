
import logo from "../assets/agos_logo.png";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

const fieldClass =
    "w-full min-h-11 rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text/40 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40";

const labelClass = "mb-1 block text-sm font-semibold text-text";

function CompleteProfile() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [provinceID, setProvinceID] = useState("");
    const [cityId, setCityId] = useState("");
    const [barangayId, setBarangayId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Load the current user's information.
    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            navigate("/login", { replace: true });
            return;
        }

        const metadata = user.user_metadata ?? {};

        setName(metadata.name || metadata.full_name || "");
        setEmail(user.email || "");
        setProvinceID(
            metadata.province_id != null
                ? String(metadata.province_id)
                : ""
        );
        setCityId(
            metadata.city_id != null
                ? String(metadata.city_id)
                : ""
        );
        setBarangayId(
            metadata.barangay_id != null
                ? String(metadata.barangay_id)
                : ""
        );
    }, [user, authLoading, navigate]);

    const handleCompleteProfile = async (e) => {
        e.preventDefault();
        setError("");

        if (authLoading || !user) {
            setError("Please sign in before completing your profile.");
            return;
        }

        if (
            !name.trim() ||
            !email ||
            !provinceID ||
            !cityId ||
            !barangayId
        ) {
            setError("Please fill in all fields.");
            return;
        }

        setIsLoading(true);

        try {
            const { data, error: updateError } =
                await supabase.auth.updateUser({
                    data: {
                        name: name.trim(),
                        province_id: provinceID,
                        city_id: cityId,
                        barangay_id: barangayId,
                    },
                });

            if (updateError) throw updateError;

            if (!data.user) {
                throw new Error("Unable to retrieve the updated user profile.");
            }

            navigate("/", { replace: true });
        } catch (err) {
            console.error("Complete profile error:", err);
            setError(
                err.message ||
                "An error occurred while completing your profile. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading || !user) {
        return (
            <main className="flex min-h-dvh items-center justify-center bg-primary p-4">
                <LoaderCircle
                    className="animate-spin text-white"
                    size={28}
                />
            </main>
        );
    }

    return (
        <main className="flex min-h-dvh items-center justify-center bg-primary p-4 md:py-10">
            <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-2xl md:grid-cols-2">
                <section className="flex flex-col items-center justify-center gap-3 bg-primary/10 px-6 py-6 md:p-8">
                    <img
                        src={logo}
                        alt="AGOS Logo"
                        className="h-auto w-24 object-contain md:w-56"
                    />
                    <p className="hidden text-center text-sm font-bold italic text-secondary md:block">
                        Sa bawat AGOS, may gabay.
                    </p>
                </section>

                <section className="flex flex-col justify-center bg-white p-6 text-text md:p-8">
                    <h1 className="text-center text-2xl font-extrabold">
                        Complete your profile
                    </h1>

                    <p className="mb-5 mt-1 text-center text-sm text-text/70">
                        Just a few more details to get started with AGOS.
                    </p>

                    <form
                        noValidate
                        onSubmit={handleCompleteProfile}
                        className="flex flex-col gap-4"
                    >
                        <div>
                            <label htmlFor="name" className={labelClass}>
                                Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                autoComplete="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className={fieldClass}
                                placeholder="e.g., Juan Dela Cruz"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className={labelClass}>
                                Email
                            </label>
                            <input
                                type="email"
                                readOnly
                                id="email"
                                name="email"
                                required
                                value={email}
                                className={fieldClass}
                                placeholder="e.g., juan@example.com"
                            />
                            <p className="mt-1 text-xs text-text/60">
                                Linked to your account and can't be changed here.
                            </p>
                        </div>

                        <fieldset className="m-0 min-w-0 border-0 p-0">
                            <legend className={labelClass}>Address</legend>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <label htmlFor="province" className="sr-only">
                                    Province
                                </label>
                                <select
                                    id="province"
                                    name="province"
                                    required
                                    value={provinceID}
                                    onChange={(e) => {
                                        setProvinceID(e.target.value);
                                        setCityId("");
                                        setBarangayId("");
                                    }}
                                    className={fieldClass}
                                >
                                    <option value="">Province</option>
                                    <option value="1">Batangas</option>
                                    <option value="2">Province 2</option>
                                    <option value="3">Province 3</option>
                                </select>

                                <label htmlFor="city" className="sr-only">
                                    City
                                </label>
                                <select
                                    id="city"
                                    name="city"
                                    required
                                    value={cityId}
                                    onChange={(e) => {
                                        setCityId(e.target.value);
                                        setBarangayId("");
                                    }}
                                    className={fieldClass}
                                >
                                    <option value="">City</option>
                                    <option value="1">Batangas City</option>
                                    <option value="2">City 2</option>
                                    <option value="3">City 3</option>
                                </select>

                                <label htmlFor="barangay" className="sr-only">
                                    Barangay
                                </label>
                                <select
                                    id="barangay"
                                    name="barangay"
                                    required
                                    value={barangayId}
                                    onChange={(e) => setBarangayId(e.target.value)}
                                    className={`${fieldClass} sm:col-span-2`}
                                >
                                    <option value="">Barangay</option>
                                    <option value="1">Barangay 1</option>
                                    <option value="2">Barangay 2</option>
                                    <option value="3">Barangay 3</option>
                                </select>
                            </div>
                        </fieldset>

                        {error && (
                            <p
                                role="alert"
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                            >
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            aria-busy={isLoading}
                            className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-secondary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isLoading ? "Completing..." : "Complete Profile"}
                            {isLoading && (
                                <LoaderCircle
                                    className="animate-spin"
                                    size={16}
                                />
                            )}
                        </button>

                        <p className="text-center text-sm text-text/70">
                            Your profile helps AGOS provide relevant local disaster information.
                        </p>
                    </form>
                </section>
            </div>
        </main>
    );
}

export default CompleteProfile;
