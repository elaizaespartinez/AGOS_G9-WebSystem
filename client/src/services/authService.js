
import { supabase } from "../lib/supabaseClient";

export const signUp = async ({
    name,
    email,
    password,
    phoneNumber,
    provinceID,
    cityID,
    barangayId,
}) => {
    if (
        !name?.trim() ||
        !email?.trim() ||
        !password ||
        !phoneNumber ||
        !provinceID ||
        !cityID ||
        !barangayId
    ) {
        throw new Error("Please complete all registration fields.");
    }

    const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
            data: {
                name: name.trim(),
                phone_number: phoneNumber,
                province_id: provinceID,
                city_id: cityID,
                barangay_id: barangayId,
            },
        },
    });

    if (error) throw error;

    return data;
};

export const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
    });

    if (error) throw error;

    return data;
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;
};

export const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
        },
    });

    if (error) throw error;

    return data;
};

export const getSession = async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    return data.session;
};
