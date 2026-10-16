import FloodYellow from "../assets/flood-warning-icons/flood-yellow.png";
import FloodRed from "../assets/flood-warning-icons/flood-red.png";
import FloodGreen from "../assets/flood-warning-icons/flood-green.png";
import FloodOrange from "../assets/flood-warning-icons/flood-orange.png";
import GreenRainfall from "../assets/rainfall-icons/green-rainfall.png";
import OrangeRainfall from "../assets/rainfall-icons/orange-rainfall.png";
import RainRed from "../assets/rainfall-icons/red-rainfall.png";
import YellowRainfall from "../assets/rainfall-icons/yellow-rainfall.png";

const floodStatusIcons = {
    high: FloodRed,
    moderate: FloodOrange,
    low: FloodYellow,
    safe: FloodGreen,
};

const rainfallIcons = {
    low: GreenRainfall,
    moderate: YellowRainfall,
    high: OrangeRainfall,
    severe: RainRed,
};

export const getFloodStatusIcon = (risk) =>
    floodStatusIcons[risk] || null;

export const getAlertIcon = (type, severity) => {
    if (type === "rainfall") {
        return rainfallIcons[severity] || rainfallIcons.moderate;
    }

    return null;
};


export const defaultHomeData = {
    weather: {
        temperature: "—",
        condition: "Weather information unavailable",
        location: "Location unavailable",
        date: "—",
        time: "—",
    },
    floodStatus: {
        location: "Flood information unavailable",
        level: "No data",
        risk: "unknown",
    },
    activeAlert: {
        title: "No alert data",
        description: "Alert information unavailable",
        type: "none",
        severity: "unknown",
    },
    hotlines: [],
};


export const mockHomeData = {
    weather: {
        temperature: "29°C",
        condition: "Cloudy",
        location: "Brgy. Alangilan",
        date: "MON, September 28",
        time: "4:48:30 PM",
    },
    floodStatus: {
        location: "Alangilan, Batangas City",
        level: "Moderate Risk",
        risk: "moderate",
    },
    activeAlert: {
        title: "Heavy Rainfall",
        description: "Flooding Reported in Cuta",
        type: "rainfall",
        severity: "severe",
    },
    hotlines: [
        {
            id: "mayors-action-center",
            name: "Mayor’s Action Center",
            numbers: ["723-1511"],
        },
        {
            id: "ebd-emergency-health",
            name: "24/7 EBD Emergency Health Hotline",
            numbers: ["0999-222-6626"],
        },
        {
            id: "city-drrm",
            name: "City DRRM",
            numbers: ["702-3902"],
        },
        {
            id: "bfp-batangas-city",
            name: "BFP Batangas City",
            numbers: ["425-7163", "0915-602-1984"],
        },
        {
            id: "batangas-component-police",
            name: "Batangas Component Police Station",
            numbers: ["723-2030", "0916-429-1515", "0999-694-6805"],
        },
    ],
};
