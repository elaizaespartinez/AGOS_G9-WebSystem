import { supabase } from "../lib/supabaseClient";

const FLOOD_LEVELS = ["Evacuate", "Alert", "Monitor"];
const BATANGAS_BOUNDS = {
    minLat: 13.60,
    maxLat: 13.90,
    minLng: 120.90,
    maxLng: 121.20,
};
const MAX_TEXT_LENGTHS = {
    locationName: 160,
    note: 1000,
    source: 160,
};

function mapFloodReport(row) {
    return {
        id: row.id,
        locationName: row.location_name,
        level: row.level,
        lat: row.latitude,
        lng: row.longitude,
        radiusMeters: row.radius_meters,
        depthCm: row.depth_cm ?? undefined,
        note: row.note,
        source: row.source,
        enteredBy: row.entered_by,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        resolved: row.resolved,
    };
}

function validationError(fields) {
    const error = new Error("Flood report validation failed.");
    error.fields = fields;
    return error;
}

function validateText(value, field, required = true) {
    if (typeof value !== "string") {
        if (!required && (value === undefined || value === null || value === "")) return "";
        throw new Error(`${field} is required.`);
    }
    const normalized = value.trim();
    if (required && !normalized) throw new Error(`${field} is required.`);
    if (normalized.length > MAX_TEXT_LENGTHS[field]) {
        throw new Error(`${field} must be ${MAX_TEXT_LENGTHS[field]} characters or fewer.`);
    }
    return normalized;
}

function validateFloodReport(report) {
    const fields = {};
    if (!FLOOD_LEVELS.includes(report?.level)) {
        fields.level = "Level must be Evacuate, Alert, or Monitor.";
    }

    const lat = Number(report?.lat);
    const lng = Number(report?.lng);
    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < BATANGAS_BOUNDS.minLat ||
        lat > BATANGAS_BOUNDS.maxLat ||
        lng < BATANGAS_BOUNDS.minLng ||
        lng > BATANGAS_BOUNDS.maxLng
    ) {
        fields.location = "The location must be inside the Batangas City area.";
    }

    const radiusMeters = Number(report?.radiusMeters);
    if (!Number.isInteger(radiusMeters) || radiusMeters < 50 || radiusMeters > 5000) {
        fields.radiusMeters = "Radius must be an integer from 50 to 5,000 meters.";
    }

    let depthCm;
    if (report?.depthCm !== undefined && report.depthCm !== null && report.depthCm !== "") {
        depthCm = Number(report.depthCm);
        if (!Number.isFinite(depthCm) || depthCm < 0 || depthCm > 1000) {
            fields.depthCm = "Depth must be between 0 and 1,000 cm.";
        }
    }

    const expiresAt = new Date(report?.expiresAt);
    if (!report?.expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
        fields.expiresAt = "Expiry must be a future date.";
    } else if (expiresAt.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
        fields.expiresAt = "Expiry cannot be more than 24 hours from now.";
    }

    for (const field of ["locationName", "source"]) {
        try {
            validateText(report?.[field], field);
        } catch (error) {
            fields[field] = error.message;
        }
    }
    try {
        validateText(report?.note, "note", false);
    } catch (error) {
        fields.note = error.message;
    }

    if (Object.keys(fields).length) throw validationError(fields);

    return {
        location_name: validateText(report.locationName, "locationName"),
        level: report.level,
        latitude: lat,
        longitude: lng,
        radius_meters: radiusMeters,
        depth_cm: depthCm,
        note: validateText(report.note, "note", false) || null,
        source: validateText(report.source, "source"),
        expires_at: expiresAt.toISOString(),
    };
}

async function getAuthenticatedUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) throw new Error("Administrator authentication is required.");
    return user;
}

export async function listFloodReports() {
    const { data, error } = await supabase
        .from("flood_reports")
        .select("*")
        .eq("resolved", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(mapFloodReport);
}

export async function createFloodReport(report, _session) {
    const user = await getAuthenticatedUser();
    const payload = validateFloodReport(report);
    const { data, error } = await supabase
        .from("flood_reports")
        .insert({
            ...payload,
            entered_by: user.id,
            resolved: false,
        })
        .select("*")
        .single();
    if (error) throw error;
    return mapFloodReport(data);
}

export async function resolveFloodReport(id, _session) {
    await getAuthenticatedUser();
    const { data, error } = await supabase
        .from("flood_reports")
        .update({ resolved: true })
        .eq("id", id)
        .select("*")
        .single();
    if (error) throw error;
    return mapFloodReport(data);
}

export async function deleteFloodReport(id, _session) {
    await getAuthenticatedUser();
    const { error } = await supabase
        .from("flood_reports")
        .delete()
        .eq("id", id);
    if (error) throw error;
}

export function subscribeToFloodReports(onChange) {
    const channel = supabase
        .channel("flood-reports")
        .on("postgres_changes", { event: "*", schema: "public", table: "flood_reports" }, onChange)
        .subscribe();
    const timer = window.setInterval(onChange, 60 * 1000);

    return () => {
        window.clearInterval(timer);
        supabase.removeChannel(channel);
    };
}
