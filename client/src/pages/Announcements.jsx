import { useEffect, useState } from "react";
import {
    BellRing,
    CalendarDays,
    ChevronDown,
    Clock3,
    CloudSun,
    Info,
    Megaphone,
    Radio,
    RefreshCw,
    Waves,
} from "lucide-react";
import {
    defaultAnnouncementsData,
    getAnnouncementIcon,
} from "../data/announcementsData";
import { getAnnouncements } from "../services/announcementsService";
import { subscribeToPublicCommunications } from "../services/publicCommunicationsService";
import GreenAlert from "../assets/alert-icons/green-alert.png";
import YellowAlert from "../assets/alert-icons/yellow-alert.png";
import RedAlert from "../assets/alert-icons/red-alert.png";

const manualAnnouncementIcons = {
    low: GreenAlert,
    moderate: YellowAlert,
    high: RedAlert,
};

const categoryConfig = [
    { name: "River Monitoring", icon: Waves },
    { name: "Coastal Monitoring", icon: Waves },
    { name: "Advisory", icon: BellRing },
    { name: "General Announcement", icon: Megaphone },
];

const getManualAnnouncementIcon = (severity) =>
    manualAnnouncementIcons[String(severity).toLowerCase()] ||
    manualAnnouncementIcons.low;

const formatPublicationTime = (publishedAt) => {
    if (!publishedAt) return "Publication time unavailable";
    const date = new Date(publishedAt);
    return Number.isNaN(date.getTime())
        ? "Publication time unavailable"
        : date.toLocaleString();
};

const getPublishedByCategory = (items, category) =>
    items
        .filter(
            (item) =>
                item.status === "published" && item.category === category,
        )
        .sort((a, b) => {
            const aTime = a.publishedAt
                ? new Date(a.publishedAt).getTime()
                : 0;
            const bTime = b.publishedAt
                ? new Date(b.publishedAt).getTime()
                : 0;
            return (
                (Number.isNaN(bTime) ? 0 : bTime) -
                (Number.isNaN(aTime) ? 0 : aTime)
            );
        });

function ManualAnnouncementList({
    announcements,
    category,
    expanded,
    onToggle,
}) {
    const matching = getPublishedByCategory(announcements, category);
    const visible = expanded ? matching : matching.slice(0, 5);

    if (!matching.length) {
        return (
            <div className="rounded-lg border border-dashed border-gray-200 bg-slate-50 p-4 text-center">
                <p className="text-xs text-text/55">
                    No published {category.toLowerCase()} yet.
                </p>
            </div>
        );
    }

    return (
        <div>
            <ul className="space-y-3">
                {visible.map((announcement) => (
                    <ManualAnnouncementCard
                        key={announcement.id}
                        announcement={announcement}
                    />
                ))}
            </ul>
            {matching.length > 5 && (
                <button
                    type="button"
                    onClick={() => onToggle(category)}
                    className="mt-4 inline-flex min-h-10 items-center gap-1 rounded-lg border border-primary/30 px-3 text-xs font-bold text-secondary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    {expanded ? "Show fewer" : `View all (${matching.length})`}
                    <ChevronDown
                        size={14}
                        className={expanded ? "rotate-180" : ""}
                        aria-hidden="true"
                    />
                </button>
            )}
        </div>
    );
}

function ManualAnnouncementCard({ announcement }) {
    return (
        <li className="rounded-lg border border-gray-100 bg-white p-3 shadow-card">
            <div className="flex items-start gap-3">
                <img
                    src={getManualAnnouncementIcon(announcement.severity)}
                    alt={`${announcement.severity || "low"} severity`}
                    className="h-10 w-10 shrink-0 object-contain"
                />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <h4 className="font-extrabold leading-snug text-secondary">
                            {announcement.title}
                        </h4>
                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold capitalize text-secondary">
                            {announcement.severity || "low"}
                        </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-text/75">
                        {announcement.content}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-text/55">
                        <span className="inline-flex items-center gap-1">
                            <Info size={12} aria-hidden="true" />
                            {announcement.source || "Source not specified."}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Clock3 size={12} aria-hidden="true" />
                            {formatPublicationTime(announcement.publishedAt)}
                        </span>
                    </div>
                </div>
            </div>
        </li>
    );
}

