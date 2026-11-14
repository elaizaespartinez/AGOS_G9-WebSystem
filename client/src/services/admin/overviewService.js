import { supabase } from "../../lib/supabaseClient";
import { aggregateReports } from "./reportsService";

export async function getOverview() {
    const now = new Date().toISOString();
    const [reportsResult, alertsResult, conditionsResult, hotlinesResult, centersResult] = await Promise.all([
        supabase.from("reports").select("status, expires_at"),
        supabase
            .from("alerts")
            .select("id")
            .eq("status", "active")
            .lte("starts_at", now)
            .gt("expires_at", now),
        supabase
            .from("flood_conditions")
            .select("severity")
            .or(`expires_at.is.null,expires_at.gt.${now}`),
        supabase.from("hotlines").select("id").eq("active", true),
        supabase.from("evacuation_centers").select("id").eq("status", "open"),
    ]);

    if (reportsResult.error) throw reportsResult.error;
    if (alertsResult.error) throw alertsResult.error;
    if (conditionsResult.error) throw conditionsResult.error;
    if (hotlinesResult.error) throw hotlinesResult.error;
    if (centersResult.error) throw centersResult.error;

    const reportItems = (reportsResult.data || []).map((report) => ({
        ...report,
        createdAt: report.created_at,
        expiresAt: report.expires_at,
    }));
    return {
        reports: aggregateReports(reportItems),
        activeAlerts: alertsResult.data?.length || 0,
        affectedLocations: (conditionsResult.data || []).filter((condition) =>
            ["affected", "evacuate"].includes(condition.severity),
        ).length,
        connectedSources: "Supabase",
        hotlines: hotlinesResult.data?.length || 0,
        openCenters: centersResult.data?.length || 0,
    };
}

export function subscribeToOverview(onChange) {
    const channel = supabase
        .channel("admin-overview")
        .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, onChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, onChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "flood_conditions" }, onChange)
        .subscribe();

    const timer = window.setInterval(onChange, 30000);
    const handleVisibility = () => {
        if (document.visibilityState === "visible") onChange();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
        window.clearInterval(timer);
        document.removeEventListener("visibilitychange", handleVisibility);
        supabase.removeChannel(channel);
    };
}
