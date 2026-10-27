import redRainfall from "../assets/rainfall-icons/red-rainfall.png";
import yellowRainfall from "../assets/rainfall-icons/yellow-rainfall.png";
import greenRainfall from "../assets/rainfall-icons/green-rainfall.png";
import orangeRainfall from "../assets/rainfall-icons/orange-rainfall.png";
import floodRed from "../assets/flood-warning-icons/flood-red.png";
import floodOrange from "../assets/flood-warning-icons/flood-orange.png";
import floodYellow from "../assets/flood-warning-icons/flood-yellow.png";
import floodGreen from "../assets/flood-warning-icons/flood-green.png";
import alertRed from "../assets/alert-icons/red-alert.png";
import alertYellow from "../assets/alert-icons/yellow-alert.png";
import alertGreen from "../assets/alert-icons/green-alert.png";

const icons = {
    rainfall: {
        high: redRainfall,
        moderate: orangeRainfall,
        low: yellowRainfall,
        safe: greenRainfall,
    },
    flood: {
        high: floodRed,
        moderate: floodOrange,
        low: floodYellow,
        safe: floodGreen,
    },
    alert: {
        high: alertRed,
        moderate: alertYellow,
        low: alertGreen,
        safe: alertGreen,
    },
};

export const getAnnouncementIcon = (type, severity) =>
    icons[type]?.[severity] || icons.alert.moderate;

export const defaultAnnouncementsData = {
    asOf: {
        time: "—",
        date: "Information unavailable",
    },
    weatherTabs: [
        {
            id: "update",
            label: "Weather Update",
            paragraphs: ["Weather update unavailable."],
        },
        {
            id: "monitor",
            label: "Monitor Weather Condition",
            paragraphs: ["Continue monitoring official weather updates."],
        },
    ],
    monitoring: [],
    advisories: [],
};

export const mockAnnouncementsData = {
    asOf: {
        time: "10:00 AM",
        date: "September 28, 2026",
    },
    weatherTabs: [
        {
            id: "update",
            label: "Weather Update",
            paragraphs: [
                "7.5 to 15mm of rain per hour is expected to persist. Flooding is possible in low-lying or poorly drained zones.",
                "Light to moderate rains are being experienced in some areas of Batangas City. Other areas are experiencing cloudy skies to light rains.",
            ],
        },
        {
            id: "monitor",
            label: "Monitor Weather Condition",
            paragraphs: [
                "Monitor rainfall and flood conditions before travelling.",
                "Follow updates from local authorities and avoid flooded roads.",
            ],
        },
    ],
    monitoring: [
        {
            id: "river-monitoring",
            type: "flood",
            severity: "low",
            text: "Residents are advised to remain vigilant, monitor river updates, and follow the guidance of local authorities.",
        },
        {
            id: "coastal-monitoring",
            type: "flood",
            severity: "safe",
            text: "Continue monitoring weather and coastal conditions, especially during periods of heavy rainfall.",
        },
        {
            id: "flood-warning",
            type: "alert",
            severity: "high",
            text: "Avoid low-lying areas and do not cross flooded roads. Check the flood map before travelling.",
        },
    ],
    advisories: [
        {
            id: "travel-advisory",
            type: "alert",
            severity: "moderate",
            title: "Travel advisory",
            text: "Allow extra travel time and use safer routes when rain is moderate to heavy.",
        },
        {
            id: "flood-map-advisory",
            type: "flood",
            severity: "moderate",
            title: "Flood map reminder",
            text: "Check current flood-prone areas before leaving your location.",
        },
    ],
};
