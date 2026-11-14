import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed } from "lucide-react";

export const evacuationDestinations = [
    { id: "sports-coliseum", name: "Batangas City Sports Coliseum", type: "Evacuation center", position: [13.7569, 121.0583] },
    { id: "sta-rita-court", name: "Sta. Rita Covered Court", type: "Evacuation center", position: [13.7418, 121.0627] },
    { id: "batangas-national-high-school", name: "Batangas National High School", type: "Evacuation center", position: [13.7564, 121.0628] },
    { id: "university-of-batangas", name: "University of Batangas", type: "Evacuation center", position: [13.7528, 121.0581] },
];

const destinationIcon = L.divIcon({
    className: "transport-destination-marker",
    html: '<span style="display:grid;place-items:center;width:28px;height:28px;border:3px solid white;border-radius:999px;background:#2e9eac;color:white;font-size:16px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.35)">⌂</span>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
});

function TransportationMap({ onDestinationsSorted, requestedDestinationId, onDestinationSelected }) {
    const mapElement = useRef(null);
    const mapInstance = useRef(null);
    const locationMarker = useRef(null);
    const accuracyCircle = useRef(null);
    const routeLine = useRef(null);
    const destinationMarkers = useRef(new Map());
    const userPosition = useRef(null);
    const selectedDestination = useRef(null);
    const routeRequestId = useRef(0);
    const routeAbortController = useRef(null);
    const routeData = useRef(new Map());
    const locationUpdateTimer = useRef(null);
    const lastRoutedPosition = useRef(null);
    const [locationStatus, setLocationStatus] = useState("");

    async function fetchRoadRoute(position, destination, signal) {
        const [latitude, longitude] = position;
        const [destinationLatitude, destinationLongitude] = destination.position;
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${longitude},${latitude};${destinationLongitude},${destinationLatitude}?overview=full&geometries=geojson`, { signal });
        const data = await response.json();
        if (!response.ok || data.code !== "Ok" || !data.routes?.[0]) throw new Error(`No road route was found to ${destination.name}.`);
        return data.routes[0];
    }

    function clearRoute() {
        routeLine.current?.remove();
        routeLine.current = null;
    }

    function drawRoute(route) {
        clearRoute();
        const positions = route.geometry.coordinates.map(([routeLongitude, routeLatitude]) => [routeLatitude, routeLongitude]);
        routeLine.current = L.polyline(positions, { color: "#1d4ed8", weight: 5, opacity: 0.9 }).addTo(mapInstance.current);
        mapInstance.current.fitBounds(routeLine.current.getBounds(), { padding: [40, 40] });
    }

    function isCurrentRouteRequest(requestId) {
        return requestId === routeRequestId.current;
    }

    async function refreshRoutes(position, destinationId = selectedDestination.current) {
        routeAbortController.current?.abort();
        const controller = new AbortController();
        routeAbortController.current = controller;
        const requestId = routeRequestId.current + 1;
        routeRequestId.current = requestId;

        try {
            const routeResults = await Promise.all(evacuationDestinations.map(async (destination) => {
                try {
                    return {
                        destination,
                        route: await fetchRoadRoute(position, destination, controller.signal),
                    };
                } catch (error) {
                    if (error.name === "AbortError") throw error;
                    return { destination, route: null };
                }
            }));
            if (!isCurrentRouteRequest(requestId)) return;

            routeData.current = new Map(
                routeResults
                    .filter(({ route }) => route)
                    .map(({ destination, route }) => [destination.id, route]),
            );
            const sortedRoutes = routeResults
                .filter(({ route }) => route)
                .sort((first, second) => first.route.duration - second.route.duration || first.route.distance - second.route.distance);
            onDestinationsSorted(routeResults
                .sort((first, second) => {
                    if (!first.route) return 1;
                    if (!second.route) return -1;
                    return first.route.duration - second.route.duration || first.route.distance - second.route.distance;
                })
                .map(({ destination, route }) => ({
                    ...destination,
                    routeDistance: route?.distance ?? null,
                    routeDuration: route?.duration ?? null,
                })));

            const selected = destinationId
                ? evacuationDestinations.find((destination) => destination.id === destinationId)
                : sortedRoutes[0]?.destination;
            const selectedRoute = selected && routeData.current.get(selected.id);
            if (!selected || !selectedRoute) {
                clearRoute();
                return;
            }
            if (selectedDestination.current !== selected.id) {
                selectedDestination.current = selected.id;
                onDestinationSelected(selected.id);
            }
            destinationMarkers.current.get(selected.id)?.openPopup();
            drawRoute(selectedRoute);
            lastRoutedPosition.current = position;
        } catch (error) {
            if (error.name !== "AbortError" && isCurrentRouteRequest(requestId)) {
                console.error("Unable to calculate transportation routes.", error);
            }
        }
    }

    function selectDestination(destination) {
        selectedDestination.current = destination.id;
        onDestinationSelected(destination.id);
        destinationMarkers.current.get(destination.id)?.openPopup();
        if (userPosition.current) refreshRoutes(userPosition.current, destination.id);
    }

    function distanceBetweenMeters(first, second) {
        const earthRadius = 6371000;
        const toRadians = (degrees) => degrees * Math.PI / 180;
        const latitudeDelta = toRadians(second[0] - first[0]);
        const longitudeDelta = toRadians(second[1] - first[1]);
        const latitude = toRadians((first[0] + second[0]) / 2);
        return Math.sqrt(latitudeDelta ** 2 + (Math.cos(latitude) * longitudeDelta) ** 2) * earthRadius;
    }

    function scheduleRouteRefresh(position) {
        if (lastRoutedPosition.current && distanceBetweenMeters(lastRoutedPosition.current, position) < 30) return;
        window.clearTimeout(locationUpdateTimer.current);
        locationUpdateTimer.current = window.setTimeout(() => {
            setLocationStatus("Sorting by road travel time...");
            refreshRoutes(position);
        }, 5000);
    }

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
                userPosition.current = position;
                locationMarker.current?.remove();
                accuracyCircle.current?.remove();
                locationMarker.current = L.circleMarker(position, { radius: 8, color: "#fff", weight: 3, fillColor: "#1687d9", fillOpacity: 1 }).addTo(map);
                accuracyCircle.current = L.circle(position, { radius: coords.accuracy, color: "#1687d9", fillColor: "#1687d9", fillOpacity: 0.15, weight: 1 }).addTo(map);
                map.setView(position, Math.max(map.getZoom(), 12));
                setLocationStatus("Location found.");
                scheduleRouteRefresh(position);
            },
            (error) => setLocationStatus(error.code === error.PERMISSION_DENIED ? "Location permission was denied." : "Your location is currently unavailable."),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
        );
    }

    useEffect(() => {
        const map = L.map(mapElement.current, { center: [13.772, 121.06], zoom: 14, zoomControl: false });
        mapInstance.current = map;
        L.control.zoom({ position: "bottomright" }).addTo(map);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
        evacuationDestinations.forEach((destination) => {
            const marker = L.marker(destination.position, { icon: destinationIcon, title: destination.name })
                .addTo(map)
                .bindTooltip(destination.name, { direction: "top", offset: [0, -14] })
                .bindPopup(`<strong>${destination.name}</strong><br>${destination.type}`)
                .on("click", () => {
                    selectDestination(destination);
                });
            destinationMarkers.current.set(destination.id, marker);
        });
        requestAnimationFrame(() => map.invalidateSize());
        locateUser();
        return () => {
            locationMarker.current?.remove();
            accuracyCircle.current?.remove();
            window.clearTimeout(locationUpdateTimer.current);
            routeAbortController.current?.abort();
            clearRoute();
            destinationMarkers.current.clear();
            map.remove();
        };
    }, []);

    useEffect(() => {
        if (!requestedDestinationId) return;
        const destination = evacuationDestinations.find((item) => item.id === requestedDestinationId);
        if (destination && selectedDestination.current !== destination.id) selectDestination(destination);
    }, [requestedDestinationId]);

    return (
        <div className="relative h-full min-h-[36rem]">
            <div ref={mapElement} className="transport-map" aria-label="Interactive Batangas transportation map" />
            <button type="button" onClick={locateUser} className="transport-location-button" disabled={locationStatus === "Finding your location..."}>
                <LocateFixed size={15} /> {locationStatus === "Finding your location..." ? "Locating..." : "My location"}
            </button>
        </div>
    );
}

export default TransportationMap;
