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
            gemini: (env.GEMINI_API_KEY || env.GEMINI_API)?.trim(),
            groq: (env.API_KEY || env.GROQ_API_KEY || env.GROQ_API)?.trim(),
            openrouter: (env.OPENROUTER_API_KEY || env.OPEN_ROUTER_API || env.OPENROUTER_API)?.trim(),
        },
        hotline: env.HOTLINE_PLACEHOLDER || "your local DRRM hotline",
        port: Number(env.PORT) || 3001,
        corsOrigin: env.ALLOWED_ORIGIN || "*",
        providerTimeoutMs: Number(env.PROVIDER_TIMEOUT_MS) || 8000,
        supabaseUrl: env.SUPABASE_URL?.trim().replace(/\/$/, ""),
        supabaseKey: (env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY)?.trim(),
        supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    };
}