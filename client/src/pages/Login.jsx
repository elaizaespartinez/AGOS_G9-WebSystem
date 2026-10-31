import { ArrowLeft, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useState } from "react";
import googleLogo from "../assets/google-logo.png";
import login from "../assets/visuals/login.png";
import {Link, useNavigate} from "react-router-dom";
import {signIn, signInWithGoogle} from "../services/authService";
import { getAuthErrorMessage } from "../services/authError";

const fieldClass =
    "w-full min-h-11 rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text/40 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40";
const labelClass = "mb-1 block text-sm font-semibold text-text";
const toggleClass =
    "absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary";

function Login(){

    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
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
                email,
                password,
            });

            navigate("/");
        } catch (error) {
            console.error("Login error:", error);

            setError(
                getAuthErrorMessage(error, "An error occurred during login. Please try again.")
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setIsGoogleLoading(true);

        try {
            await signInWithGoogle();
            // Supabase redirects the user to Google.
        } catch (error) {
            console.error("Google login error:", error);
            setError(
                getAuthErrorMessage(error, "An error occurred during Google login. Please try again.")
            );
            setIsGoogleLoading(false);
        }
    };

    return (
        <main className="flex min-h-dvh items-center justify-center bg-primary p-4 md:py-10">

            <div className="relative grid w-full max-w-md grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-2xl md:max-w-4xl md:grid-cols-2">

                <Link
                    to="/"
                    className="absolute left-3 top-3 z-10 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary/10 px-4 text-sm font-semibold text-secondary transition-colors hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 md:left-4 md:top-4"
                >
                    <ArrowLeft size={16} aria-hidden="true" />
                    <span className="max-md:sr-only">Back to homepage</span>
                </Link>

                <section className="hidden items-center justify-center bg-white p-8 md:flex">
                    <img
                        src={login}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        className="h-auto w-full max-w-xs object-contain"
                    />
                </section>

                <section className="flex flex-col justify-center bg-white p-6 pt-20 text-text md:p-8">

                    <h1 className="text-center text-2xl font-extrabold">Login</h1>
                    <p className="mb-5 mt-1 text-center text-sm text-text/70">
                        Welcome back! Log in to continue.
                    </p>

                    <form noValidate onSubmit={handleLogin} className="flex flex-col gap-4">

                        <div>
                            <label htmlFor="email" className={labelClass}>Email</label>
                            <input type="email" id="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} placeholder="e.g., juan@example.com" />
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
                            disabled={isLoading || isGoogleLoading}
                            aria-busy={isLoading}
                            className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-secondary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isLoading ? "Logging in..." : "Login"}
                            {isLoading && <LoaderCircle className="animate-spin" size={16} />}
                        </button>

                        <div className="flex items-center justify-center">
                            <hr className="flex-1 border-gray-300" />
                            <span className="mx-3 text-sm text-text/70">Or</span>
                            <hr className="flex-1 border-gray-300" />
                        </div>

                        <button
                            type="button" onClick={handleGoogleLogin} disabled={isGoogleLoading || isLoading}
                            aria-busy={isGoogleLoading}
                            className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70">
                            <img src={googleLogo} alt="" aria-hidden="true" className="h-5 w-5" />
                            <span>{isGoogleLoading ? "Signing in..." : "Sign in with Google"}</span>
                            {isGoogleLoading && <LoaderCircle className="animate-spin" size={16} />}
                        </button>

                        <p className="text-center text-sm text-text/70">
                            Don't have an account?{" "}
                            <Link to="/register" className="font-semibold text-secondary underline-offset-4 hover:underline">
                                Register
                            </Link>
                        </p>
                    </form>

                </section>
            </div>
        </main>
    )
}

export default Login;