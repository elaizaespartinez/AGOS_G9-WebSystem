import { MapPinned } from "lucide-react";
import { useState } from "react";
import TransportationMap, { evacuationDestinations } from "../components/TransportationMap";
import "../transportation.css";

function Transportation() {
    const [availableDestinations, setAvailableDestinations] = useState(evacuationDestinations);
    const [locationKnown, setLocationKnown] = useState(false);
    const [selectedDestinationId, setSelectedDestinationId] = useState(null);

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
                />
                <div className="transport-legend">
                    <span><i className="transport-dot suspended" />Suspended</span>
                    <span><i className="transport-dot affected" />Affected</span>
                    <span><i className="transport-dot safe" />Safe</span>
                </div>
            </section>
            <section className="transport-routes-panel">
                <article className="transport-card">
                    <header className="transport-card-header"><h2>Available Routes</h2><MapPinned size={18} /></header>
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
                    <p>Route Status</p>
                    <div className="transport-status"><span>● AFFECTED</span><span>15 min</span></div>
                    <p>Reason</p>
                    <div className="transport-reason"><strong>Flooding near Batangas State University - P. B.</strong><br />Last updated: September 28, 2026</div>
                </article>
            </section>
        </main>
    );
}

export default Transportation;
