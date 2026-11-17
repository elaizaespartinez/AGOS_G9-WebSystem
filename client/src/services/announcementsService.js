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

/** Map admin alert severity to flood-icon severity key */
const alertSeverityToIconSeverity = (severity) => {
    switch (String(severity).toLowerCase()) {
        case "evacuate": return "high";
        case "affected": return "moderate";
        case "monitor": return "low";
        case "safe": return "safe";
        default: return "low";
    }
};

const getAnnouncements = async () => {
    const { announcements, alerts } = await listPublicCommunications();
    const isMockMode = import.meta.env.VITE_USE_MOCK_ADMIN !== "false";
    const baseData = isMockMode
        ? mockAnnouncementsData
        : defaultAnnouncementsData;

    return {
        ...baseData,
        manualAnnouncements: mapManualAnnouncements(announcements),
        /** Active alerts shown in their own top-level section */
        activeAlerts: alerts.map((alert) => ({
            id: alert.id,
            type: "flood",
            severity: alertSeverityToIconSeverity(alert.severity),
            rawSeverity: alert.severity,
            title: alert.title,
            text: alert.description,
            startsAt: alert.startsAt,
            source: alert.source,
        })),
        /**
         * Advisories no longer include alerts — the Advisory category block
         * now shows only announcements with category "Advisory".
         */
        advisories: [],
    };
};

export { getAnnouncements };
