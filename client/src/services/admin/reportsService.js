import { supabase } from "../../lib/supabaseClient";
import { recordAudit } from "./auditService";
import { reports as mockReports } from "./mockData";
import { isExpired } from "../../lib/adminRules";

const useMockReports = import.meta.env.VITE_USE_MOCK_ADMIN !== "false";
const mediaBucket = import.meta.env.VITE_REPORT_MEDIA_BUCKET || "report-media";

function getMediaUploadError(error) {
    const message = error?.message?.toLowerCase() || "";

    if (message.includes("bucket not found") || message.includes("not found")) {
        return new Error(
            `Report photos are not configured yet. Ask an administrator to create the private "${mediaBucket}" Supabase Storage bucket, then try again.`,
        );
    }

    if (
        message.includes("row-level security") ||
        message.includes("new row violates")
    ) {
        return new Error(
            "Report photo access is not configured. Apply the report Storage policies in Supabase, then try again.",
        );
    }

    return error;
}

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

function mapMockReport(report) {
    return {
        ...report,
        reportType: reportTypeValues[report.type] || report.type,
    };
}

async function getAdminProfile() {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error("An authenticated administrator is required.");

    const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .single();

    if (error) throw error;
    if (profile.role !== "admin") {
        throw new Error("This account does not have administrator access.");
    }

    return user;
}

async function loadReportMedia(rows) {
    return Promise.all(
        (rows || []).map(async (row) => {
            const { data } = await supabase.storage
                .from(mediaBucket)
                .createSignedUrl(row.storage_path, 60 * 60);

            return {
                ...row,
                publicUrl: data?.signedUrl || "",
            };
        }),
    );
}

