import { Circle, CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const BATANGAS_CENTER = [13.7565, 121.0583];
const levelColors = {
    Evacuate: "#dc2626",
    Alert: "#f97316",
    Monitor: "#facc15",
};

function MapClickHandler({ onSelect }) {
    useMapEvents({
        click: (event) => onSelect({
            lat: event.latlng.lat,
            lng: event.latlng.lng,
        }),
    });
    return null;
}

function LocateButton({ onSelect }) {
    const map = useMap();

    function locate() {
        if (!navigator.geolocation) {
            onSelect(new Error("Location services are unavailable in this browser."));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                const point = { lat: coords.latitude, lng: coords.longitude };
                map.setView([point.lat, point.lng], Math.max(map.getZoom(), 14));
                onSelect(point);
            },
            (error) => onSelect(new Error(error.message)),
            { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
        );
    }

    return (
        <button
            type="button"
            onClick={locate}
            className="absolute right-3 top-3 z-[1000] rounded-lg bg-white/95 px-3 py-2 text-xs font-bold text-secondary shadow-card"
        >
            Use my location
        </button>
    );
}

export default function FloodReportEntryMap({ latitude, longitude, level, radiusMeters, onSelect }) {
    const point = Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
        ? [Number(latitude), Number(longitude)]
        : null;
    const radius = Number(radiusMeters) > 0 ? Number(radiusMeters) : 0;
    const color = levelColors[level] || levelColors.Monitor;

    return (
        <div className="relative h-72 overflow-hidden rounded-xl border border-gray-200">
            <MapContainer center={BATANGAS_CENTER} zoom={13} scrollWheelZoom className="h-full w-full">
                <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onSelect={onSelect} />
                <LocateButton onSelect={onSelect} />
                {point && (
                    <>
                        {radius > 0 && (
                            <Circle
                                center={point}
                                radius={radius}
                                pathOptions={{ color, fillColor: color, fillOpacity: 0.2, weight: 2, dashArray: "6 6" }}
                            />
                        )}
                        <CircleMarker
                            center={point}
                            radius={8}
                            pathOptions={{ color: "#fff", fillColor: color, fillOpacity: 1, weight: 3 }}
                        />
                    </>
                )}
            </MapContainer>
            <p className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-text/70 shadow-card">
                Click the map to set the report location.
            </p>
        </div>
    );
}
