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

function formatPht(value) {
    return new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Manila",
    }).format(new Date(value));
}

function createRoutePopup(route) {
    const root = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = `${route.code} · ${route.name}`;
    root.appendChild(title);
    const addField = (label, value) => {
        const field = document.createElement("p");
        const labelElement = document.createElement("strong");
        labelElement.textContent = `${label}: `;
        field.append(labelElement, document.createTextNode(value));
        root.appendChild(field);
    };
    addField("Type", route.routeType);
    addField("Status", route.effectiveStatus);
    addField("Reason", route.effectiveReason);
    addField("Updated", `${formatPht(route.updatedAt)} PHT`);
    return root;
}

const routeColors = {
    safe: "#16a34a",
    monitor: "#eab308",
    affected: "#f97316",
    evacuate: "#dc2626",
};

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_PREFIX = "transport_routes_";

function getCacheKey(position) {
    const lat = Number(position[0]).toFixed(3);
    const lng = Number(position[1]).toFixed(3);
    return `${lat},${lng}`;
}

function saveSortedCache(position, destinations) {
    if (typeof sessionStorage === "undefined") return;
    try {
        const key = getCacheKey(position);
        const altKey = `${Number(position[0]).toFixed(3)}_${Number(position[1]).toFixed(3)}`;
        const payload = JSON.stringify({
            timestamp: Date.now(),
            position,
            destinations,
            data: destinations,
        });
        sessionStorage.setItem(key, payload);
        sessionStorage.setItem(altKey, payload);
        sessionStorage.setItem(`${CACHE_PREFIX}${key}`, payload);
        sessionStorage.setItem(`transport_destinations_${altKey}`, payload);
        sessionStorage.setItem("transport_last_pos_key", key);
    } catch {
        // Ignore potential sessionStorage quota errors
    }
}

function getCachedSorted(position) {
    if (typeof sessionStorage === "undefined") return null;
    try {
        const key = getCacheKey(position);
        const altKey = `${Number(position[0]).toFixed(3)}_${Number(position[1]).toFixed(3)}`;
        const raw =
            sessionStorage.getItem(key) ||
            sessionStorage.getItem(altKey) ||
            sessionStorage.getItem(`${CACHE_PREFIX}${key}`) ||
            sessionStorage.getItem(`transport_destinations_${altKey}`);
        if (!raw) return null;
        const entry = JSON.parse(raw);
        if (!entry || Date.now() - entry.timestamp > CACHE_TTL_MS) {
            sessionStorage.removeItem(key);
            sessionStorage.removeItem(altKey);
            return null;
        }
        return entry.destinations || entry.data || null;
    } catch {
        return null;
    }
}

function getMountCache() {
    if (typeof sessionStorage === "undefined") return null;
    try {
        const lastKey = sessionStorage.getItem("transport_last_pos_key");
        if (lastKey) {
            const raw = sessionStorage.getItem(lastKey) || sessionStorage.getItem(`${CACHE_PREFIX}${lastKey}`);
            if (raw) {
                const entry = JSON.parse(raw);
                if (entry && Date.now() - entry.timestamp <= CACHE_TTL_MS) {
                    return entry.destinations || entry.data || null;
                }
            }
        }
        for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i);
            if (!k) continue;
            try {
                const entry = JSON.parse(sessionStorage.getItem(k));
                if (entry && entry.timestamp && Date.now() - entry.timestamp <= CACHE_TTL_MS && (entry.destinations || entry.data)) {
                    return entry.destinations || entry.data;
                }
            } catch {}
        }
    } catch {}
    return null;
}

function createFloodReportPopup(report) {
    const root = document.createElement("div");
    const addField = (label, value) => {
        const field = document.createElement("p");
        const labelElement = document.createElement("strong");
        labelElement.textContent = `${label}: `;
        field.append(labelElement, document.createTextNode(value));
        root.appendChild(field);
    };
    addField("Location", report.locationName);
    addField("Level", report.level);
    if (report.depthCm !== undefined && report.depthCm !== null) addField("Depth", `${report.depthCm} cm`);
    addField("Note", report.note || "None");
    addField("Source", report.source);
    addField("Updated", `${formatPht(report.createdAt)} PHT`);
    return root;
}

function distanceBetweenMeters(first, second) {
    const earthRadius = 6371000;
    const toRadians = (degrees) => degrees * Math.PI / 180;
    const latitudeDelta = toRadians(second[0] - first[0]);
    const longitudeDelta = toRadians(second[1] - first[1]);
    const latitude = toRadians((first[0] + second[0]) / 2);
    return Math.sqrt(latitudeDelta ** 2 + (Math.cos(latitude) * longitudeDelta) ** 2) * earthRadius;
}

