import ServiceCard from "../components/ServiceCard";
import { Map, BusFront, PhoneIncoming, ContactRound, Cloud, MapPin, WavesHorizontal, OctagonAlert, PhoneCall, } from "lucide-react";
import ContactUs from "./ContactUs";
import FloodYellow from "../assets/flood-warning-icons/flood-yellow.png";
import RainRed from "../assets/rainfall-icons/red-rainfall.png";
import MapImg from "../assets/visuals/map.png";

function Home() {
    const hotlines = [
        {
            name: "Mayor’s Action Center",
            numbers: ["723-1511"],
        },
        {
            name: "24/7 EBD Emergency Health Hotline",
            numbers: ["0999-222-6626"],
        },
        {
            name: "City DRRM",
            numbers: ["702-3902"],
        },
        {
            name: "BFP Batangas City",
            numbers: ["425-7163", "0915-602-1984"],
        },
        {
            name: "Batangas Component Police Station",
            numbers: ["723-2030", "0916-429-1515", "0999-694-6805"],
        },
    ];

    const toTel = (number) =>
        `tel:${number.replace(/[^\d+]/g, "")}`;

    return (
        <main className="flex flex-col gap-2 bg-white p-2 md:px-32">

            <section className="flex items-center justify-between rounded-xl bg-primary p-4 text-white">
                <div className="flex w-0 flex-1 items-center gap-2">
                    <Cloud size={40} className="text-white/70" />

                    <div>
                        <h1 className="text-2xl font-bold md:text-4xl">
                            28&deg;C
                        </h1>

                        <p className="text-sm">
                            Cloudy
                        </p>
                    </div>
                </div>

                <div className="flex flex-1 flex-col items-start rounded-xl bg-[#1BBED2]/40 p-4">
                    <div className="flex items-center gap-1">
                        <MapPin size={16} />

                        <p className="text-xs font-semibold md:text-sm">
                            Brgy. Alangilan
                        </p>
                    </div>

                    <p className="text-xs font-bold md:text-sm">
                        MON, September 28
                    </p>

                    <p className="text-xs md:text-sm">
                        4:48:30 PM
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
                                <img
                                    src={FloodYellow}
                                    alt="Flood Status"
                                    className="h-12 w-12"
                                />

                                <div>
                                    <p className="text-sm">
                                        Alangilan, Batangas City
                                    </p>

                                    <p className="text-lg font-bold">
                                        Moderate Risk
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
                                <img
                                    src={RainRed}
                                    alt="Heavy Rainfall"
                                    className="h-12 w-12"
                                />

                                <div>
                                    <p className="text-lg font-bold">
                                        Heavy Rainfall
                                    </p>

                                    <p className="text-sm">
                                        Flooding Reported in Cuta
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
                            {hotlines.map(({ name, numbers }) => (
                                <div
                                    key={name}
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

            <section
                id="contact"
                className="bg-white"
            >
                <ContactUs />
            </section>
        </main>
    );
}
  
export default Home;
