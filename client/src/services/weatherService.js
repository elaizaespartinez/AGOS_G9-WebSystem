const WEATHER_ENDPOINT =
    "https://api.open-meteo.com/v1/forecast?latitude=13.7565&longitude=121.0583&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_hours=1&timezone=Asia%2FManila";

const weatherConditions = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    56: "Freezing drizzle",
    57: "Heavy freezing drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Heavy freezing rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Light showers",
    81: "Showers",
    82: "Heavy showers",
    85: "Snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Heavy thunderstorm with hail",
};

const getHomeWeather = async () => {
    const response = await fetch(WEATHER_ENDPOINT);
    if (!response.ok) {
        throw new Error(
            `Open-Meteo request failed with status ${response.status}.`,
        );
    }

    const payload = await response.json();
    const current = payload.current;
    const rainChance = payload.hourly?.precipitation_probability?.[0];

    if (
        !current ||
        typeof current.temperature_2m !== "number" ||
        typeof current.relative_humidity_2m !== "number" ||
        typeof current.precipitation !== "number" ||
        typeof current.weather_code !== "number" ||
        typeof current.wind_speed_10m !== "number" ||
        typeof rainChance !== "number"
    ) {
        throw new Error("Open-Meteo returned an invalid weather response.");
    }

    const now = new Date();
    const dateFormatter = new Intl.DateTimeFormat("en-PH", {
        weekday: "short",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Manila",
    });
    const timeFormatter = new Intl.DateTimeFormat("en-PH", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Manila",
    });

    return {
        temperature: `${Math.round(current.temperature_2m)}°C`,
        condition: weatherConditions[current.weather_code] || "Unknown",
        location: "Batangas City",
        date: dateFormatter.format(now),
        time: timeFormatter.format(now),
        humidity: `${Math.round(current.relative_humidity_2m)}%`,
        wind: `${Math.round(current.wind_speed_10m)} km/h`,
        rainfall: `${current.precipitation.toFixed(1)} mm`,
        rainChance: `${Math.round(rainChance)}%`,
    };
};

const WEATHER_ENDPOINT_FOR_MAP =
    "https://api.open-meteo.com/v1/forecast?latitude=13.7565&longitude=121.0583&hourly=precipitation&past_hours=1&forecast_hours=3&timezone=Asia%2FManila";

export async function getWeather() {
    const response = await fetch(WEATHER_ENDPOINT_FOR_MAP);
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

export { getHomeWeather };
