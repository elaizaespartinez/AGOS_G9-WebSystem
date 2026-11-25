import { useEffect, useState } from "react";
import {Link} from "react-router-dom";
import ServiceCard from "../components/ServiceCard";
import FloodMapLeaflet from "../components/FloodMapLeaflet";
import { evacuationDestinations } from "../components/TransportationMap";
import { Map, PhoneIncoming, ContactRound, MoveRight, NotepadText } from "lucide-react";
import ContactUs from "./ContactUs";
import MapImg from "../assets/visuals/map.png";
import { defaultHomeData } from "../data/homeData";
import { getHomeDashboard } from "../services/homeService";
import { subscribeToPublicCommunications } from "../services/publicCommunicationsService";
import {
    listFloodReports,
    subscribeToFloodReports,
} from "../services/floodReportsService";
import "../flood-map.css";

let cachedHomeData = null;

// Stable reference so the map doesn't reset itself on every render
const noWeatherData = [];

const floodPillStyles = {
    safe: { pill: "bg-safe/15", dot: "bg-safe" },
    low: { pill: "bg-risk-low/20", dot: "bg-risk-low" },
    moderate: { pill: "bg-risk-moderate/15", dot: "bg-risk-moderate" },
    high: { pill: "bg-risk-high/15", dot: "bg-risk-high" },
    unknown: { pill: "bg-gray-100", dot: "bg-gray-400" },
};

function MiniStat({ label, value, note }) {
    return (
        <div className="flex h-full min-w-0 flex-col justify-center rounded-xl bg-card p-4 shadow-card">
            <p className="text-xs font-bold uppercase tracking-wider text-text/60">
                {label}
            </p>

            <p className="mt-1 truncate text-2xl font-extrabold text-text">
                {value ?? "--"}
            </p>

            {note && (
                <p className="mt-0.5 truncate text-xs text-text/60">{note}</p>
            )}
        </div>
    );
}