function isReportOnRoute(route, report) {
    const coordinates = route?.geometry?.coordinates || [];
    const point = [Number(report.lat), Number(report.lng)];
    if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) return false;
    return coordinates.some((coordinate, index) => {
        const current = [coordinate[1], coordinate[0]];
        if (distanceBetweenMeters(current, point) <= Number(report.radiusMeters)) return true;
        const nextCoordinate = coordinates[index + 1];
        if (!nextCoordinate) return false;
        const next = [nextCoordinate[1], nextCoordinate[0]];
        const segmentLength = distanceBetweenMeters(current, next);
        if (!segmentLength) return false;
        const ratio = Math.max(0, Math.min(1, (
            (point[0] - current[0]) * (next[0] - current[0]) +
            (point[1] - current[1]) * (next[1] - current[1])
        ) / (
            (next[0] - current[0]) ** 2 + (next[1] - current[1]) ** 2
        )));
        const closest = [
            current[0] + ratio * (next[0] - current[0]),
            current[1] + ratio * (next[1] - current[1]),
        ];
        return distanceBetweenMeters(closest, point) <= Number(report.radiusMeters);
    });
}

function getRouteStatus(route, floodReports) {
    const intersectingReports = floodReports
        .filter((report) => isReportOnRoute(route, report))
        .sort((first, second) => {
            const severity = { Evacuate: 2, Alert: 1, Monitor: 1 };
            return (severity[second.level] || 0) - (severity[first.level] || 0)
                || new Date(second.createdAt) - new Date(first.createdAt);
        });
    const worst = intersectingReports[0];
    if (!worst) {
        return {
            status: "Safe",
            duration: route?.duration ?? null,
            report: null,
        };
    }
    return {
        status: worst.level === "Evacuate" ? "Suspended" : "Affected",
        duration: route.duration,
        report: worst,
    };
}

