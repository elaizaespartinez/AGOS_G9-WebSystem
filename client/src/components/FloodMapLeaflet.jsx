import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getFloodRiskLevel } from "../lib/floodRisk";
import { getWeather } from "../services/weatherService";
import { floodMapConfig } from "../config/mapConfig";

const NOAH_LABEL = "Flood-prone areas (NOAH)";
const GFM_WMS_URL = "https://geoserver.gfm.eodc.eu/geoserver/gfm/wms";
const GFM_CAPABILITIES_URL = `${GFM_WMS_URL}?service=WMS&request=GetCapabilities`;
const hazardStyles = {
    low: { color: "#ca8a04", fillColor: "#facc15" },
    medium: { color: "#ea580c", fillColor: "#f97316" },
    high: { color: "#991b1b", fillColor: "#991b1b" },
};

function getLayerText(layer, tagName) {
    return layer.getElementsByTagNameNS("*", tagName)[0]?.textContent?.trim() || "";
}

function getGfmMetadata(xmlText) {
    const document = new DOMParser().parseFromString(xmlText, "text/xml");
    const layers = [...document.getElementsByTagNameNS("*", "Layer")];
    const layer = layers.find((candidate) => {
        const name = getLayerText(candidate, "Name").toLowerCase().replace(/_/g, " ");
        const title = getLayerText(candidate, "Title").toLowerCase().replace(/_/g, " ");
        return (name.includes("observed flood extent") || title.includes("observed flood extent"))
            && !name.includes("group");
    });
    if (!layer) throw new Error("GFM GetCapabilities did not expose an Observed Flood Extent layer.");

    const name = getLayerText(layer, "Name");
    const timeNode = [...layer.getElementsByTagNameNS("*", "Dimension"), ...layer.getElementsByTagNameNS("*", "Extent")]
        .find((node) => node.getAttribute("name")?.toLowerCase() === "time");
    const times = (timeNode?.textContent || "").split(",").map((value) => value.trim()).filter(Boolean);
    if (!name || times.length === 0) throw new Error("GFM Observed Flood Extent has no TIME values.");

    const latestTime = times.slice().sort().at(-1);
    return {
        layerName: name,
        times,
        latestTime,
        latestDate: latestTime.slice(0, 10),
    };
}

function getTimeForDate(metadata, date) {
    return metadata.times.find((time) => time.slice(0, 10) === date);
}

function addPopupField(root, label, value) {
    const field = document.createElement("p");
    const labelElement = document.createElement("strong");
    labelElement.textContent = `${label}: `;
    field.append(labelElement, document.createTextNode(value));
    root.appendChild(field);
}

function createReportPopup(report) {
    const root = document.createElement("div");
    addPopupField(root, "Location", report.locationName);
    addPopupField(root, "Level", report.level);
    if (report.depthCm !== undefined) addPopupField(root, "Depth", `${report.depthCm} cm`);
    addPopupField(root, "Note", report.note || "None");
    addPopupField(root, "Source", report.source);
    addPopupField(root, "Entered", `${formatPht(report.createdAt)} PHT`);
    addPopupField(root, "Expires", `${formatPht(report.expiresAt)} PHT`);
    const confirmation = document.createElement("strong");
    confirmation.textContent = "Admin-confirmed";
    root.appendChild(confirmation);
    return root;
}

function formatPht(value) {
    return new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Manila",
    }).format(new Date(value));
}

function formatWeatherPopup(weather) {
    const rainfall = Number.isFinite(weather.peakRainfall)
        ? `${weather.peakRainfall.toFixed(1)} mm/hr peak estimated rainfall`
        : "No rainfall data";
    return `<strong>Batangas City</strong><br>${rainfall}`;
}

function getHazardStyle(feature, risk) {
    const level = String(feature?.properties?.hazard_level || "low").toLowerCase();
    const style = hazardStyles[level] || hazardStyles.low;
    const fillOpacity = {
        safe: 0.25,
        low: 0.4,
        moderate: 0.5,
        high: 0.6,
    }[risk] || 0.25;
    return {
        ...style,
        fillOpacity,
        opacity: level === "high" ? 0.95 : 0.8,
        weight: 1,
    };
}

