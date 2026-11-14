import { supabase } from "../../lib/supabaseClient";
import { recordAudit } from "./auditService";
import { isExpired } from "../../lib/adminRules";

const mediaBucket = import.meta.env.VITE_REPORT_MEDIA_BUCKET || "report-media";
const reportTypeValues = {
    "Flooded road": "flooded_road",
    "Road is passable": "road_passable",
    "Transport disruption": "transport_disruption",
    "Heavy rainfall": "heavy_rainfall",
    "Unsafe route": "unsafe_route",
    "Emergency need": "emergency_need",
};
const reportTypeLabels = Object.fromEntries(
    Object.entries(reportTypeValues).map(([label, value]) => [value, label]),
);

function mapReport(row) {
    const latestReview = [...(row.report_reviews || [])].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
    )[0];
    return {
        id: row.id,
        type: reportTypeLabels[row.report_type] || row.report_type,
        reportType: row.report_type,
        location: row.location_text,
        barangay: row.barangays?.name || row.barangay_id || row.location_text,
        provinceId: row.province_id,
        cityId: row.city_id,
        barangayId: row.barangay_id,
        description: row.description || "",
        latitude: row.latitude,
        longitude: row.longitude,
        reporter: row.reporter?.name || "Authenticated user",
        reporterId: row.reporter_id,
        risk: latestReview?.assessed_severity || "monitor",
        status: row.status,
        createdAt: row.created_at,
        observedAt: row.observed_at,
        expiresAt: row.expires_at,
        rejectionReason: row.rejection_reason || "",
        media: row.report_media || [],
        photoUrl: row.report_media?.[0]?.publicUrl || "",
    };
}

async function getAdminProfile() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("An authenticated administrator is required.");

    const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .single();
    if (error) throw error;
    if (profile.role !== "admin") throw new Error("This account does not have administrator access.");
    return user;
}

async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) throw new Error("Please sign in before submitting a report.");
    return user;
}

async function loadReportMedia(rows) {
    return Promise.all((rows || []).map(async (row) => {
        const { data } = await supabase.storage
            .from(mediaBucket)
            .createSignedUrl(row.storage_path, 60 * 60);
        return { ...row, publicUrl: data?.signedUrl || "" };
    }));
}

const reportSelection = "*, reporter:profiles!reports_reporter_id_fkey(name), barangays(name), report_media(id, storage_path, media_type, file_size, created_at), report_reviews(id, assessed_severity, created_at)";

export async function listReports(filters = {}) {
    await getAdminProfile();
    let query = supabase.from("reports").select(reportSelection).order("created_at", { ascending: false });
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.type) query = query.eq("report_type", reportTypeValues[filters.type] || filters.type);
    if (filters.barangay) query = query.eq("barangay_id", filters.barangay);
    if (filters.date) query = query.gte("created_at", `${filters.date}T00:00:00.000Z`).lt("created_at", `${filters.date}T23:59:59.999Z`);
    const { data, error } = await query;
    if (error) throw error;
    const rows = await Promise.all((data || []).map(async (row) => ({
        ...row,
        report_media: await loadReportMedia(row.report_media),
    })));
    return rows.map(mapReport).filter((report) => !filters.risk || report.risk === filters.risk);
}

export async function updateReportStatus(id, status, reason = "", severity) {
    await getAdminProfile();
    const { error } = await supabase.rpc("review_report", {
        p_report_id: id,
        p_status: status,
        p_reason: reason.trim() || null,
        p_severity: severity || null,
    });
    if (error) throw error;
    await recordAudit(`report_${status}`, "report", id, { reason, severity });
    const { data, error: loadError } = await supabase
        .from("reports")
        .select(reportSelection)
        .eq("id", id)
        .single();
    if (loadError) throw loadError;
    return mapReport({ ...data, report_media: await loadReportMedia(data.report_media) });
}

export async function submitReport(input) {
    const locationText = input.locationText?.trim() || "";
    const description = input.details?.trim() || "";
    const files = input.images || [];
    if (locationText.length < 2 || locationText.length > 240) throw new Error("Please provide a location between 2 and 240 characters.");
    if (description.length > 2000) throw new Error("Report details must be 2,000 characters or fewer.");
    if (files.length > 5) throw new Error("You can attach up to five photos.");
    if (files.some((file) => !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)) throw new Error("Each attachment must be an image no larger than 5 MB.");

    const user = await getCurrentUser();
    const reportPayload = {
        reporter_id: user.id,
        report_type: reportTypeValues[input.reportType] || input.reportType,
        location_text: locationText,
        latitude: input.latitude || null,
        longitude: input.longitude || null,
        province_id: input.provinceId || null,
        city_id: input.cityId || null,
        barangay_id: input.barangayId || null,
        description: description || null,
        status: "pending",
        observed_at: input.observedAt || new Date().toISOString(),
    };
    const { data: report, error } = await supabase.from("reports").insert(reportPayload).select("id").single();
    if (error) throw error;

    const uploadedPaths = [];
    try {
        for (const file of files) {
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
            const storagePath = `${user.id}/${report.id}/${crypto.randomUUID()}-${safeName}`;
            const { error: uploadError } = await supabase.storage.from(mediaBucket).upload(storagePath, file, {
                cacheControl: "3600",
                upsert: false,
                contentType: file.type,
            });
            if (uploadError) throw new Error("Report photo upload was rejected. Confirm the report-media bucket and policies are configured.");
            uploadedPaths.push(storagePath);
            const { error: mediaError } = await supabase.from("report_media").insert({
                report_id: report.id,
                storage_path: storagePath,
                media_type: file.type,
                file_size: file.size,
            });
            if (mediaError) throw new Error("Report photo metadata could not be saved.");
        }
    } catch (error) {
        if (uploadedPaths.length) await supabase.storage.from(mediaBucket).remove(uploadedPaths);
        await supabase.from("reports").delete().eq("id", report.id);
        throw error;
    }
    return { id: report.id, ...reportPayload };
}

export async function withdrawReport(id) {
    const user = await getCurrentUser();
    const { data, error } = await supabase
        .from("reports")
        .update({ status: "withdrawn", updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("reporter_id", user.id)
        .eq("status", "pending")
        .select("id, status")
        .single();
    if (error) throw error;
    return data;
}

export async function listMyReports() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return [];
    const { data, error } = await supabase
        .from("reports")
        .select("id, report_type, location_text, status, created_at, observed_at, expires_at")
        .eq("reporter_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
    if (error) throw error;
    return (data || []).map(mapReport);
}

export function subscribeToReports(onChange) {
    const channel = supabase
        .channel("admin-reports")
        .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, onChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "report_reviews" }, onChange)
        .subscribe();
    return () => supabase.removeChannel(channel);
}

export function aggregateReports(items = []) {
    return {
        total: items.length,
        pending: items.filter((report) => report.status === "pending" && !isExpired(report)).length,
        verified: items.filter((report) => report.status === "verified").length,
        rejected: items.filter((report) => report.status === "rejected").length,
        expired: items.filter((report) => isExpired(report)).length,
    };
}
