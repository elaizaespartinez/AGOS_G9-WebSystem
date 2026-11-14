export const floodMapConfig = {
    center: [13.7565, 121.0583],
    zoom: 13,
    minZoom: 11,
    maxZoom: 18,
    maxBounds: [
        [4.2, 116.5],
        [21.5, 127.5],
    ],
    // OSM public tiles are for light use. Move this URL to a hosted provider such as MapTiler for real traffic.
    tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    tileAttribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>',
    hazardDataPath: "/data/batangas-flood-25yr.geojson",
};

export const hazardStyles = {
    low: { color: "#D97706", fillColor: "#FACC15" },
    medium: { color: "#C2410C", fillColor: "#F97316" },
    high: { color: "#B91C1C", fillColor: "#DC2626" },
};

export function getHazardStyle(feature) {
    const level = String(feature?.properties?.hazard_level || "low").toLowerCase();
    return {
        ...hazardStyles[level] || hazardStyles.low,
        fillOpacity: 0.28,
        opacity: 0.9,
        weight: 1.5,
    };
}