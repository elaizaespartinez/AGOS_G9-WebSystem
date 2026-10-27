import ndrrmcLogo from "../assets/agency-logos/ndrrmc.png";
import redCrossLogo from "../assets/agency-logos/red-cross.png";
import dswdLogo from "../assets/agency-logos/dswd.png";
import pcgLogo from "../assets/agency-logos/pcg.png";
import pnpLogo from "../assets/agency-logos/pnp.png";
import dostLogo from "../assets/agency-logos/dost.png";
import {useEffect, useState} from "react";
import {getLocalResponse} from "../services/emergencyService.js";
import {defaultLocalResponse} from "../data/emergencyData.js";

function Emergency() {

    const [location, setLocation] = useState({
        province: "Batangas",
        municipality: "Batangas City",
        barangay: "Alangilan",
    });

    const [localResponse, setLocalResponse] = useState(defaultLocalResponse);
    const  [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true; 
        setLoading(true);
        getLocalResponse(location).then((data) => {
            if (!isMounted) return; 
            const response = data || defaultLocalResponse;
            setLocalResponse({
                ...defaultLocalResponse,
                ...data,
                hotlines: Array.isArray(data.hotlines) ? data.hotlines : [],
                });
            })
            .catch((error) => {
                console.error("Error fetching local response data:", error);
                if (!isMounted) return;
                setLocalResponse(defaultLocalResponse);
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false; 
            }
    }, [location]);
    const natHotlines = [
    {
        name: "NDRRMC",
        logo: ndrrmcLogo,
        numbers: ["8911-5061 to 65 local 100", "(02) 8911 - 1406", "(+632) 91114016"],
    },
    {
        name: "Philippine Red Cross",
        logo: redCrossLogo,
        numbers: ["143", "(02) 527 - 0000"],
    },
    {
        name: "DOST",
        logo: dostLogo,
        numbers: ["(02) 824 - 0800"],
    },
    {
        name: "Philippine Coast Guard",
        logo: pcgLogo,
        numbers: ["(02) 527 - 8481 to 89", "(02) 527 - 3877", "0917 724 3682"],
    },
    {
        name: "Philippine National Police",
        logo: pnpLogo,
        numbers: ["8911-5061 to 65 local 100", "(02) 8911-1406", "(+632) 91114016"],
    },
    {
        name: "DSWD",
        logo: dswdLogo,
        numbers: ["0917 110 5686", "09199116200", "inquiry@dswd.gov.ph"],
    },
];

    const getHref = (line) =>
    line.includes("@")
        ? `mailto:${line}`
        : /\bto\b|local/.test(line)
        ? null
        : `tel:${line.replace(/[^\d+]/g, "")}`;

;
    return (
        <main className="md:mx-32 bg-white">
           

            <section className="p-2 flex flex-col gap-6">
                <article className="flex flex-col gap-6 bg-white px-6 py-8 rounded-lg shadow-elevated">
                    <h2 className="text-xl font-bold">Find your local response contact</h2>
                    <div className="flex flex-col gap-2 md:flex-row md:gap-8 justify-between">
                        <div className="flex flex-col gap-2 w-full">
                            <label htmlFor="province" className="text-primary uppercase font-bold">Province</label>
                            <select id="province" value={location.province} onChange={(e) => setLocation((prev) => ({ ...prev, province: e.target.value }))} className="bg-background font-agos rounded-lg w-full p-3 text-sm text-text/80 font-semibold border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary hover:border-secondary">
                                <option value="">Select Province</option>
                                <option value="batangas">Batangas</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                            <label htmlFor="municipality" className="text-primary uppercase font-bold">Municipality / City</label>
                            <select id="municipality" value={location.municipality} onChange={(e) => setLocation((prev) => ({ ...prev, municipality: e.target.value }))} className="bg-background font-agos rounded-lg w-full p-3 text-sm text-text/80 font-semibold border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary hover:border-secondary">
                                <option value="">Select Municipality / City</option>
                                <option value="batangas-city">Batangas City</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                            <label htmlFor="barangay" className="text-primary uppercase font-bold">Barangay</label>
                            <select id="barangay" value={location.barangay} onChange={(e) => setLocation((prev) => ({ ...prev, barangay: e.target.value }))} className="bg-background font-agos rounded-lg w-full p-3 text-sm text-text/80 font-semibold border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary hover:border-secondary  ">
                                <option value="">Select Barangay</option>
                                <option value="alangilan">Alangilan</option>
                            </select>
                        </div>
                    </div>
                </article>

                <div className="relative w-full  mx-auto">
            
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-2xl border-[5px] border-[#2b9db5] bg-[#e9f5f6]"
                        style={{ filter: "url(#wobbly-border) drop-shadow(2px 4px 3px rgba(0,0,0,0.25))" }}
                    />

                    <div className="relative z-10 flex flex-col gap-4 px-5 py-6 sm:px-10 sm:py-8">
                        <header className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold uppercase text-gray-600 sm:text-sm">
                            <span className="tracking-wide">Local Response</span>
                            <span aria-hidden="true">&mdash;</span>
                            <span className="text-sm sm:text-base">{localResponse.organization || "Local response information unavailable"}</span>
                        </header>

                        <h2 className="text-2xl font-extrabold text-[#c4161c] sm:text-3xl">
                            {localResponse.location || "Select a location"}
                        </h2>

                        {loading ? (
                        <p className="py-6 text-center text-gray-500">
                            Loading emergency contacts...
                        </p>
                    ) : localResponse.hotlines.length > 0 ? (
                        <ul className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-4">
                            {localResponse.hotlines.map(({ label, number }) => (
                                <li key={`${label}-${number}`}>
                                    <a
                                        href={`tel:${number.replace(/[^\d+]/g, "")}`}
                                        className="flex h-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-red-200 bg-gray-100 px-4 py-3 text-center shadow-[inset_0_0_10px_rgba(220,120,120,0.35)] transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2b9db5]"
                                    >
                                        <span className="text-xl font-extrabold tracking-wide text-[#1c6b7a] sm:text-2xl">
                                            {number}
                                        </span>

                                        <span className="text-[11px] italic text-[#1c6b7a] sm:text-xs">
                                            {label}
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="py-6 text-center text-gray-500">
                            No emergency contacts available for this location.
                        </p>
                    )}
                    </div>
                </div>

                <div className="w-full  mx-auto rounded-md border border-dotted border-sky-400 bg-white p-4 shadow-md sm:p-6">
                    <h2 className="mb-4 text-xl font-semibold text-gray-900 sm:text-2xl">
                        National Hotlines
                    </h2>

                    {/* 911 banner */}
                    <div className="grid grid-cols-1 items-center gap-3 rounded-md bg-[#cf4343] p-3 shadow-md sm:grid-cols-2 sm:gap-4 sm:p-4">
                        <p className="text-center text-lg font-extrabold uppercase leading-tight text-white sm:text-2xl">
                            Philippine National <br className="hidden sm:block" /> Emergency Hotline
                        </p>

                        <a
                            href="tel:911"
                            className="flex items-center justify-center rounded-md bg-[#9c2f2f] py-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]"
                            aria-label="Call 911"
                        >
                            <span className="text-5xl font-extrabold text-white sm:text-6xl">
                                911
                            </span>
                        </a>
                    </div>

                    <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        {natHotlines.map(({ name, logo, numbers }) => (
                            <li
                                key={name}
                                className="flex items-center gap-4 rounded-2xl bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
                            >
                                <img src={logo} alt={name} className="h-14 w-20 shrink-0 object-contain" />

                                <div className="flex flex-1 flex-col items-center text-center text-xs font-bold text-gray-900 sm:text-sm">
                                    {numbers.map((line) => {
                                        const href = getHref(line);
                                        return href ? (
                                            <a key={line} href={href} className="hover:underline font-agos  focus:outline-none focus-visible:underline">
                                                {line}
                                            </a>
                                        ) : (
                                            <span key={line}>{line}</span>
                                        );
                                    })}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

            </section>
        </main>
    )
}

export default Emergency;