export async function listReports(filters = {}) {
    if (useMockReports) {
        return mockReports
            .filter((report) => {
                const matchesStatus = !filters.status || report.status === filters.status;
                const matchesType =
                    !filters.type || report.type === filters.type;
                const matchesBarangay =
                    !filters.barangay || report.barangay === filters.barangay;
                const matchesRisk = !filters.risk || report.risk === filters.risk;
                const matchesDate =
                    !filters.date || report.createdAt.slice(0, 10) === filters.date;
                const notExpiredPending = !(
                    filters.status === "pending" && isExpired(report)
                );

                return (
                    matchesStatus &&
                    matchesType &&
                    matchesBarangay &&
                    matchesRisk &&
                    matchesDate &&
                    notExpiredPending
                );
            })
            .map(mapMockReport);
    }

    await getAdminProfile();

    let query = supabase
        .from("reports")
        .select(
            "*, reporter:profiles!reports_reporter_id_fkey(name), barangays(name), report_media(id, storage_path, media_type, file_size, created_at), report_reviews(id, assessed_severity, created_at)",
        )
        .order("created_at", { ascending: false });

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.type) {
        query = query.eq(
            "report_type",
            reportTypeValues[filters.type] || filters.type,
        );
    }
    if (filters.barangay) query = query.eq("barangay_id", filters.barangay);
    if (filters.date) {
        query = query
            .gte("created_at", `${filters.date}T00:00:00.000Z`)
            .lt("created_at", `${filters.date}T23:59:59.999Z`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const reportsWithMedia = await Promise.all(
        (data || []).map(async (row) => ({
            ...row,
            report_media: await loadReportMedia(row.report_media),
        })),
    );

    return reportsWithMedia
        .map(mapReport)
        .filter((report) => !filters.risk || report.risk === filters.risk);
}

export async function updateReportStatus(id, status, reason = "", severity) {
    if (useMockReports) {
        const report = mockReports.find((item) => item.id === id);
        if (!report) throw new Error("Report not found");

        report.status = status;
        report.reviewReason = reason;
        if (severity) report.risk = severity;
        await recordAudit(`report_${status}`, "report", id, {
            reason,
            severity,
        });
        return mapMockReport({ ...report });
    }

    await getAdminProfile();
    const { error: reviewError } = await supabase.rpc("review_report", {
        p_report_id: id,
        p_status: status,
        p_reason: reason.trim() || null,
        p_severity: severity || null,
    });

    if (reviewError) throw reviewError;

    const { data: updated, error: loadError } = await supabase
        .from("reports")
        .select(
            "*, reporter:profiles!reports_reporter_id_fkey(name), barangays(name), report_media(id, storage_path, media_type, file_size, created_at), report_reviews(id, assessed_severity, created_at)",
        )
        .eq("id", id)
        .single();

    if (loadError) throw loadError;

    await recordAudit(`report_${status}`, "report", id, {
        reason,
        severity,
    });

    return mapReport({
        ...updated,
        report_media: await loadReportMedia(updated.report_media),
    });
}

export async function submitReport(input) {
    const locationText = input.locationText?.trim() || "";
    const description = input.details?.trim() || "";
    const files = input.images || [];

    if (locationText.length < 2 || locationText.length > 240) {
        throw new Error("Please provide a location between 2 and 240 characters.");
    }
    if (description.length > 2000) {
        throw new Error("Report details must be 2,000 characters or fewer.");
    }
    if (files.length > 5) {
        throw new Error("You can attach up to five photos.");
    }
    if (files.some((file) => !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)) {
        throw new Error("Each attachment must be an image no larger than 5 MB.");
    }

    if (useMockReports) {
        const report = {
            id: `RPT-${String(mockReports.length + 25).padStart(3, "0")}`,
            type: input.reportType,
            reportType: reportTypeValues[input.reportType] || input.reportType,
            location: input.locationText,
            barangay: input.barangay || input.locationText,
            description,
            latitude: input.latitude || null,
            longitude: input.longitude || null,
            reporter: "Authenticated user",
            risk: "monitor",
            status: "pending",
            createdAt: new Date().toISOString(),
            observedAt: input.observedAt || new Date().toISOString(),
            photoUrl: input.photoUrl || "",
        };

        mockReports.unshift(report);
        return { ...report };
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error("Please sign in before submitting a report.");

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

    const { data: report, error } = await supabase
        .from("reports")
        .insert(reportPayload)
        .select("id")
        .single();

    if (error) throw error;

    const uploadedPaths = [];

    try {
    for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `${user.id}/${report.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
            .from(mediaBucket)
            .upload(storagePath, file, {
                cacheControl: "3600",
                upsert: false,
                contentType: file.type,
            });

        if (uploadError) {
            const uploadFailure = getMediaUploadError(uploadError);
            if (uploadFailure === uploadError) {
                throw new Error(
                    "Report photo upload was rejected. Confirm that the private report-media bucket and its Storage INSERT policy are configured.",
                );
            }
            throw uploadFailure;
        }
        uploadedPaths.push(storagePath);

        const { error: mediaError } = await supabase.from("report_media").insert({
            report_id: report.id,
            storage_path: storagePath,
            media_type: file.type,
            file_size: file.size,
        });

        if (mediaError) {
            const mediaFailure = getMediaUploadError(mediaError);
            if (mediaFailure === mediaError) {
                throw new Error(
                    "Report photo metadata could not be saved. Confirm that the report_media INSERT policy is configured.",
                );
            }
            throw mediaFailure;
        }
    }
    } catch (uploadError) {
        if (uploadedPaths.length) {
            await supabase.storage.from(mediaBucket).remove(uploadedPaths);
        }
        await supabase.from("reports").delete().eq("id", report.id);
        throw uploadError;
    }

    return { id: report.id, ...reportPayload };
}

export async function withdrawReport(id) {
    if (useMockReports) {
        const report = mockReports.find((item) => item.id === id);
        if (!report) throw new Error("Report not found.");
        if (report.status !== "pending") {
            throw new Error("Only pending reports can be withdrawn.");
        }
        report.status = "withdrawn";
        return mapMockReport({ ...report });
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error("Please sign in before withdrawing a report.");

    const { data, error } = await supabase
        .from("reports")
        .update({
            status: "withdrawn",
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("reporter_id", user.id)
        .eq("status", "pending")
        .select("id, status")
        .single();

    if (error) throw error;
    return data;
}

export async function listMyReports() {
    if (useMockReports) {
        return mockReports.slice(0, 5).map(mapMockReport);
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) return [];

    const { data, error } = await supabase
        .from("reports")
        .select("id, report_type, location_text, status, created_at, observed_at")
        .eq("reporter_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

    if (error) throw error;
    return (data || []).map(mapReport);
}

export function subscribeToReports(onChange) {
    if (useMockReports) return () => {};

    const channel = supabase
        .channel("admin-reports")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "reports" },
            onChange,
        )
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "report_reviews" },
            onChange,
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

export function aggregateReports(items = mockReports) {
    return {
        total: items.length,
        pending: items.filter((report) => report.status === "pending" && !isExpired(report)).length,
        verified: items.filter((report) => report.status === "verified").length,
        rejected: items.filter((report) => report.status === "rejected").length,
        expired: items.filter((report) => isExpired(report)).length,
    };
}
