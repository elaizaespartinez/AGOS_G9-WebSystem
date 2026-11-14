const WEATHER_ENDPOINT = "https://api.open-meteo.com/v1/forecast?latitude=13.7565&longitude=121.0583&hourly=precipitation&past_hours=1&forecast_hours=3&timezone=Asia%2FManila";

export async function getWeather() {
    const response = await fetch(WEATHER_ENDPOINT);
    if (!response.ok) throw new Error(`Open-Meteo request failed with status ${response.status}.`);

    const payload = await response.json();
    const precipitation = payload.hourly?.precipitation;
    if (!Array.isArray(precipitation) || precipitation.length === 0) {
        throw new Error("Open-Meteo returned no hourly precipitation data.");
    }

    const rainfall = precipitation.map(Number).filter(Number.isFinite);
    if (rainfall.length === 0) throw new Error("Open-Meteo returned invalid precipitation data.");

    return {
        lat: 13.7565,
        lng: 121.0583,
        peakRainfall: Math.max(...rainfall),
        lastUpdated: new Date(),
    };
}
