const PROVIDERS = ["gemini", "groq", "openrouter"];

export function loadConfig(env = process.env) {
    const providerOrder = (env.PROVIDER_ORDER || "groq,gemini,openrouter")
        .split(",")
        .map((provider) => provider.trim().toLowerCase())
        .filter((provider, index, values) => PROVIDERS.includes(provider) && values.indexOf(provider) === index);

    return {
        providerOrder,
        models: {
            gemini: env.GEMINI_MODEL || "gemini-3.8-flash",
            groq: env.GROQ_MODEL || "openai/gpt-oss-20b",
            openrouter: env.OPENROUTER_MODEL || "qwen/qwen3.8-27b:free",
        },
        keys: {
            gemini: env.GEMINI_API_KEY?.trim(),
            groq: env.GROQ_API_KEY?.trim(),
            openrouter: env.OPENROUTER_API_KEY?.trim(),
        },
        hotline: env.HOTLINE_PLACEHOLDER || "your local DRRM hotline",
        port: Number(env.PORT) || 3001,
        corsOrigin: env.CORS_ORIGIN || "http://localhost:5173",
        providerTimeoutMs: Number(env.PROVIDER_TIMEOUT_MS) || 8000,
    };
}