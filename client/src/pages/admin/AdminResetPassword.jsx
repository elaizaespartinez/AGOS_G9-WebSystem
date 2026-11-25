
import {
    ArrowLeft,
    KeyRound,
    Eye,
    EyeOff,
    Check,
    LoaderCircle,
} from "lucide-react";
import resetPasswordImage from "../../assets/visuals/reset-password.png";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { getAuthErrorMessage } from "../../services/authError";

const fieldClass =
    "w-full min-h-11 rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text/40 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40";

const labelClass = "mb-1 block text-sm font-semibold text-text";

const toggleClass =
    "absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary";

function AdminResetPassword() {
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isRecovery, setIsRecovery] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    const passwordRequirements = {
        length: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        lowercase: /[a-z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    };

    const requirementList = [
        [passwordRequirements.length, "At least 8 characters"],
        [passwordRequirements.uppercase, "One uppercase letter"],
        [passwordRequirements.lowercase, "One lowercase letter"],
        [passwordRequirements.number, "One number"],
        [passwordRequirements.specialChar, "One special character"],
    ];

    useEffect(() => {
        let isMounted = true;

        const verifyRecovery = async (session) => {
            if (!session?.user) {
                if (isMounted) {
                    setError("Your password reset link is invalid or expired. Please request a new one.");
                    setIsChecking(false);
                }
                return;
            }

            try {
                const { data, error: profileError } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", session.user.id)
                    .maybeSingle();

                if (profileError) throw profileError;

                const role = String(data?.role || "").toLowerCase();
                const hasAdminAccess = [
                    "admin",
                    "administrator",
                    "super_admin",
                ].includes(role);

                if (!hasAdminAccess) {
                    await supabase.auth.signOut();

                    if (isMounted) {
                        setError("This account does not have admin access.");
                        setIsRecovery(false);
                        setIsChecking(false);
                    }
                    return;
                }

                if (isMounted) {
                    setIsRecovery(true);
                    setIsChecking(false);
                }
            } catch (error) {
                console.error("Admin recovery verification error:", error);

                if (isMounted) {
                    setError("Unable to verify admin access. Please try requesting a new reset link.");
                    setIsChecking(false);
                }
            }
        };

        const initializeRecovery = async () => {
            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError) throw sessionError;

            const isRecoveryUrl =
                window.location.hash.includes("type=recovery") ||
                new URLSearchParams(window.location.search).get("type") === "recovery";

            if (!isRecoveryUrl) {
                if (isMounted) {
                    setError("Please use the password reset link sent to your email.");
                    setIsChecking(false);
                }
                return;
            }

            await verifyRecovery(session);
        };

        initializeRecovery().catch((error) => {
            console.error("Unable to initialize admin recovery.", error);

            if (isMounted) {
                setError("Unable to verify your reset link. Please request a new one.");
                setIsChecking(false);
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "PASSWORD_RECOVERY" && session) {
                verifyRecovery(session);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const handleResetPassword = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess(false);

        if (!newPassword || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (!Object.values(passwordRequirements).every(Boolean)) {
            setError("Password does not meet the requirements.");
            return;
        }

        if (!isRecovery) {
            setError("Your password reset session is invalid or expired.");
            return;
        }

        setIsLoading(true);

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;
            if (!user) throw new Error("Your recovery session has expired.");

            // Verify the admin role again before updating the password.
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .maybeSingle();

            if (profileError) throw profileError;

            const role = String(profile?.role || "").toLowerCase();

            if (!["admin", "administrator", "super_admin"].includes(role)) {
                throw new Error("This account does not have admin access.");
            }

            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (updateError) throw updateError;

            await supabase.auth.signOut();
            setSuccess(true);
            setIsRecovery(false);
        } catch (error) {
            console.error("Admin reset password error:", error);

            setError(
                getAuthErrorMessage(
                    error,
                    "An error occurred while resetting the password. Please try again."
                )
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-dvh items-center justify-center bg-primary p-4 md:py-10">
            <div className="relative grid w-full max-w-md grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-2xl md:max-w-4xl md:grid-cols-2">

                <Link
                    to="/admin/login"
                    aria-label="Back to admin login"
                    className="absolute left-3 top-3 z-10 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary/10 px-4 text-sm font-semibold text-secondary transition-colors hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 max-md:w-11 max-md:justify-center max-md:px-0 md:left-4 md:top-4"
                >
                    <ArrowLeft size={16} aria-hidden="true" />
                    <span className="max-md:sr-only">Back to admin login</span>
                </Link>

                <section className="hidden items-center justify-center bg-white p-8 md:flex">
                    <img
                        src={resetPasswordImage}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        className="h-auto w-full max-w-xs object-contain"
                    />
                </section>

                <section className="flex flex-col justify-center bg-white p-6 pt-16 text-text md:p-8">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <KeyRound className="h-8 w-8 text-primary" aria-hidden="true" />
                    </div>

                    <h1 className="text-center text-2xl font-extrabold">
                        Set your new admin password
                    </h1>

                    <p className="mb-5 mt-1 text-center text-sm text-text/70">
                        Create a new password to regain access to your admin account.
                    </p>

                    {isChecking ? (
                        <div className="flex items-center justify-center gap-2 py-8 text-sm text-text/70">
                            <LoaderCircle className="animate-spin" size={18} />
                            Verifying reset link...
                        </div>
                    ) : !isRecovery ? (
                        <div className="flex flex-col gap-4">
                            {error && (
                                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                    {error}
                                </p>
                            )}

                            <Link
                                to="/admin/forgot-password"
                                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-secondary px-4 py-2.5 font-semibold text-white hover:bg-secondary-hover"
                            >
                                Request a new reset link
                            </Link>
                        </div>
                    ) : (
                        <form noValidate onSubmit={handleResetPassword} className="flex flex-col gap-4">
                            <div>
                                <label htmlFor="newPassword" className={labelClass}>
                                    New Password
                                </label>

                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="newPassword"
                                        name="newPassword"
                                        autoComplete="new-password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className={`${fieldClass} pr-11`}
                                        placeholder="Enter your new password"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className={toggleClass}
                                    >
                                        {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                    </button>
                                </div>

                                {newPassword && (
                                    <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-0.5 text-xs sm:grid-cols-2" aria-live="polite">
                                        {requirementList.map(([met, label]) => (
                                            <li key={label} className={met ? "text-green-700" : "text-red-700"}>
                                                <span aria-hidden="true">{met ? "✓" : "✕"}</span>{" "}
                                                {label}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className={labelClass}>
                                    Confirm New Password
                                </label>

                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className={`${fieldClass} pr-11`}
                                        placeholder="Confirm your password"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                        className={toggleClass}
                                    >
                                        {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                    </button>
                                </div>

                                {confirmPassword && (
                                    <p aria-live="polite" className={`mt-2 text-xs ${confirmPassword === newPassword ? "text-green-700" : "text-red-700"}`}>
                                        {confirmPassword === newPassword ? "✓ Passwords match" : "✕ Passwords do not match"}
                                    </p>
                                )}
                            </div>

                            {error && (
                                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                aria-busy={isLoading}
                                className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-secondary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isLoading ? "Resetting..." : "Reset Password"}
                                {isLoading && <LoaderCircle className="animate-spin" size={16} />}
                            </button>
                        </form>
                    )}

                    {success && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                            <div
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="reset-success-title"
                                className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
                            >
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                                    <Check className="h-8 w-8 text-green-700" aria-hidden="true" />
                                </div>

                                <h2 id="reset-success-title" className="mb-2 text-xl font-extrabold text-text">
                                    Password reset successful
                                </h2>

                                <p className="mb-6 text-sm text-text/70">
                                    Your admin password has been successfully reset.
                                </p>

                                <button
                                    type="button"
                                    autoFocus
                                    onClick={() => navigate("/admin/login", { replace: true })}
                                    className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-lg bg-secondary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-secondary-hover"
                                >
                                    Back to Admin Login
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

export default AdminResetPassword;
