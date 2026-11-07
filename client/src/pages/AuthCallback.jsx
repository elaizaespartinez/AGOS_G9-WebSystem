
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { getAuthErrorMessage } from "../services/authError";

export default function AuthCallback() {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;

        const handleCallback = async () => {
            try {
                // Get the authenticated user
                const {
                    data: { session },
                    error: authError,
                } = await supabase.auth.getSession();

                if (authError) throw authError;

                const user = session?.user;

                if (!user) {
                    navigate("/login", { replace: true });
                    return;
                }

                // Get the user's profile from the database
                const { data: profile, error: profileError } =
                    await supabase
                        .from("profiles")
                        .select(
                            "name, phone_number, province_id, city_id, barangay_id"
                        )
                        .eq("id", user.id)
                        .maybeSingle();

                if (profileError) throw profileError;

                // Check whether all required profile fields are completed
                const isProfileComplete = Boolean(
                    profile?.name?.trim() &&
                    profile?.phone_number?.trim() &&
                    profile?.province_id &&
                    profile?.city_id &&
                    profile?.barangay_id
                );

                // Redirect based on profile completion
                navigate(
                    isProfileComplete
                        ? "/"
                        : "/complete-profile",
                    { replace: true }
                );

            } catch (err) {
                console.error("Authentication callback error:", err);

                setError(
                    getAuthErrorMessage(
                        err,
                        "Unable to finish sign-in. Please try again."
                    )
                );
            }
        };

        handleCallback();
    }, [navigate]);

    if (error) {
        return (
            <main className="flex min-h-dvh items-center justify-center p-6">
                <div className="text-center">
                    <p
                        role="alert"
                        className="mb-4 text-red-600"
                    >
                        {error}
                    </p>

                    <button
                        onClick={() =>
                            navigate("/login", { replace: true })
                        }
                        className="rounded-lg bg-secondary px-4 py-2 text-white"
                    >
                        Return to Login
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-dvh items-center justify-center p-6">
            <p className="text-text">
                Finishing sign-in...
            </p>
        </main>
    );
}
