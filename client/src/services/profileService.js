
const NOT_PROVIDED = "Not provided";

export const getProfileData = (user) => {
    if (!user) {
        return null;
    }

    const metadata = user.user_metadata ?? {};

    return {
        id: user.id,
        name: metadata.name || NOT_PROVIDED,
        email: user.email || NOT_PROVIDED,
        province:
            metadata.province_name ||
            metadata.province ||
            metadata.province_id ||
            NOT_PROVIDED,
        city:
            metadata.city_name ||
            metadata.city ||
            metadata.city_id ||
            NOT_PROVIDED,
        barangay:
            metadata.barangay_name ||
            metadata.barangay ||
            metadata.barangay_id ||
            NOT_PROVIDED,
    };
};
