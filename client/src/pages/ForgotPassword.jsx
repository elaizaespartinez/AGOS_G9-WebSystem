import { ArrowLeft, LockKeyhole, LoaderCircle } from "lucide-react";
import forgotPasswordImage from "../assets/visuals/forgot-password.png";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { getAuthErrorMessage } from "../services/authError";

const fieldClass =
    "w-full min-h-11 rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text/40 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40";
const labelClass = "mb-1 block text-sm font-semibold text-text";

const COOLDOWN_SECONDS = 60;
const COOLDOWN_KEY = "forgotPasswordCooldownUntil";

// localStorage can throw (private mode, blocked storage), so keep it guarded
const readCooldownUntil = () => {
    try {
        return Number(localStorage.getItem(COOLDOWN_KEY)) || 0;
    } catch {
        return 0;
    }
};

const saveCooldown = (seconds) => {
    const until = Date.now() + seconds * 1000;

    try {
        localStorage.setItem(COOLDOWN_KEY, String(until));
    } catch {
        // ignore: the in-memory countdown still works
    }

    return until;
};

const getRetrySeconds = (error) => {
    const message = String(error?.message ?? "");
    const match = message.match(/(?:after|in)\s+(\d+)\s*(seconds?|minutes?)/i);

    if (!match) return COOLDOWN_SECONDS;

    const amount = Number(match[1]);
    return /minute/i.test(match[2]) ? amount * 60 : amount;
};

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [cooldownUntil, setCooldownUntil] = useState(readCooldownUntil);
    const [now, setNow] = useState(() => Date.now());

    const cooldown = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

    // Keep multiple tabs in sync
    useEffect(() => {
        const syncFromStorage = () => {
            setCooldownUntil(readCooldownUntil());
            setNow(Date.now());
        };

        window.addEventListener("storage", syncFromStorage);
        return () => window.removeEventListener("storage", syncFromStorage);
    }, []);

    // Tick once per second while a cooldown is active
    useEffect(() => {
        if (cooldownUntil <= Date.now()) return;

        const timer = window.setInterval(() => {
            const current = Date.now();
            setNow(current);

            if (current >= cooldownUntil) window.clearInterval(timer);
        }, 1000);

        return () => window.clearInterval(timer);
    }, [cooldownUntil]);

    const applyCooldown = (seconds) => {
        setCooldownUntil(saveCooldown(seconds));
        setNow(Date.now());
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (isLoading || cooldown > 0) return; // guards Enter key and double-clicks

        setError("");
        setSuccess(false);

        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        setIsLoading(true);

        try {
            const { error } =
                await supabase.auth.resetPasswordForEmail(
                    email.trim(),
                    {
                        redirectTo: `${window.location.origin}/reset-password`,
                    }
                );

            if (error) throw error;

            setSuccess(true);
            applyCooldown(COOLDOWN_SECONDS);
        } catch (error) {
            console.error("Forgot password error:", error);

            // Supabase rate-limits reset emails; treat that as a cooldown too
            if (
                error?.status === 429 ||
                /security purposes|rate limit|too many requests/i.test(
                    error?.message ?? ""
                )
            ) {
                applyCooldown(getRetrySeconds(error));
                setError("Please wait before requesting another reset link.");
            } else {
                setError(
                    getAuthErrorMessage(
                        error,
                        "An error occurred while sending the reset link. Please try again."
                    )
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-dvh items-center justify-center bg-primary p-4 md:py-10">
            <div className="relative grid w-full max-w-md grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-2xl md:max-w-4xl md:grid-cols-2">

                <Link
                    to="/"
                    aria-label="Back to homepage"
                    className="absolute left-3 top-3 z-10 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary/10 px-4 text-sm font-semibold text-secondary transition-colors hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 max-md:w-11 max-md:justify-center max-md:px-0 md:left-4 md:top-4"
                >
                    <ArrowLeft size={16} aria-hidden="true" />
                    <span className="max-md:sr-only">Back to homepage</span>
                </Link>

                <section className="hidden items-center justify-center bg-white px-8 pb-8 pt-24 md:flex">
                    <img
                        src={forgotPasswordImage}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        className="h-auto max-h-80 w-full max-w-xs object-contain"
                    />
                </section>

                <section className="flex flex-col justify-center bg-white p-6 pt-16 text-text md:p-8">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <LockKeyhole className="h-8 w-8 text-primary" aria-hidden="true" />
                    </div>

                    <h1 className="text-center text-2xl font-extrabold">Forgot password</h1>
                    <p className="mb-5 mt-1 text-center text-sm text-text/70">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>

                    <form noValidate onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                        <div>
                            <label htmlFor="email" className={labelClass}>Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError("");
                                    setSuccess(false);
                                }}
                                required
                                className={fieldClass}
                                placeholder="e.g., juandela@example.com"
                            />
                        </div>

                        {error && (
                            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                {error}
                            </p>
                        )}

                        {success && (
                            <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                                If an account exists for that email, a reset link has been requested. Please check your inbox and spam folder.
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || cooldown > 0}
                            aria-busy={isLoading}
                            className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-secondary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isLoading
                                ? "Sending..."
                                : cooldown > 0
                                    ? `Resend available in ${cooldown}s`
                                    : "Send Reset Link"}
                            {isLoading && <LoaderCircle className="animate-spin" size={16} />}
                        </button>

                        <p className="text-center text-sm text-text/70">
                            Remembered your password?{" "}
                            <Link to="/login" className="font-semibold text-secondary underline-offset-4 hover:underline">
                                Back to login
                            </Link>
                        </p>
                    </form>
                </section>
            </div>
        </main>
    );
}

export default ForgotPassword;