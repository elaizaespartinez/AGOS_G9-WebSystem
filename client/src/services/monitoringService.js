import { getFloodRiskLevel } from "../lib/floodRisk";
import { getWeather } from "./weatherService";

/**
 * Automated monitoring for the Announcements page.
 *
 * Data sources (free, no API key):
 *  - Open-Meteo Flood API (GloFAS) -> river discharge
 *  - Open-Meteo Marine API         -> wave height and sea level
 *  - Open-Meteo Forecast API       -> rainfall (via weatherService)
 *
 * Severity levels match the icon keys used by getAnnouncementIcon:
 * "safe" | "low" | "moderate" | "high".
 */

// Batangas City (nearest river is snapped to automatically by the API).
const RIVER_POINT = { latitude: 13.7565, longitude: 121.0583 };
// Offshore point in Batangas Bay so the marine model has ocean data.
const COASTAL_POINT = { latitude: 13.7, longitude: 121.05 };

const FLOOD_ENDPOINT = `https://flood-api.open-meteo.com/v1/flood?latitude=${RIVER_POINT.latitude}&longitude=${RIVER_POINT.longitude}&daily=river_discharge&past_days=7&forecast_days=4&timezone=Asia%2FManila`;
const MARINE_ENDPOINT = `https://marine-api.open-meteo.com/v1/marine?latitude=${COASTAL_POINT.latitude}&longitude=${COASTAL_POINT.longitude}&hourly=wave_height,sea_level_height_msl&past_hours=1&forecast_hours=24&timezone=Asia%2FManila`;

const SOURCE_RIVER = "Open-Meteo / GloFAS river discharge model";
const SOURCE_COASTAL = "Open-Meteo marine model";
const SOURCE_RAIN = "Open-Meteo rainfall data";

const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

async function fetchJson(url, label) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`${label} request failed with status ${response.status}.`);
    }
    return response.json();
}

/** Compares the coming days of river flow against the past week's average. */
function getRiverSeverity(ratio) {
    if (ratio >= 3) return "high";
    if (ratio >= 2) return "moderate";
    if (ratio >= 1.3) return "low";
    return "safe";
}

const riverMessages = {
    safe: "River flow is normal. No significant rise is expected in the next few days.",
    low: "River flow is slightly above its recent average. Keep monitoring river updates.",
    moderate:
        "River flow is expected to rise noticeably. Stay alert near riverbanks and low-lying areas.",
    high: "River flow is expected to rise sharply. Avoid riverbanks and follow local authorities' guidance.",
};

export async function getRiverMonitoring() {
    const payload = await fetchJson(FLOOD_ENDPOINT, "River monitoring");
    const times = payload.daily?.time;
    const discharge = payload.daily?.river_discharge;

    if (!Array.isArray(times) || !Array.isArray(discharge)) {
        throw new Error("River monitoring returned an invalid response.");
    }

    // past_days=7 puts the 7 previous days first, then today and the forecast.
    const pastValues = discharge.slice(0, 7).filter(isNumber);
    const upcomingValues = discharge.slice(7).filter(isNumber);
    if (!pastValues.length || !upcomingValues.length) {
        throw new Error("No river discharge data is available for this location.");
    }

    const pastAverage =
        pastValues.reduce((total, value) => total + value, 0) / pastValues.length;
    const peakUpcoming = Math.max(...upcomingValues);
    const ratio = pastAverage > 0 ? peakUpcoming / pastAverage : 1;
    const severity = getRiverSeverity(ratio);

    return {
        id: "river-monitoring",
        type: "flood",
        severity,
        title: "River monitoring",
        text: riverMessages[severity],
        details: `Forecast peak ${peakUpcoming.toFixed(1)} m³/s vs ${pastAverage.toFixed(1)} m³/s 7-day average`,
        source: SOURCE_RIVER,
        updatedAt: new Date().toISOString(),
    };
}

function getWaveSeverity(waveHeight) {
    if (waveHeight >= 2.5) return "high";
    if (waveHeight >= 1.5) return "moderate";
    if (waveHeight >= 1) return "low";
    return "safe";
}

const coastalMessages = {
    safe: "Sea conditions are calm. Continue monitoring weather and coastal conditions.",
    low: "Waves are slightly elevated. Small boats should take extra care.",
    moderate:
        "Rough sea conditions. Avoid coastal areas and sea travel for small boats.",
    high: "Very rough seas expected. Stay away from the coast and avoid all sea travel.",
};

export async function getCoastalMonitoring() {
    const payload = await fetchJson(MARINE_ENDPOINT, "Coastal monitoring");
    const waves = (payload.hourly?.wave_height || []).filter(isNumber);
    const seaLevel = (payload.hourly?.sea_level_height_msl || []).filter(isNumber);

    if (!waves.length) {
        throw new Error("No wave data is available for this location.");
    }

    const peakWave = Math.max(...waves);
    const severity = getWaveSeverity(peakWave);
    const highTide = seaLevel.length ? Math.max(...seaLevel) : null;

    return {
        id: "coastal-monitoring",
        type: "flood",
        severity,
        title: "Coastal monitoring",
        text: coastalMessages[severity],
        details:
            `Peak wave height ${peakWave.toFixed(1)} m in the next 24 hours` +
            (highTide !== null ? `, high tide about ${highTide.toFixed(2)} m` : ""),
        source: SOURCE_COASTAL,
        updatedAt: new Date().toISOString(),
    };
}

const floodMessages = {
    safe: "Rainfall is light. Flooding is not expected, but check the flood map before travelling.",
    low: "Moderate rainfall recorded. Flooding is possible in low-lying or poorly drained zones.",
    moderate:
        "Heavy rainfall recorded. Flooding is likely in flood-prone areas. Avoid low-lying roads.",
    high: "Intense rainfall recorded. Avoid low-lying areas and do not cross flooded roads.",
};

export async function getFloodConditions() {
    const weather = await getWeather();
    const severity = getFloodRiskLevel(weather);

    return {
        id: "flood-conditions",
        type: "flood",
        severity,
        title: "Flood conditions",
        text: floodMessages[severity],
        details: `${weather.total24h.toFixed(1)} mm in the last 24 hours, peak ${weather.peakRainfall.toFixed(1)} mm/hr`,
        source: SOURCE_RAIN,
        updatedAt: new Date().toISOString(),
    };
}

// Open-Meteo only updates a few times per day, so avoid refetching on every
// page refresh or 30-second communications poll.
const CACHE_TTL_MS = 4 * 60 * 1000;
let monitoringCache = null;

/**
 * Loads all automated monitoring cards. One failing source never blocks the
 * others; cards that could not load are simply left out.
 */
export async function getAutomatedMonitoring() {
    if (monitoringCache && Date.now() - monitoringCache.time < CACHE_TTL_MS) {
        return monitoringCache.data;
    }

    const results = await Promise.allSettled([
        getRiverMonitoring(),
        getCoastalMonitoring(),
        getFloodConditions(),
    ]);

    results.forEach((result) => {
        if (result.status === "rejected") {
            console.error("Automated monitoring source failed.", result.reason);
        }
    });

    const data = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

    // Only cache when something loaded, so a failed attempt is retried next time.
    if (data.length) monitoringCache = { time: Date.now(), data };
    return data;
}