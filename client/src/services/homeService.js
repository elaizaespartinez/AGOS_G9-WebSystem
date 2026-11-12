import { mockHomeData } from "../data/homeData";
import {
    listPublicCommunications,
    subscribeToPublicCommunications,
} from "./publicCommunicationsService";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const getHomeDashboard = async () => {
    if (!API_BASE_URL) {
        if (import.meta.env.DEV) {
            const { alerts } = await listPublicCommunications();
            const alert = alerts[0];

            return {
                ...mockHomeData,
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
        }

        throw new Error("The Home dashboard API URL is not configured.");
    }

    const response = await fetch(`${API_BASE_URL}/api/home`);

    if (!response.ok) {
        throw new Error(`Home dashboard request failed with status ${response.status}.`);
    }

    const apiData = await response.json();
    const { alerts } = await listPublicCommunications();
    const alert = alerts[0];

    return {
        ...apiData,
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
