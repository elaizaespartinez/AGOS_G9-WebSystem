import { supabase } from "../lib/supabaseClient";
import {
    listAlerts,
    listCommunicationsAnnouncements,
} from "./admin/communicationsService";

const useMockAdmin = import.meta.env.VITE_USE_MOCK_ADMIN !== "false";

const STORAGE_KEY = "public_communications_cache";
let memoryCache = null;

function readSession() {
    if (typeof sessionStorage === "undefined") return null;
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writeSession(data) {
    if (typeof sessionStorage === "undefined") return;
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // Ignore quota errors
    }
}

export function getCachedPublicCommunications() {
    if (memoryCache) return memoryCache;
    const session = readSession();
    if (session) memoryCache = session;
    return memoryCache;
}

export function setCachedPublicCommunications(data) {
    memoryCache = data;
    writeSession(data);
}

function throttle(fn, delayMs = 3000) {
    let lastRun = 0;
    let timer = null;
    return (...args) => {
        const now = Date.now();
        const timeSince = now - lastRun;
        if (timeSince >= delayMs) {
            lastRun = now;
            fn(...args);
        } else {
            clearTimeout(timer);
            timer = setTimeout(() => {
                lastRun = Date.now();
                fn(...args);
            }, delayMs - timeSince);
        }
    };
}

async function listPublicCommunications() {
    let result;
    if (useMockAdmin) {
        const [alerts, announcements] = await Promise.all([
            listAlerts(),
            listCommunicationsAnnouncements(),
        ]);
        result = {
            alerts: alerts.filter((alert) => alert.status === "active"),
            announcements: announcements.filter(
                (announcement) => announcement.status === "published",
            ),
        };
    } else {
        const [alertsResult, announcementsResult] = await Promise.all([
            supabase
                .from("alerts")
                .select("*")
                .eq("status", "active")
                .order("created_at", { ascending: false }),
            supabase
                .from("announcements")
                .select("*")
                .eq("status", "published")
                .order("created_at", { ascending: false }),
        ]);

        if (alertsResult.error) throw alertsResult.error;
        if (announcementsResult.error) throw announcementsResult.error;

        result = {
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

    setCachedPublicCommunications(result);
    return result;
}

function subscribeToPublicCommunications(onChange) {
    if (useMockAdmin) return () => {};

    const throttledChange = throttle(onChange, 3000);

    const channel = supabase
        .channel("public-communications")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "alerts" },
            throttledChange,
        )
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "announcements" },
            throttledChange,
        )
        .subscribe();

    const refreshTimer = window.setInterval(throttledChange, 30000);
    const handleVisibility = () => {
        if (document.visibilityState === "visible") throttledChange();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
        window.clearInterval(refreshTimer);
        document.removeEventListener("visibilitychange", handleVisibility);
        supabase.removeChannel(channel);
    };
}

export { listPublicCommunications, subscribeToPublicCommunications };
