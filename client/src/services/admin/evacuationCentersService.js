import { evacuationCenters } from "./mockData";
import { recordAudit } from "./auditService";

// TODO: replace CRUD with Supabase evacuation_centers table.

export async function listEvacuationCenters() {
  return evacuationCenters.map((item) => ({ ...item }));
}

export async function saveEvacuationCenter(values) {
  if (
    !values.name?.trim() ||
    !values.address?.trim() ||
    Number(values.capacity) <= 0
  ) {
    throw new Error("Name, address, and a positive capacity are required.");
  }

  if (values.id) {
    Object.assign(
      evacuationCenters.find((item) => item.id === values.id),
      values,
    );
  } else {
    evacuationCenters.push({
      ...values,
      id: `EVC-${String(evacuationCenters.length + 1).padStart(3, "0")}`,
      occupied: 0,
      status: "closed",
    });
  }

  await recordAudit(
    values.id ? "update_center" : "create_center",
    "evacuation_center",
    values.id,
  );

  return values;
}

export async function deleteEvacuationCenter(id) {
  const index = evacuationCenters.findIndex((item) => item.id === id);
  if (index >= 0) evacuationCenters.splice(index, 1);

  await recordAudit("delete_center", "evacuation_center", id);
}