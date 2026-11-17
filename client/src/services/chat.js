import { API_URL } from "../config/api";

const OFFLINE_REPLY = "I can help with floods, typhoons, earthquakes, landslides, fires, and disaster preparedness.\n\n> **For urgent danger, call 911 or your local emergency hotline first.**\n\n**Official sources:** PAGASA, PHIVOLCS, NDRRMC, and your LGU or barangay DRRM office.";

export async function askChat(message, history = []) {
    try {
        if (API_URL === "REPLACE_WITH_RENDER_URL") {
            throw new Error("Set API_URL in client/src/config/api.js to the deployed Render URL.");
        }
        const response = await fetch(`${API_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message,
                history,
            }),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            if ([502, 503, 504].includes(response.status)) {
                console.error(`Chat server is unavailable (HTTP ${response.status}). Using the offline safety guide.`);
                return { reply: OFFLINE_REPLY, provider: "local-safety-guide" };
            }
            throw new Error(data.error || "The chat service is unavailable right now.");
        }

        return data;
    } catch (error) {
        if (error instanceof TypeError) {
            return { reply: OFFLINE_REPLY, provider: "local-safety-guide" };
        }
        throw error;
    }
}