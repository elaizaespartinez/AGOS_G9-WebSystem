const hoursFromNow = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

export const hazardTypes = ["Flood", "Landslide", "Road Obstruction", "Heavy Rainfall", "Other"];
export const hazardSeverities = ["Low", "Moderate", "High", "Critical"];
export const hazardStatuses = ["Active", "Resolved", "Expired"];

export const mockHazardZones = [
    {
        id: "HZ-001",
        title: "Sta. Rita road flooding",
        type: "Flood",
        severity: "High",
        description: "Water is reported along the road near the multipurpose hall.",
        latitude: 13.7569,
        longitude: 121.0588,
        radius: 650,
        radiusUnit: "meters",
        status: "Active",
        createdAt: hoursAgo(2),
        expiresAt: hoursFromNow(4),
        location: "Barangay Sta. Rita",
    },
    {
        id: "HZ-002",
        title: "BatStateU-PB heavy rainfall",
        type: "Heavy Rainfall",
        severity: "Moderate",
        description: "Moderate to heavy rainfall may affect visibility and travel time.",
        latitude: 13.7717,
        longitude: 121.0734,
        radius: 1.4,
        radiusUnit: "kilometers",
        status: "Active",
        createdAt: hoursAgo(4),
        expiresAt: hoursFromNow(8),
        location: "Alangilan",
    },
    {
        id: "HZ-003",
        title: "Kumintang road obstruction",
        type: "Road Obstruction",
        severity: "Low",
        description: "A temporary obstruction is affecting one lane of the main road.",
        latitude: 13.7648,
        longitude: 121.0645,
        radius: 300,
        radiusUnit: "meters",
        status: "Resolved",
        createdAt: hoursAgo(18),
        expiresAt: hoursAgo(2),
        location: "Barangay Kumintang",
    },
    {
        id: "HZ-004",
        title: "Cuta flood watch",
        type: "Flood",
        severity: "Critical",
        description: "Several reports indicate rapidly rising water in low-lying areas.",
        latitude: 13.7781,
        longitude: 121.0831,
        radius: 0.9,
        radiusUnit: "kilometers",
        status: "Expired",
        createdAt: hoursAgo(30),
        expiresAt: hoursAgo(6),
        location: "Barangay Cuta",
    },
];
