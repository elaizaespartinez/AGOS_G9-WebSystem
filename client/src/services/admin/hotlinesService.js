import { hotlines } from "./mockData";
import { recordAudit } from "./auditService";

// TODO: replace CRUD with Supabase hotlines table.

export async function listHotlines() {
  return hotlines.map((item) => ({ ...item }));
}

export async function saveHotline(values) {
  if (!values.name?.trim() || !values.number?.trim()) {
    throw new Error("Name and number are required.");
  }

  if (values.id) {
    Object.assign(
      hotlines.find((item) => item.id === values.id),
      values,
    );
  } else {
    hotlines.push({
      ...values,
      id: `HOT-${String(hotlines.length + 1).padStart(3, "0")}`,
      active: true,
    });
  }

  await recordAudit(
    values.id ? "update_hotline" : "create_hotline",
    "hotline",
    values.id,
  );

  return values;
}

export async function deleteHotline(id) {
  const index = hotlines.findIndex((item) => item.id === id);
  if (index >= 0) hotlines.splice(index, 1);

  await recordAudit("delete_hotline", "hotline", id);
}