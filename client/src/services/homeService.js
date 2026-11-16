import { mockHomeData } from "../data/homeData";
import { supabase } from "../lib/supabaseClient";
import {
    listPublicCommunications,
    subscribeToPublicCommunications,
} from "./publicCommunicationsService";
import { getHomeWeather } from "./weatherService";

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
    const [weatherResult, hotlinesResult] = await Promise.allSettled([
        getHomeWeather(),
        getHotlines(),
    ]);

    if (
        weatherResult.status === "rejected" &&
        hotlinesResult.status === "rejected"
    ) {
        throw new Error("Unable to load weather and hotline data.");
    }

    const { alerts } = await listPublicCommunications();
    const alert = alerts[0];

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
        ...(alert
            ? {
                  activeAlert: {
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
                  },
              }
            : {}),
    };
};

export { getHomeDashboard, subscribeToPublicCommunications };
