import { useEffect, useState } from "react";
import FloodMapLeaflet from "../components/FloodMapLeaflet";
import StatCard from "../components/StatCard";
import { evacuationDestinations } from "../components/TransportationMap";
import {
    listFloodReports,
    subscribeToFloodReports,
} from "../services/floodReportsService";
import { getWeather } from "../services/weatherService";
import "../flood-map.css";

const rainfallLevels = {
    evacuate: { label: "Evacuate", icon: "▲" },
    alert: { label: "Alert", icon: "!" },
    monitor: { label: "Monitor", icon: "◼" },
    normal: { label: "Normal", icon: "✓" },
};

function getTimePht(date) {
    return new Intl.DateTimeFormat("en-PH", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Manila",
    }).format(date);
}

function FloodMap() {
    const [weather, setWeather] = useState(null);
    const [weatherLoading, setWeatherLoading] = useState(true);
    const [weatherError, setWeatherError] = useState("");
    const [satelliteDate, setSatelliteDate] = useState("");
    const [, setNoahVisible] = useState(false);
    const [floodReports, setFloodReports] = useState([]);
    const [reportsLoaded, setReportsLoaded] = useState(false);
    const [reportsLastUpdated, setReportsLastUpdated] = useState(null);
    const [reportsError, setReportsError] = useState("");

    useEffect(() => {
        let mounted = true;
        let refreshTimer;
        let retryTimer;

        async function refreshWeather() {
            try {
                const nextWeather = await getWeather();
                if (!mounted) return;
                setWeather(nextWeather);
                setWeatherError("");
                window.clearTimeout(retryTimer);
                window.clearInterval(refreshTimer);
                refreshTimer = window.setInterval(refreshWeather, 10 * 60 * 1000);
            } catch (error) {
                console.error("Unable to load live weather.", error);
                if (mounted) {
                    setWeatherError("Live weather is unavailable. Retrying in 60 seconds.");
                    window.clearTimeout(retryTimer);
                    retryTimer = window.setTimeout(refreshWeather, 60 * 1000);
                }
            } finally {
                if (mounted) setWeatherLoading(false);
            }
        }

        refreshWeather();
        return () => {
            mounted = false;
            window.clearInterval(refreshTimer);
            window.clearTimeout(retryTimer);
        };
    }, []);

    useEffect(() => {
        let mounted = true;

        async function refreshReports() {
            try {
                const nextReports = await listFloodReports();
                if (!mounted) return;
                setFloodReports(nextReports);
                setReportsLoaded(true);
                setReportsLastUpdated(new Date());
                setReportsError("");
            } catch (error) {
                console.error("Unable to load active flood reports.", error);
                if (mounted) {
                    setReportsError(
                        reportsLastUpdated
                            ? `Last updated ${getTimePht(reportsLastUpdated)} PHT - may be outdated.`
                            : "Flood reports are currently unavailable.",
                    );
                }
            }
        }

        refreshReports();
        const unsubscribe = subscribeToFloodReports(refreshReports);
        return () => {
            mounted = false;
            unsubscribe();
        };
    }, []);

    const rainfall = weather?.peakRainfall;
    const highestReport = ["Evacuate", "Alert", "Monitor"]
        .map((reportLevel) => floodReports.find((report) => report.level === reportLevel))
        .find(Boolean);
    const officialLevel = reportsLoaded
        ? highestReport
            ? rainfallLevels[highestReport.level.toLowerCase()]
            : rainfallLevels.normal
        : null;
    const officialStatusKey = highestReport
        ? highestReport.level.toLowerCase()
        : reportsLoaded
            ? "normal"
            : "";
    const officialStatusClasses = {
        evacuate: "bg-risk-high/15 text-risk-high",
        alert: "bg-risk-moderate/15 text-risk-moderate",
        monitor: "bg-risk-low/20 text-amber-800",
        normal: "bg-safe/15 text-safe",
    };
    const statusCounts = reportsLoaded
        ? {
            evacuate: floodReports.filter((report) => report.level === "Evacuate").length,
            alert: floodReports.filter((report) => report.level === "Alert").length,
            monitor: floodReports.filter((report) => report.level === "Monitor").length,
            normal: floodReports.length ? 0 : 1,
        }
        : null;
    const statusCards = [
        ["Evacuate", "evacuate", statusCounts?.evacuate],
        ["Alert", "alert", statusCounts?.alert],
        ["Monitor", "monitor", statusCounts?.monitor],
        ["Normal", "normal", statusCounts?.normal],
    ];
    const statusCardClasses = {
        evacuate: "border-risk-high",
        alert: "border-risk-moderate",
        monitor: "border-risk-low",
        normal: "border-safe",
    };
    const statusDotClasses = {
        evacuate: "bg-risk-high",
        alert: "bg-risk-moderate",
        monitor: "bg-risk-low",
        normal: "bg-safe",
    };
    return (
        <div className="mx-auto max-w-[1600px] px-4 py-3 lg:h-[calc(100dvh-5rem)] lg:overflow-hidden">
            <section className="grid gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="flex flex-col gap-2 lg:h-full lg:min-h-0  bg-white p-1 rounded-xl ">
                    <div className="h-[50dvh] min-h-0 flex-1 lg:h-full">
                        <FloodMapLeaflet
                            weatherData={weather ? [weather] : []}
                            facilityData={evacuationDestinations}
                            floodReports={floodReports}
                            onSatelliteDateChange={setSatelliteDate}
                            onNoahVisibilityChange={setNoahVisible}
                        />
                    </div>
                    <div className="flood-page-legend-strip">
                        <span className="font-bold text-text">Map data:</span>
                        <span className="flood-page-legend-item"><span className="flood-legend-admin" /> Official reports</span>
                        <span className="flood-page-legend-item"><span className="flood-legend-satellite" /> Satellite flood</span>
                        <span className="flood-page-legend-item"><i className="bg-risk-high" /> Evacuate</span>
                        <span className="flood-page-legend-item"><i className="bg-risk-moderate" /> Alert</span>
                        <span className="flood-page-legend-item"><i className="bg-risk-low" /> Monitor</span>
                        <span className="flood-page-legend-item"><i className="bg-safe" /> Normal</span>
                        <span className="flood-page-legend-item"><i className="bg-[#2e9eac]" /> Evacuation center</span>
                    </div>
                </div>
                <div className="flex flex-col gap-3 lg:h-full lg:overflow-y-auto flood-sidebar-scroll lg:pr-1">
                    <div className="grid grid-cols-2 gap-2.5">
                        {statusCards.map(([label, key, value]) => (
                            <StatCard
                                key={label}
                                variant={key}
                                title={label}
                                value={value}
                                note={statusCounts ? "Estimated" : "No data"}
                            />
                        ))}
                    </div>

                    <article className="rounded-xl bg-card p-3 shadow-card">
                        <header className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-text/50">Flood reports</p>
                                <h2 className="mt-0.5 text-sm font-bold text-text">Official status</h2>
                            </div>
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${officialStatusKey ? officialStatusClasses[officialStatusKey] : "bg-slate-100 text-slate-500"}`}>
                                {officialLevel ? `${officialLevel.icon} ${officialLevel.label}` : "No data"}
                            </span>
                        </header>
                        <div className="mt-2.5 divide-y divide-slate-100 text-xs">
                            <p className="flex justify-between gap-3 py-1.5 first:pt-0"><span className="text-text/60">Active reports</span><strong>{reportsLoaded ? floodReports.length : "No data"}</strong></p>
                            <p className="flex justify-between gap-3 py-1.5"><span className="text-text/60">Estimated rainfall</span><strong>{Number.isFinite(rainfall) ? `${rainfall.toFixed(1)} mm/hr` : "No data"}</strong></p>
                            <p className="flex justify-between gap-3 py-1.5 last:pb-0"><span className="text-text/60">Satellite data</span><strong className="text-right">{satelliteDate ? `For ${satelliteDate}` : "No data"}</strong></p>
                        </div>
                        <div className="mt-2">
                            <p className="flood-estimate-note text-[10px]">Rainfall is estimated; satellite data is separate from official status.</p>
                        </div>
                    </article>
                    {reportsLoaded && !floodReports.length && <p className="flood-empty-state text-xs py-1.5 px-2.5">No active flood reports</p>}
                    {reportsError && <p className="flood-weather-error text-xs">{reportsError}</p>}
                    <article className="flood-weather-card">
                        <div className="flood-weather-heading">
                            <h2 className="text-sm font-bold">Live weather</h2>
                            <span>{weatherLoading ? "Loading..." : weather ? "Batangas City" : "Unavailable"}</span>
                        </div>
                        {weather && (
                            <div className="flood-weather-grid">
                                <div><strong>{weather.peakRainfall.toFixed(1)} mm/hr</strong><span>Peak estimated rainfall</span></div>
                            </div>
                        )}
                        {weatherError && <p className="flood-weather-error text-xs">{weatherError}</p>}
                        {!weatherLoading && weather && <p className="flood-weather-updated text-[11px]">Last updated: {getTimePht(weather.lastUpdated)} PHT</p>}
                    </article>
                </div>
            </section>
        </div>
    );
}

export default FloodMap;