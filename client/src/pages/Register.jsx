import logo from "../assets/agos_logo.png";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { signUp } from "../services/authService";
import { getAuthErrorMessage } from "../services/authError";

const fieldClass =
    "w-full min-h-11 rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text/40 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40 disabled:cursor-not-allowed disabled:opacity-60";
const labelClass = "mb-1 block text-sm font-semibold text-text";
const toggleClass =
    "absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary";

const benefits = [
    "Flood alerts for your barangay",
    "Safer routes during floods",
    "One-tap emergency hotlines",
];

function Register() {
    const [step, setStep] = useState(1);
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
        [passwordRequirements.length, "8+ characters"],
        [passwordRequirements.uppercase, "Uppercase"],
        [passwordRequirements.lowercase, "Lowercase"],
        [passwordRequirements.number, "Number"],
        [passwordRequirements.specialChar, "Symbol"],
    ];

    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);


    const headingRef = useRef(null);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        headingRef.current?.focus();
    }, [step]);

    const validateAccount = () => {
        if (!name.trim()) return "Please enter your name.";
        if (!email.trim()) return "Please enter your email.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return "Please enter a valid email address.";
        }
        if (!Object.values(passwordRequirements).every(Boolean)) {
            return "Password does not meet the requirements.";
        }
        if (password !== confirmPassword) return "Passwords do not match.";
        return "";
    };

    const validateLocation = () => {
        if (!provinceID) return "Please select your province.";
        if (!cityID) return "Please select your city.";
        if (!barangayId) return "Please select your barangay.";
        return "";
    };

    const handleContinue = (e) => {
        e.preventDefault();
        setError("");

        const message = validateAccount();
        if (message) {
            setError(message);
            return;
        }

        setStep(2);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const accountMessage = validateAccount();
        if (accountMessage) {
            setStep(1);
            setError(accountMessage);
            return;
        }

        const locationMessage = validateLocation();
        if (locationMessage) {
            setError(locationMessage);
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
    
                window.location.href = "/";
            } else {
   
                setSuccess(
                    "Registration submitted! Please check your email to confirm your account."
                );
            }
        } catch (error) {
            console.error("Registration error:", error);
            setError(
                getAuthErrorMessage(error, "Registration failed. Please try again.")
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e) => (step === 1 ? handleContinue(e) : handleRegister(e));

    return (
        <main className="flex min-h-dvh items-center justify-center bg-primary p-4 md:py-10">
            <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-2xl md:grid-cols-[1fr_1.25fr]">

                <section className="hidden flex-col justify-between gap-8 bg-secondary p-10 text-white md:flex">
                    <div className="w-fit rounded-xl bg-white p-3">
                        <img src={logo} alt="AGOS Logo" className="h-12 w-auto object-contain" />
                    </div>

                    <div>
                        <h2 className="mb-5 text-3xl font-extrabold leading-tight">
                            Abiso at Gabay sa Oras ng Sakuna
                        </h2>
                        <ul className="flex flex-col gap-3.5">
                            {benefits.map((benefit) => (
                                <li key={benefit} className="flex items-center gap-3 text-[15px]">
                                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                                        <Check size={14} strokeWidth={3} aria-hidden="true" />
                                    </span>
                                    {benefit}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="font-bold italic text-white/80">Sa bawat AGOS, may gabay.</p>
                </section>

                <section className="flex flex-col gap-4 bg-white p-6 text-text md:px-10 md:py-8">

                    <div className="flex items-center justify-between md:hidden">
                        <Link
                            to="/"
                            aria-label="Back to homepage"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-secondary transition-colors hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                        >
                            <ArrowLeft size={18} aria-hidden="true" />
                        </Link>
                        <img src={logo} alt="AGOS Logo" className="h-10 w-auto object-contain" />
                        <span className="w-11" aria-hidden="true" />
                    </div>

                    <Link
                        to="/"
                        className="hidden min-h-11 w-fit items-center gap-2 rounded-full bg-primary/10 px-4 text-sm font-semibold text-secondary transition-colors hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 md:inline-flex"
                    >
                        <ArrowLeft size={16} aria-hidden="true" />
                        Back to homepage
                    </Link>

                    <div>
                        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-secondary">
                            Step {step} of 2 · {step === 1 ? "Your account" : "Your location"}
                        </p>
                        <div className="mb-4 grid grid-cols-2 gap-1.5" aria-hidden="true">
                            <div className="h-1.5 rounded-full bg-primary" />
                            <div className={`h-1.5 rounded-full ${step === 2 ? "bg-primary" : "bg-gray-300"}`} />
                        </div>

                        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold focus:outline-none">
                            {step === 1 ? "Create your account" : "Where do you live?"}
                        </h1>
                        <p className="mt-1 text-sm text-text/70">
                            {step === 1
                                ? "It only takes a minute."
                                : "This helps AGOS show alerts and routes near you."}
                        </p>
                    </div>

                    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">

                        {step === 1 && (
                            <>
                                <div>
                                    <label htmlFor="name" className={labelClass}>Name</label>
                                    <input type="text" id="name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required className={fieldClass} placeholder="e.g., Juan Dela Cruz" />
                                </div>

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

                                    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Password requirements">
                                        {requirementList.map(([met, label]) => (
                                            <li
                                                key={label}
                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                                                    met ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                                                }`}
                                            >
                                                <span aria-hidden="true">{met ? "✓" : "○"}</span>
                                                <span className="sr-only">{met ? "Met: " : "Not met: "}</span>
                                                {label}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
                                    <div className="relative">
                                        <input type={showConfirmPassword ? "text" : "password"} id="confirmPassword" name="confirmPassword" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={`${fieldClass} pr-11`} placeholder="Confirm your password" />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"} className={toggleClass}>
                                            {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                        </button>
                                    </div>

                                    <div aria-live="polite">
                                        {confirmPassword && confirmPassword === password && (
                                            <p className="mt-2 text-xs text-green-700">✓ Passwords match</p>
                                        )}
                                        {confirmPassword && confirmPassword !== password && confirmPassword.length >= password.length && (
                                            <p className="mt-2 text-xs text-red-700">✕ Passwords do not match</p>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div>
                                    <label htmlFor="province" className={labelClass}>Province</label>
                                    <select
                                        id="province"
                                        name="province"
                                        value={provinceID}
                                        onChange={(e) => {
                                            setProvinceID(e.target.value);
                                            setCityID('');
                                            setBarangayId('');
                                        }}
                                        required
                                        className={fieldClass}
                                    >
                                        <option value="">Select your province</option>
                                        <option value="1">Batangas</option>
                                        <option value="2">Province 2</option>
                                        <option value="3">Province 3</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="city" className={labelClass}>City</label>
                                    <select
                                        id="city"
                                        name="city"
                                        value={cityID}
                                        onChange={(e) => {
                                            setCityID(e.target.value);
                                            setBarangayId('');
                                        }}
                                        required
                                        disabled={!provinceID}
                                        className={fieldClass}
                                    >
                                        <option value="">Select your city</option>
                                        <option value="City 1">Batangas City</option>
                                        <option value="City 2">City 2</option>
                                        <option value="City 3">City 3</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="barangay" className={labelClass}>Barangay</label>
                                    <select
                                        id="barangay"
                                        name="barangay"
                                        value={barangayId}
                                        onChange={(e) => setBarangayId(e.target.value)}
                                        required
                                        disabled={!cityID}
                                        className={fieldClass}
                                    >
                                        <option value="">Select your barangay</option>
                                        <option value="Address 1">Address 1</option>
                                        <option value="Address 2">Address 2</option>
                                        <option value="Address 3">Address 3</option>
                                    </select>
                                </div>

                                <p className="rounded-lg bg-background/60 px-3 py-2.5 text-sm text-text/70">
                                    We use your barangay to show flood alerts and routes near you.
                                </p>
                            </>
                        )}

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

                        {step === 1 ? (
                            <button
                                type="submit"
                                className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-lg bg-secondary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-secondary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                            >
                                Continue
                            </button>
                        ) : (
                            <div className="grid grid-cols-[1fr_1.6fr] gap-2">
                                <button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => {
                                        setError("");
                                        setStep(1);
                                    }}
                                    className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-semibold text-text transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    Back
                                </button>

                                <button
                                    type="submit"
                                    disabled={isLoading || Boolean(success)}
                                    aria-busy={isLoading}
                                    className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-secondary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {isLoading ? "Registering..." : "Register"}
                                    {isLoading && <LoaderCircle className="animate-spin" size={16} />}
                                </button>
                            </div>
                        )}
                    </form>

                    <p className="text-center text-sm text-text/70">
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