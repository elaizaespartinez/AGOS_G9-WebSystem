import { mockHomeData } from "../data/homeData";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const getHomeDashboard = async () => {
    if (!API_BASE_URL) {
        if (import.meta.env.DEV) {
            return mockHomeData;
        }

        throw new Error("The Home dashboard API URL is not configured.");
    }

    const response = await fetch(`${API_BASE_URL}/api/home`);

    if (!response.ok) {
        throw new Error(`Home dashboard request failed with status ${response.status}.`);
    }

    return response.json();
};

export { getHomeDashboard };
