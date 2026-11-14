import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const storePath = resolve(dirname(fileURLToPath(import.meta.url)), "data", "flood-reports.json");

async function ensureStore() {
    await mkdir(dirname(storePath), { recursive: true });
    try {
        await readFile(storePath, "utf8");
    } catch (error) {
        if (error.code !== "ENOENT") throw error;
        await writeFile(storePath, "[]\n", "utf8");
    }
}

export async function readFloodReports() {
    await ensureStore();
    const contents = await readFile(storePath, "utf8");
    const reports = JSON.parse(contents);
    if (!Array.isArray(reports)) throw new Error("Flood report store must contain an array.");
    return reports;
}

export async function writeFloodReports(reports) {
    if (!Array.isArray(reports)) throw new Error("Flood reports must be an array.");
    await ensureStore();
    await writeFile(storePath, `${JSON.stringify(reports, null, 2)}\n`, "utf8");
}

export async function listActiveFloodReports(now = Date.now()) {
    const reports = await readFloodReports();
    return reports.filter((report) => !report.resolved && new Date(report.expiresAt).getTime() > now);
}
