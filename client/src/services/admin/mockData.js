const ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();
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
