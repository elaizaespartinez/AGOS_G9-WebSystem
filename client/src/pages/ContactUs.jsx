import { useState, useEffect } from "react";
import { Mail, Phone, LoaderCircle, CircleCheck, CircleAlert, X } from "lucide-react";
import contactVisual from "../assets/visuals/contact-us.png"; // TODO: replace with your image path or imported asset

const getInputClass = (hasError) =>
    `w-full rounded-full bg-gray-100 px-6 py-2.5 text-xs text-gray-800 placeholder:text-gray-400 placeholder:font-semibold font-agos-sub focus:outline-none focus:ring-2 ${
        hasError ? "ring-2 ring-red-400 focus:ring-red-400" : "focus:ring-white/70"
    }`;

function ContactUs() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        number: "",
        location: "",
        message: "",
    });
    const [errorField, setErrorField] = useState("");
    const [toast, setToast] = useState(null); // { type: "error" | "success", message: string }
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // auto-dismiss the toast after 5 seconds
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(timer);
    }, [toast]);

    // close the confirm dialog with the Escape key
    useEffect(() => {
        if (!showConfirm) return;
        const onKeyDown = (e) => {
            if (e.key === "Escape") setShowConfirm(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [showConfirm]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errorField === name) setErrorField("");
    };

    // show an error toast, highlight the field and move the cursor to it
    const fail = (field, message) => {
        setErrorField(field);
        setToast({ type: "error", message });
        document.getElementById(field)?.focus();
    };

    // step 1: validate, then ask for confirmation
    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorField("");
        setToast(null);

        if (!form.name.trim()) return fail("name", "Please enter your full name.");
        if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            return fail("email", "Please enter a valid email address.");
        if (!form.number.trim() || !/^[+()\d\s-]{7,20}$/.test(form.number))
            return fail("number", "Please enter a valid contact number.");
        if (!form.location.trim()) return fail("location", "Please enter your location.");
        if (!form.message.trim()) return fail("message", "Please describe your concern.");

        setShowConfirm(true);
    };

    // step 2: user confirmed, actually send
    const handleConfirmSend = async () => {
        setShowConfirm(false);
        setIsLoading(true);
        try {
            // supabase / API call here
            setToast({
                type: "success",
                message:
                    "Your message has been successfully sent. Thank you for contacting us! AGOS will get back to you as soon as possible.",
            });
            setForm({ name: "", email: "", number: "", location: "", message: "" });
        } catch (err) {
            setToast({
                type: "error",
                message: "Something went wrong. We apologize for the inconvenience. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section id="contact" className="w-full px-4 py-12 md:px-32 flex flex-col scroll-mt-20">
            {/* Toast popup */}
            {toast && (
                <div
                    role={toast.type === "error" ? "alert" : "status"}
                    className={`fixed top-24 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md flex items-start gap-3 rounded-lg bg-white p-4 shadow-elevated border-l-4 ${
                        toast.type === "error" ? "border-risk-high" : "border-safe"
                    }`}
                >
                    {toast.type === "error" ? (
                        <CircleAlert size={20} className="shrink-0 text-risk-high mt-0.5" />
                    ) : (
                        <CircleCheck size={20} className="shrink-0 text-safe mt-0.5" />
                    )}
                    <p className="flex-1 text-xs font-medium text-text">{toast.message}</p>
                    <button
                        type="button"
                        onClick={() => setToast(null)}
                        aria-label="Dismiss message"
                        className="shrink-0 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Confirm dialog */}
            {showConfirm && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setShowConfirm(false)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="confirm-title"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-elevated text-center"
                    >
                        <h2 id="confirm-title" className="text-lg font-extrabold text-text mb-2">
                            Send this message?
                        </h2>
                        <p className="text-xs text-text/100 mb-6">
                            Please make sure your details are correct before sending your message to the AGOS team.
                        </p>

                        <div className="flex gap-3 justify-center">
                            <button
                                type="button"
                                onClick={() => setShowConfirm(false)}
                                className="rounded-full border border-gray-300 px-5 py-2 text-xs font-bold text-text hover:bg-red-600/70 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                autoFocus
                                onClick={handleConfirmSend}
                                className="rounded-full bg-primary-hover px-5 py-2 text-xs font-bold text-white hover:bg-green-600 cursor-pointer focus:outline-none"
                            >
                                Yes, send
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="mb-10">
                <h2 className="text-2xl font-extrabold text-text md:text-3xl">
                    Contact Us
                </h2>
            </header>

            {/* Layout wrapper: form column on the left, image visual on the right (stacks on mobile) */}
            <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
                <section className="w-full md:w-full">
                    {/* Form card */}
                    <form
                        noValidate
                        onSubmit={handleSubmit}
                        className="bg-primary-hover rounded-lg shadow-elevated p-5 flex flex-col gap-3 w-00 md:w-full"
                    >
                        <div>
                            <label htmlFor="name" className="block text-white text-[11px] font-bold uppercase mb-1 ml-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                autoComplete="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                placeholder="Juan Dela Cruz"
                                aria-invalid={errorField === "name"}
                                className={getInputClass(errorField === "name")}
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-white text-[11px] font-bold uppercase mb-1 ml-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                autoComplete="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                placeholder="juan@email.com"
                                aria-invalid={errorField === "email"}
                                className={getInputClass(errorField === "email")}
                            />
                        </div>

                        <div>
                            <label htmlFor="number" className="block text-white text-[11px] font-bold uppercase mb-1 ml-2">
                                Contact Number
                            </label>
                            <input
                                type="tel"
                                id="number"
                                name="number"
                                autoComplete="tel"
                                value={form.number}
                                onChange={handleChange}
                                required
                                placeholder="+63 912 345 6789"
                                aria-invalid={errorField === "number"}
                                className={getInputClass(errorField === "number")}
                            />
                        </div>

                        <div>
                            <label htmlFor="location" className="block text-white text-[11px] font-bold uppercase mb-1 ml-2">
                                Location
                            </label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                value={form.location}
                                onChange={handleChange}
                                required
                                placeholder="Barangay, City, Province"
                                aria-invalid={errorField === "location"}
                                className={getInputClass(errorField === "location")}
                            />
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-white text-[11px] font-bold uppercase mb-1 ml-2">
                                Your Message
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                rows={7}
                                value={form.message}
                                onChange={handleChange}
                                required
                                placeholder={"Describe your concern here\n\nNeed urgent help? In case of an emergency, please visit our Hotline section for hotlines and immediate help."}
                                aria-invalid={errorField === "message"}
                                className={`w-full rounded-lg bg-gray-100 px-4 py-3 text-xs text-gray-800 placeholder:text-gray-400 placeholder:font-semibold font-agos-sub resize-none focus:outline-none focus:ring-2 ${
                                    errorField === "message" ? "ring-2 ring-red-400 focus:ring-red-400" : "focus:ring-white/70"
                                }`}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            aria-busy={isLoading}
                            className="self-center flex items-center justify-center bg-white text-primary text-xs font-bold rounded-full px-6 py-2 shadow-card hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white/70 disabled:opacity-70 cursor-pointer"
                        >
                            {isLoading ? "Sending..." : "Send Message"}
                            {isLoading && <LoaderCircle className="ml-2 animate-spin" size={14} />}
                        </button>
                    </form>

                    {/* Contact info strip */}
                    <div className="bg-primary rounded-lg shadow-elevated px-4 py-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                        <a
                            href="mailto:support@agos.ph"
                            className="flex items-center gap-3 text-white text-xs font-bold hover:underline"
                        >
                            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-hover border-2 border-white/60">
                                <Mail size={18} />
                            </span>
                            support@agos.ph
                        </a>

                        <a
                            href="tel:+6328888246"
                            className="flex items-center gap-3 text-white text-xs font-bold hover:underline"
                        >
                            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-hover border-2 border-white/60">
                                <Phone size={18} />
                            </span>
                            +63 2 8888 AGOS
                        </a>
                    </div>
                </section>

                {/* Image visual (right side). Remove "hidden md:block" to also show it on mobile. */}
                <div className="hidden md:flex md:w-[450px] items-center justify-center">
                    <img
                        src={contactVisual}
                        alt="Contact AGOS"
                        className="w-full object-contain"
                    />
                </div>
            </div>
        </section>
    );
}

export default ContactUs;