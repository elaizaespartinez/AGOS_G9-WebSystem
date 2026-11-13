import { supabase } from "../../lib/supabaseClient";
import { recordAudit } from "./auditService";
import {
    alerts as mockAlerts,
    communicationsAnnouncements as mockAnnouncements,
    locations as mockLocations,
} from "./mockData";

const useMockAdmin = import.meta.env.VITE_USE_MOCK_ADMIN !== "false";
const adminName = "Admin User";

export const ALERT_SEVERITIES = ["safe", "monitor", "affected", "evacuate"];
export const ANNOUNCEMENT_CATEGORIES = [
    "Weather Update",
    "River Monitoring",
    "Coastal Monitoring",
    "Advisory",
    "General Announcement",
];
export const ANNOUNCEMENT_SEVERITIES = ["low", "moderate", "high"];

const mapAlert = (row, targets = []) => ({
    id: row.id,
    title: row.title,
    severity: row.severity,
    description: row.description,
    affectedBarangays: targets,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    source: row.source,
    issuingAdministrator: row.creator?.name || row.created_by || adminName,
    status: row.status,
});

const mapAnnouncement = (row, targets = []) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    content: row.content,
    severity: row.severity || "low",
    affectedAreas: targets,
    attachmentUrl: row.attachment_url || "",
    source: row.source,
    publishedAt: row.published_at,
    issuingAdministrator: row.creator?.name || row.created_by || adminName,
    status: row.status,
});

async function getCurrentUser() {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error) throw error;
    if (!user) throw new Error("An authenticated administrator is required.");
    return user;
}

async function getAdminProfile() {
    const user = await getCurrentUser();
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, name, role")
        .eq("id", user.id)
        .single();

    if (error) throw error;
    if (profile.role !== "admin") {
        throw new Error("This account does not have administrator access.");
    }

    return {
        user,
        profile,
        name:
            profile.name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email ||
            adminName,
    };
}

async function loadTargets(table, foreignKey, ids) {
    if (!ids.length) return {};

    const { data, error } = await supabase
        .from(table)
        .select(
            `${foreignKey}, province_id, city_id, barangay_id, barangays(name), cities_municipalities(name), provinces(name)`,
        )
        .in(foreignKey, ids);

    if (error) throw error;

    return data.reduce((result, target) => {
        const name =
            target.barangays?.name ||
            target.cities_municipalities?.name ||
            target.provinces?.name;
        if (!result[target[foreignKey]]) result[target[foreignKey]] = [];
        if (name) result[target[foreignKey]].push(name);
        return result;
    }, {});
}

async function persistTargets(table, foreignKey, communicationId, names) {
    const selected = [...new Set((names || []).map((name) => name.trim()).filter(Boolean))];
    const { data: provinces, error: provincesError } = await supabase
        .from("provinces")
        .select("psgc_code, name")
        .in("name", selected);
    if (provincesError) throw provincesError;

    const { data: cities, error: citiesError } = await supabase
        .from("cities_municipalities")
        .select("psgc_code, name, province_code")
        .in("name", selected);
    if (citiesError) throw citiesError;

    const { data: barangays, error: barangaysError } = await supabase
        .from("barangays")
        .select("psgc_code, name, city_municipality_code")
        .in("name", selected);
    if (barangaysError) throw barangaysError;

    const rows = [
        ...(provinces || []).map(({ psgc_code }) => ({
            [foreignKey]: communicationId,
            province_id: psgc_code,
        })),
        ...(cities || []).map(({ psgc_code }) => ({
            [foreignKey]: communicationId,
            city_id: psgc_code,
        })),
        ...(barangays || []).map(({ psgc_code }) => ({
            [foreignKey]: communicationId,
            barangay_id: psgc_code,
        })),
    ];

    const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq(foreignKey, communicationId);
    if (deleteError) throw deleteError;

    if (rows.length) {
        const { error: insertError } = await supabase.from(table).insert(rows);
        if (insertError) throw insertError;
    }
}

export async function listCommunicationLocations() {
    if (useMockAdmin) return mockLocations.map(({ id, name }) => ({ id, name }));

    const [citiesResult, barangaysResult] = await Promise.all([
        supabase.from("cities_municipalities").select("psgc_code, name").order("name"),
        supabase.from("barangays").select("psgc_code, name").order("name"),
    ]);

    if (citiesResult.error) throw citiesResult.error;
    if (barangaysResult.error) throw barangaysResult.error;

    return [
        ...(citiesResult.data || []).map(({ psgc_code, name }) => ({
            id: psgc_code,
            name,
        })),
        ...(barangaysResult.data || []).map(({ psgc_code, name }) => ({
            id: psgc_code,
            name: `Brgy. ${name}`,
            value: name,
        })),
    ];
}

export async function listAlerts() {
    if (useMockAdmin) return mockAlerts.map((alert) => ({ ...alert }));

    const { data, error } = await supabase
        .from("alerts")
        .select("*, creator:profiles!alerts_created_by_fkey(name)")
        .order("created_at", { ascending: false });
    if (error) throw error;

    const targets = await loadTargets(
        "alert_targets",
        "alert_id",
        data.map(({ id }) => id),
    );
    return data.map((row) => mapAlert(row, targets[row.id] || []));
}

