import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { floodMapConfig } from "../../config/mapConfig";

const markerColors = {
    safe: "#339900",
    monitor: "#FFCC00",
    affected: "#FF6700",
    evacuate: "#FF0F0F",
};

function getConditionName(condition) {
    return condition.barangays?.name || condition.barangay_id || "Unknown";
}

function isValidCoordinate(value) {
    return value !== null
        && value !== undefined
        && String(value).trim() !== ""
        && Number.isFinite(Number(value));
}

function getConditionPopup(condition) {
    const root = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = getConditionName(condition);
    root.appendChild(title);

    const severity = document.createElement("p");
    severity.textContent = `Severity: ${condition.severity || "Unknown"}`;
    root.appendChild(severity);

    if (condition.confidence != null) {
        const confidence = Number(condition.confidence);
        const confidenceText = Number.isFinite(confidence)
            ? `${Math.round(confidence * (confidence <= 1 ? 100 : 1))}%`
            : "Unknown";
        const confidenceField = document.createElement("p");
        confidenceField.textContent = `Confidence: ${confidenceText}`;
        root.appendChild(confidenceField);
    }

    const reportCount = condition.recent_report_count ?? condition.reports;
    if (reportCount != null) {
        const reports = document.createElement("p");
        reports.textContent = `Reports: ${reportCount}`;
        root.appendChild(reports);
    }

    return root;
}

function HazardOverviewMap({ conditions = [] }) {
    const mapElement = useRef(null);
    const mapInstance = useRef(null);
    const markers = useRef([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!mapElement.current) return undefined;

        const map = L.map(mapElement.current, {
            center: floodMapConfig.center,
            zoom: 12,
            zoomControl: false,
            scrollWheelZoom: false,
            dragging: false,
            touchZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
        });
        mapInstance.current = map;
        L.tileLayer(floodMapConfig.tileUrl, {
            attribution: floodMapConfig.tileAttribution,
        }).addTo(map);
        const handleMapClick = () => navigate("/admin/locations?view=hazards");
        map.on("click", handleMapClick);
        requestAnimationFrame(() => map.invalidateSize());

        return () => {
            map.off("click", handleMapClick);
            markers.current.forEach((marker) => marker.remove());
            markers.current = [];
            map.remove();
            mapInstance.current = null;
        };
    }, [navigate]);

    useEffect(() => {
        const map = mapInstance.current;
        if (!map) return;

        markers.current.forEach((marker) => marker.remove());
        markers.current = [];
        const bounds = [];

        conditions.forEach((condition) => {
            if (!isValidCoordinate(condition.latitude) || !isValidCoordinate(condition.longitude)) return;
            const latitude = Number(condition.latitude);
            const longitude = Number(condition.longitude);

            const marker = L.circleMarker([latitude, longitude], {
                radius: 9,
                color: "#fff",
                weight: 2,
                fillColor: markerColors[condition.severity] || "#64748b",
                fillOpacity: 1,
            })
                .addTo(map)
                .bindTooltip(getConditionName(condition), {
                    permanent: true,
                    direction: "top",
                    offset: [0, -8],
                    opacity: 0.95,
                })
                .bindPopup(getConditionPopup(condition));

            markers.current.push(marker);
            bounds.push([latitude, longitude]);
        });

        if (bounds.length) {
            map.fitBounds(bounds, {
                padding: [28, 28],
                maxZoom: 14,
            });
        }
    }, [conditions]);

    return (
        <div className="relative h-[310px] overflow-hidden rounded-b-xl">
            <div ref={mapElement} className="h-full w-full" aria-label="Flood condition hazard overview map" />
            <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-lg bg-white/90 px-3 py-2 text-[10px] font-semibold text-text shadow-card">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {[
                        ["Evacuate", markerColors.evacuate],
                        ["Alert", markerColors.affected],
                        ["Monitor", markerColors.monitor],
                        ["Normal", markerColors.safe],
                    ].map(([label, color]) => (
                        <span key={label} className="inline-flex items-center gap-1.5">
                            <i className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                            {label}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default HazardOverviewMap;
