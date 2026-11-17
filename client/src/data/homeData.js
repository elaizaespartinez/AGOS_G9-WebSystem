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
    safe: GreenRainfall,
    low: YellowRainfall,
    moderate: OrangeRainfall,
    high: RainRed,
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
        title: "Flood safety advisory",
        description:
            "Avoid low-lying areas. Check the flood map before travelling.",
        type: "rainfall",
        severity: "moderate",
        updatedAt: "Today, 4:48 PM",
        source: "AGOS System Monitoring",
    },
    hotlines: [],
};


export const mockHomeData = {
    weather: {
        temperature: "29°C",
        condition: "Cloudy",
        location: "Brgy. Alangilan",
        date: "Mon, September 28",
        time: "4:48 PM",
    },
    floodStatus: {
        location: "Alangilan, Batangas City",
        level: "Moderate Risk",
        risk: "moderate",
        updatedAt: "Today, 4:48 PM",
        source: "AGOS System Monitoring",
    },
    activeAlert: {
        title: "Safe",
        description:
            "Safe conditions. No immediate flood risk. Continue to monitor weather updates.",
        type: "rainfall",
        severity: "safe",
        updatedAt: "Today, 4:48 PM",
        source: "AGOS System Monitoring",
    },
    hotlines: [
        {
            id: "mayors-action-center",
            name: "Mayor’s Action Center",
            numbers: ["723-1511"],
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
    ],
};