export async function saveAlert(input, id = null) {
    if (useMockAdmin) {
        const alert = {
            id: id || `ALT-${String(mockAlerts.length + 1).padStart(3, "0")}`,
            title: input.title.trim(),
            severity: input.severity,
            description: input.description.trim(),
            affectedBarangays: input.affectedBarangays,
            startsAt: input.startsAt,
            expiresAt: input.expiresAt,
            source: input.source.trim(),
            issuingAdministrator: adminName,
            status: input.status || "draft",
        };
        const index = mockAlerts.findIndex((item) => item.id === id);
        if (index >= 0) mockAlerts[index] = alert;
        else mockAlerts.unshift(alert);
        await recordAudit(id ? "alert_edit" : "alert_create", "alert", alert.id, {});
        return { ...alert };
    }

    const { user, name } = await getAdminProfile();
    const values = {
        title: input.title.trim(),
        severity: input.severity,
        description: input.description.trim(),
        starts_at: new Date(input.startsAt).toISOString(),
        expires_at: new Date(input.expiresAt).toISOString(),
        source: input.source.trim(),
        created_by: user.id,
        status: input.status || "draft",
        updated_at: new Date().toISOString(),
    };
    const query = id
        ? supabase.from("alerts").update(values).eq("id", id).select("*").single()
        : supabase.from("alerts").insert(values).select("*").single();
    const { data, error } = await query;
    if (error) throw error;

    await persistTargets("alert_targets", "alert_id", data.id, input.affectedBarangays);
    await recordAudit(id ? "alert_edit" : "alert_create", "alert", data.id, {
        affectedBarangays: input.affectedBarangays,
        administrator: name,
    });
    return mapAlert(data, input.affectedBarangays);
}

export async function updateAlertStatus(id, status) {
    if (useMockAdmin) {
        const alert = mockAlerts.find((item) => item.id === id);
        if (!alert) throw new Error("Alert not found.");
        alert.status = status;
        await recordAudit(`alert_${status}`, "alert", id, {});
        return { ...alert };
    }

    await getAdminProfile();
    const { data, error: updateError } = await supabase
        .from("alerts")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single();
    if (updateError) throw updateError;
    await recordAudit(`alert_${status}`, "alert", id, {});
    return mapAlert(data);
}

export async function listCommunicationsAnnouncements() {
    if (useMockAdmin) return mockAnnouncements.map((announcement) => ({ ...announcement }));

    const { data, error } = await supabase
        .from("announcements")
        .select("*, creator:profiles!announcements_created_by_fkey(name)")
        .order("created_at", { ascending: false });
    if (error) throw error;

    const targets = await loadTargets(
        "announcement_targets",
        "announcement_id",
        data.map(({ id }) => id),
    );
    return data.map((row) => mapAnnouncement(row, targets[row.id] || []));
}

export async function saveCommunicationAnnouncement(input, id = null) {
    if (useMockAdmin) {
        const announcement = {
            id: id || `ANN-${String(mockAnnouncements.length + 1).padStart(3, "0")}`,
            title: input.title.trim(),
            category: input.category,
            severity: input.severity || "low",
            content: input.content.trim(),
            affectedAreas: input.affectedAreas,
            attachmentUrl: input.attachmentUrl?.trim() || "",
            source: input.source.trim(),
            publishedAt: input.publishedAt || null,
            status: input.status || "draft",
            issuingAdministrator: adminName,
        };
        const index = mockAnnouncements.findIndex((item) => item.id === id);
        if (index >= 0) mockAnnouncements[index] = announcement;
        else mockAnnouncements.unshift(announcement);
        await recordAudit(id ? "announcement_edit" : "announcement_create", "announcement", announcement.id, {});
        return { ...announcement };
    }

    const { user, name } = await getAdminProfile();
    const values = {
        title: input.title.trim(),
        category: input.category,
        severity: input.severity || "low",
        content: input.content.trim(),
        attachment_url: input.attachmentUrl?.trim() || null,
        source: input.source.trim(),
        published_at: input.publishedAt ? new Date(input.publishedAt).toISOString() : null,
        status: input.status || "draft",
        created_by: user.id,
        updated_at: new Date().toISOString(),
    };
    const query = id
        ? supabase.from("announcements").update(values).eq("id", id).select("*").single()
        : supabase.from("announcements").insert(values).select("*").single();
    const { data, error } = await query;
    if (error) throw error;

    await persistTargets("announcement_targets", "announcement_id", data.id, input.affectedAreas);
    await recordAudit(id ? "announcement_edit" : "announcement_create", "announcement", data.id, {
        affectedAreas: input.affectedAreas,
        administrator: name,
    });
    return mapAnnouncement(data, input.affectedAreas);
}

export async function updateCommunicationAnnouncementStatus(id, status) {
    if (useMockAdmin) {
        const announcement = mockAnnouncements.find((item) => item.id === id);
        if (!announcement) throw new Error("Announcement not found.");
        announcement.status = status;
        if (status === "published" && !announcement.publishedAt) {
            announcement.publishedAt = new Date().toISOString();
        }
        await recordAudit(`announcement_${status}`, "announcement", id, {});
        return { ...announcement };
    }

    await getAdminProfile();
    const { data: current, error: currentError } = await supabase
        .from("announcements")
        .select("published_at")
        .eq("id", id)
        .single();
    if (currentError) throw currentError;

    const values = {
        status,
        updated_at: new Date().toISOString(),
        ...(status === "published" && !current.published_at
            ? { published_at: new Date().toISOString() }
            : {}),
    };
    const { data, error } = await supabase
        .from("announcements")
        .update(values)
        .eq("id", id)
        .select("*")
        .single();
    if (error) throw error;
    await recordAudit(`announcement_${status}`, "announcement", id, {});
    return mapAnnouncement(data);
}

export function subscribeToCommunications(onChange) {
    if (useMockAdmin) return () => {};

    const channel = supabase
        .channel("admin-communications")
        .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, onChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, onChange)
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
