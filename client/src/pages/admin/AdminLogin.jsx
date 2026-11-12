import logo from "../../assets/agos_logo.png";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signIn, signOut } from "../../services/authService";
import { getAuthErrorMessage } from "../../services/authError";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { isAdmin } from "../../lib/adminRules";

const fieldClass =
    "w-full min-h-11 rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text/40 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40";
const labelClass = "mb-1 block text-sm font-semibold text-text";
const toggleClass =
    "absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary";

const isAdminUser = async (user) => {
    if (!user?.id) return false;

    if (isAdmin(user)) return true;

    const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (error) throw error;

    return ["admin", "administrator", "super_admin"].includes(
        String(data?.role || "").toLowerCase(),
    );
};

function AdminLogin() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Already signed in as an admin: skip the form
    useEffect(() => {
        let isMounted = true;

        const checkAdmin = async () => {
            if (loading || !user) return;

            try {
                const isAdmin = await isAdminUser(user);

                if (isMounted && isAdmin) {
                    navigate("/admin/dashboard", { replace: true });
                }
            } catch (error) {
                console.error("Admin role verification error:", error);
            }
        };

        checkAdmin();

        return () => {
            isMounted = false;
        };
    }, [user, loading, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (isLoading) return;

        setError("");

        if (!email.trim() || !password) {
            setError("Please fill in all fields.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError("Please enter a valid email address.");
            return;
        }

        setIsLoading(true);

        try {
            await signIn({
                email: email.trim(),
                password,
            });

            const {
                data: { user: signedInUser },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;

            const isAdmin = await isAdminUser(signedInUser);

            if (!isAdmin) {
                await signOut();

                setError("This account doesn't have admin access.");
                return;
            }

            navigate("/admin/dashboard", { replace: true });

        } catch (error) {
            console.error("Admin login error:", error);

            setError(
                getAuthErrorMessage(
                    error,
                    "An error occurred during login. Please try again."
                )
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className="flex min-h-dvh items-center justify-center bg-primary p-4 md:py-10">

            <div className="grid w-full max-w-md grid-cols-1 overflow-hidden rounded-lg bg-white shadow-2xl md:max-w-4xl md:grid-cols-2">

                {/* Logo panel (desktop only) */}
                <section className="relative hidden flex-col items-center justify-center gap-5 border-r border-gray-200 bg-white p-8 md:flex">
                    <Link
                        to="/"
                        className="absolute left-5 top-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary/10 px-4 text-sm font-semibold text-secondary transition-colors hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                    >
                        <ArrowLeft size={16} aria-hidden="true" />
                        Back to public site
                    </Link>

                    <img
                        src={logo}
                        alt="AGOS Logo"
                        className="h-auto w-56 max-w-full object-contain"
                    />

                    <p className="max-w-xs text-balance text-center text-lg font-bold italic text-text">
                        <span className="text-primary">A</span>biso at{" "}
                        <span className="text-primary">G</span>abay sa{" "}
                        <span className="text-primary">O</span>ras ng{" "}
                        <span className="text-primary">S</span>akuna
                    </p>
                </section>

                {/* Form panel */}
                <section className="flex flex-col justify-center gap-4 bg-white p-6 text-text md:px-8 md:py-8">

                    {/* Mobile header: back icon, logo, spacer to keep the logo centered */}
                    <div className="flex items-center justify-between md:hidden">
                        <Link
                            to="/"
                            aria-label="Back to public site"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-secondary transition-colors hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                        >
                            <ArrowLeft size={18} aria-hidden="true" />
                        </Link>
                        <img src={logo} alt="AGOS Logo" className="h-10 w-auto object-contain" />
                        <span className="w-11" aria-hidden="true" />
                    </div>

                    <div>
                        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                            <ShieldCheck size={14} aria-hidden="true" />
                            Admin portal
                        </p>

                        <h1 className="text-2xl font-extrabold">Admin login</h1>
                        <p className="mt-1 text-sm text-text/70">
                            For authorized AGOS personnel only.
                        </p>
                    </div>

                    <form noValidate onSubmit={handleLogin} className="flex flex-col gap-4">

                        <div>
                            <label htmlFor="email" className={labelClass}>Email</label>
                            <input type="email" id="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} placeholder="e.g., admin@example.com" />
                        </div>

                        <div>
                            <label htmlFor="password" className={labelClass}>Password</label>
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} id="password" name="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`${fieldClass} pr-11`} placeholder="Enter your password" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className={toggleClass}>
                                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                </button>
                            </div>

                            <div className="mt-2 flex justify-end">
                                <Link to="/forgot-password" className="text-sm font-semibold text-secondary underline-offset-4 hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
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
                            {isLoading ? "Logging in..." : "Login"}
                            {isLoading && <LoaderCircle className="animate-spin" size={16} />}
                        </button>
                    </form>

                </section>
            </div>
        </main>
    );

    }   

export default AdminLogin;