function TransportationMap({
    onDestinationsSorted,
    requestedDestinationId,
    onDestinationSelected,
    floodReports = [],
    onRouteStatusChange,
    localRoutes = [],
    requestedLocalRouteId,
    onLocalRouteSelected,
    showLocalRoutes = true,
}) {
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
    const floodReportsRef = useRef(floodReports);
    const floodReportCircles = useRef([]);
    const localRouteLayers = useRef(new Map());
    const locationUpdateTimer = useRef(null);
    const lastRoutedPosition = useRef(null);
    const isFirstFix = useRef(true);
    const [locationStatus, setLocationStatus] = useState("");

    useEffect(() => {
        floodReportsRef.current = floodReports;
    }, [floodReports]);

    async function fetchRoadRoute(position, destination, signal) {
        const [latitude, longitude] = position;
        const [destinationLatitude, destinationLongitude] = destination.position;
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${longitude},${latitude};${destinationLongitude},${destinationLatitude}?overview=full&geometries=geojson`, { signal });
        const data = await response.json();
        if (!response.ok || data.code !== "Ok" || !data.routes?.[0]) throw new Error(`No road route was found to ${destination.name}.`);
        return data.routes[0];
    }

    async function fetchRoadTable(position, signal) {
        const [latitude, longitude] = position;
        const coordinates = [
            `${longitude},${latitude}`,
            ...evacuationDestinations.map((d) => `${d.position[1]},${d.position[0]}`),
        ].join(";");
        const response = await fetch(
            `https://router.project-osrm.org/table/v1/driving/${coordinates}?sources=0&annotations=duration,distance`,
            { signal }
        );
        const data = await response.json();
        if (!response.ok || data.code !== "Ok") throw new Error("Unable to fetch road travel time table.");
        return data;
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

    function updateRouteStatus(route) {
        onRouteStatusChange?.(getRouteStatus(route, floodReportsRef.current));
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
            let sortedDestinations = getCachedSorted(position);

            if (!sortedDestinations) {
                const tableData = await fetchRoadTable(position, controller.signal);
                if (!isCurrentRouteRequest(requestId)) return;

                const destinationsWithRoad = evacuationDestinations.map((destination, index) => ({
                    ...destination,
                    routeDistance: tableData.distances?.[0]?.[index + 1] ?? null,
                    routeDuration: tableData.durations?.[0]?.[index + 1] ?? null,
                }));

                sortedDestinations = [...destinationsWithRoad].sort((first, second) => {
                    if (first.routeDuration === null) return 1;
                    if (second.routeDuration === null) return -1;
                    return (
                        first.routeDuration - second.routeDuration ||
                        (first.routeDistance ?? 0) - (second.routeDistance ?? 0)
                    );
                });

                saveSortedCache(position, sortedDestinations);
            }

            if (!isCurrentRouteRequest(requestId)) return;

            onDestinationsSorted?.(sortedDestinations);

            const selected = destinationId
                ? evacuationDestinations.find((destination) => destination.id === destinationId)
                : sortedDestinations.find((d) => d.routeDuration !== null) || sortedDestinations[0];

            if (!selected) {
                clearRoute();
                onRouteStatusChange?.({ status: "Safe", duration: null, report: null });
                return;
            }

            if (selectedDestination.current !== selected.id) {
                selectedDestination.current = selected.id;
                onDestinationSelected(selected.id);
            }
            destinationMarkers.current.get(selected.id)?.openPopup();

            const hasMoved = !lastRoutedPosition.current || distanceBetweenMeters(lastRoutedPosition.current, position) >= 30;
            if (hasMoved) {
                routeData.current.clear();
            }

            let selectedRoute = routeData.current.get(selected.id);
            if (!selectedRoute) {
                selectedRoute = await fetchRoadRoute(position, selected, controller.signal);
                if (!isCurrentRouteRequest(requestId)) return;
                routeData.current.set(selected.id, selectedRoute);
            }

            drawRoute(selectedRoute);
            updateRouteStatus(selectedRoute);
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

    function scheduleRouteRefresh(position) {
        if (lastRoutedPosition.current && distanceBetweenMeters(lastRoutedPosition.current, position) < 30) return;
        window.clearTimeout(locationUpdateTimer.current);
        if (isFirstFix.current) {
            isFirstFix.current = false;
            setLocationStatus("Sorting by road travel time...");
            refreshRoutes(position);
            return;
        }
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

                const straightSorted = evacuationDestinations
                    .map((destination) => ({
                        ...destination,
                        routeDistance: distanceBetweenMeters(position, destination.position),
                        routeDuration: null,
                    }))
                    .sort((first, second) => (first.routeDistance ?? 0) - (second.routeDistance ?? 0));
                onDestinationsSorted?.(straightSorted);

                scheduleRouteRefresh(position);
            },
            (error) => setLocationStatus(error.code === error.PERMISSION_DENIED ? "Location permission was denied." : "Your location is currently unavailable."),
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
        );
    }

    useEffect(() => {
        const cached = getMountCache();
        if (cached) {
            onDestinationsSorted?.(cached);
        }
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
            floodReportCircles.current.forEach((circle) => circle.remove());
            floodReportCircles.current = [];
            localRouteLayers.current.forEach((layer) => layer.remove());
            localRouteLayers.current.clear();
            destinationMarkers.current.clear();
            map.remove();
        };
    }, []);

    useEffect(() => {
        if (!requestedDestinationId) return;
        const destination = evacuationDestinations.find((item) => item.id === requestedDestinationId);
        if (destination && selectedDestination.current !== destination.id) selectDestination(destination);
    }, [requestedDestinationId]);

    useEffect(() => {
        const selectedRoute = selectedDestination.current && routeData.current.get(selectedDestination.current);
        if (selectedRoute) updateRouteStatus(selectedRoute);
    }, [floodReports]);

    useEffect(() => {
        if (!mapInstance.current) return;
        localRouteLayers.current.forEach((layer) => layer.remove());
        localRouteLayers.current.clear();
        if (!showLocalRoutes) return;
        localRoutes
            .filter((route) => route.geometry?.length > 1)
            .forEach((route) => {
                const line = L.polyline(route.geometry, {
                    color: routeColors[route.effectiveStatus] || routeColors.safe,
                    weight: 5,
                    opacity: 0.8,
                })
                    .addTo(mapInstance.current)
                    .bindPopup(createRoutePopup(route))
                    .on("click", () => onLocalRouteSelected?.(route.id));
                localRouteLayers.current.set(route.id, line);
            });
        if (requestedLocalRouteId) {
            const selectedLine = localRouteLayers.current.get(requestedLocalRouteId);
            if (selectedLine) {
                selectedLine.openPopup();
                mapInstance.current.fitBounds(selectedLine.getBounds(), { padding: [40, 40] });
            }
        }
    }, [localRoutes, requestedLocalRouteId, showLocalRoutes]);

    useEffect(() => {
        if (!mapInstance.current) return;
        floodReportCircles.current.forEach((circle) => circle.remove());
        const colors = {
            Evacuate: "#dc2626",
            Alert: "#f97316",
            Monitor: "#facc15",
        };
        floodReportCircles.current = floodReports
            .filter((report) => Number.isFinite(Number(report.lat)) && Number.isFinite(Number(report.lng)))
            .map((report) => L.circle([report.lat, report.lng], {
                radius: Number(report.radiusMeters),
                color: colors[report.level] || "#64748b",
                fillColor: colors[report.level] || "#64748b",
                fillOpacity: 0.22,
                weight: 2,
            }).addTo(mapInstance.current).bindPopup(createFloodReportPopup(report)));
    }, [floodReports]);

    return (
        <div className="relative h-full min-h-0">
            <div ref={mapElement} className="transport-map" aria-label="Interactive Batangas transportation map" />
            <button type="button" onClick={locateUser} className="transport-location-button" disabled={locationStatus === "Finding your location..."}>
                <LocateFixed size={15} /> {locationStatus === "Finding your location..." ? "Locating..." : "My location"}
            </button>
        </div>
    );
}

export default TransportationMap;
