import { Fragment, useEffect } from "react";
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const BATANGAS_CENTER = [13.7565, 121.0583];
const severityColors = {
    Low: "var(--color-risk-low)",
    Moderate: "var(--color-risk-moderate)",
    High: "var(--color-risk-high)",
    Critical: "var(--color-risk-high)",
};

const markerIcon = (color) => L.divIcon({
    className: "",
    html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 1px 5px rgba(0,0,0,.35)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
});

function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click: (event) => onMapClick({ latitude: event.latlng.lat, longitude: event.latlng.lng }),
    });
    return null;
}

function MapController({ focusRequest, resetRequest }) {
    const map = useMap();

    useEffect(() => {
        if (focusRequest) map.flyTo([focusRequest.latitude, focusRequest.longitude], Math.max(map.getZoom(), 14), { duration: 0.6 });
    }, [focusRequest, map]);

    useEffect(() => {
        if (resetRequest) map.flyTo(BATANGAS_CENTER, 13, { duration: 0.6 });
    }, [resetRequest, map]);

    return null;
}

export default function HazardMap({ zones, selectedZone, draftPoint, draftZone, showZones, onMapClick, onSelectZone, focusRequest, resetRequest }) {
    return (
        <div className="relative h-[520px] overflow-hidden rounded-xl border border-gray-200">
            <MapContainer center={BATANGAS_CENTER} zoom={13} scrollWheelZoom className="h-full w-full">
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClickHandler onMapClick={onMapClick} />
                <MapController focusRequest={focusRequest} resetRequest={resetRequest} />
                {showZones && zones.map((zone) => {
                    const color = severityColors[zone.severity] || severityColors.Low;
                    const radiusMeters = zone.radiusUnit === "kilometers" ? zone.radius * 1000 : zone.radius;
                    return (
                        <Fragment key={zone.id}>
                            <Circle
                                center={[zone.latitude, zone.longitude]}
                                radius={radiusMeters}
                                pathOptions={{ color, fillColor: color, fillOpacity: selectedZone?.id === zone.id ? 0.35 : 0.2, weight: selectedZone?.id === zone.id ? 4 : 2 }}
                                eventHandlers={{ click: () => onSelectZone(zone) }}
                            >
                                <Popup><b>{zone.title}</b><br />{zone.severity} · {zone.status}<br />{zone.location}</Popup>
                            </Circle>
                            <Marker
                                position={[zone.latitude, zone.longitude]}
                                icon={markerIcon(color)}
                                eventHandlers={{ click: () => onSelectZone(zone) }}
                            />
                        </Fragment>
                    );
                })}
                {draftPoint && (
                    <>
                        {draftZone && (
                            <Circle
                                center={[draftPoint.latitude, draftPoint.longitude]}
                                radius={draftZone.radiusUnit === "kilometers" ? Number(draftZone.radius) * 1000 : Number(draftZone.radius)}
                                pathOptions={{ color: severityColors[draftZone.severity] || severityColors.Moderate, fillColor: severityColors[draftZone.severity] || severityColors.Moderate, fillOpacity: 0.3, weight: 3, dashArray: "6 6" }}
                            />
                        )}
                        <CircleMarker center={[draftPoint.latitude, draftPoint.longitude]} radius={8} pathOptions={{ color: "#1b1c68", fillColor: "#2e9eac", fillOpacity: 0.9, weight: 3 }} />
                        <Popup position={[draftPoint.latitude, draftPoint.longitude]}>Selected center point</Popup>
                    </>
                )}
            </MapContainer>
            <div className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-text/70 shadow-card">
                Click anywhere to select a hazard-zone center
            </div>
            <div className="absolute bottom-3 left-3 z-[1000] flex flex-wrap gap-2 rounded-lg bg-white/95 p-2 text-[10px] font-bold text-text/70 shadow-card">
                {Object.entries(severityColors).map(([severity, color]) => <span key={severity}><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />{severity}</span>)}
            </div>
        </div>
    );
}
