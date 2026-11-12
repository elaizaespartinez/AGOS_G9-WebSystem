import { locations } from "./mockData";
import { recordAudit } from "./auditService";
import { RISK_LEVELS } from "../../lib/adminRules";

// TODO: persist risk overrides in Supabase location_overrides.

export async function listLocations() {
  return locations.map((item) => ({ ...item }));
}

export async function setLocationOverride(
  id,
  risk,
  reason,
  expiresAt,
  metadata = {},
) {
  if (!RISK_LEVELS.includes(risk)) throw new Error("Invalid risk level.");
  if (!reason?.trim()) throw new Error("A reason is required.");
  if (!expiresAt) throw new Error("An expiry is required.");

  const location = locations.find((item) => item.id === id);
  if (!location) throw new Error("Location not found");

  location.override = { risk, reason, expiresAt, ...metadata };

  await recordAudit("location_override", "location", id, location.override);

  return { ...location };
}

export async function evacuateLocation(id) {
  await recordAudit("evacuate_location", "location", id);
  return true;
}