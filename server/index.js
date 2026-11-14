import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { loadConfig } from "./config.js";
import { getChatReply } from "./chat.js";
import { listActiveFloodReports, readFloodReports, writeFloodReports } from "./floodReportsStore.js";

const config = loadConfig();
const MAX_BODY_LENGTH = 100000;
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

function sendJson(response, status, body) {
    response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": config.corsOrigin,
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    });
    response.end(JSON.stringify(body));
}

async function readBody(request) {
    let body = "";
    for await (const chunk of request) {
        body += chunk;
        if (body.length > MAX_BODY_LENGTH) throw new Error("Request body is too large.");
    }
    return JSON.parse(body || "{}");
}

function getBearerToken(request) {
    const header = request.headers.authorization || "";
    return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

async function requireAdmin(request) {
    const token = getBearerToken(request);
    if (!token) {
        const error = new Error("Authentication is required.");
        error.status = 401;
        throw error;
    }
    if (!config.supabaseUrl || !config.supabaseKey) {
        const error = new Error("Server authentication is not configured.");
        error.status = 503;
        throw error;
    }

    const userResponse = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
        headers: {
            apikey: config.supabaseKey,
            Authorization: `Bearer ${token}`,
        },
    });
    if (!userResponse.ok) {
        const error = new Error("The access token is invalid or expired.");
        error.status = 401;
        throw error;
    }
    const user = await userResponse.json();
    const profileResponse = await fetch(
        `${config.supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role&limit=1`,
        {
            headers: {
                apikey: config.supabaseKey,
                Authorization: `Bearer ${config.supabaseServiceRoleKey || token}`,
            },
        },
    );
    if (!profileResponse.ok) {
        const error = new Error("Unable to verify administrator access.");
        error.status = 403;
        throw error;
    }
    const profiles = await profileResponse.json();
    if (String(profiles[0]?.role || "").toLowerCase() !== "admin") {
        const error = new Error("Administrator access is required.");
        error.status = 403;
        throw error;
    }

    return user;
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

function validateFloodReport(body, user) {
    if (!body || typeof body !== "object") throw new Error("A flood report object is required.");
    const errors = {};
    if (!FLOOD_LEVELS.includes(body.level)) errors.level = "Level must be Evacuate, Alert, or Monitor.";

    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)
        || lat < BATANGAS_BOUNDS.minLat || lat > BATANGAS_BOUNDS.maxLat
        || lng < BATANGAS_BOUNDS.minLng || lng > BATANGAS_BOUNDS.maxLng) {
        errors.location = "The location must be inside the Batangas City area.";
    }

    const radiusMeters = Number(body.radiusMeters);
    if (!Number.isInteger(radiusMeters) || radiusMeters < 50 || radiusMeters > 5000) {
        errors.radiusMeters = "Radius must be an integer from 50 to 5,000 meters.";
    }

    let depthCm;
    if (body.depthCm !== undefined && body.depthCm !== null && body.depthCm !== "") {
        depthCm = Number(body.depthCm);
        if (!Number.isFinite(depthCm) || depthCm < 0 || depthCm > 1000) {
            errors.depthCm = "Depth must be between 0 and 1,000 cm.";
        }
    }

    const expiresAt = new Date(body.expiresAt);
    if (!body.expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
        errors.expiresAt = "Expiry must be a future date.";
    }
    if (expiresAt.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
        errors.expiresAt = "Expiry cannot be more than 24 hours from now.";
    }

    for (const field of ["locationName", "source"]) {
        try {
            validateText(body[field], field);
        } catch (error) {
            errors[field] = error.message;
        }
    }
    try {
        validateText(body.note, "note", false);
    } catch (error) {
        errors.note = error.message;
    }
    if (Object.keys(errors).length > 0) {
        const error = new Error("Flood report validation failed.");
        error.status = 400;
        error.fields = errors;
        throw error;
    }

    return {
        id: randomUUID(),
        locationName: validateText(body.locationName, "locationName"),
        lat,
        lng,
        level: body.level,
        radiusMeters,
        ...(depthCm === undefined ? {} : { depthCm }),
        note: validateText(body.note, "note", false),
        source: validateText(body.source, "source"),
        enteredBy: user.email || user.id,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        resolved: false,
    };
}

async function handleFloodReportRequest(request, response, url) {
    if (request.method === "GET" && url.pathname === "/api/flood-reports") {
        sendJson(response, 200, { reports: await listActiveFloodReports() });
        return true;
    }
    if (!url.pathname.startsWith("/api/flood-reports")) return false;

    const match = url.pathname.match(/^\/api\/flood-reports(?:\/([^/]+))?(?:\/resolve)?$/);
    const id = match?.[1];
    const isResolve = url.pathname.endsWith("/resolve");
    const user = await requireAdmin(request);

    if (request.method === "POST" && url.pathname === "/api/flood-reports") {
        const report = validateFloodReport(await readBody(request), user);
        const reports = await readFloodReports();
        reports.push(report);
        await writeFloodReports(reports);
        sendJson(response, 201, report);
        return true;
    }

    if (!id) {
        sendJson(response, 404, { error: "Flood report not found." });
        return true;
    }

    const reports = await readFloodReports();
    const reportIndex = reports.findIndex((report) => report.id === id);
    if (reportIndex === -1) {
        sendJson(response, 404, { error: "Flood report not found." });
        return true;
    }

    if (request.method === "PATCH" && isResolve) {
        reports[reportIndex] = { ...reports[reportIndex], resolved: true };
        await writeFloodReports(reports);
        sendJson(response, 200, reports[reportIndex]);
        return true;
    }

    if (request.method === "DELETE" && !isResolve) {
        const [deleted] = reports.splice(reportIndex, 1);
        await writeFloodReports(reports);
        sendJson(response, 200, deleted);
        return true;
    }

    sendJson(response, 405, { error: "Method not allowed." });
    return true;
}

const server = createServer(async (request, response) => {
    if (request.method === "OPTIONS") {
        sendJson(response, 204, {});
        return;
    }

    try {
        const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
        if (await handleFloodReportRequest(request, response, url)) return;
        if (request.method !== "POST" || url.pathname !== "/api/chat") {
            sendJson(response, 404, { error: "Not found" });
            return;
        }
        const body = await readBody(request);
        const result = await getChatReply(body.messages);
        sendJson(response, 200, result);
    } catch (error) {
        sendJson(response, error.status || 400, {
            error: error.message || "Invalid request.",
            ...(error.fields ? { fields: error.fields } : {}),
        });
    }
});

server.listen(config.port, () => {
    console.log(`AGOS chat server listening on http://localhost:${config.port}`);
});