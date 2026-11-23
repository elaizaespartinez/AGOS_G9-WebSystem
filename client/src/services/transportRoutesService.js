import { supabase } from "../lib/supabaseClient";
import { recordAudit } from "./admin/auditService";

const routeStatusRank = {
    safe: 0,
    monitor: 1,
    affected: 2,
    evacuate: 3,
};

const reportStatus = {
    Monitor: "monitor",
    Alert: "affected",
    Evacuate: "evacuate",
};

function mapRoute(row) {
    return {
        id: row.id,
        code: row.code,
        name: row.name,
        routeType: row.route_type,
        status: row.status,
        reason: row.reason || "Operating normally",
        waypoints: Array.isArray(row.waypoints) ? row.waypoints : [],
        geometry: Array.isArray(row.geometry) ? row.geometry : [],
        active: row.active,
        updatedBy: row.updated_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function distanceBetweenMeters(first, second) {
    const earthRadius = 6371000;
    const toRadians = (degrees) => degrees * Math.PI / 180;
    const latitudeDelta = toRadians(second[0] - first[0]);
    const longitudeDelta = toRadians(second[1] - first[1]);
    const latitude = toRadians((first[0] + second[0]) / 2);
    return Math.sqrt(latitudeDelta ** 2 + (Math.cos(latitude) * longitudeDelta) ** 2) * earthRadius;
}

function pointToSegmentDistance(point, first, second) {
    const denominator = (second[0] - first[0]) ** 2 + (second[1] - first[1]) ** 2;
    if (!denominator) return distanceBetweenMeters(point, first);
    const ratio = Math.max(0, Math.min(1, (
        (point[0] - first[0]) * (second[0] - first[0])
        + (point[1] - first[1]) * (second[1] - first[1])
    ) / denominator));
    return distanceBetweenMeters(point, [
        first[0] + ratio * (second[0] - first[0]),
        first[1] + ratio * (second[1] - first[1]),
    ]);
}

export function routeIntersectsFloodReport(route, report) {
    const path = Array.isArray(route?.geometry) && route.geometry.length
        ? route.geometry
        : route?.waypoints;
    const point = [Number(report?.lat), Number(report?.lng)];
    const radius = Number(report?.radiusMeters);
    if (!Array.isArray(path) || path.length < 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1]) || !Number.isFinite(radius)) {
        return false;
    }
    return path.some((coordinate, index) => {
        const current = [Number(coordinate[0]), Number(coordinate[1])];
        if (!current.every(Number.isFinite)) return false;
        if (distanceBetweenMeters(current, point) <= radius) return true;
        const next = path[index + 1];
        if (!next) return false;
        const following = [Number(next[0]), Number(next[1])];
        return following.every(Number.isFinite)
            && pointToSegmentDistance(point, current, following) <= radius;
    });
}

export function getEffectiveRoute(route, floodReports = []) {
    const intersectingReports = floodReports
        .filter((report) => routeIntersectsFloodReport(route, report))
        .sort((first, second) => (
            (routeStatusRank[reportStatus[second.level]] || 0)
            - (routeStatusRank[reportStatus[first.level]] || 0)
            || new Date(second.createdAt) - new Date(first.createdAt)
        ));
    const worstReport = intersectingReports[0];
    const impliedStatus = worstReport ? reportStatus[worstReport.level] : "safe";
    const effectiveStatus = routeStatusRank[impliedStatus] > routeStatusRank[route.status]
        ? impliedStatus
        : route.status;
    return {
        ...route,
        effectiveStatus,
        effectiveReason: effectiveStatus !== route.status && worstReport
            ? worstReport.locationName
            : route.reason || "Operating normally",
        overlap: Boolean(worstReport),
        worstReport: worstReport || null,
    };
}

async function calculateGeometry(waypoints) {
    if (waypoints.length < 2) return waypoints;
    const coordinates = waypoints.map(([latitude, longitude]) => `${longitude},${latitude}`).join(";");
    try {
        const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`,
        );
        const data = await response.json();
        if (!response.ok || data.code !== "Ok" || !data.routes?.[0]?.geometry?.coordinates?.length) {
            return waypoints;
        }
        return data.routes[0].geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]);
    } catch (error) {
        console.error("Unable to calculate route geometry; saving waypoints instead.", error);
        return waypoints;
    }
}

async function getAdminUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) throw new Error("An authenticated administrator is required.");
    return user;
}

export async function listRoutes() {
    const { data, error } = await supabase
        .from("transport_routes")
        .select("*")
        .eq("active", true)
        .order("code", { ascending: true });
    if (error) throw error;
    return (data || []).map(mapRoute);
}

export async function saveRoute(input) {
    const user = await getAdminUser();
    const waypoints = (input.waypoints || []).map(([latitude, longitude]) => [
        Number(latitude),
        Number(longitude),
    ]);
    if (waypoints.length < 2) throw new Error("Add at least two waypoints to map this route.");
    if (!input.code?.trim() || !input.name?.trim()) throw new Error("Route code and name are required.");
    const geometry = await calculateGeometry(waypoints);
    const payload = {
        code: input.code.trim(),
        name: input.name.trim(),
        route_type: input.routeType,
        waypoints,
        geometry,
        active: true,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
    };
    if (!input.id) {
        payload.status = input.status || "safe";
        payload.reason = input.reason || "Operating normally";
    }
    const query = input.id
        ? supabase.from("transport_routes").update(payload).eq("id", input.id)
        : supabase.from("transport_routes").insert(payload);
    const { data, error } = await query.select("*").single();
    if (error) throw error;
    const route = mapRoute(data);
    await recordAudit(input.id ? "route_updated" : "route_created", "transport_route", route.id, {
        code: route.code,
    });
    return route;
}

export async function setRouteStatus(id, status, reason = "") {
    const user = await getAdminUser();
    const payload = {
        status,
        reason: status === "safe" ? "Operating normally" : reason.trim(),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
    };
    if (status !== "safe" && !payload.reason) throw new Error("A reason is required for this route status.");
    const { data, error } = await supabase
        .from("transport_routes")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
    if (error) throw error;
    const route = mapRoute(data);
    await recordAudit("route_status_updated", "transport_route", id, { status, reason: payload.reason });
    return route;
}

export async function deleteRoute(id) {
    const user = await getAdminUser();
    const { data, error } = await supabase
        .from("transport_routes")
        .update({
            active: false,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();
    if (error) throw error;
    await recordAudit("route_deleted", "transport_route", id, { code: data.code });
}

export function subscribeToRoutes(onChange) {
    const channel = supabase
        .channel("transport-routes")
        .on("postgres_changes", { event: "*", schema: "public", table: "transport_routes" }, onChange)
        .subscribe();
    const timer = window.setInterval(onChange, 60 * 1000);
    return () => {
        window.clearInterval(timer);
        supabase.removeChannel(channel);
    };
}
