import { useEffect, useState } from "react";
import {
    defaultAnnouncementsData,
    getAnnouncementIcon,
} from "../data/announcementsData";
import { getAnnouncements } from "../services/announcementsService";

function Announcements() {
    const [announcements, setAnnouncements] = useState(
        defaultAnnouncementsData,
    );
    const [activeTab, setActiveTab] = useState("update");
    const [hasLoadError, setHasLoadError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        getAnnouncements()
            .then((data) => {
                if (!isMounted) return;

                const incoming =
                    data && typeof data === "object" ? data : {};

                setAnnouncements({
                    ...defaultAnnouncementsData,
                    ...incoming,
                    asOf: {
                        ...defaultAnnouncementsData.asOf,
                        ...incoming.asOf,
                    },
                    weatherTabs: Array.isArray(incoming.weatherTabs)
                        ? incoming.weatherTabs
                        : defaultAnnouncementsData.weatherTabs,
                    monitoring: Array.isArray(incoming.monitoring)
                        ? incoming.monitoring
                        : defaultAnnouncementsData.monitoring,
                    advisories: Array.isArray(incoming.advisories)
                        ? incoming.advisories
                        : defaultAnnouncementsData.advisories,
                });
            })
            .catch((error) => {
                if (!isMounted) return;

                console.error("Unable to load announcements.", error);
                setHasLoadError(true);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const currentTab =
        announcements.weatherTabs.find(({ id }) => id === activeTab) ||
        announcements.weatherTabs[0];

    return (
        <section className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 p-2 mb-4">
            {hasLoadError && (
                <p role="alert" className="w-full text-xs text-text/60">
                    Unable to update announcements. Showing available data.
                </p>
            )}

            <div className="flex w-full  flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-full bg-primary/50 px-6 py-3 text-base font-extrabold shadow-elevated sm:text-lg">
                <span className="text-secondary">
                    As of {announcements.asOf.time}
                </span>
                <span className="text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]">
                    {announcements.asOf.date}
                </span>
            </div>

            <div className="flex w-full flex-col gap-4 rounded-xl border border-gray-300 bg-[#e8f4f5] p-4 shadow-[0_2px_5px_rgba(0,0,0,0.2)] sm:flex-row sm:items-start">
                <img
                    src={getAnnouncementIcon("rainfall", "moderate")}
                    alt="Moderate rainfall"
                    className="mx-auto h-20 w-20 shrink-0 object-contain sm:mt-2 sm:h-24 sm:w-24"
                />

                <div className="flex-1">
                    <div role="tablist" className="grid grid-cols-2 gap-1">
                        {announcements.weatherTabs.map(({ id, label }) => (
                            <button
                                key={id}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === id}
                                onClick={() => setActiveTab(id)}
                                className={`cursor-pointer px-2 py-1.5 text-xs font-semibold sm:text-sm ${
                                    activeTab === id
                                        ? "bg-[#1c1b6b] text-white [text-shadow:0_0_6px_rgba(255,255,255,0.6)]"
                                        : "bg-[#d3e9ec] text-gray-900"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div
                        role="tabpanel"
                        className="flex flex-col gap-3 bg-[#d3e9ec] p-3 text-xs leading-snug text-gray-900 sm:text-[13px]"
                    >
                        {currentTab?.paragraphs?.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col rounded-xl bg-[#e8f4f5] pb-3 shadow-[0_3px_6px_rgba(0,0,0,0.25)]">
                    <h3 className="mx-3 mt-3 rounded-t-2xl bg-[#1c1b6b] px-3 py-3 text-center text-xs font-extrabold uppercase text-white sm:text-sm">
                        River and Coastal Monitoring
                    </h3>

                    <ul className="mx-3 mt-2 flex flex-col gap-3">
                        {announcements.monitoring.map(
                            ({ id, type, severity, text }) => (
                                <li
                                    key={id}
                                    className="flex items-center gap-4 bg-white px-4 py-3"
                                >
                                    <img
                                        src={getAnnouncementIcon(type, severity)}
                                        alt={`${severity} ${type} status`}
                                        className="h-12 w-12 shrink-0 object-contain"
                                    />
                                    <p className="text-xs leading-snug text-gray-900">
                                        {text}
                                    </p>
                                </li>
                            ),
                        )}
                    </ul>
                </div>

                <div className="flex flex-col rounded-xl bg-[#e8f4f5] pb-3 shadow-[0_3px_6px_rgba(0,0,0,0.25)]">
                    <h3 className="mx-3 mt-3 rounded-t-2xl bg-[#1c1b6b] px-3 py-3 text-center text-base font-extrabold uppercase text-white sm:text-lg">
                        Advisory
                    </h3>

                    <div className="mx-3 mt-2 min-h-[200px] flex-1 bg-white p-4">
                        {announcements.advisories.length > 0 ? (
                            <ul className="flex flex-col gap-3 text-sm text-gray-900">
                                {announcements.advisories.map(
                                    ({ id, type, severity, title, text }) => (
                                        <li key={id} className="flex gap-3">
                                            <img
                                                src={getAnnouncementIcon(
                                                    type,
                                                    severity,
                                                )}
                                                alt={`${severity} advisory`}
                                                className="h-8 w-8 shrink-0 object-contain"
                                            />
                                            <p>
                                                {title && (
                                                    <strong className="block">
                                                        {title}
                                                    </strong>
                                                )}
                                                {text}
                                            </p>
                                        </li>
                                    ),
                                )}
                            </ul>
                        ) : (
                            <p className="text-sm text-text/60">
                                No active advisories.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Announcements;
