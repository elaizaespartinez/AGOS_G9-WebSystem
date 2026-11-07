
import { supabase } from "../lib/supabaseClient";

// Fetch all provinces
export const getProvinces = async () => {
    const { data, error } = await supabase
        .from("provinces")
        .select("psgc_code, name")
        .order("name");

    if (error) throw error;

    return data;
};

export const getCitiesByProvince = async (provinceCode) => {
    if (!provinceCode) return [];

    const { data, error } = await supabase
        .from("cities_municipalities")
        .select("psgc_code, name, type")
        .eq("province_code", provinceCode)
        .order("name");

    if (error) throw error;

    return data ?? [];
};

// Fetch barangays under a city or municipality
export const getBarangaysByCity = async (cityCode) => {
    const { data, error } = await supabase
        .from("barangays")
        .select("psgc_code, name")
        .eq("city_municipality_code", cityCode)
        .order("name");

    if (error) throw error;

    return data;
};


