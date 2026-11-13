import { supabase } from "../lib/supabaseClient";

export const getProfileWithAddress = async (user) => {
    if (!user) return null;

    const { data, error } = await supabase
        .from("profiles")
        .select(`
            name,
            phone_number,
            phone_verified,
            province:provinces(name),
            city:cities_municipalities(name),
            barangay:barangays(name)
        `)
        .eq("id", user.id)
        .single();

    if (error) throw error;

    return {
        id: user.id,
        name: data.name || "Not provided",
        email: user.email || "Not provided",
        phone_number: data.phone_number || null,
        phone_verified: data.phone_verified ?? false,
        province: data.province?.name || "Not provided",
        city: data.city?.name || "Not provided",
        barangay: data.barangay?.name || "Not provided",
    };
};