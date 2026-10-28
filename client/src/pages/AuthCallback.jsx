
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallback() {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;

        const handleCallback = async () => {
            try {
                const { data, error } =
                    await supabase.auth.getSession();

                if (error) throw error;

                const user = data.session?.user;

                if (!user) {
                    navigate("/login", { replace: true });
                    return;
                }

                const metadata = user.user_metadata ?? {};

                const isProfileComplete = Boolean(
                    metadata.name?.trim() &&
                    metadata.province_id &&
                    metadata.city_id &&
                    metadata.barangay_id
                );

                navigate(
                    isProfileComplete
                        ? "/"
                        : "/complete-profile",
                    { replace: true }
                );
            } catch (err) {
                console.error("Authentication callback error:", err);
                setError(
                    "Unable to finish sign-in. Please try again."
                );
            }
        };

        handleCallback();
    }, [navigate]);

    if (error) {
        return (
            <main className="flex min-h-dvh items-center justify-center p-6">
                <div className="text-center">
                    <p role="alert" className="mb-4 text-red-600">
                        {error}
                    </p>
                    <button
                        onClick={() => navigate("/login", { replace: true })}
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
