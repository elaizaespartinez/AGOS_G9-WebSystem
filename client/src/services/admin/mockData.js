const ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();
export const reports = [
  { id: "RPT-024", type: "Flooded road", location: "Brgy. Sta. Rita", barangay: "Sta. Rita", description: "Water is covering the road near the multipurpose hall.", latitude: 13.756, longitude: 121.058, reporter: "s***@example.com", risk: "affected", status: "pending", createdAt: ago(8), photoUrl: "" },
  { id: "RPT-023", type: "Transport disruption", location: "BatStateU - PB", barangay: "Alangilan", description: "Jeepneys are temporarily unable to pass.", latitude: 13.772, longitude: 121.073, reporter: "m***@example.com", risk: "monitor", status: "verified", createdAt: ago(18), photoUrl: "" },
  { id: "RPT-022", type: "Road is passable", location: "Brgy. Alangilan", barangay: "Alangilan", description: "Road is passable with light rain.", latitude: 13.771, longitude: 121.075, reporter: "j***@example.com", risk: "safe", status: "pending", createdAt: ago(31), photoUrl: "" },
  { id: "RPT-021", type: "Flooded road", location: "Brgy. Kumintang", barangay: "Kumintang", description: "Floodwater is rising beside the main road.", latitude: 13.764, longitude: 121.064, reporter: "c***@example.com", risk: "evacuate", status: "rejected", createdAt: ago(90), photoUrl: "" },
];
export const locations = [
  { id: "LOC-001", name: "Batangas City", risk: "monitor", reports: 14, updatedAt: ago(12), source: "Community reports", confidence: 82, why: "Rainfall reports are increasing.", override: null },
  { id: "LOC-002", name: "Brgy. Sta. Rita", risk: "affected", reports: 8, updatedAt: ago(18), source: "DRRMO field report", confidence: 91, why: "Multiple reports indicate road flooding.", override: null },
  { id: "LOC-003", name: "Brgy. Alangilan", risk: "safe", reports: 3, updatedAt: ago(40), source: "Community reports", confidence: 68, why: "Routes remain passable.", override: null },
];
export const hotlines = [
  { id: "HOT-001", name: "Batangas City DRRMO", number: "(043) 723-4248", category: "Emergency", active: true },
  { id: "HOT-002", name: "Philippine Red Cross", number: "143", category: "Rescue", active: true },
];
export const evacuationCenters = [
  { id: "EVC-001", name: "Batangas City Sports Complex", address: "Pallocan West", capacity: 500, occupied: 120, status: "open" },
  { id: "EVC-002", name: "Alangilan Elementary School", address: "Alangilan", capacity: 250, occupied: 0, status: "closed" },
];
export const auditLog = [];

export const alerts = [
  {
    id: "ALT-001",
    title: "Flooding reported in Sta. Rita",
    severity: "affected",
    description: "Multiple reports indicate flooding near the multipurpose hall.",
    affectedBarangays: ["Sta. Rita"],
    startsAt: ago(45),
    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    source: "Community reports",
    issuingAdministrator: "Admin User",
    status: "active",
  },
];

export const communicationsAnnouncements = [
  {
    id: "ANN-001",
    title: "Travel advisory",
    category: "Advisory",
    severity: "low",
    content: "Allow extra travel time and use safer routes when rain is moderate to heavy.",
    affectedAreas: ["Batangas City"],
    attachmentUrl: "",
    source: "AGOS Administration",
    publishedAt: ago(35),
    status: "published",
    issuingAdministrator: "Admin User",
  },
];