function Home() {
    const [homeData, setHomeData] = useState(
        cachedHomeData ?? defaultHomeData,
    );
    const [isLoading, setIsLoading] = useState(!cachedHomeData);
    const [hasLoadError, setHasLoadError] = useState(false);
    const [floodReports, setFloodReports] = useState([]);

    useEffect(() => {
        let isMounted = true;

        const loadDashboard = () =>
            getHomeDashboard()
            .then((data) => {
                if (!isMounted) return;

                const dashboard =
                    data && typeof data === "object" ? data : {};

                const merged = {
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
                };

                cachedHomeData = merged;
                setHomeData(merged);
            })
            .catch((error) => {
                if (!isMounted) return;

                console.error("Unable to load the Home dashboard data.", error);
                setHasLoadError(true);
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        loadDashboard();
        const unsubscribe = subscribeToPublicCommunications(loadDashboard);
        const refreshTimer = window.setInterval(
            loadDashboard,
            10 * 60 * 1000,
        );

        return () => {
            isMounted = false;
            unsubscribe();
            window.clearInterval(refreshTimer);
        };
    }, []);

    // Official flood reports for the map preview (same source as the full map)
    useEffect(() => {
        let isMounted = true;

        const refreshReports = async () => {
            try {
                const nextReports = await listFloodReports();
                if (isMounted) setFloodReports(nextReports);
            } catch (error) {
                console.error("Unable to load active flood reports.", error);
            }
        };

        refreshReports();
        const unsubscribe = subscribeToFloodReports(refreshReports);

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const { weather, floodStatus } = homeData;

    const floodPill =
        floodPillStyles[String(floodStatus.risk).toLowerCase()] ??
        floodPillStyles.unknown;

    return (
        <main className="flex flex-col gap-4 bg-background p-2 md:px-32">
            <h1 className="sr-only">
                AGOS flood information for Batangas City
            </h1>

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

            {/* Flood map preview */}
            <section aria-labelledby="home-map-heading" className="flex flex-col gap-3">
                <div className="relative isolate h-[24rem] overflow-hidden rounded-2xl bg-gray-100 shadow-card md:h-[28rem]">
                    <FloodMapLeaflet
                        preview
                        weatherData={noWeatherData}
                        facilityData={evacuationDestinations}
                        floodReports={floodReports}
                    />
                    <div className="pointer-events-none absolute right-3 top-3 z-[600] rounded-lg bg-white/95 px-3 py-2 text-xs shadow-card backdrop-blur">
                        <p className="font-bold text-secondary">Flood map preview</p>
                        <p className="mt-0.5 text-[0.65rem] text-text/60">
                            {floodReports.length
                                ? `${floodReports.length} active official report${floodReports.length === 1 ? "" : "s"}`
                                : "No active official reports"}
                        </p>
                    </div>
                    <div className="pointer-events-none absolute bottom-20 left-3 z-[600] hidden items-center gap-3 rounded-lg bg-white/95 px-3 py-2 text-[0.65rem] font-semibold text-text shadow-card backdrop-blur sm:flex">
                        <span className="flex items-center gap-1.5">
                            <i className="h-2.5 w-2.5 rounded-full bg-[#dc2626]" />
                            Flood reports
                        </span>
                        <span className="flex items-center gap-1.5">
                            <i className="h-2.5 w-2.5 rounded-full bg-[#2e9eac]" />
                            Evacuation centers
                        </span>
                    </div>
                    
                    <Link
                        to="/maps?tab=flood"
                        className="absolute bottom-4 right-4 z-[600] inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-secondary px-5 text-sm font-bold text-white shadow-card transition-colors hover:bg-secondary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 sm:w-auto"
                    >
                        Open full flood map
                        <MoveRight size={18} aria-hidden="true" />
                    </Link> 
                </div>
            </section>

            {/* Conditions strip */}
            <section
                aria-label="Conditions in your area"
                className="rounded-2xl bg-card p-5 shadow-elevated md:px-8 md:py-6"
            >
                <dl className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
                    <div className="min-w-0">
                        <dt className="mb-2 text-xs font-bold uppercase tracking-wider text-text/60">
                            Flood status
                        </dt>

                        <dd>
                            <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold text-text ${floodPill.pill}`}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`h-2 w-2 rounded-full ${floodPill.dot}`}
                                />
                                {floodStatus.level ?? "No data"}
                            </span>

                            <p className="mt-2 text-xs leading-relaxed text-text/60">
                                {floodStatus.location}
                                {floodStatus.updatedAt && (
                                    <>
                                        <br />
                                        Updated {floodStatus.updatedAt}
                                    </>
                                )}
                                {floodStatus.source && (
                                    <>
                                        <br />
                                        Source: {floodStatus.source}
                                    </>
                                )}
                            </p>
                        </dd>
                    </div>

                    <div className="min-w-0">
                        <dt className="mb-2 text-xs font-bold uppercase tracking-wider text-text/60">
                            Weather
                        </dt>

                        <dd>
                            <p className="text-3xl font-extrabold text-text">
                                {weather.temperature ?? "--"}
                            </p>

                            <p className="mt-1 text-sm text-text/60">
                                {weather.condition}
                                {weather.location && ` · ${weather.location}`}
                            </p>
                        </dd>
                    </div>

                    <div className="min-w-0">
                        <dt className="mb-2 text-xs font-bold uppercase tracking-wider text-text/60">
                            Rain
                        </dt>

                        <dd>
                            <p className="text-3xl font-extrabold text-text">
                                {weather.rainChance ?? "--"}
                            </p>

                            <p className="mt-1 text-sm text-text/60">
                                Chance of rain
                                {weather.rainfall && ` · ${weather.rainfall} now`}
                            </p>
                        </dd>
                    </div>

                    <div className="min-w-0">
                        <dt className="mb-2 text-xs font-bold uppercase tracking-wider text-text/60">
                            Wind and humidity
                        </dt>

                        <dd>
                            <p className="text-3xl font-extrabold text-text">
                                {weather.wind ?? "--"}
                            </p>

                            <p className="mt-1 text-sm text-text/60">
                                Wind
                                {weather.humidity && ` · ${weather.humidity} humidity`}
                            </p>
                        </dd>
                    </div>
                </dl>
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
                        title="Maps"
                        description="View flood-prone areas, check the current flood risk, and find safer routes around Batangas City."
                        to="/maps?tab=flood"
                    />

                    <ServiceCard
                        icon={<NotepadText size={32} />}
                        title="Report"
                        description="Report flooded roads, blockages or heavy rain to help others in your area."
                        to="/report"
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