function SectionHeader({ icon: Icon, eyebrow, title, description }) {
    return (
        <div className="mb-4 flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon size={20} aria-hidden="true" />
            </span>
            <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
                    {eyebrow}
                </p>
                <h2 className="mt-1 text-lg font-extrabold text-secondary">
                    {title}
                </h2>
                {description && (
                    <p className="mt-1 text-xs leading-relaxed text-text/60">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}

function Announcements() {
    const [announcements, setAnnouncements] = useState(
        defaultAnnouncementsData,
    );
    const [activeTab, setActiveTab] = useState("update");
    const [expandedCategories, setExpandedCategories] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoadError, setHasLoadError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadAnnouncements = () =>
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
                        manualAnnouncements: Array.isArray(
                            incoming.manualAnnouncements,
                        )
                            ? incoming.manualAnnouncements
                            : defaultAnnouncementsData.manualAnnouncements,
                    });
                    setHasLoadError(false);
                })
                .catch((error) => {
                    if (!isMounted) return;
                    console.error("Unable to load announcements.", error);
                    setHasLoadError(true);
                })
                .finally(() => {
                    if (isMounted) setIsLoading(false);
                });

        loadAnnouncements();
        const unsubscribe = subscribeToPublicCommunications(loadAnnouncements);

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const currentTab =
        announcements.weatherTabs.find(({ id }) => id === activeTab) ||
        announcements.weatherTabs[0];
    const toggleCategory = (category) =>
        setExpandedCategories((current) => ({
            ...current,
            [category]: !current[category],
        }));

    if (isLoading) {
        return (
            <main className="flex min-h-[520px] items-center justify-center bg-background p-2 md:mx-32 md:px-3">
                <div className="w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-elevated">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                        <RefreshCw size={26} className="animate-spin" />
                    </div>
                    <h1 className="mt-5 text-lg font-extrabold text-secondary">
                        Loading official updates
                    </h1>
                    <p className="mt-2 text-sm text-text/60">
                        Checking the latest announcements and monitoring information.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="flex flex-col gap-6 bg-background p-2 md:mx-32 md:px-3">
            <header className="rounded-2xl bg-primary  p-5 text-white shadow-elevated md:p-7">
                <div className="flex flex-wrap items-start justify-between gap-5">
                    <div>
                        <p className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white">
                            <Megaphone size={14} aria-hidden="true" />
                            AGOS public information
                        </p>
                        <h1 className="mt-2 text-2xl font-extrabold md:text-3xl">
                            Announcements & monitoring
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">
                            Official advisories, weather updates, and monitoring information
                            to help you plan safer trips around Batangas City.
                        </p>
                    </div>
                    <div className="rounded-xl bg-white/10 px-4 py-3 text-left sm:min-w-44 sm:text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                            Last information update
                        </p>
                        <p className="mt-1 text-sm font-bold">
                            {announcements.asOf.time}
                        </p>
                        <p className="text-xs text-white/70">
                            {announcements.asOf.date}
                        </p>
                    </div>
                </div>
            </header>

            {hasLoadError && (
                <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                >
                    <Info size={18} className="mt-0.5 shrink-0" />
                    <div>
                        <p className="font-bold">Updates could not be loaded.</p>
                        <p className="mt-0.5 text-xs">
                            Please refresh the page and try again.
                        </p>
                    </div>
                </div>
            )}

            {announcements.weatherTabs.length > 0 && (
                <section className="rounded-2xl bg-white p-5 shadow-card md:p-6">
                    <SectionHeader
                        icon={CloudSun}
                        eyebrow="Weather update"
                        title="Current weather information"
                        description="Review the latest weather guidance before travelling."
                    />
                    <div className="overflow-hidden rounded-xl border border-primary/15 bg-[#e8f4f5]">
                        <div
                            role="tablist"
                            className="grid grid-cols-2 border-b border-primary/10"
                        >
                            {announcements.weatherTabs.map(({ id, label }) => (
                                <button
                                    key={id}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeTab === id}
                                    onClick={() => setActiveTab(id)}
                                    className={`min-h-11 px-3 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:text-sm ${
                                        activeTab === id
                                            ? "bg-secondary text-white"
                                            : "bg-white text-text/65 hover:bg-primary/5"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div
                            role="tabpanel"
                            className="p-4 text-sm leading-relaxed text-text/80"
                        >
                            {currentTab?.paragraphs?.map((paragraph) => (
                                <p key={paragraph} className="mb-2 last:mb-0">
                                    {paragraph}
                                </p>
                            ))}
                            <ManualAnnouncementList
                                announcements={announcements.manualAnnouncements}
                                category="Weather Update"
                                expanded={expandedCategories["Weather Update"]}
                                onToggle={toggleCategory}
                            />
                        </div>
                    </div>
                </section>
            )}

            <section className="rounded-2xl bg-white p-5 shadow-card md:p-6">
                <SectionHeader
                    icon={Radio}
                    eyebrow="Automated monitoring"
                    title="River, coastal, and flood conditions"
                    description="Monitoring observations are separate from manually published announcements."
                />
                {announcements.monitoring.length ? (
                    <div className="grid gap-3 md:grid-cols-3">
                        {announcements.monitoring.map(
                            ({ id, type, severity, text }) => (
                                <article
                                    key={id}
                                    className="rounded-xl border border-gray-100 bg-background/60 p-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <img
                                            src={getAnnouncementIcon(
                                                type,
                                                severity,
                                            )}
                                            alt={`${severity} ${type} status`}
                                            className="h-11 w-11 shrink-0 object-contain"
                                        />
                                        <p className="text-xs leading-relaxed text-text/75">
                                            {text}
                                        </p>
                                    </div>
                                </article>
                            ),
                        )}
                    </div>
                ) : (
                    <EmptyState message="No monitoring updates are available." />
                )}
            </section>

            <section>
                <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">
                            Official communications
                        </p>
                        <h2 className="mt-1 text-xl font-extrabold text-secondary">
                            Published announcements
                        </h2>
                    </div>
                    <span className="hidden items-center gap-1 text-xs text-text/55 sm:inline-flex">
                        <CalendarDays size={14} />
                        Newest first
                    </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {categoryConfig.map(({ name, icon: Icon }) => (
                        <article
                            key={name}
                            className="rounded-2xl bg-white p-5 shadow-card"
                        >
                            <SectionHeader
                                icon={Icon}
                                eyebrow="Category"
                                title={name}
                            />
                            {name === "Advisory" && announcements.advisories.length > 0 && (
                                <div className="mb-4 space-y-3">
                                    {announcements.advisories.map(
                                        ({ id, type, severity, title, text }) => (
                                            <div
                                                key={id}
                                                className="rounded-lg border border-gray-100 bg-background/60 p-3"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <img
                                                        src={getAnnouncementIcon(
                                                            type,
                                                            severity,
                                                        )}
                                                        alt={`${severity} advisory`}
                                                        className="h-9 w-9 shrink-0 object-contain"
                                                    />
                                                    <div className="text-sm text-text/80">
                                                        {title && (
                                                            <p className="font-bold text-secondary">
                                                                {title}
                                                            </p>
                                                        )}
                                                        <p className="mt-1 text-xs leading-relaxed">
                                                            {text}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}
                            <ManualAnnouncementList
                                announcements={announcements.manualAnnouncements}
                                category={name}
                                expanded={expandedCategories[name]}
                                onToggle={toggleCategory}
                            />
                        </article>
                    ))}
                </div>

                {!announcements.manualAnnouncements.some(
                    ({ status }) => status === "published",
                ) && (
                    <div className="mt-4">
                        <EmptyState message="No published announcements yet. Official updates will appear here after they are published." />
                    </div>
                )}
            </section>
        </main>
    );
}

function EmptyState({ message }) {
    return (
        <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 p-6 text-center">
            <BellRing className="mx-auto text-primary/60" size={24} />
            <p className="mt-2 text-sm text-text/60">{message}</p>
        </div>
    );
}

export default Announcements;
