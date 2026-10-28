import {Eye, EyeOff, LoaderCircle} from "lucide-react";
import { useState } from "react";
import googleLogo from "../assets/google-logo.png";
import login from "../assets/visuals/login.png";
import {Link, useNavigate} from "react-router-dom";
import {signIn, signInWithGoogle} from "../services/authService";

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
    const [rememberMe, setRememberMe] = useState(false);

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

            if (error.message === "Invalid login credentials") {
                setError("Incorrect email or password.");
            } else {
                setError(
                    error.message || "An error occurred during login. Please try again."
                );
            }
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
                error.message ||
                "An error occurred during Google login. Please try again."
            );
            setIsGoogleLoading(false);
        }
    };


    return (
        <main className="flex min-h-dvh items-center justify-center bg-primary p-4 md:py-10">
            <div className="grid w-full max-w-md grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-2xl md:max-w-4xl md:grid-cols-2">

                <section className="flex items-center justify-center bg-white px-6 py-6 md:p-8">
                    <img
                        src={login}
                        alt="Login"
                        className="h-auto w-28 object-contain md:w-full md:max-w-xs"
                    />
                </section>

                <section className="flex flex-col justify-center bg-white p-6 text-text md:p-8">
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

                            <div className="mt-2 flex items-center justify-between gap-2">
                                <label htmlFor="remember" className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-text/80">
                                    <input type="checkbox" id="remember" name="remember"
                                        checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                                        className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary" />
                                    Remember me
                                </label>

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