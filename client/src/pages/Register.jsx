
import logo from "../assets/agos_logo.png";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { signUp } from "../services/authService";
import { getAuthErrorMessage } from "../services/authError";
import {
    getProvinces,
    getCitiesByProvince,
    getBarangaysByCity,
} from "../services/locationService";

const fieldClass =
    "w-full min-h-11 rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text/40 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40 disabled:cursor-not-allowed disabled:opacity-60";

const errorFieldClass = fieldClass.replace(
    "border-gray-300",
    "border-red-500"
);

const labelClass = "mb-1 block text-sm font-semibold text-text";

const toggleClass =
    "absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary";

const PH_MOBILE_REGEX = /^9\d{9}$/;

const normalizePhoneInput = (value) => {
    let digits = value.replace(/\D/g, "");

    if (digits.startsWith("63")) {
        digits = digits.slice(2);
    }

    if (digits.startsWith("0")) {
        digits = digits.slice(1);
    }

    return digits.slice(0, 10);
};

// Convert national format to international format for Supabase.
const formatInternationalPhone = (value) => `+63${value}`;

const benefits = [
    "Flood alerts for your barangay",
    "Safer routes during floods",
    "One-tap emergency hotlines",
];

function Register() {
    const [step, setStep] = useState(1);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [phoneTouched, setPhoneTouched] = useState(false);

    const [provinceID, setProvinceID] = useState("");
    const [cityID, setCityID] = useState("");
    const [barangayId, setBarangayId] = useState("");
    // Location options fetched from Supabase
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [barangays, setBarangays] = useState([]);

    // Location loading states
    const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [isLoadingBarangays, setIsLoadingBarangays] = useState(false);

    const [locationError, setLocationError] = useState("");

    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [confirmPassword, setConfirmPassword] = useState("");
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const passwordRequirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const requirementList = [
        [passwordRequirements.length, "8+ characters"],
        [passwordRequirements.uppercase, "Uppercase"],
        [passwordRequirements.lowercase, "Lowercase"],
        [passwordRequirements.number, "Number"],
        [passwordRequirements.specialChar, "Symbol"],
    ];

    // Move focus to the heading when the step changes.
    const headingRef = useRef(null);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        headingRef.current?.focus();
    }, [step]);

    // Account validation
    const validateAccount = () => {
        if (!name.trim()) {
            return "Please enter your name.";
        }

        if (!email.trim()) {
            return "Please enter your email.";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return "Please enter a valid email address.";
        }

        if (!Object.values(passwordRequirements).every(Boolean)) {
            return "Password does not meet the requirements.";
        }

        if (password !== confirmPassword) {
            return "Passwords do not match.";
        }

        return "";
    };

    // Phone validation
    const validatePhone = () => {
        if (!phone) {
            return "Please enter your phone number.";
        }

        if (!PH_MOBILE_REGEX.test(phone)) {
            return "Enter a valid Philippine mobile number with 10 digits.";
        }

        return "";
    };

    // Location validation
    const validateLocation = () => {
        if (!provinceID) {
            return "Please select your province.";
        }

        if (!cityID) {
            return "Please select your city.";
        }

        if (!barangayId) {
            return "Please select your barangay.";
        }

        return "";
    };

    const validateDetails = () => {
        return validatePhone() || validateLocation();
    };

    const phoneError = phoneTouched ? validatePhone() : "";

    // Handle phone input.
    // Accepts pasted numbers with +63 or leading 0.
    const handlePhoneChange = (e) => {
        const normalized = normalizePhoneInput(e.target.value);

        setPhone(normalized);
        setError("");
    };

    useEffect(() => {
        let isMounted = true;

        const fetchProvinces = async () => {
            try {
                setIsLoadingProvinces(true);
                setLocationError("");

                const data = await getProvinces();

                if (isMounted) {
                    setProvinces(data);
                }
            } catch (error) {
                console.error("Error fetching provinces:", error);

                if (isMounted) {
                    setLocationError("Unable to load provinces. Please try again.");
                }
            } finally {
                if (isMounted) {
                    setIsLoadingProvinces(false);
                }
            }
        };

        fetchProvinces();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!provinceID) {
            setCities([]);
            return;
        }

        let isMounted = true;

        const fetchCities = async () => {
            try {
                setIsLoadingCities(true);
                setLocationError("");

                const data = await getCitiesByProvince(provinceID);

                if (isMounted) {
                    setCities(data);
                }
            } catch (error) {
                console.error("Error fetching cities:", error);

                if (isMounted) {
                    setLocationError("Unable to load cities and municipalities.");
                    setCities([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoadingCities(false);
                }
            }
        };

        fetchCities();

        return () => {
            isMounted = false;
        };
    }, [provinceID]);

    useEffect(() => {
        if (!cityID) {
            setBarangays([]);
            return;
        }

        let isMounted = true;

        const fetchBarangays = async () => {
            try {
                setIsLoadingBarangays(true);
                setLocationError("");

                const data = await getBarangaysByCity(cityID);

                if (isMounted) {
                    setBarangays(data);
                }
            } catch (error) {
                console.error("Error fetching barangays:", error);

                if (isMounted) {
                    setLocationError("Unable to load barangays.");
                    setBarangays([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoadingBarangays(false);
                }
            }
        };

        fetchBarangays();

        return () => {
            isMounted = false;
        };
    }, [cityID]);

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

        setPhoneTouched(true);

        const detailsMessage = validateDetails();

        if (detailsMessage) {
            setError(detailsMessage);
            return;
        }

        setIsLoading(true);

        try {
            const data = await signUp({
                name,
                email,
                password,

                // Always send international format: +639171234567
                phoneNumber: formatInternationalPhone(phone),

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
                getAuthErrorMessage(
                    error,
                    "Registration failed. Please try again."
                )
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e) => {
        if (step === 1) {
            handleContinue(e);
        } else {
            handleRegister(e);
        }
    };

    return (
        <main className="flex min-h-dvh items-center justify-center bg-primary p-4 md:py-10">
            <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-2xl md:min-h-[680px] md:grid-cols-2">

                {/* Logo panel (desktop only) */}
                <section className="relative hidden flex-col items-center justify-center gap-6 border-r border-gray-200 bg-white p-10 md:flex">
                    <Link
                        to="/"
                        className="absolute left-6 top-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary/10 px-4 text-sm font-semibold text-secondary transition-colors hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                    >
                        <ArrowLeft size={16} aria-hidden="true" />
                        Back to homepage
                    </Link>

                    <img
                        src={logo}
                        alt="AGOS Logo"
                        className="h-auto w-64 max-w-full object-contain lg:w-72"
                    />

                    <p className="max-w-xs text-balance text-center text-lg font-bold italic text-text lg:text-xl">
                        <span className="text-primary">A</span>biso at{" "}
                        <span className="text-primary">G</span>abay sa{" "}
                        <span className="text-primary">O</span>ras ng{" "}
                        <span className="text-primary">S</span>akuna
                    </p>

                    <div
                        className="h-1 w-12 rounded-full bg-primary"
                        aria-hidden="true"
                    />

                    <ul className="flex flex-col gap-3">
                        {benefits.map((benefit) => (
                            <li
                                key={benefit}
                                className="flex items-center gap-3 text-sm font-medium text-text"
                            >
                                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                                    <Check size={14} strokeWidth={3} aria-hidden="true" />
                                </span>
                                {benefit}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Form panel */}
                <section className="flex flex-col justify-center gap-4 bg-white p-6 text-text md:px-10 md:py-10">

                    {/* Mobile header */}
                    <div className="flex items-center justify-between md:hidden">
                        <Link
                            to="/"
                            aria-label="Back to homepage"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-secondary transition-colors hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                        >
                            <ArrowLeft size={18} aria-hidden="true" />
                        </Link>

                        <img
                            src={logo}
                            alt="AGOS Logo"
                            className="h-10 w-auto object-contain"
                        />

                        <span className="w-11" aria-hidden="true" />
                    </div>

                    <div>
                        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-secondary">
                            Step {step} of 2 ·{" "}
                            {step === 1 ? "Your account" : "Your details"}
                        </p>

                        <div
                            className="mb-4 grid grid-cols-2 gap-1.5"
                            aria-hidden="true"
                        >
                            <div className="h-1.5 rounded-full bg-primary" />

                            <div
                                className={`h-1.5 rounded-full ${
                                    step === 2 ? "bg-primary" : "bg-gray-300"
                                }`}
                            />
                        </div>

                        <h1
                            ref={headingRef}
                            tabIndex={-1}
                            className="text-2xl font-extrabold focus:outline-none"
                        >
                            {step === 1 ? "Create your account" : "Your details"}
                        </h1>

                        <p className="mt-1 text-sm text-text/70">
                            {step === 1
                                ? "It only takes a minute."
                                : "Add your contact number and where you live."}
                        </p>
                    </div>

                    <form
                        noValidate
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-4"
                    >
                        {/* STEP 1: Account information */}
                        {step === 1 && (
                            <>
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
                                        id="email"
                                        name="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className={fieldClass}
                                        placeholder="e.g., juan@example.com"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className={labelClass}>
                                        Password
                                    </label>

                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            name="password"
                                            autoComplete="new-password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className={`${fieldClass} pr-11`}
                                            placeholder="Create a password"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                            className={toggleClass}
                                        >
                                            {showPassword ? (
                                                <Eye size={20} />
                                            ) : (
                                                <EyeOff size={20} />
                                            )}
                                        </button>
                                    </div>

                                    <ul
                                        className="mt-2 flex flex-wrap gap-1.5"
                                        aria-label="Password requirements"
                                    >
                                        {requirementList.map(([met, label]) => (
                                            <li
                                                key={label}
                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                                                    met
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-slate-100 text-slate-600"
                                                }`}
                                            >
                                                <span aria-hidden="true">
                                                    {met ? "✓" : "○"}
                                                </span>

                                                <span className="sr-only">
                                                    {met ? "Met: " : "Not met: "}
                                                </span>

                                                {label}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <label
                                        htmlFor="confirmPassword"
                                        className={labelClass}
                                    >
                                        Confirm Password
                                    </label>

                                    <div className="relative">
                                        <input
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            autoComplete="new-password"
                                            value={confirmPassword}
                                            onChange={(e) =>
                                                setConfirmPassword(e.target.value)
                                            }
                                            required
                                            className={`${fieldClass} pr-11`}
                                            placeholder="Confirm your password"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    !showConfirmPassword
                                                )
                                            }
                                            aria-label={
                                                showConfirmPassword
                                                    ? "Hide confirm password"
                                                    : "Show confirm password"
                                            }
                                            className={toggleClass}
                                        >
                                            {showConfirmPassword ? (
                                                <Eye size={20} />
                                            ) : (
                                                <EyeOff size={20} />
                                            )}
                                        </button>
                                    </div>

                                    <div aria-live="polite">
                                        {confirmPassword &&
                                            confirmPassword === password && (
                                                <p className="mt-2 text-xs text-green-700">
                                                    ✓ Passwords match
                                                </p>
                                            )}

                                        {confirmPassword &&
                                            confirmPassword !== password &&
                                            confirmPassword.length >= password.length && (
                                                <p className="mt-2 text-xs text-red-700">
                                                    ✕ Passwords do not match
                                                </p>
                                            )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* STEP 2: Contact and location information */}
                        {step === 2 && (
                            <>
                                <div>
                                    <label htmlFor="phone" className={labelClass}>
                                        Phone number
                                    </label>

                                    <div
                                        className={`flex min-h-11 w-full overflow-hidden rounded-lg border bg-background focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/40 ${
                                            phoneError
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        }`}
                                    >
                                        {/* Fixed country code */}
                                        <span className="inline-flex shrink-0 items-center border-r border-gray-300 bg-gray-100 px-3 text-sm font-semibold text-text">
                                            +63
                                        </span>

                                        {/* User enters only the remaining 10 digits */}
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            inputMode="numeric"
                                            autoComplete="tel-national"
                                            maxLength={10}
                                            value={phone}
                                            onChange={handlePhoneChange}
                                            onBlur={() => setPhoneTouched(true)}
                                            required
                                            aria-invalid={Boolean(phoneError)}
                                            aria-describedby="phone-hint"
                                            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-text outline-none placeholder:text-text/40"
                                            placeholder="917 123 4567"
                                        />
                                    </div>

                                    <p
                                        id="phone-hint"
                                        aria-live="polite"
                                        className={`mt-1 text-xs ${
                                            phoneError
                                                ? "text-red-700"
                                                : "text-text/60"
                                        }`}
                                    >
                                        {phoneError ||
                                            "Enter your 10-digit mobile number starting with 9."}
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="province" className={labelClass}>
                                        Province
                                    </label>

                                    <select
                                        id="province"
                                        name="province"
                                        value={provinceID}
                                        onChange={(e) => {
                                            setProvinceID(e.target.value);
                                            setCityID("");
                                            setBarangayId("");
                                            setCities([]);
                                            setBarangays([]);
                                            setLocationError("");
                                        }}
                                        required
                                        disabled={isLoadingProvinces}
                                        className={fieldClass}
                                    >
                                        <option value="">
                                            {isLoadingProvinces
                                                ? "Loading provinces..."
                                                : provinces.length === 0
                                                    ? "No provinces available"
                                                    : "Select your province"}
                                        </option>

                                        {provinces.map((province) => (
                                            <option
                                                key={province.psgc_code}
                                                value={province.psgc_code}
                                            >
                                                {province.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="city" className={labelClass}>
                                        City / Municipality
                                    </label>

                                    <select
                                        id="city"
                                        name="city"
                                        value={cityID}
                                        onChange={(e) => {
                                            setCityID(e.target.value);
                                            setBarangayId("");
                                            setBarangays([]);
                                            setLocationError("");
                                        }}
                                        required
                                        disabled={!provinceID || isLoadingCities}
                                        className={fieldClass}
                                    >
                                        <option value="">
                                            {!provinceID
                                                ? "Select a province first"
                                                : isLoadingCities
                                                    ? "Loading cities..."
                                                    : cities.length === 0
                                                        ? "No cities available"
                                                        : "Select your city / municipality"}
                                        </option>

                                        {cities.map((city) => (
                                            <option
                                                key={city.psgc_code}
                                                value={city.psgc_code}
                                            >
                                                {city.name}
                                                {city.type === "city" ? " (City)" : " (Municipality)"}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="barangay" className={labelClass}>
                                        Barangay
                                    </label>

                                    <select
                                        id="barangay"
                                        name="barangay"
                                        value={barangayId}
                                        onChange={(e) => setBarangayId(e.target.value)}
                                        required
                                        disabled={!cityID || isLoadingBarangays}
                                        className={fieldClass}
                                    >
                                        <option value="">
                                            {!cityID
                                                ? "Select a city first"
                                                : isLoadingBarangays
                                                    ? "Loading barangays..."
                                                    : barangays.length === 0
                                                        ? "No barangays available"
                                                        : "Select your barangay"}
                                        </option>

                                        {barangays.map((barangay) => (
                                            <option
                                                key={barangay.psgc_code}
                                                value={barangay.psgc_code}
                                            >
                                                {barangay.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {locationError && (
                                    <p className="text-sm text-red-700" role="alert">
                                        {locationError}
                                    </p>
                                )}

                                <p className="rounded-lg bg-background/60 px-3 py-2.5 text-sm text-text/70">
                                    We use your barangay to show flood alerts and routes near you.
                                </p>
                            </>
                        )}

                        {/* Error message */}
                        {error && (
                            <p
                                role="alert"
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                            >
                                {error}
                            </p>
                        )}

                        {/* Success message */}
                        {success && (
                            <p
                                role="status"
                                className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
                            >
                                {success}
                            </p>
                        )}

                        {/* Navigation buttons */}
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

                                    {isLoading && (
                                        <LoaderCircle
                                            className="animate-spin"
                                            size={16}
                                        />
                                    )}
                                </button>
                            </div>
                        )}
                    </form>

                    <p className="text-center text-sm text-text/70">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="font-semibold text-secondary underline-offset-4 hover:underline"
                        >
                            Log in
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
}

export default Register;
