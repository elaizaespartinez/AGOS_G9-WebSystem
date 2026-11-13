import { mockAnnouncementsData } from "../data/announcementsData";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const getAnnouncements = async () => {
    if (!API_BASE_URL) {
        if (import.meta.env.DEV) return mockAnnouncementsData;

        throw new Error("The Announcements API URL is not configured.");
    }

    const response = await fetch(`${API_BASE_URL}/api/announcements`);

    if (!response.ok) {
        throw new Error(
            `Announcements request failed with status ${response.status}.`,
        );
    }

    return response.json();
};

export { getAnnouncements };
