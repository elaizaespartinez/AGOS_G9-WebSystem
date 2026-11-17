import {
    defaultLocalResponse,
    mockLocalResponse,
    barangayHotlines,
} from "../data/emergencyData.js";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const getLocalResponse = async ({ barangay }) => {
    if (barangay && barangay in barangayHotlines) {
        return barangayHotlines[barangay];
    }

    if (barangay === "Alangilan") {
        return mockLocalResponse;
    }

    if (!API_BASE_URL) {
        return {
            ...defaultLocalResponse,
            organization: barangay ? `${barangay} Barangay Hall` : defaultLocalResponse.organization,
            location: barangay ? `${barangay}, Batangas City` : defaultLocalResponse.location,
            hotlines: [],
        };
    }

    const params = new URLSearchParams({ barangay: barangay || "" });

    const response = await fetch(`${API_BASE_URL}/local-response?${params.toString()}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch local response data: ${response.statusText}`);
    }

    return response.json();
};

export { getLocalResponse };
