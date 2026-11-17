import { supabase } from "../../lib/supabaseClient";
import { auditLog } from "./mockData";

const useMockAdmin = import.meta.env.VITE_USE_MOCK_ADMIN !== "false";

export async function recordAudit(action, entity, entityId, details = {}) {
    if (useMockAdmin) {
        const entry = {
            id: `AUD-${Date.now()}`,
            action,
            entity,
            entityId,
            details,
            createdAt: new Date().toISOString(),
        };
        auditLog.unshift(entry);
        return entry;
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error("An authenticated administrator is required.");

    const entry = {
        action,
        entity,
        entity_id: entityId,
        actor_id: user.id,
        details,
        created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from("audit_events")
        .insert(entry)
        .select("id, action, entity, entity_id, actor_id, details, created_at")
        .single();

    if (error) throw error;

    return {
        id: data.id,
        action: data.action,
        entity: data.entity,
        entityId: data.entity_id,
        adminId: data.actor_id,
        details: data.details,
        createdAt: data.created_at,
    };
}

export async function listAudit() {
    if (useMockAdmin) return [...auditLog];

    const { data, error } = await supabase
        .from("audit_events")
        .select("id, action, entity, entity_id, actor_id, details, created_at")
        .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((entry) => ({
        id: entry.id,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entity_id,
        adminId: entry.actor_id,
        details: entry.details,
        createdAt: entry.created_at,
    }));
}
