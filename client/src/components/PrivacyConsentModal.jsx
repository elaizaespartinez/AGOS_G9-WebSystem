import { useEffect, useRef, useState } from "react";
import { LoaderCircle, ShieldCheck } from "lucide-react";

// TODO: replace with the real administrator contact before launch
const ADMIN_EMAIL = "admin.agos@gmail.com";

const dataCollected = [
    "Full name",
    "Email address and mobile number",
    "Account login details (your password is stored in encrypted form)",
];

const sectionHeadingClass = "mb-1.5 text-sm font-extrabold text-text";
const paragraphClass = "text-sm leading-relaxed text-text/80";
const listClass = "list-disc space-y-1 pl-5 text-sm leading-relaxed text-text/80";
const linkClass =
    "font-semibold text-secondary underline underline-offset-2 hover:text-secondary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary";

function PrivacyConsentModal({
    isSubmitting = false,
    onDecline,
    onAgree,
    agreeLabel = "Agree and create account",
}) {
    const dialogRef = useRef(null);
    const headingRef = useRef(null);
    const [agreed, setAgreed] = useState(false);

    // Keep the latest props available to the key handler without re-binding it
    const isSubmittingRef = useRef(isSubmitting);
    const onDeclineRef = useRef(onDecline);
    isSubmittingRef.current = isSubmitting;
    onDeclineRef.current = onDecline;

    useEffect(() => {
        const previouslyFocused = document.activeElement;
        const previousOverflow = document.body.style.overflow;

        // Lock page scroll and move focus into the dialog
        document.body.style.overflow = "hidden";
        headingRef.current?.focus();

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                if (!isSubmittingRef.current) onDeclineRef.current?.();
                return;
            }

            if (e.key !== "Tab" || !dialogRef.current) return;

            // Keep Tab and Shift+Tab inside the dialog
            const focusable = dialogRef.current.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );

            if (focusable.length === 0) {
                e.preventDefault();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (
                e.shiftKey &&
                (document.activeElement === first ||
                    document.activeElement === headingRef.current)
            ) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;

            if (previouslyFocused instanceof HTMLElement) {
                previouslyFocused.focus();
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-secondary/60 sm:items-center sm:p-4">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="privacy-title"
                aria-describedby="privacy-intro"
                className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
            >
                {/* Header */}
                <header className="flex items-start gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
                    <span
                        aria-hidden="true"
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                    >
                        <ShieldCheck size={22} />
                    </span>

                    <div>
                        <h2
                            id="privacy-title"
                            ref={headingRef}
                            tabIndex={-1}
                            className="text-xl font-extrabold text-text focus:outline-none"
                        >
                            Data privacy notice and consent
                        </h2>
                        <p id="privacy-intro" className="mt-0.5 text-sm text-text/70">
                            Please read this before we create your account.
                        </p>
                    </div>
                </header>

                {/* Scrollable notice */}
                <div
                    tabIndex={0}
                    role="region"
                    aria-label="Data privacy notice text"
                    className="flex-1 space-y-5 overflow-y-auto px-5 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary sm:px-6"
                >
                    <p className={paragraphClass}>
                        AGOS needs your permission to collect and process your personal
                        information, in accordance with the Data Privacy Act of 2012
                        (Republic Act No. 10173) and its Implementing Rules and Regulations.
                    </p>

                    <section>
                        <h3 className={sectionHeadingClass}>What we collect</h3>
                        <ul className={listClass}>
                            {dataCollected.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h3 className={sectionHeadingClass}>Why we collect it</h3>
                        <p className={paragraphClass}>
                            To create and verify your account, let you use the website’s
                            features, send you important service notices, and keep the system
                            secure.
                        </p>
                    </section>

                    <section>
                        <h3 className={sectionHeadingClass}>Who handles your data</h3>
                        <p className={paragraphClass}>
                            Your data is handled only by the website’s authorized
                            administrator, who acts as the Personal Information Controller. It
                            is not sold, and it is not shared with third parties without your
                            consent, unless the law requires it.
                        </p>
                    </section>

                    <section>
                        <h3 className={sectionHeadingClass}>
                            How long we keep it and how we protect it
                        </h3>
                        <p className={paragraphClass}>
                            We keep your data only while your account is active or as long as
                            needed for the purposes above, then delete or anonymize it. We use
                            organizational, physical, and technical safeguards against
                            unauthorized access, loss, or disclosure.
                        </p>
                    </section>

                    <section>
                        <h3 className={sectionHeadingClass}>Your rights as a data subject</h3>
                        <ul className={listClass}>
                            <li>Be informed about how your data is processed</li>
                            <li>Access a copy of your data</li>
                            <li>Object to processing, or withdraw your consent at any time</li>
                            <li>Correct inaccurate data</li>
                            <li>Request erasure or blocking of your data</li>
                            <li>Receive your data in a portable format</li>
                            <li>Claim damages for any violation of your rights</li>
                            <li>
                                File a complaint with the National Privacy Commission (
                                <a
                                    href="https://privacy.gov.ph"
                                    target="_blank"
                                    rel="noreferrer"
                                    className={linkClass}
                                >
                                    privacy.gov.ph
                                </a>
                                )
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className={sectionHeadingClass}>Questions or requests</h3>
                        <p className={paragraphClass}>
                            Contact the administrator at{" "}
                            <a href={`mailto:${ADMIN_EMAIL}`} className={linkClass}>
                                {ADMIN_EMAIL}
                            </a>
                            .
                        </p>
                    </section>
                </div>

                {/* Consent and actions */}
                <footer className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:px-6">
                    <label
                        htmlFor="privacy-consent"
                        className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-text"
                    >
                        <input
                            id="privacy-consent"
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            disabled={isSubmitting}
                            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-secondary disabled:cursor-not-allowed"
                        />
                        <span>
                            I have read and understood this notice. I voluntarily consent to
                            the collection and processing of my personal data by the
                            administrator as described above.
                        </span>
                    </label>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onDecline}
                            disabled={isSubmitting}
                            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            Decline
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                if (agreed) onAgree();
                            }}
                            disabled={!agreed || isSubmitting}
                            aria-busy={isSubmitting}
                            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-secondary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? "Please wait..." : agreeLabel}
                            {isSubmitting && <LoaderCircle className="animate-spin" size={16} />}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default PrivacyConsentModal;