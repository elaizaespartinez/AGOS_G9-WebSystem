export const cityWideHotlines = [
    {
        label: "CDRRMO",
        number: "(043) 702-3902",
    },
    {
        label: "Mayor's Action Center",
        number: "(043) 723-1511",
    },
    {
        label: "24/7 EBD Emergency Health Hotline",
        number: "0999-222-6626",
    },
];

export const barangays = [
    "Alangilan",
    "Balagtas",
    // Batangas City has 105 barangays (e.g., Bolbok, Calicanto, Cuta, Gulod, Kumintang Ibaba, Kumintang Ilaya, Libjo, Pallocan, Sta. Clara, Sta. Rita, Wawa, etc.)
];

export const defaultLocalResponse = {
    organization: "Barangay Hall",
    location: "Batangas City",
    hotlines: [],
};

export const barangayHotlines = {
    Alangilan: {
        organization: "Alangilan Barangay Hall",
        location: "Alangilan, Batangas City",
        hotlines: [
            {
                label: "Barangay Hotline",
                number: "(043) 349-8939",
            },
        ],
    },
    Balagtas: {
        organization: "Balagtas Barangay Hall",
        location: "Balagtas, Batangas City",
        hotlines: [
            {
                label: "Barangay Hall",
                number: "(043) 409-0119",
                verified: false, // source: Barangay Balagtas Facebook page, unverified
            },
        ],
    },
};

export const mockLocalResponse = barangayHotlines.Alangilan;
