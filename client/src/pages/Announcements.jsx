import { useEffect, useState } from "react";
import {
    AlertTriangle,
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
import {
    getCachedPublicCommunications,
    subscribeToPublicCommunications,
} from "../services/publicCommunicationsService";
import formatPht from "../lib/formatPht";
import GreenAlert from "../assets/alert-icons/green-alert.png";
import YellowAlert from "../assets/alert-icons/yellow-alert.png";
import RedAlert from "../assets/alert-icons/red-alert.png";

const manualAnnouncementIcons = {
    low: GreenAlert,
    moderate: YellowAlert,
    high: RedAlert,
};

const categoryConfig = [
    { name: "Weather Update", icon: CloudSun },
    { name: "River Monitoring", icon: Waves, monitoringId: "river-monitoring" },
    { name: "Coastal Monitoring", icon: Waves, monitoringId: "coastal-monitoring" },
    { name: "Advisory", icon: BellRing },
    { name: "General Announcement", icon: Megaphone },
];

const getManualAnnouncementIcon = (severity) =>
    manualAnnouncementIcons[String(severity).toLowerCase()] ||
    manualAnnouncementIcons.low;

const formatPublicationTime = (publishedAt) => {
    const formatted = formatPht(publishedAt);
    return formatted || "Publication time unavailable";
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

/** Compute the "Last information update" from the newest alert or announcement timestamp */
function computeAsOf(data) {
    let newest = 0;

    for (const alert of data.activeAlerts || []) {
        const t = alert.startsAt ? new Date(alert.startsAt).getTime() : 0;
        if (!Number.isNaN(t) && t > newest) newest = t;
    }
    for (const reading of data.monitoring || []) {
        const t = reading.updatedAt ? new Date(reading.updatedAt).getTime() : 0;
        if (!Number.isNaN(t) && t > newest) newest = t;
    }
    for (const ann of data.manualAnnouncements || []) {
        const t = ann.publishedAt ? new Date(ann.publishedAt).getTime() : 0;
        if (!Number.isNaN(t) && t > newest) newest = t;
    }

    if (!newest) {
        return { time: "No updates yet", date: "" };
    }

    const formatted = formatPht(new Date(newest));
    return { time: formatted, date: "" };
}

function ManualAnnouncementList({
    announcements,
    category,
    expanded,
    onToggle,
    hideWhenEmpty = false,
}) {
    const matching = getPublishedByCategory(announcements, category);
    const visible = expanded ? matching : matching.slice(0, 5);

    if (!matching.length) {
        if (hideWhenEmpty) return null;
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

const severityLabels = {
    safe: "Safe",
    low: "Monitor",
    moderate: "Affected",
    high: "Danger",
};

function AutomatedMonitoringCard({ reading }) {
    const { type, severity, title, text, details, source, updatedAt } = reading;
    return (
        <article className="rounded-xl border border-gray-100 bg-background/60 p-4">
            <div className="flex items-start gap-3">
                <img
                    src={getAnnouncementIcon(type, severity)}
                    alt={`${severity} ${type} status`}
                    className="h-11 w-11 shrink-0 object-contain"
                />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-bold text-secondary">{title}</p>
                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-secondary">
                            {severityLabels[severity] || severity}
                        </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-text/75">
                        {text}
                    </p>
                    {details && (
                        <p className="mt-1 text-[11px] leading-relaxed text-text/55">
                            {details}
                        </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-text/55">
                        {source && (
                            <span className="inline-flex items-center gap-1">
                                <Radio size={12} aria-hidden="true" />
                                {source}
                            </span>
                        )}
                        {updatedAt && (
                            <span className="inline-flex items-center gap-1">
                                <Clock3 size={12} aria-hidden="true" />
                                {formatPht(updatedAt) || "—"}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </article>
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
    const cachedPublic = getCachedPublicCommunications();
    const initialData = cachedPublic
        ? {
              ...defaultAnnouncementsData,
              manualAnnouncements: [...(cachedPublic.announcements || [])]
                  .sort((a, b) => {
                      const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
                      const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
                      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
                  })
                  .map((announcement) => ({
                      ...announcement,
                      type: "announcement",
                      severity: announcement.severity || "low",
                      isManual: true,
                  })),
              activeAlerts: (cachedPublic.alerts || []).map((alert) => ({
                  id: alert.id,
                  type: "flood",
                  severity: (() => {
                      switch (String(alert.severity).toLowerCase()) {
                          case "evacuate": return "high";
                          case "affected": return "moderate";
                          case "monitor": return "low";
                          case "safe": return "safe";
                          default: return "low";
                      }
                  })(),
                  rawSeverity: alert.severity,
                  title: alert.title,
                  text: alert.description,
                  startsAt: alert.startsAt,
                  source: alert.source,
              })),
              advisories: [],
          }
        : defaultAnnouncementsData;

    const [announcements, setAnnouncements] = useState(initialData);
    const [activeTab, setActiveTab] = useState("update");
    const [expandedCategories, setExpandedCategories] = useState({});
    const [isLoading, setIsLoading] = useState(!cachedPublic);
    const [isRefreshing, setIsRefreshing] = useState(Boolean(cachedPublic));
    const [hasLoadError, setHasLoadError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadAnnouncements = () => {
            setIsRefreshing(true);
            return getAnnouncements()
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
                        activeAlerts: Array.isArray(incoming.activeAlerts)
                            ? incoming.activeAlerts
                            : defaultAnnouncementsData.activeAlerts,
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
                    if (isMounted) {
                        setIsLoading(false);
                        setIsRefreshing(false);
                    }
                });
        };

        loadAnnouncements();
        const unsubscribe = subscribeToPublicCommunications(loadAnnouncements);
        // Automated monitoring refreshes on its own, even without admin activity.
        const monitoringTimer = window.setInterval(loadAnnouncements, 5 * 60 * 1000);

        return () => {
            isMounted = false;
            window.clearInterval(monitoringTimer);
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

    const asOf = computeAsOf(announcements);

    /** Check if published Weather Update announcements exist */
    const hasPublishedWeatherUpdates = getPublishedByCategory(
        announcements.manualAnnouncements,
        "Weather Update",
    ).length > 0;

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
                        <div className="flex items-center justify-between gap-2 sm:justify-end">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                                Last information update
                            </p>
                            {isRefreshing && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white">
                                    <RefreshCw size={10} className="animate-spin" />
                                    Refreshing...
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-sm font-bold">
                            {asOf.time}
                        </p>
                        {asOf.date && (
                            <p className="text-xs text-white/70">
                                {asOf.date}
                            </p>
                        )}
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
                        <p className="font-bold">Updates could not be refreshed.</p>
                        <p className="mt-0.5 text-xs">
                            Showing latest available data. Please check your connection and try again.
                        </p>
                    </div>
                </div>
            )}

            {announcements.activeAlerts.length > 0 && (
                <section className="rounded-2xl bg-white p-5 shadow-card md:p-6">
                    <SectionHeader
                        icon={AlertTriangle}
                        eyebrow="Active alerts"
                        title="Current alert status"
                        description="Active alerts issued by AGOS administrators."
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                        {announcements.activeAlerts.map(
                            ({ id, type, severity, rawSeverity, title, text, startsAt, source }) => (
                                <article
                                    key={id}
                                    className="rounded-xl border border-gray-100 bg-background/60 p-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <img
                                            src={getAnnouncementIcon(type, severity)}
                                            alt={`${rawSeverity || severity} alert`}
                                            className="h-11 w-11 shrink-0 object-contain"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <p className="font-bold text-secondary">
                                                    {title}
                                                </p>
                                                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold capitalize text-secondary">
                                                    {rawSeverity || severity}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs leading-relaxed text-text/75">
                                                {text}
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-text/55">
                                                {source && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Info size={12} aria-hidden="true" />
                                                        {source}
                                                    </span>
                                                )}
                                                {startsAt && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Clock3 size={12} aria-hidden="true" />
                                                        {formatPht(startsAt) || "—"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ),
                        )}
                    </div>
                </section>
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
                            {/* Hide default placeholder paragraphs when published Weather Updates exist */}
                            {!(hasPublishedWeatherUpdates && currentTab?.id === "update" && currentTab?.paragraphs?.length === 1 && currentTab.paragraphs[0] === "Weather update unavailable.") &&
                                currentTab?.paragraphs?.map((paragraph) => (
                                    <p key={paragraph} className="mb-2 last:mb-0">
                                        {paragraph}
                                    </p>
                                ))
                            }
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
                    description="Live readings update automatically. They are separate from manually published announcements."
                />
                {announcements.monitoring.length ? (
                    <div className="grid gap-3 md:grid-cols-3">
                        {announcements.monitoring.map((reading) => (
                            <AutomatedMonitoringCard
                                key={reading.id}
                                reading={reading}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState message="Automated monitoring is temporarily unavailable. It will retry automatically." />
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
                    {categoryConfig.map(({ name, icon: Icon, monitoringId }, index) => {
                        const reading = monitoringId
                            ? announcements.monitoring.find(({ id }) => id === monitoringId)
                            : null;
                        return (
                        <article
                            key={name}
                            className={`rounded-2xl bg-white p-5 shadow-card ${
                                index === categoryConfig.length - 1 && categoryConfig.length % 2 !== 0
                                    ? "md:col-span-2"
                                    : ""
                            }`}
                        >
                            <SectionHeader
                                icon={Icon}
                                eyebrow="Category"
                                title={name}
                            />
                            {monitoringId && (
                                reading ? (
                                    <div className="mb-3">
                                        <AutomatedMonitoringCard reading={reading} />
                                    </div>
                                ) : (
                                    <p className="mb-3 text-xs text-text/55">
                                        Automated reading is temporarily unavailable.
                                    </p>
                                )
                            )}
                            {/* Advisory category: show only manual announcements, not alerts */}
                            <ManualAnnouncementList
                                announcements={announcements.manualAnnouncements}
                                category={name}
                                expanded={expandedCategories[name]}
                                onToggle={toggleCategory}
                                hideWhenEmpty={Boolean(monitoringId)}
                            />
                        </article>
                        );
                    })}
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