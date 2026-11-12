import { supabase } from "../lib/supabaseClient";
import {
    listAlerts,
    listCommunicationsAnnouncements,
} from "./admin/communicationsService";

const useMockAdmin = import.meta.env.VITE_USE_MOCK_ADMIN !== "false";

async function listPublicCommunications() {
    if (useMockAdmin) {
        const [alerts, announcements] = await Promise.all([
            listAlerts(),
            listCommunicationsAnnouncements(),
        ]);
        return {
            alerts: alerts.filter(
                (alert) =>
                    alert.status === "active" &&
                    (!alert.expiresAt || new Date(alert.expiresAt) > new Date()),
            ),
            announcements: announcements.filter(
                (announcement) =>
                    announcement.status === "published" &&
                    (!announcement.publishedAt ||
                        new Date(announcement.publishedAt) <= new Date()),
            ),
        };
    }

    const now = new Date().toISOString();
    const [alertsResult, announcementsResult] = await Promise.all([
        supabase
            .from("alerts")
            .select("*")
            .eq("status", "active")
            .lte("starts_at", now)
            .gt("expires_at", now)
            .order("created_at", { ascending: false }),
        supabase
            .from("announcements")
            .select("*")
            .eq("status", "published")
            .or(`published_at.is.null,published_at.lte.${now}`)
            .order("published_at", { ascending: false }),
    ]);

    if (alertsResult.error) throw alertsResult.error;
    if (announcementsResult.error) throw announcementsResult.error;

    return {
        alerts: (alertsResult.data || []).map((row) => ({
            id: row.id,
            title: row.title,
            severity: row.severity,
            description: row.description,
            startsAt: row.starts_at,
            expiresAt: row.expires_at,
            source: row.source,
            status: row.status,
        })),
        announcements: (announcementsResult.data || []).map((row) => ({
            id: row.id,
            title: row.title,
            category: row.category,
            severity: row.severity || "low",
            content: row.content,
            attachmentUrl: row.attachment_url || "",
            source: row.source,
            publishedAt: row.published_at,
            status: row.status,
        })),
    };
}

function subscribeToPublicCommunications(onChange) {
    if (useMockAdmin) return () => {};

    const channel = supabase
        .channel("public-communications")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "alerts" },
            onChange,
        )
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "announcements" },
            onChange,
        )
        .subscribe();

    const refreshTimer = window.setInterval(onChange, 30000);
    const handleVisibility = () => {
        if (document.visibilityState === "visible") onChange();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
        window.clearInterval(refreshTimer);
        document.removeEventListener("visibilitychange", handleVisibility);
        supabase.removeChannel(channel);
    };
}

export { listPublicCommunications, subscribeToPublicCommunications };
