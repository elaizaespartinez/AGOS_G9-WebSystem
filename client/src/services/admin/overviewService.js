import { supabase } from "../../lib/supabaseClient";
import { getReportMatchSummary, isExpired, reportsMatch } from "../../lib/adminRules";
import { getWeather } from "../weatherService";
import { listReports } from "./reportsService";
import { listAudit } from "./auditService";

const nowIso = () => new Date().toISOString();

async function loadAlerts() {
    const { data, error } = await supabase
        .from("alerts")
        .select("id, title, description, severity, created_at, starts_at, expires_at")
        .eq("status", "active")
        .lte("starts_at", nowIso())
        .gt("expires_at", nowIso())
        .order("created_at", { ascending: false })
        .limit(3);
    if (error) throw error;
    return data || [];
}

async function loadConditions() {
    const expiry = nowIso();
    const embedded = await supabase
        .from("flood_conditions")
        .select("*, barangays(name)")
        .or(`expires_at.is.null,expires_at.gt.${expiry}`)
        .order("updated_at", { ascending: false });

    if (!embedded.error) return embedded.data || [];

    const fallback = await supabase
        .from("flood_conditions")
        .select("*")
        .or(`expires_at.is.null,expires_at.gt.${expiry}`)
        .order("updated_at", { ascending: false });
    if (fallback.error) throw fallback.error;

    const ids = [...new Set((fallback.data || []).map((row) => row.barangay_id).filter(Boolean))];
    if (!ids.length) return fallback.data || [];

    const { data: barangays, error: barangayError } = await supabase
        .from("barangays")
        .select("psgc_code, name")
        .in("psgc_code", ids);
    if (barangayError) throw barangayError;

    const names = new Map((barangays || []).map((barangay) => [barangay.psgc_code, barangay.name]));
    return (fallback.data || []).map((row) => ({
        ...row,
        barangays: { name: names.get(row.barangay_id) },
    }));
}

function mapPendingReports(rows) {
    const active = (rows || []).filter(
        (report) => report.status === "pending" && !isExpired(report),
    );
    const summary = getReportMatchSummary(active);
    return {
        summary,
        reports: active.slice(0, 3).map((report) => {
            const related = active.filter(
                (item) => reportsMatch(report, item),
            );
            return {
                ...report,
                matchSummary: getReportMatchSummary(related),
            };
        }),
    };
}

export async function getOverview() {
    const results = await Promise.allSettled([
        listReports({ status: "pending" }),
        loadAlerts(),
        loadConditions(),
        listAudit(),
        getWeather(),
    ]);
    const [reportsResult, alertsResult, conditionsResult, auditResult, weatherResult] = results;
    const supabaseHealthy = results
        .slice(0, 4)
        .every((result) => result.status === "fulfilled");
    const weatherHealthy = weatherResult.status === "fulfilled";

    if (!supabaseHealthy && !weatherHealthy) {
        throw new Error("Supabase and Open-Meteo are unavailable.");
    }

    const pending = reportsResult.status === "fulfilled"
        ? mapPendingReports(reportsResult.value)
        : { reports: [], summary: { distinctReporters: 0, conflicts: 0 } };
    const alerts = alertsResult.status === "fulfilled" ? alertsResult.value : [];
    const conditions = conditionsResult.status === "fulfilled" ? conditionsResult.value : [];
    const activity = auditResult.status === "fulfilled" ? auditResult.value.slice(0, 5) : [];
    const sourceFailures = [
        !supabaseHealthy && "Supabase",
        !weatherHealthy && "Open-Meteo",
    ].filter(Boolean);

    return {
        reports: {
            pending: pending.reports.length,
            items: pending.reports,
            matchSummary: pending.summary,
        },
        activeAlerts: alerts.length,
        alerts,
        conditions,
        affectedLocations: conditions.filter((condition) =>
            ["affected", "evacuate"].includes(condition.severity),
        ).length,
        activities: activity,
        weather: weatherResult.status === "fulfilled" ? weatherResult.value : null,
        connectedSources: Number(supabaseHealthy) + Number(weatherHealthy),
        sourceFailures,
    };
}

export function subscribeToOverview(onChange) {
    const channel = supabase
        .channel("admin-overview")
        .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, onChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, onChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "flood_conditions" }, onChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "audit_events" }, onChange)
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
