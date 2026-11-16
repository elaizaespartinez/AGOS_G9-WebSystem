export const REPORT_STATUSES = ["pending", "verified", "rejected"];
export const RISK_LEVELS = ["safe", "monitor", "affected", "evacuate"];
export const SEVERITIES = RISK_LEVELS;
export const OVERRIDE_EXPIRY_OPTIONS = [1, 3, 6, 12, 24];
export const STALE_AFTER_HOURS = 3;
export const REPORT_EXPIRY_HOURS = 6;
export const LIKELY_AFFECTED_MIN_REPORTS = 3;

export function getRole(user) {
  return user?.profile?.role || null;
}

export function isAdmin(user) {
  return ["admin", "administrator", "super_admin"].includes(
    String(getRole(user) || "").toLowerCase()
  );
}
export function validateRequired(values, fields) {
  const errors = {};
  fields.forEach((field) => {
    if (!String(values?.[field] ?? "").trim()) errors[field] = "This field is required.";
  });
  return errors;
}

export function isStale(value, now = Date.now()) {
  const timestamp = typeof value === "object" ? (value?.updatedAt || value?.createdAt || value?.timestamp) : value;
  return Boolean(timestamp) && now - new Date(timestamp).getTime() >= STALE_AFTER_HOURS * 60 * 60 * 1000;
}

export function isExpired(report, now = Date.now()) {
  if (!report) return false;
  const expiry = typeof report === "object"
    ? report.expiresAt || (report.createdAt && new Date(report.createdAt).getTime() + REPORT_EXPIRY_HOURS * 60 * 60 * 1000)
    : report;
  return Boolean(expiry) && new Date(expiry).getTime() <= now;
}

function reportType(report) {
  return report?.reportType || report?.type || report?.category || report?.severity;
}

function coordinatesFor(report) {
  const latitude = Number(report?.latitude);
  const longitude = Number(report?.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    ? { latitude, longitude }
    : null;
}

function distanceInMeters(first, second) {
  const earthRadius = 6371000;
  const latitudeDelta = (second.latitude - first.latitude) * Math.PI / 180;
  const longitudeDelta = (second.longitude - first.longitude) * Math.PI / 180;
  const latitudeOne = first.latitude * Math.PI / 180;
  const latitudeTwo = second.latitude * Math.PI / 180;
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.sin(longitudeDelta / 2) ** 2 * Math.cos(latitudeOne) * Math.cos(latitudeTwo);
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function reportsMatch(first, second) {
  if (!first || !second || reportType(first) !== reportType(second)) return false;
  if (first.barangayId && second.barangayId) {
    if (first.barangayId === second.barangayId) return true;
  }
  const firstCoordinates = coordinatesFor(first);
  const secondCoordinates = coordinatesFor(second);
  return Boolean(
    firstCoordinates
    && secondCoordinates
    && distanceInMeters(firstCoordinates, secondCoordinates) <= 300,
  );
}

export function getReportMatchSummary(items = []) {
  const reports = (Array.isArray(items) ? items : []).filter(
    (report) => report.status !== "rejected" && !isExpired(report),
  );
  const reporters = new Set(reports.map((report) => report.reporterId || report.reporter).filter(Boolean));
  return { distinctReporters: reporters.size, conflicts: 0 };
}

export function formatRelativeTime(value, now = Date.now()) {
  if (!value) return "Unknown time";
  const minutes = Math.max(0, Math.floor((now - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} day ago`;
}
