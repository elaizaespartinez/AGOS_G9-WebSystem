import { MapPinned } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import TransportationMap, { evacuationDestinations } from "../components/TransportationMap";
import {
    listFloodReports,
    subscribeToFloodReports,
} from "../services/floodReportsService";
import {
    getEffectiveRoute,
    listRoutes,
    subscribeToRoutes,
} from "../services/transportRoutesService";
import "../transportation.css";

function Transportation() {
    const [availableDestinations, setAvailableDestinations] = useState(evacuationDestinations);
    const [locationKnown, setLocationKnown] = useState(false);
    const [selectedDestinationId, setSelectedDestinationId] = useState(null);
    const [floodReports, setFloodReports] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [selectedLocalRouteId, setSelectedLocalRouteId] = useState(null);
    const [showLocalRoutes, setShowLocalRoutes] = useState(true);
    const [routeStatus, setRouteStatus] = useState({
        status: "Safe",
        duration: null,
        report: null,
    });

    useEffect(() => {
        let mounted = true;
        async function refreshReports() {
            try {
                const reports = await listFloodReports();
                if (mounted) setFloodReports(reports);
            } catch (error) {
                console.error("Unable to load transportation flood reports.", error);
            }
        }

        refreshReports();
        const unsubscribe = subscribeToFloodReports(refreshReports);
        return () => {
            mounted = false;
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        let mounted = true;
        async function refreshRoutes() {
            try {
                const routeData = await listRoutes();
                if (mounted) setRoutes(routeData);
            } catch (error) {
                console.error("Unable to load local transportation routes.", error);
            }
        }
        refreshRoutes();
        const unsubscribe = subscribeToRoutes(refreshRoutes);
        return () => {
            mounted = false;
            unsubscribe();
        };
    }, []);

    const effectiveRoutes = useMemo(
        () => routes.map((route) => getEffectiveRoute(route, floodReports)),
        [floodReports, routes],
    );

    function handleDestinationsSorted(sortedDestinations) {
        setAvailableDestinations(sortedDestinations);
        setLocationKnown(true);
    }

    return (
        <main className="transportation-page">
            <section className="transport-map-wrap">
                <TransportationMap
                    onDestinationsSorted={handleDestinationsSorted}
                    requestedDestinationId={selectedDestinationId}
                    onDestinationSelected={setSelectedDestinationId}
                    floodReports={floodReports}
                    onRouteStatusChange={setRouteStatus}
                    localRoutes={effectiveRoutes}
                    requestedLocalRouteId={selectedLocalRouteId}
                    onLocalRouteSelected={setSelectedLocalRouteId}
                    showLocalRoutes={showLocalRoutes}
                />
                <div className="transport-legend">
                    <span><i className="transport-dot suspended" />Suspended</span>
                    <span><i className="transport-dot affected" />Affected</span>
                    <span><i className="transport-dot monitor" />Monitor</span>
                    <span><i className="transport-dot safe" />Safe</span>
                </div>
            </section>
            <section className="transport-routes-panel">
                <article className="transport-card">
                    <header className="transport-card-header"><h2>Available Routes</h2><MapPinned size={18} /></header>
                    <button type="button" className="transport-layer-toggle" onClick={() => setShowLocalRoutes((current) => !current)}>
                        {showLocalRoutes ? "Hide local route layer" : "Show local route layer"}
                    </button>
                    <p className="transport-list-caption">{locationKnown ? "Nearest evacuation centers first" : "Evacuation centers"}</p>
                    <ol className="transport-destination-list">
                        {availableDestinations.map((destination) => (
                            <li
                                key={destination.id}
                                className={selectedDestinationId === destination.id ? "transport-destination-selected" : ""}
                            >
                                <button
                                    type="button"
                                    className="transport-destination-button"
                                    onClick={() => setSelectedDestinationId(destination.id)}
                                >
                                <span>{destination.name}</span>
                                {locationKnown
                                    ? <small>{destination.type} · {destination.routeDuration === null ? "Route unavailable" : `${Math.round(destination.routeDuration / 60)} min · ${(destination.routeDistance / 1000).toFixed(1)} km`}</small>
                                    : <small>{destination.type}</small>}
                                </button>
                            </li>
                        ))}
                    </ol>
                    <h3 className="transport-section-title">Local routes</h3>
                    {!effectiveRoutes.length ? (
                        <p className="transport-empty">No local routes are available.</p>
                    ) : (
                        <ol className="transport-local-route-list">
                            {effectiveRoutes.map((route) => (
                                <li key={route.id} className={selectedLocalRouteId === route.id ? "transport-local-route-selected" : ""}>
                                    <button type="button" className="transport-local-route-button" onClick={() => setSelectedLocalRouteId(route.id)}>
                                        <span className="transport-local-route-heading"><strong>{route.code}</strong><span className={`transport-route-pill ${route.effectiveStatus}`}>{route.effectiveStatus}</span></span>
                                        <span>{route.name}</span>
                                        <small>{route.routeType} · {route.geometry?.length > 1 ? route.effectiveReason : "Path not mapped yet"}</small>
                                    </button>
                                </li>
                            ))}
                        </ol>
                    )}
                    <p>Route Status</p>
                    <div className={`transport-status ${routeStatus.status.toLowerCase()}`}>
                        <span>● {routeStatus.status.toUpperCase()}</span>
                        <span>{routeStatus.duration === null ? "Route unavailable" : `${Math.round(routeStatus.duration / 60)} min`}</span>
                    </div>
                    <p>Reason</p>
                    <div className="transport-reason">
                        {routeStatus.report ? (
                            <>
                                <strong>{routeStatus.report.locationName}</strong>
                                {routeStatus.report.note && <> — {routeStatus.report.note}</>}
                                <br />
                                Last updated: {new Intl.DateTimeFormat("en-PH", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                    timeZone: "Asia/Manila",
                                }).format(new Date(routeStatus.report.createdAt))} PHT
                            </>
                        ) : (
                            "No flood reports along this route."
                        )}
                    </div>
                </article>
            </section>
        </main>
    );
}

export default Transportation;
