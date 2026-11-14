import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import FloodMapLeaflet from "../components/FloodMapLeaflet";
import { evacuationDestinations } from "../components/TransportationMap";
import { listFloodReports } from "../services/floodReportsService";
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
    const [noahVisible, setNoahVisible] = useState(false);
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
        let refreshTimer;

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
        refreshTimer = window.setInterval(refreshReports, 60 * 1000);
        return () => {
            mounted = false;
            window.clearInterval(refreshTimer);
        };
    }, [reportsLastUpdated]);

    const rainfall = weather?.peakRainfall;
    const highestReport = ["Evacuate", "Alert", "Monitor"]
        .map((reportLevel) => floodReports.find((report) => report.level === reportLevel))
        .find(Boolean);
    const officialLevel = reportsLoaded
        ? highestReport
            ? rainfallLevels[highestReport.level.toLowerCase()]
            : rainfallLevels.normal
        : null;
    const statusCounts = reportsLoaded
        ? {
            evacuate: floodReports.filter((report) => report.level === "Evacuate").length,
            alert: floodReports.filter((report) => report.level === "Alert").length,
            monitor: floodReports.filter((report) => report.level === "Monitor").length,
            normal: floodReports.length ? 0 : 1,
        }
        : null;

    return (
        <main className="mx-auto max-w-[var(--container-agos)] px-4 py-6">
            <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="h-[min(70vh,38rem)] min-h-[28rem]">
                    <FloodMapLeaflet
                        weatherData={weather ? [weather] : []}
                        facilityData={evacuationDestinations}
                        floodReports={floodReports}
                        onSatelliteDateChange={setSatelliteDate}
                        onNoahVisibilityChange={setNoahVisible}
                    />
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div><StatCard variant="high" title="Evacuate" value={statusCounts ? statusCounts.evacuate : "-"} /><span className="flood-stat-note">{statusCounts ? "Estimated" : "No data"}</span></div>
                        <div><StatCard variant="moderate" title="Alert" value={statusCounts ? statusCounts.alert : "-"} /><span className="flood-stat-note">{statusCounts ? "Estimated" : "No data"}</span></div>
                        <div><StatCard variant="low" title="Monitor" value={statusCounts ? statusCounts.monitor : "-"} /><span className="flood-stat-note">{statusCounts ? "Estimated" : "No data"}</span></div>
                        <div><StatCard variant="safe" title="Normal" value={statusCounts ? statusCounts.normal : "-"} /><span className="flood-stat-note">{statusCounts ? "Estimated" : "No data"}</span></div>
                    </div>

                    <article className="rounded-xl bg-card p-4 shadow-card">
                        <header>
                            <h2>Official status</h2>
                            <div>{officialLevel ? `${officialLevel.icon} ${officialLevel.label}` : "No data"}</div>
                        </header>
                        <div>
                            <p>Active reports: {reportsLoaded ? floodReports.length : "No data"}</p>
                            <p>Estimated rainfall: {Number.isFinite(rainfall) ? `${rainfall.toFixed(1)} mm/hr` : "No data"}</p>
                            <p>Satellite data: {satelliteDate ? `Satellite data for ${satelliteDate}. Not live.` : "No data"}</p>
                            <p className="flood-estimate-note">Rainfall is estimated; satellite data is separate from official status.</p>
                        </div>
                    </article>
                    {reportsLoaded && !floodReports.length && <p className="flood-empty-state">No active flood reports</p>}
                    {reportsError && <p className="flood-weather-error">{reportsError}</p>}
                    <article className="flood-weather-card">
                        <div className="flood-weather-heading">
                            <h2>Live weather</h2>
                            <span>{weatherLoading ? "Loading..." : weather ? "Batangas City" : "Unavailable"}</span>
                        </div>
                        {weather && (
                            <div className="flood-weather-grid">
                                <div><strong>{weather.peakRainfall.toFixed(1)} mm/hr</strong><span>Peak estimated rainfall</span></div>
                            </div>
                        )}
                        {weatherError && <p className="flood-weather-error">{weatherError}</p>}
                        {!weatherLoading && weather && <p className="flood-weather-updated">Last updated: {getTimePht(weather.lastUpdated)} PHT</p>}
                    </article>
                </div>
            </section>

            <section className="mt-6 rounded-xl bg-card p-4 shadow-card">
                <header>
                    <h2>Map data</h2>
                </header>

                <div className="grid grid-cols-3 gap-3">
                    <div className="flood-page-legend-item"><i className="flood-legend-admin" />Admin-confirmed flood report</div>
                    <div className="flood-page-legend-item"><i className="flood-legend-satellite" />Satellite-detected flooding</div>
                    {noahVisible && <div className="flood-page-legend-item"><i className="bg-[#facc15]" />NOAH Low / Medium / High</div>}
                </div>
            </section>

        </main>
    )
}

export default FloodMap;