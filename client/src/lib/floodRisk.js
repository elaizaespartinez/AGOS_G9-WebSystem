// Approximate PAGASA-style rainfall thresholds.
const HOURLY_LOW_THRESHOLD = 7.5;
const HOURLY_MODERATE_THRESHOLD = 15;
const HOURLY_HIGH_THRESHOLD = 30;
const TOTAL_24H_LOW_THRESHOLD = 30;
const TOTAL_24H_MODERATE_THRESHOLD = 60;
const TOTAL_24H_HIGH_THRESHOLD = 100;

const riskLevels = ["safe", "low", "moderate", "high"];

function getMetricRisk(value, lowThreshold, moderateThreshold, highThreshold) {
    if (!Number.isFinite(value) || value < lowThreshold) return "safe";
    if (value < moderateThreshold) return "low";
    if (value <= highThreshold) return "moderate";
    return "high";
}

export function getFloodRiskLevel({ peakRainfall, total24h }) {
    const peakRisk = getMetricRisk(
        peakRainfall,
        HOURLY_LOW_THRESHOLD,
        HOURLY_MODERATE_THRESHOLD,
        HOURLY_HIGH_THRESHOLD,
    );
    const totalRisk = getMetricRisk(
        total24h,
        TOTAL_24H_LOW_THRESHOLD,
        TOTAL_24H_MODERATE_THRESHOLD,
        TOTAL_24H_HIGH_THRESHOLD,
    );

    return riskLevels[Math.max(riskLevels.indexOf(peakRisk), riskLevels.indexOf(totalRisk))];
}

export function getHazardLevelsForRisk(risk) {
    return {
        safe: [],
        low: ["high"],
        moderate: ["high", "medium"],
        high: ["high", "medium", "low"],
    }[risk] || [];
}
