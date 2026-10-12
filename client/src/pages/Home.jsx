import ServiceCard from '../components/ServiceCard'
import {Map, BusFront, PhoneIncoming, ContactRound, Mail, Phone, Cloud, MapPin, WavesHorizontal, OctagonAlert, PhoneCall} from "lucide-react";
import {Link} from "react-router-dom";
import register from './Register';
import ContactUs from './ContactUs';
import FloodYellow from '../assets/flood-warning-icons/flood-yellow.png'
import RainRed from '../assets/rainfall-icons/red-rainfall.png'

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
        
        // Strip spaces/dashes so the tel: link dials correctly
        const toTel = (n) => `tel:${n.replace(/[^\d+]/g, "")}`;

    return (
        <main className="flex flex-col gap-4 p-4 md:px-32 ">

            {/* current conditions */}
            <section className="flex justify-between items-center bg-primary p-4 rounded-xl text-white ">
                <div className="flex flex-row gap-2 items-center w-0 flex-1">
                    <Cloud size={40} className="text-white/70" />
                    <div>
                        <h1 className="text-2xl font-bold md:text-4xl">28&deg;C</h1>
                        <p className="text-sm ">Cloudy</p>
                    </div>
                </div>

                <div className="flex flex-col items-start bg-[#1BBED2]/40 p-4 rounded-xl flex-1">
                    <div className="flex flex-row gap-1 items-center ">
                        <MapPin size={16} />
                        <p className="text-xs md:text-sm font-semibold ">Brgy. Alangilan</p>
                    </div>
                    <p className="text-xs font-bold md:text-sm">MON, September 28</p>
                    <p className="text-xs md:text-sm">4:48:30 PM</p>
                </div>
            </section>

            <hr className="border-t border-text/20 m-0" />

            {/* agos dashboard */}
            <section className="flex flex-col gap- p-2 rounded-xl">
                
                <header className="flex flex-row justify-between items-center">
                    <h1 className="text-2xl font-extrabold">AGOS Dashboard</h1>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">
                    <div className="grid grid-cols-1 md:grid-rows-2 gap-2 ">
                        <article className="bg-secondary p-4 md:p-6 rounded-xl text-white flex flex-col gap-2 shadow-elevated">
                            <div className="flex flex-row gap-2 items-center justify-between ">
                                <h3 className="text-sm font-semibold">Current Flood Status</h3>
                                <WavesHorizontal size={32} className="text-white" />
                            </div>
                            <div className="flex flex-row gap-4 items-center">
                                <div>
                                    <img src={FloodYellow} alt="Flood Status" className="w-12 h-12" />
                                </div>
                                <div>
                                    <p className="text-sm">Alangilan, Batangas City</p>
                                    <p className="text-lg font-bold">Moderate Risk</p>
                                </div>
                            </div>
                        </article>
                        <article className="bg-white p-4 md:p-6 rounded-xl text-text flex flex-col gap-2 shadow-elevated">
                            <div className="flex flex-row gap-2 items-center justify-between">
                                <h3 className="text-sm font-semibold">Active Alerts</h3>
                                <div className="bg-red-700  rounded-full">
                                    <OctagonAlert size={32} className="text-white" />
                                </div>
                            </div>
                            <div className="flex flex-row gap-4 items-center">
                                <div>
                                    <img src={RainRed} alt="Heavy Rainfall" className="w-12 h-12" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold">Heavy Rainfall</p>
                                    <p className="text-sm">Flooding Reported in Cuta</p>
                                </div>
                            </div>
                        </article>
                    </div>

                    <article className="bg-white p-4 md:p-6 rounded-xl text-text flex flex-col gap-2 shadow-elevated">
                        <header className="flex flex-row gap-2 items-center justify-between">
                            <h3 className="text-sm md:text-lg font-bold text-primary">Quick Emergency Hotline</h3>
                            <PhoneCall size={32} className="text-primary" />
                           
                        </header>

                        <dl className="mt-0 divide-y divide-slate-100">
                            {hotlines.map(({ name, numbers }) => (
                                <div
                                key={name}
                                className="flex flex-col gap-2 py-1 sm:flex-row sm:items-center sm:justify-between"
                                >
                                <dt className="text-sm font-semibold text-slate-800 sm:max-w-[55%] sm:text-sm">
                                    {name}
                                </dt>
                                <dd className="flex flex-col gap-1 sm:items-end">
                                    {numbers.map((num) => (
                                    <a
                                        key={num}
                                        href={toTel(num)}
                                        className="rounded text-sm text-slate-700 underline-offset-4 transition-colors hover:text-teal-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:text-sm"
                                    >
                                        {num}
                                    </a>
                                    ))}
                                </dd>
                                </div>
                            ))}
                        </dl>
                    </article>
                </div>

            </section>

            {/*quick actions*/}
            <section>
                <h1>Quick Actions</h1>

                <div>
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
                        description="Reach the AGOS  team for inquiries, concerns, feedback, or assistance."
                        to="#contact"
                    />
                </div>
            </section>

            {/*about agos*/}
            <section>
                <h2>
                    About
                </h2>

                <div>
                    <div><img src="" alt="" /></div>
                    <div>
                        <p>Sa bawat AGOS, may gabay</p>
                        <p>The name AGOS (“current” or “flow”) reflects both the flow of floodwater that the system monitors and the flow of timely information it delivers back to communities, turning a hazard into a guided, navigable situation.</p>
                    </div>
                </div>
            </section>

            {/*contact form*/}
            <section id="contact">
                <ContactUs />
            </section>



        </main>
    )
}

export default Home;