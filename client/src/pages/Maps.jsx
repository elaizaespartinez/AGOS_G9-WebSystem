import { useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { BusFront, Map as MapIcon } from "lucide-react";
import FloodMap from "./FloodMap";
import Transportation from "./Transportation";

const tabs = [
    {
        id: "flood",
        label: "Flood Map",
        icon: MapIcon,
        caption: "See flood-prone areas, hazards and reports.",
    },
    {
        id: "transportation",
        label: "Transportation",
        icon: BusFront,
        caption: "Check which routes are safe for your trip.",
    },
];

// Change this one line to line the tabs up with your pages' content edge.
// For example "px-4 md:px-32" if FloodMap and Transportation use md:px-32.
const containerClass = "mx-auto w-full max-w-[1600px] px-4";

function Maps() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabRefs = useRef([]);

    const activeTab = searchParams.get("tab") === "transportation"
        ? "transportation"
        : "flood";

    const activeCaption = tabs.find((tab) => tab.id === activeTab)?.caption;

    const handleTabChange = (tab) => {
        setSearchParams({ tab }, { replace: false });
    };

    // Arrow keys, Home and End move between tabs
    const handleKeyDown = (e, index) => {
        const last = tabs.length - 1;
        let next = null;

        if (e.key === "ArrowRight") next = index === last ? 0 : index + 1;
        if (e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
        if (e.key === "Home") next = 0;
        if (e.key === "End") next = last;

        if (next === null) return;

        e.preventDefault();
        handleTabChange(tabs[next].id);
        tabRefs.current[next]?.focus();
    };

    return (
        <div>
            {/* Page title for screen readers; the visible title is the active tab */}
            <h1 className="sr-only">Maps</h1>

            <div
                className={`${containerClass} flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between md:gap-6 md:py-5`}
            >
                {/* Tabs */}
                <div className="w-fit shrink-0 rounded-xl border border-gray-200 bg-white p-1 shadow-card">
                    <div
                        role="tablist"
                        aria-label="Map views"
                        aria-describedby="maps-guide"
                        className="inline-grid grid-cols-2 gap-1"
                    >
                        {tabs.map(({ id, label, icon: Icon }, index) => {
                            const isActive = activeTab === id;

                            return (
                                <button
                                    key={id}
                                    ref={(el) => (tabRefs.current[index] = el)}
                                    type="button"
                                    role="tab"
                                    id={`tab-${id}`}
                                    aria-selected={isActive}
                                    aria-controls={`panel-${id}`}
                                    tabIndex={isActive ? 0 : -1}
                                    onClick={() => handleTabChange(id)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 sm:px-5 ${
                                        isActive
                                            ? "bg-primary text-white"
                                            : "text-text/80 hover:bg-background hover:text-secondary"
                                    }`}
                                >
                                    <Icon size={18} aria-hidden="true" />
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Caption: one short line that changes with the selected tab */}
                <p
                    id="maps-guide"
                    className="min-w-0 text-sm text-text/70 md:text-base"
                >
                    {activeCaption}
                </p>
            </div>

            <div
                role="tabpanel"
                id={`panel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
            >
                {activeTab === "flood" ? <FloodMap /> : <Transportation />}
            </div>
        </div>
    );
}

export default Maps;