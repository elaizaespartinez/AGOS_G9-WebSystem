import { useEffect, useState } from "react";
import {Link} from "react-router-dom";
import ServiceCard from "../components/ServiceCard";
import { Map, BusFront, PhoneIncoming, ContactRound, Cloud, MapPin, WavesHorizontal, OctagonAlert, PhoneCall, MoveRight} from "lucide-react";
import ContactUs from "./ContactUs";
import MapImg from "../assets/visuals/map.png";
import {
    defaultHomeData,
    getAlertIcon,
    getFloodStatusIcon,
} from "../data/homeData";
import { getHomeDashboard } from "../services/homeService";

function Home() {
    const [homeData, setHomeData] = useState(defaultHomeData);
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoadError, setHasLoadError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        getHomeDashboard()
            .then((data) => {
                if (!isMounted) return;

                const dashboard =
                    data && typeof data === "object" ? data : {};

                setHomeData({
                    ...defaultHomeData,
                    ...dashboard,
                    weather: {
                        ...defaultHomeData.weather,
                        ...dashboard.weather,
                    },
                    floodStatus: {
                        ...defaultHomeData.floodStatus,
                        ...dashboard.floodStatus,
                    },
                    activeAlert: {
                        ...defaultHomeData.activeAlert,
                        ...dashboard.activeAlert,
                    },
                    hotlines: Array.isArray(dashboard.hotlines)
                        ? dashboard.hotlines
                        : defaultHomeData.hotlines,
                });
            })
            .catch((error) => {
                if (!isMounted) return;

                console.error("Unable to load the Home dashboard data.", error);
                setHasLoadError(true);
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const { weather, floodStatus, activeAlert, hotlines } = homeData;
    const floodStatusIcon = getFloodStatusIcon(floodStatus.risk);
    const alertIcon = getAlertIcon(activeAlert.type, activeAlert.severity);
    const alertStyles = {
        high: {
            card: "border-risk-high/30 bg-white/10",
            icon: "bg-risk-high",
            label: "text-red-800",
            link: "bg-red-800 hover:bg-red-700 focus-visible:ring-risk-high",
        },
        moderate: {
            card: "border-risk-moderate/30 bg-white/10",
            icon: "bg-risk-moderate",
            label: "text-risk-moderate",
            link: "bg-risk-moderate hover:bg-orange-700 focus-visible:ring-risk-moderate",
        },
        low: {
            card: "border-risk-low/40 bg-white/10",
            icon: "bg-risk-low",
            label: "text-yellow-800",
            link: "bg-yellow-600 hover:bg-yellow-700 focus-visible:ring-yellow-600",
        },
        safe: {
            card: "border-primary/30 bg-slate-50",
            icon: "bg-primary",
            label: "text-primary-hover",
            link: "bg-primary hover:bg-primary-hover focus-visible:ring-primary",
        },
    };
    const alertStyle =
        alertStyles[String(activeAlert.severity).toLowerCase()] ??
        alertStyles.unknown;

    const floodScale = [
        { key: "safe", label: "Safe", bar: "bg-safe" },
        { key: "low", label: "Low", bar: "bg-risk-low" },
        { key: "moderate", label: "Moderate", bar: "bg-risk-moderate" },
        { key: "high", label: "High", bar: "bg-risk-high" },
    ];
    const floodLevelIndex = floodScale.findIndex(
        ({ key }) => key === String(floodStatus.risk).toLowerCase()
    );

    const toTel = (number) =>
        `tel:${number.replace(/[^\d+]/g, "")}`;

    return (
        <main className="flex flex-col gap-4 bg-white p-2 md:px-32">
            {(isLoading || hasLoadError) && (
                <p
                    role={hasLoadError ? "alert" : "status"}
                    className="px-2 py-1 text-xs text-text/60"
                >
                    {isLoading
                        ? "Loading live information..."
                        : "⚠ Unable to update live information. Showing available data."}
                </p>
            )}

            <article
                role="alert"
                aria-label="Active alert"
                className={`flex flex-col gap-4 rounded-2xl border p-4 text-text shadow-elevated md:flex-row md:items-center md:p-5 ${alertStyle.card}`}
            >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-white ${alertStyle.icon}`}
                    >
                        {alertIcon ? (
                            <img
                                src={alertIcon}
                                alt={`${activeAlert.severity} ${activeAlert.type} alert`}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <OctagonAlert size={24} aria-hidden="true" />
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <p
                            className={`text-xs font-extrabold uppercase tracking-wider ${alertStyle.label}`}
                        >
                            {activeAlert.severity} alert
                        </p>

                        <h3 className="text-lg font-extrabold leading-snug">
                            {activeAlert.title}
                        </h3>

                        <p className="text-sm leading-relaxed text-text/75">
                            {activeAlert.description}
                        </p>

                        <p className="mt-2 text-xs text-text/60">
                            Updated at {activeAlert.updatedAt} · Source:{" "}
                            {activeAlert.source}
                        </p>
                    </div>
                </div>

                <Link
                    to="/flood-map"
                    className={`inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-lg px-6 text-center text-sm font-bold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:w-auto ${alertStyle.link}`}
                >
                    View flood map

                    <MoveRight size={16} className="ml-2" />
                </Link>
            </article>

            <section className="flex items-center justify-between rounded-xl bg-primary p-4 text-white">
                <div className="flex w-0 flex-1 items-center gap-2">
                    <Cloud size={40} className="text-white/70" />

                    <div>
                        <h1 className="text-2xl font-bold md:text-4xl">
                            {weather.temperature}
                        </h1>

                        <p className="text-sm">
                            {weather.condition}
                        </p>
                    </div>
                </div>

                <div className="flex flex-1 flex-col items-end justify-end rounded-xl bg-[#1BBED2]/40 p-3">
                  

                        <p className="text-xs font-semibold md:text-sm">
                            {weather.location}
                        </p>
                    

                    <p className="text-xs font-bold md:text-sm">
                        {weather.date}
                    </p>

                    <p className="text-xs md:text-sm">
                        {weather.time}
                    </p>
                </div>
            </section>

            <section aria-labelledby="dashboard-heading" className="flex flex-col gap-1 rounded-xl p-2">
                <header className="w-fit">
                    <h2 id="dashboard-heading" className="text-2xl font-extrabold text-text md:text-3xl">
                        Dashboard
                    </h2>
                </header>

                <div className="grid grid-cols-1 items-start gap-4 py-3 md:grid-cols-2">
                    <article className="flex flex-col gap-4 rounded-2xl bg-secondary p-4 h-full text-white shadow-elevated md:p-6">
                        <header className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold md:text-base">
                                Current Flood Status
                            </h3>
                            <WavesHorizontal size={32} aria-hidden="true" />
                        </header>

                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
                                {floodStatusIcon && (
                                    <img
                                        src={floodStatusIcon}
                                        alt={`${floodStatus.risk} flood status`}
                                        className="h-full w-full object-contain"
                                    />
                                )}
                            </div>

                            <div>
                                <p className="text-sm text-white/80">
                                    {floodStatus.location}
                                </p>
                                <p className="text-xl font-extrabold md:text-2xl">
                                    {floodStatus.level}
                                </p>
                            </div>
                        </div>

                        <div>
                            <div aria-hidden="true" className="grid grid-cols-4 gap-1.5">
                                {floodScale.map(({ key, bar }, i) => (
                                    <div
                                        key={key}
                                        className={`h-2 rounded ${i <= floodLevelIndex ? bar : "bg-white/25"}`}
                                    />
                                ))}
                            </div>

                            <div className="mt-1.5 grid grid-cols-4 text-xs text-white/80">
                                {floodScale.map(({ key, label }, i) => (
                                    <span
                                        key={key}
                                        className={i === floodLevelIndex ? "font-bold text-white" : ""}
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {floodStatus.updatedAt && (
                            <div>
                                <p className="text-xs text-white/70">
                                    Updated {floodStatus.updatedAt}
                                </p>
                                <p className="text-xs text-white/70">{floodStatus.source ? `Source: ${floodStatus.source}` : ""}</p>
                            </div>
                        )}
                    </article>

                    {/* Hotlines */}
                    <article className="flex flex-col gap-3 rounded-2xl bg-card p-4 text-text shadow-elevated md:p-6">
                        <header className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-bold text-primary md:text-lg">
                                Quick Emergency Hotline
                            </h3>
                            <PhoneCall size={32} className="text-primary" aria-hidden="true" />
                        </header>

                        {/* <a
                            href="tel:911"
                            className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-red-800 text-lg font-extrabold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-2"
                        >
                            <PhoneCall size={22} aria-hidden="true" />
                            Call 911
                        </a> */}

                        {hotlines.length === 0 ? (
                            <p className="text-sm text-text/60">
                                Hotline information unavailable.
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {hotlines.map(({ id, name, numbers }) => (
                                    <li
                                        key={id || name}
                                        className="flex flex-col gap-1.5 rounded-xl bg-background/60 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <span className="text-sm font-semibold sm:max-w-[55%]">
                                            {name}
                                        </span>

                                        <div className="flex flex-wrap gap-x-4 sm:justify-end">
                                            {numbers.map((number) => (
                                                <a
                                                    key={number}
                                                    href={toTel(number)}
                                                    className="inline-flex min-h-11 items-center gap-1.5 rounded text-sm font-bold text-primary transition-colors hover:text-primary-hover hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                >
                                                    <PhoneCall size={14} aria-hidden="true" />
                                                    {number}
                                                </a>
                                            ))}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <Link
                            to="/emergency"
                            className="py-1 text-center text-sm font-bold text-primary hover:text-primary-hover hover:underline"
                        >
                            See all hotlines →
                        </Link>
                    </article>
                </div>
            </section>

            <hr className="border-t border-text/20" />

            <section className="flex flex-col gap-2 rounded-xl p-2">
                <header className="w-fit">
                    <h2 className="text-2xl font-extrabold text-text md:text-3xl">
                        Quick Actions
                    </h2>
                </header>

                <div className="grid grid-cols-1 gap-3 py-3 md:grid-cols-4">
                    <ServiceCard
                        icon={<Map size={32} />}
                        title="Flood Map"
                        description="View flood-prone areas and check the current flood risk around Batangas City."
                        to="/flood-map"
                    />

                    <ServiceCard
                        icon={<BusFront size={32} />}
                        title="Transportation"
                        description="Find PUJ routes and identify routes affected by flooding or other hazards."
                        to="/transportation"
                    />

                    <ServiceCard
                        icon={<PhoneIncoming size={32} />}
                        title="Hotlines"
                        description="Quickly access important emergency and rescue contact numbers."
                        to="/emergency"
                    />

                    <ServiceCard
                        icon={<ContactRound size={32} />}
                        title="Contact Us"
                        description="Reach the AGOS team for inquiries, concerns, feedback, or assistance."
                        to="#contact"
                    />
                </div>
            </section>

            <hr className="border-t border-text/20" />

            <section className="bg-background -mx-2 md:-mx-32">
                <div className="flex flex-col gap-6 p-4 md:px-32">
                    <header>
                        <h2 className="text-2xl font-extrabold text-text md:text-3xl">
                            About AGOS
                        </h2>
                    </header>

                    <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
                        <figure className="relative overflow-hidden rounded-2xl bg-gray-100 shadow-elevated">
                            <img
                                src={MapImg}
                                alt="AGOS flood monitoring map"
                                className="h-[280px] w-full object-cover transition-transform duration-700 hover:scale-105 md:h-[380px]"
                            />

                            <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-12">
                                <p className="text-sm font-semibold text-white">
                                    Flood Monitoring & Community Safety
                                </p>
                            </figcaption>
                        </figure>

                        <div className="flex flex-col gap-4 md:px-6">
                            <p className="text-lg font-bold italic text-primary">
                                Sa bawat AGOS, may gabay.
                            </p>

                            <h3 className="text-2xl font-extrabold text-text md:text-3xl">
                                Helping communities navigate hazards with confidence.
                            </h3>

                            <p className="text-sm leading-relaxed text-text/70 md:text-base">
                                AGOS is a disaster information and navigation platform
                                designed to help communities in Batangas City stay informed,
                                understand flood risks, and find safer routes during
                                hazardous conditions.
                            </p>

                            <p className="text-sm leading-relaxed text-text/70 md:text-base">
                                The name AGOS, meaning “current” or “flow,” represents both
                                the movement of floodwater and the flow of timely information
                                to the community.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="contact" className="bg-background -mx-2 md:-mx-32">
                <ContactUs />
            </section>
        </main>
    );
}
  
export default Home;
