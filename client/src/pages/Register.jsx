import logo from "../assets/agos_logo.png";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { signUp } from "../services/authService";

const fieldClass =
    "w-full min-h-11 rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text/40 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40";
const labelClass = "mb-1 block text-sm font-semibold text-text";
const toggleClass =
    "absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary";

function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [provinceID, setProvinceID] = useState('');
    const [cityID, setCityID] = useState('');
    const [barangayId, setBarangayId] = useState('');
    const [password, setPassword] = useState('');
    const passwordRequirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    const requirementList = [
        [passwordRequirements.length, "At least 8 characters"],
        [passwordRequirements.uppercase, "One uppercase letter"],
        [passwordRequirements.lowercase, "One lowercase letter"],
        [passwordRequirements.number, "One number"],
        [passwordRequirements.specialChar, "One special character"],
    ];

    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!name.trim()) {
            setError("Please enter your name.");
            return;
        }

        if (!email.trim()) {
            setError("Please enter your email.");
            return;
        }

        if (!provinceID) {
            setError("Please select your province.");
            return;
        }

        if (!cityID) {
            setError("Please select your city.");
            return;
        }

        if (!barangayId) {
            setError("Please select your barangay.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!Object.values(passwordRequirements).every(Boolean)) {
            setError("Password does not meet the requirements.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsLoading(true);

        try {
            const data = await signUp({
                name,
                email,
                password,
                provinceID,
                cityID,
                barangayId,
            });

            if (data.user?.identities?.length === 0) {
                setError("An account with this email may already exist.");
                return;
            }

            if (data.session) {
                // Email confirmation is disabled.
                window.location.href = "/";
            } else {
                // Email confirmation is enabled.
                setSuccess(
                    "Registration submitted! Please check your email to confirm your account."
                );
            }
        } catch (error) {
            console.error("Registration error:", error);
            setError(
                error.message || "Registration failed. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

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
                    <h1 className="text-center text-2xl font-extrabold">Register an account</h1>
                    <p className="mb-5 mt-1 text-center text-sm text-text/70">
                        Join AGOS to stay informed and prepared.
                    </p>

                    <form noValidate onSubmit={handleRegister} className="flex flex-col gap-4">
                        <div>
                            <label htmlFor="name" className={labelClass}>Name</label>
                            <input type="text" id="name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required className={fieldClass} placeholder="e.g., Juan Dela Cruz" />
                        </div>

                        <fieldset className="m-0 min-w-0 border-0 p-0">
                            <legend className={labelClass}>Address</legend>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <label htmlFor="province" className="sr-only">Province</label>
                                <select id="province" name="province" value={provinceID} onChange={(e) => setProvinceID(e.target.value)} required className={fieldClass}>
                                    <option value="">Province</option>
                                    <option value="1">Batangas</option>
                                    <option value="2">Province 2</option>
                                    <option value="3">Province 3</option>
                                </select>

                                <label htmlFor="city" className="sr-only">City</label>
                                <select id="city" name="city" value={cityID} onChange={(e) => setCityID(e.target.value)} required className={fieldClass}>
                                    <option value="">City</option>
                                    <option value="City 1">Batangas City</option>
                                    <option value="City 2">City 2</option>
                                    <option value="City 3">City 3</option>
                                </select>

                                <label htmlFor="barangay" className="sr-only">Barangay</label>
                                <select id="barangay" name="barangay" value={barangayId} onChange={(e) => setBarangayId(e.target.value)} required className={`${fieldClass} sm:col-span-2`}>
                                    <option value="">Barangay</option>
                                    <option value="Address 1">Address 1</option>
                                    <option value="Address 2">Address 2</option>
                                    <option value="Address 3">Address 3</option>
                                </select>
                            </div>
                        </fieldset>

                        <div>
                            <label htmlFor="email" className={labelClass}>Email</label>
                            <input type="email" id="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={fieldClass} placeholder="e.g., juan@example.com" />
                        </div>

                        <div>
                            <label htmlFor="password" className={labelClass}>Password</label>
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} id="password" name="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required className={`${fieldClass} pr-11`} placeholder="Create a password" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className={toggleClass}>
                                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                </button>
                            </div>

                            {password && (
                                <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-0.5 text-xs sm:grid-cols-2" aria-live="polite">
                                    {requirementList.map(([met, label]) => (
                                        <li key={label} className={met ? "text-green-700" : "text-red-700"}>
                                            <span aria-hidden="true">{met ? "✓" : "✕"}</span>{" "}
                                            <span className="sr-only">{met ? "Met: " : "Not met: "}</span>
                                            {label}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
                            <div className="relative">
                                <input type={showConfirmPassword ? "text" : "password"} id="confirmPassword" name="confirmPassword" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={`${fieldClass} pr-11`} placeholder="Confirm your password" />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"} className={toggleClass}>
                                    {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                </button>
                            </div>

                            {confirmPassword && (
                                <p aria-live="polite" className={`mt-2 text-xs ${confirmPassword === password ? "text-green-700" : "text-red-700"}`}>
                                    {confirmPassword === password ? "✓ Passwords match" : "✕ Passwords do not match"}
                                </p>
                            )}
                        </div>

                        {error && (
                            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                {error}
                            </p>
                        )}

                        {success && (
                            <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                                {success}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            aria-busy={isLoading}
                            className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-secondary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isLoading ? "Registering..." : "Register"}
                            {isLoading && <LoaderCircle className="animate-spin" size={16} />}
                        </button>
                    </form>

                    <p className="mt-5 text-center text-sm text-text/70">
                        Already have an account?{" "}
                        <Link to="/login" className="font-semibold text-secondary underline-offset-4 hover:underline">
                            Log in
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
}

export default Register;