import { mockHomeData } from "../data/homeData";
import { supabase } from "../lib/supabaseClient";
import {
    listPublicCommunications,
    subscribeToPublicCommunications,
} from "./publicCommunicationsService";
import { getHomeWeather, getWeather } from "./weatherService";
import { getFloodRiskLevel } from "../lib/floodRisk";

const mapHotlineNumbers = (hotline) => {
    const value = hotline.number ?? hotline.numbers ?? "";

    if (Array.isArray(value)) {
        return value.flatMap((number) =>
            String(number)
                .split(/[,/]/)
                .map((item) => item.trim())
                .filter(Boolean),
        );
    }

    return String(value)
        .split(/[,/]/)
        .map((number) => number.trim())
        .filter(Boolean);
};

const getHotlines = async () => {
    const { data, error } = await supabase
        .from("hotlines")
        .select("*")
        .eq("active", true)
        .order("name");

    if (error) throw error;

    return (data || []).map((hotline) => ({
        id: hotline.id,
        name: hotline.name,
        numbers: mapHotlineNumbers(hotline),
    }));
};

const getHomeDashboard = async () => {
    const [
        weatherResult,
        hotlinesResult,
        communicationsResult,
        floodWeatherResult,
    ] =
        await Promise.allSettled([
            getHomeWeather(),
            getHotlines(),
            listPublicCommunications(),
            getWeather(),
        ]);

    if (
        weatherResult.status === "rejected" &&
        hotlinesResult.status === "rejected"
    ) {
        throw new Error("Unable to load weather and hotline data.");
    }

    const alert =
        communicationsResult.status === "fulfilled"
            ? communicationsResult.value.alerts[0]
            : null;

    const floodRisk =
        floodWeatherResult.status === "fulfilled"
            ? getFloodRiskLevel(floodWeatherResult.value)
            : null;

    return {
        ...mockHomeData,
        weather:
            weatherResult.status === "fulfilled"
                ? weatherResult.value
                : mockHomeData.weather,
        hotlines:
            hotlinesResult.status === "fulfilled"
                ? hotlinesResult.value
                : [],
        floodStatus:
            floodRisk
                ? {
                      risk: floodRisk,
                      level: `${floodRisk.replace(/^./, (letter) => letter.toUpperCase())} Risk`,
                      location: "Batangas City",
                      updatedAt: floodWeatherResult.value.lastUpdated.toLocaleString(),
                      source: "Open-Meteo rainfall estimate",
                  }
                : mockHomeData.floodStatus,
        activeAlert: alert
            ? {
                  title: alert.title,
                  description: alert.description,
                  type: "rainfall",
                  severity:
                      alert.severity === "safe"
                          ? "safe"
                          : alert.severity === "monitor"
                            ? "moderate"
                            : "high",
                  updatedAt: alert.startsAt
                      ? new Date(alert.startsAt).toLocaleString()
                      : "Just now",
                  source: alert.source,
              }
            : mockHomeData.activeAlert,
    };
};

export { getHomeDashboard, subscribeToPublicCommunications };
