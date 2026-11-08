import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed } from "lucide-react";
import { floodMapConfig } from "../config/mapConfig";

function FloodMapLeaflet() {
    const mapElement = useRef(null);
    const mapInstance = useRef(null);
    const locationMarker = useRef(null);
    const accuracyCircle = useRef(null);
    const [tileError, setTileError] = useState(false);
    const [locationStatus, setLocationStatus] = useState("");

    function locateUser() {
        if (!navigator.geolocation) {
            setLocationStatus("Location is not supported by this browser.");
            return;
        }

        setLocationStatus("Finding your location...");
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                const map = mapInstance.current;
                if (!map) return;

                const position = [coords.latitude, coords.longitude];
                locationMarker.current?.remove();
                accuracyCircle.current?.remove();
                locationMarker.current = L.circleMarker(position, {
                    radius: 8,
                    color: "#ffffff",
                    weight: 3,
                    fillColor: "#1687d9",
                    fillOpacity: 1,
                }).addTo(map).bindPopup("Your approximate location");
                accuracyCircle.current = L.circle(position, {
                    radius: coords.accuracy,
                    color: "#1687d9",
                    fillColor: "#1687d9",
                    fillOpacity: 0.15,
                    weight: 1,
                }).addTo(map);
                map.setView(position, Math.max(map.getZoom(), 12));
                setLocationStatus("Location found.");
            },
            (error) => {
                const message = error.code === error.PERMISSION_DENIED
                    ? "Location permission was denied."
                    : error.code === error.POSITION_UNAVAILABLE
                        ? "Your location is currently unavailable."
                        : "Location request timed out.";
                setLocationStatus(message);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
        );
    }

    useEffect(() => {
        if (!mapElement.current) return undefined;

        const map = L.map(mapElement.current, {
            center: floodMapConfig.center,
            zoom: floodMapConfig.zoom,
            minZoom: floodMapConfig.minZoom,
            maxZoom: floodMapConfig.maxZoom,
            maxBounds: floodMapConfig.maxBounds,
            maxBoundsViscosity: 0.75,
            zoomControl: true,
        });
        mapInstance.current = map;

        const tiles = L.tileLayer(floodMapConfig.tileUrl, {
            attribution: floodMapConfig.tileAttribution,
            minZoom: floodMapConfig.minZoom,
            maxZoom: floodMapConfig.maxZoom,
        }).addTo(map);

        L.control.scale({ imperial: false }).addTo(map);

        const handleTileError = () => setTileError(true);
        tiles.on("tileerror", handleTileError);

        requestAnimationFrame(() => map.invalidateSize());

        return () => {
            tiles.off("tileerror", handleTileError);
            locationMarker.current?.remove();
            accuracyCircle.current?.remove();
            mapInstance.current = null;
            map.remove();
        };
    }, []);

    return (
        <div className="relative h-full min-h-[24rem] overflow-hidden rounded-xl bg-slate-200 shadow-card">
            <div ref={mapElement} className="h-full min-h-[24rem] w-full" />
            <button
                type="button"
                onClick={locateUser}
                disabled={locationStatus === "Finding your location..."}
                className="absolute right-3 top-3 z-[1100] inline-flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-text shadow-card hover:bg-white disabled:cursor-wait disabled:opacity-70"
                aria-label="Show my location on the map"
            >
                <LocateFixed className="h-4 w-4 text-primary" />
                {locationStatus === "Finding your location..." ? "Locating..." : "My location"}
            </button>
            <div className="pointer-events-none absolute bottom-3 left-3 z-[400] rounded-lg bg-white/95 px-3 py-2 text-xs shadow-card">
                <p className="mb-1 font-semibold text-text">Flood hazard</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#9bdd72]" />Low</span>
                    <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#ffcc00]" />Medium</span>
                    <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#ff5b5b]" />High</span>
                </div>
            </div>
            {tileError && (
                <p className="absolute right-3 top-3 z-[400] max-w-[15rem] rounded-lg bg-white/95 px-3 py-2 text-xs text-text shadow-card">
                    Map tiles are unavailable. The map and hazard controls are still available.
                </p>
            )}
            {locationStatus && locationStatus !== "Finding your location..." && locationStatus !== "Location found." && (
                <p className="absolute right-3 top-14 z-[400] max-w-[15rem] rounded-lg bg-white/95 px-3 py-2 text-xs text-text shadow-card">
                    {locationStatus}
                </p>
            )}
        </div>
    );
}

export default FloodMapLeaflet;