function formatWeatherUpdatedAt(value) {
    if (!value) return "unknown time";
    return new Intl.DateTimeFormat("en-PH", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Manila",
    }).format(new Date(value));
}

function FloodMapLeaflet({
    weatherData = [],
    facilityData = [],
    floodReports = [],
    onSatelliteDateChange,
    onNoahVisibilityChange,
}) {
    const mapElement = useRef(null);
    const mapInstance = useRef(null);
    const weatherMarkers = useRef([]);
    const reportMarkers = useRef([]);
    const reportCircles = useRef([]);
    const radarLayer = useRef(null);
    const radarVisibleRef = useRef(true);
    const noahLoaded = useRef(false);
    const facilityMarkers = useRef([]);
    const gfmLayer = useRef(null);
    const gfmMetadata = useRef(null);
    const gfmTileLoaded = useRef(false);
    const hazardLayerRef = useRef(null);
    const hazardDataRef = useRef(null);
    const hazardLoading = useRef(false);
    const [mapError, setMapError] = useState("");
    const [radarVisible, setRadarVisible] = useState(true);
    const [noahVisible, setNoahVisible] = useState(false);
    const [noahStatus, setNoahStatus] = useState("idle");
    const [gfmDate, setGfmDate] = useState("");
    const [gfmRange, setGfmRange] = useState({ min: "", max: "" });
    const [gfmStatus, setGfmStatus] = useState("loading");
    const [currentWeather, setCurrentWeather] = useState(weatherData[0] || null);
    const estimatedRisk = getFloodRiskLevel(currentWeather || {});
    const estimatedRiskRef = useRef(estimatedRisk);
    estimatedRiskRef.current = estimatedRisk;

    useEffect(() => {
        setCurrentWeather(weatherData[0] || null);
    }, [weatherData]);

    useEffect(() => {
        let cancelled = false;

        async function refreshWeather() {
            try {
                const nextWeather = await getWeather();
                if (!cancelled) setCurrentWeather(nextWeather);
            } catch (error) {
                if (!cancelled) console.error("Unable to refresh flood map weather.", error);
            }
        }

        refreshWeather();
        const weatherInterval = window.setInterval(refreshWeather, 10 * 60 * 1000);
        return () => {
            cancelled = true;
            window.clearInterval(weatherInterval);
        };
    }, []);

    useEffect(() => {
        const layer = hazardLayerRef.current;
        const data = hazardDataRef.current;
        if (!layer || !data || !mapInstance.current?.hasLayer(layer)) return;

        layer.clearLayers();
        layer.addData(data);
    }, [estimatedRisk]);

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
            preferCanvas: true,
        });
        mapInstance.current = map;
        const tiles = L.tileLayer(floodMapConfig.tileUrl, {
            attribution: floodMapConfig.tileAttribution,
            minZoom: floodMapConfig.minZoom,
            maxZoom: floodMapConfig.maxZoom,
        }).addTo(map);
        const noahPane = map.createPane("noahHazards");
        noahPane.style.zIndex = "450";
        const hazardLayer = L.geoJSON(null, {
            pane: "noahHazards",
            style: (feature) => getHazardStyle(feature, estimatedRiskRef.current),
            onEachFeature: (feature, layer) => {
                const properties = feature.properties || {};
                const hazardLevel = String(properties.hazard_level || "Unknown");
                layer.bindPopup(
                    `<strong>Flood susceptibility: ${hazardLevel} · 25-year return period · Source: Project NOAH</strong>`,
                );
            },
        });
        hazardLayerRef.current = hazardLayer;
        const layerControl = L.control.layers(null, { [NOAH_LABEL]: hazardLayer }, { position: "topright" }).addTo(map);
        const layerToggle = layerControl.getContainer().querySelector(".leaflet-control-layers-toggle");
        if (layerToggle) {
            layerToggle.textContent = "Layers";
            layerToggle.setAttribute("aria-label", "Layers");
        }
        const renderNoahHazards = () => {
            if (!map.hasLayer(hazardLayer) || !hazardDataRef.current) return;
            hazardLayer.clearLayers();
            hazardLayer.addData(hazardDataRef.current);
        };
        const loadNoahHazards = () => {
            if (noahLoaded.current) {
                renderNoahHazards();
                return;
            }
            if (hazardLoading.current) return;
            setNoahStatus("loading");
            hazardLoading.current = true;
            fetch(floodMapConfig.hazardDataPath)
                .then((response) => {
                    if (!response.ok) throw new Error(`Flood hazard request failed with status ${response.status}.`);
                    return response.json();
                })
                .then((data) => {
                    hazardDataRef.current = data;
                    noahLoaded.current = true;
                    renderNoahHazards();
                    setNoahStatus("loaded");
                })
                .catch((error) => {
                    console.error("Unable to load flood hazard data.", error);
                    map.removeLayer(hazardLayer);
                    setNoahVisible(false);
                    onNoahVisibilityChange?.(false);
                    setNoahStatus("error");
                    setMapError("Project NOAH flood hazard data is unavailable.");
                })
                .finally(() => {
                    hazardLoading.current = false;
                });
        };
        const handleNoahAdd = ({ layer }) => {
            if (layer !== hazardLayer) return;
            setNoahVisible(true);
            onNoahVisibilityChange?.(true);
            loadNoahHazards();
        };
        const handleNoahRemove = ({ layer }) => {
            if (layer !== hazardLayer) return;
            setNoahVisible(false);
            onNoahVisibilityChange?.(false);
        };
        map.on("overlayadd", handleNoahAdd);
        map.on("overlayremove", handleNoahRemove);

        let cancelled = false;
        L.control.scale({ imperial: false }).addTo(map);
        async function refreshRadar() {
            try {
                const response = await fetch("https://api.rainviewer.com/public/weather-maps.json");
                if (!response.ok) throw new Error(`RainViewer request failed with status ${response.status}.`);
                const data = await response.json();
                const latestFrame = data.radar?.past?.at(-1);
                if (!latestFrame?.path || !data.host) throw new Error("RainViewer returned no radar frame.");
                if (cancelled) return;

                radarLayer.current?.remove();
                radarLayer.current = L.tileLayer(
                    `${data.host}${latestFrame.path}/256/{z}/{x}/{y}/2/1_1.png`,
                    {
                        attribution: "Radar: RainViewer",
                        opacity: 0.6,
                        maxNativeZoom: 7,
                        maxZoom: floodMapConfig.maxZoom,
                    },
                );
                if (!cancelled && radarVisibleRef.current) radarLayer.current.addTo(map);
            } catch (error) {
                if (cancelled) return;
                console.error("Unable to load RainViewer radar.", error);
                radarLayer.current?.remove();
                radarLayer.current = null;
            }
        }

        refreshRadar();
        const radarInterval = window.setInterval(refreshRadar, 10 * 60 * 1000);
        const facilityIcon = L.divIcon({
            className: "flood-facility-marker",
            html: "<span>⌂</span>",
            iconSize: [28, 28],
            iconAnchor: [14, 14],
        });
        facilityMarkers.current = facilityData.map((facility) => L.marker(facility.position, { icon: facilityIcon })
            .addTo(map)
            .bindPopup(`${facility.name}<br>${facility.type}`));

        const locationMarker = { marker: null, accuracy: null };
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                ({ coords }) => {
                    if (cancelled) return;
                    locationMarker.marker = L.circleMarker([coords.latitude, coords.longitude], {
                        radius: 8,
                        color: "#fff",
                        weight: 3,
                        fillColor: "#2563eb",
                        fillOpacity: 1,
                    }).addTo(map).bindPopup("Your location");
                    locationMarker.accuracy = L.circle([coords.latitude, coords.longitude], {
                        radius: coords.accuracy,
                        color: "#2563eb",
                        fillColor: "#2563eb",
                        fillOpacity: 0.12,
                        weight: 1,
                    }).addTo(map);
                },
                (error) => console.warn("Unable to determine user location.", error),
                { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
            );
        }

        async function loadGfm() {
            try {
                const response = await fetch(GFM_CAPABILITIES_URL);
                if (!response.ok) throw new Error(`GFM GetCapabilities failed with status ${response.status}.`);
                const metadata = getGfmMetadata(await response.text());
                if (cancelled) return;
                gfmMetadata.current = metadata;
                setGfmDate(metadata.latestDate);
                setGfmRange({ min: metadata.times[0].slice(0, 10), max: metadata.latestDate });
                onSatelliteDateChange?.(metadata.latestDate);
                const layer = L.tileLayer.wms(GFM_WMS_URL, {
                    layers: metadata.layerName,
                    format: "image/png",
                    transparent: true,
                    opacity: 0.65,
                    time: metadata.latestTime,
                    attribution: "Satellite flood extent: GFM",
                });
                gfmLayer.current = layer;
                gfmTileLoaded.current = false;
                layer.on("tileload", () => {
                    gfmTileLoaded.current = true;
                    setGfmStatus("loaded");
                });
                layer.on("tileerror", (error) => {
                    console.error("Unable to load GFM WMS tile.", error);
                    if (!gfmTileLoaded.current) setGfmStatus("empty");
                });
                layer.addTo(map);
                window.setTimeout(() => {
                    if (!gfmTileLoaded.current && !cancelled) setGfmStatus("empty");
                }, 10000);
            } catch (error) {
                console.error("Unable to load GFM flood data.", error);
                if (!cancelled) {
                    setGfmStatus("empty");
                    setMapError("Satellite flood data is unavailable.");
                }
            }
        }
        loadGfm();

        const handleTileError = () => setMapError("Base map tiles are unavailable.");
        tiles.on("tileerror", handleTileError);
        requestAnimationFrame(() => map.invalidateSize());

        return () => {
            cancelled = true;
            tiles.off("tileerror", handleTileError);
            map.off("overlayadd", handleNoahAdd);
            map.off("overlayremove", handleNoahRemove);
            window.clearInterval(radarInterval);
            radarLayer.current?.remove();
            radarLayer.current = null;
            gfmLayer.current?.remove();
            gfmLayer.current = null;
            hazardLayerRef.current = null;
            hazardDataRef.current = null;
            layerControl.remove();
            facilityMarkers.current.forEach((marker) => marker.remove());
            facilityMarkers.current = [];
            locationMarker.marker?.remove();
            locationMarker.accuracy?.remove();
            weatherMarkers.current.forEach((marker) => marker.remove());
            reportMarkers.current.forEach((marker) => marker.remove());
            reportCircles.current.forEach((circle) => circle.remove());
            map.remove();
        };
    }, [facilityData, onNoahVisibilityChange, onSatelliteDateChange]);

    useEffect(() => {
        const metadata = gfmMetadata.current;
        const layer = gfmLayer.current;
        const time = metadata && getTimeForDate(metadata, gfmDate);
        if (!metadata || !layer || !time) return;
        gfmTileLoaded.current = false;
        setGfmStatus("loading");
        layer.setParams({ time });
        onSatelliteDateChange?.(gfmDate);
    }, [gfmDate, onSatelliteDateChange]);

    useEffect(() => {
        if (!mapInstance.current) return;
        weatherMarkers.current.forEach((marker) => marker.remove());
        const weatherIcon = L.divIcon({
            className: "flood-weather-marker",
            html: '<span>⌂</span>',
            iconSize: [26, 26],
            iconAnchor: [13, 13],
        });
        weatherMarkers.current = (currentWeather ? [currentWeather] : []).map((weather) => L.marker([weather.lat, weather.lng], { icon: weatherIcon })
            .addTo(mapInstance.current)
            .bindPopup(formatWeatherPopup(weather)));
    }, [currentWeather]);

    useEffect(() => {
        if (!mapInstance.current) return;
        reportMarkers.current.forEach((marker) => marker.remove());
        reportCircles.current.forEach((circle) => circle.remove());
        const colors = {
            Evacuate: "#dc2626",
            Alert: "#f97316",
            Monitor: "#facc15",
        };
        reportMarkers.current = floodReports.map((report) => {
            const icon = L.divIcon({
                className: `flood-report-marker flood-report-marker--${report.level.toLowerCase()}`,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            });
            return L.marker([report.lat, report.lng], { icon })
                .setZIndexOffset(report.level === "Evacuate" ? 300 : report.level === "Alert" ? 200 : 0)
                .addTo(mapInstance.current)
                .bindPopup(createReportPopup(report));
        });
        reportCircles.current = floodReports.map((report) => L.circle(
            [report.lat, report.lng],
            {
                radius: report.radiusMeters,
                color: colors[report.level],
                fillColor: colors[report.level],
                fillOpacity: 0.2,
                weight: 2,
            },
        ).addTo(mapInstance.current).bindPopup(createReportPopup(report)));
    }, [floodReports]);

    return (
        <div className="relative h-full min-h-[24rem] overflow-hidden rounded-2xl bg-slate-200 shadow-elevated">
            <div ref={mapElement} className="h-full min-h-[24rem] w-full" aria-label="Interactive Batangas City flood hazard map" />
            <div className="flood-map-date-control absolute left-3 top-3 z-[400] rounded-lg bg-white/95 px-3 py-2 shadow-card">
                <label htmlFor="flood-map-date">Satellite date</label>
                <input
                    id="flood-map-date"
                    type="date"
                    value={gfmDate}
                    min={gfmRange.min}
                    max={gfmRange.max}
                    onChange={(event) => setGfmDate(event.target.value)}
                    disabled={!gfmMetadata.current}
                />
            </div>
            <button
                type="button"
                onClick={() => {
                    setRadarVisible((visible) => {
                        const nextVisible = !visible;
                        radarVisibleRef.current = nextVisible;
                        if (radarLayer.current) {
                            if (nextVisible) radarLayer.current.addTo(mapInstance.current);
                            else radarLayer.current.remove();
                        }
                        return nextVisible;
                    });
                }}
                className="flood-map-radar-toggle absolute right-3 z-[400] rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-text shadow-card hover:bg-white"
                aria-pressed={radarVisible}
            >
                {radarVisible ? "Hide radar" : "Show radar"}
            </button>
            {noahVisible && <div className="flood-map-noah-card pointer-events-none absolute left-3 z-[400] rounded-xl bg-white/90 px-3 py-2 text-xs shadow-card backdrop-blur">
                <p className="font-semibold text-text">Flood-Prone Areas</p>
                <p className="text-[0.65rem] text-text/60">Project NOAH 25-year hazard model</p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#facc15]" />Low susceptibility</span>
                    <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#f97316]" />Medium susceptibility</span>
                    <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#991b1b]" />High susceptibility</span>
                </div>
                {noahStatus === "loading" && <p className="mt-2 text-text/60">Loading flood-prone areas...</p>}
                {noahStatus === "error" && <p className="mt-2 text-risk-high">Unable to load flood-prone areas.</p>}
            </div>}
            <div className="flood-map-risk-card pointer-events-none absolute left-3 z-[400] rounded-xl bg-white/90 px-3 py-2 text-xs shadow-card backdrop-blur">
                <p className="mt-1 font-semibold text-text">
                    Today's estimated risk: {estimatedRisk[0].toUpperCase() + estimatedRisk.slice(1)}
                </p>
                <p className="text-text/70">
                    Updated at {formatWeatherUpdatedAt(currentWeather?.lastUpdated)}
                </p>
            </div>
            <p className="flood-map-satellite-note pointer-events-none absolute right-3 z-[400] max-w-[16rem] rounded-xl bg-white/90 px-3 py-2 text-xs text-text shadow-card backdrop-blur">
                {gfmStatus === "loaded"
                    ? `Satellite data for ${gfmDate}. Not live.`
                    : gfmStatus === "empty"
                        ? `No flooding detected in the satellite data for ${gfmDate || "the selected date"}.`
                        : "Loading satellite flood data..."}
            </p>
            {mapError && (
                <p className="flood-map-error absolute z-[400] max-w-[15rem] rounded-lg bg-white/95 px-3 py-2 text-xs text-text shadow-card">
                    {mapError}
                </p>
            )}
        </div>
    );
}

export default FloodMapLeaflet;
