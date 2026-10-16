import { useEffect, useState } from "react";
import ServiceCard from "../components/ServiceCard";
import { Map, BusFront, PhoneIncoming, ContactRound, Cloud, MapPin, WavesHorizontal, OctagonAlert, PhoneCall, } from "lucide-react";
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

    const toTel = (number) =>
        `tel:${number.replace(/[^\d+]/g, "")}`;

    return (
        <main className="flex flex-col gap-2 bg-white p-2 md:px-32">
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

                <div className="flex flex-1 flex-col items-start rounded-xl bg-[#1BBED2]/40 p-4">
                    <div className="flex items-center gap-1">
                        <MapPin size={16} />

                        <p className="text-xs font-semibold md:text-sm">
                            {weather.location}
                        </p>
                    </div>

                    <p className="text-xs font-bold md:text-sm">
                        {weather.date}
                    </p>

                    <p className="text-xs md:text-sm">
                        {weather.time}
                    </p>
                </div>
            </section>

            <hr className="border-t border-text/20" />

            <section className="flex flex-col gap-2 rounded-xl p-2">
                <header className="w-fit">
                    <h2 className="text-2xl font-extrabold text-text md:text-3xl">
                        Dashboard
                    </h2>
                </header>

                <div className="grid grid-cols-1 gap-3 py-3 md:grid-cols-2">
                    <div className="grid grid-cols-1 gap-2 md:grid-rows-2">

                        <article className="flex flex-col gap-2 rounded-xl bg-secondary p-4 text-white shadow-elevated md:p-6">
                            <header className="flex items-center justify-between gap-2">
                                <h3 className="text-sm font-semibold">
                                    Current Flood Status
                                </h3>

                                <WavesHorizontal size={32} />
                            </header>

                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white p-0">
                                    {floodStatusIcon && (
                                        <img
                                            src={floodStatusIcon}
                                            alt={`${floodStatus.risk} flood status`}
                                            className="h-full m-0"
                                        />
                                    )}
                                </div>

                                <div>
                                    <p className="text-sm">
                                        {floodStatus.location}
                                    </p>

                                    <p className="text-lg font-bold">
                                        {floodStatus.level}
                                    </p>
                                </div>
                            </div>
                        </article>

                        <article className="flex flex-col gap-2 rounded-xl bg-white p-4 text-text shadow-elevated md:p-6">
                            <header className="flex items-center justify-between gap-2">
                                <h3 className="text-sm font-semibold">
                                    Active Alerts
                                </h3>

                                <div className="rounded-full bg-red-700">
                                    <OctagonAlert
                                        size={32}
                                        className="text-white"
                                    />
                                </div>
                            </header>

                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 overflow-hidden rounded-full">
                                    {alertIcon && (
                                        <img
                                            src={alertIcon}
                                            alt={`${activeAlert.severity} ${activeAlert.type} alert`}
                                            className="h-full w-full object-cover"
                                        />
                                    )}
                                </div>

                                <div>
                                    <p className="text-lg font-bold">
                                        {activeAlert.title}
                                    </p>

                                    <p className="text-sm">
                                        {activeAlert.description}
                                    </p>
                                </div>
                            </div>
                        </article>
                    </div>

                    <article className="flex flex-col gap-2 rounded-xl bg-white p-4 text-text shadow-elevated md:p-6">
                        <header className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-bold text-primary md:text-lg">
                                Quick Emergency Hotline
                            </h3>

                            <PhoneCall
                                size={32}
                                className="text-primary"
                            />
                        </header>

                        <dl className="divide-y divide-slate-100">
                            {hotlines.map(({ id, name, numbers }) => (
                                <div
                                    key={id || name}
                                    className="flex flex-col gap-2 py-1 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <dt className="text-sm font-semibold text-slate-800 sm:max-w-[55%]">
                                        {name}
                                    </dt>

                                    <dd className="flex flex-col gap-1 sm:items-end">
                                        {numbers.map((number) => (
                                            <a
                                                key={number}
                                                href={toTel(number)}
                                                className="rounded text-sm text-slate-700 underline-offset-4 transition-colors hover:text-teal-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                                            >
                                                {number}
                                            </a>
                                        ))}
                                    </dd>
                                </div>
                            ))}
                        </dl>
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
