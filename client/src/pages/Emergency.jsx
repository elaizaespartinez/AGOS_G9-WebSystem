import ndrrmcLogo from "../assets/agency-logos/ndrrmc.png";
import redCrossLogo from "../assets/agency-logos/red-cross.png";
import dswdLogo from "../assets/agency-logos/dswd.png";
import pcgLogo from "../assets/agency-logos/pcg.png";
import pnpLogo from "../assets/agency-logos/pnp.png";
import dostLogo from "../assets/agency-logos/dost.png";
import { useEffect, useState } from "react";
import { ChevronDown, MapPin, Phone } from "lucide-react";
import { getLocalResponse } from "../services/emergencyService.js";
import {
    barangays,
    cityWideHotlines,
    defaultLocalResponse,
} from "../data/emergencyData.js";

const hasNumber = (item) =>
    Boolean(item) && typeof item.number === "string" && item.number.trim().length > 0;

function Emergency() {
    const [barangay, setBarangay] = useState("Alangilan");
    const [localResponse, setLocalResponse] = useState(defaultLocalResponse);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        getLocalResponse({ barangay })
            .then((data) => {
                if (!isMounted) return;
                const hotlines = Array.isArray(data?.hotlines)
                    ? data.hotlines.filter(hasNumber)
                    : [];
                setLocalResponse({
                    ...defaultLocalResponse,
                    ...data,
                    hotlines,
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
        };
    }, [barangay]);

    
const natHotlines = [
    {
        name: "NDRRMC",
        logo: ndrrmcLogo,
        numbers: [
            "(02) 8911-5061 to 65 local 100",
            "(02) 8911-1406",
            "(02) 8912-2665",
            "(02) 8912-5668",
            "(02) 8911-1873",
        ],
    },
    {
        name: "Philippine Red Cross",
        logo: redCrossLogo,
        numbers: [
            "143 (Emergency Hotline)",
            "(02) 8527-0000",
            "(02) 8790-2300",
        ],
    },
    {
        name: "PAGASA (DOST-PAGASA)",
        logo: dostLogo,
        numbers: [
            "(02) 8284-0800",
        ],
    },
    {
        name: "Philippine Coast Guard",
        logo: pcgLogo,
        numbers: [
            "(02) 8527-8481 to 89",
            "(02) 8527-3877",
            "(02) 8527-3880 to 85",
            "0917-724-3682 (Text Hotline)",
            "0918-967-4697 (Text Hotline)",
        ],
    },
    {
        name: "Philippine National Police",
        logo: pnpLogo,
        numbers: [
            "117 (PNP Emergency Hotline)",
            "(02) 8722-0650",
            "0917-847-5757 (Text Hotline)",
        ],
    },
    {
        name: "Department of Social Welfare and Development",
        logo: dswdLogo,
        numbers: [
            "0918-912-2813 (Text Hotline)",
            "(02) 8931-8101 to 07",
            "(02) 8856-3665 (Disaster Response Unit)",
            "(02) 8852-8081 (Disaster Response Unit)",
        ],
    },
];


    const getHref = (line) =>
        line.includes("@")
            ? `mailto:${line}`
            : /\bto\b|local/.test(line)
            ? null
            : `tel:${line.replace(/[^\d+]/g, "")}`;

    const toTel = (number) => `tel:${number.replace(/[^\d+]/g, "")}`;

    // Barangay hotlines first, then the city-wide ones, without repeating a number
    const barangayHotlines = Array.isArray(localResponse?.hotlines)
        ? localResponse.hotlines.filter(hasNumber)
        : [];

    const seenNumbers = new Set();
    const localHotlines = [...barangayHotlines, ...cityWideHotlines.filter(hasNumber)].filter(
        ({ number }) => {
            const key = number.replace(/\D/g, "");
            if (seenNumbers.has(key)) return false;
            seenNumbers.add(key);
            return true;
        }
    );

    const selectedLocation =
        localResponse.location || (barangay ? `${barangay}, Batangas City` : "Select your barangay");

    return (
        <main className="bg-background/40 px-4 py-8 md:py-12">
            <div className="mx-auto flex w-full max-w-agos flex-col gap-10">

                {/* Page heading */}
                <header>
                    <h1 className="text-3xl font-extrabold text-primary md:text-4xl">
                        Emergency hotlines
                    </h1>
                    <p className="mt-1 text-sm text-text/70 md:text-base">
                        Find your local response contact
                    </p>
                </header>

                {/* 911 */}
                <section
                    aria-label="National emergency hotline"
                    className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:px-7 md:py-6"
                >
                    <div>
                        <h2 className="text-lg font-bold md:text-xl">
                            Philippine national emergency hotline
                        </h2>
                        <p className="mt-1 text-sm text-text/70">
                            For emergencies that need immediate assistance.
                        </p>
                    </div>

                    <a
                        href="tel:911"
                        aria-label="Call 911"
                        className="inline-flex min-h-16 items-center justify-center gap-3 rounded-xl bg-red-50 px-8 py-3 text-red-700 transition-colors hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 sm:min-w-56"
                    >
                        <Phone size={24} aria-hidden="true" />
                        <span className="text-4xl font-extrabold md:text-5xl">911</span>
                    </a>
                </section>

                {/* Local response */}
                <section aria-labelledby="local-response-heading" className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h2
                            id="local-response-heading"
                            className="text-xl font-extrabold text-secondary md:text-2xl"
                        >
                            Local response
                        </h2>

                        <p className="text-[11px] font-bold uppercase tracking-wider text-text/60">
                            {localResponse.organization || "DRRMO Batangas City"}
                        </p>
                    </div>

                    {/* Location selector: the native select sits invisibly on top of the row */}
                    <div className="relative flex min-h-14 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-primary hover:border-primary">
                        <MapPin size={18} className="shrink-0 text-primary" aria-hidden="true" />

                        <span className="min-w-0 flex-1 truncate text-sm font-semibold md:text-base">
                            {selectedLocation}
                        </span>

                        <span className="hidden shrink-0 text-xs font-semibold text-text/70 sm:inline">
                            Change location
                        </span>
                        <ChevronDown size={18} className="shrink-0 text-text/70" aria-hidden="true" />

                        <label htmlFor="barangay" className="sr-only">
                            Your barangay
                        </label>
                        <select
                            id="barangay"
                            value={barangay}
                            onChange={(e) => setBarangay(e.target.value)}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        >
                            <option value="">Select Barangay</option>
                            {barangays.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {loading && (
                        <p role="status" className="text-sm text-text/60">
                            Loading emergency contacts...
                        </p>
                    )}

                    {!loading && barangayHotlines.length === 0 && (
                        <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-text/70">
                            {barangay
                                ? `No barangay number listed for ${barangay}. Call CDRRMO (043) 702-3902.`
                                : "Select your barangay to see its hotline. City-wide numbers are shown below."}
                        </p>
                    )}

                    <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 sm:grid-cols-2">
                        {localHotlines.map(({ label, number }) => (
                            <li
                                key={`${label}-${number}`}
                                className="bg-white sm:[&:last-child:nth-child(odd)]:col-span-2"
                            >
                                <a
                                    href={toTel(number)}
                                    aria-label={`Call ${label} at ${number}`}
                                    className="group flex min-h-24 items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                                >
                                    <span className="min-w-0">
                                        <span className="block text-xs text-text/70">{label}</span>
                                        <span className="block text-xl font-bold md:text-2xl">
                                            {number}
                                        </span>
                                    </span>

                                    <span
                                        aria-hidden="true"
                                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/20"
                                    >
                                        <Phone size={18} />
                                    </span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* National hotlines */}
                <section aria-labelledby="national-heading" className="flex flex-col gap-4">
                    <div>
                        <h2
                            id="national-heading"
                            className="text-xl font-extrabold text-secondary md:text-2xl"
                        >
                            National hotlines
                        </h2>
                        <p className="mt-1 text-sm text-text/70">
                            Disaster response, health and public safety.
                        </p>
                    </div>

                    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {natHotlines.map(({ name, logo, numbers }) => (
                            <li
                                key={name}
                                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5"
                            >
                                <div className="flex items-center gap-3">
                                    <img
                                        src={logo}
                                        alt=""
                                        aria-hidden="true"
                                        className="h-10 w-12 shrink-0 object-contain object-left"
                                    />
                                    <h3 className="text-base font-bold">{name}</h3>
                                </div>

                                <ul className="flex flex-col">
                                    {numbers.map((line) => {
                                        const href = getHref(line);

                                        return (
                                            <li key={line}>
                                                {href ? (
                                                    <a
                                                        href={href}
                                                        className="inline-flex min-h-9 items-center break-all text-[15px] text-text transition-colors hover:text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                    >
                                                        {line}
                                                    </a>
                                                ) : (
                                                    <span className="inline-flex min-h-9 items-center text-[15px] text-text">
                                                        {line}
                                                    </span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </main>
    );
}

export default Emergency;