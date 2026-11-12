import {
    defaultAnnouncementsData,
    mockAnnouncementsData,
} from "../data/announcementsData";
import { listPublicCommunications } from "./publicCommunicationsService";

const sortPublishedAnnouncements = (items) =>
    [...items].sort((a, b) => {
        const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    });

const mapManualAnnouncements = (items) =>
    sortPublishedAnnouncements(items).map((announcement) => ({
        ...announcement,
        type: "announcement",
        severity: announcement.severity || "low",
        isManual: true,
    }));

const getAnnouncements = async () => {
    const { announcements, alerts } = await listPublicCommunications();
    const isMockMode = import.meta.env.VITE_USE_MOCK_ADMIN !== "false";
    const baseData = isMockMode
        ? mockAnnouncementsData
        : defaultAnnouncementsData;

    return {
        ...baseData,
        manualAnnouncements: mapManualAnnouncements(announcements),
        advisories: [
            ...alerts.map((alert) => ({
                id: alert.id,
                type: "alert",
                severity: alert.severity,
                title: alert.title,
                text: alert.description,
            })),
        ],
    };
};

export { getAnnouncements };
