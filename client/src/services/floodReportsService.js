async function request(path, options = {}, session) {
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);

    let response;
    try {
        response = await fetch(path, { ...options, headers });
    } catch (error) {
        console.error(`Flood report request could not reach ${path}.`, error);
        throw new Error("Unable to reach the flood-report server. Make sure the server is running on port 3001.");
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(body.error || `Flood report request failed with HTTP ${response.status}.`);
        error.status = response.status;
        error.fields = body.fields || {};
        throw error;
    }
    return body;
}

export async function listFloodReports() {
    const body = await request("/api/flood-reports");
    return Array.isArray(body.reports) ? body.reports : [];
}

export function createFloodReport(report, session) {
    const note = typeof report.note === "string" ? report.note.trim() : "";
    const payload = {
        locationName: report.locationName.trim(),
        level: report.level,
        lat: report.lat,
        lng: report.lng,
        radiusMeters: Number(report.radiusMeters),
        source: report.source.trim(),
        expiresAt: report.expiresAt,
    };
    if (report.depthCm !== "" && report.depthCm !== null && report.depthCm !== undefined) {
        payload.depthCm = Number(report.depthCm);
    }
    if (note) payload.note = note;

    return request("/api/flood-reports", {
        method: "POST",
        body: JSON.stringify(payload),
    }, session);
}

export function resolveFloodReport(id, session) {
    return request(`/api/flood-reports/${encodeURIComponent(id)}/resolve`, {
        method: "PATCH",
    }, session);
}

export function deleteFloodReport(id, session) {
    return request(`/api/flood-reports/${encodeURIComponent(id)}`, {
        method: "DELETE",
    }, session);
}
