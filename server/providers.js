import { DRRM_SYSTEM_PROMPT } from "./systemPrompt.js";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const PROVIDER_URLS = {
    groq: "https://api.groq.com/openai/v1/chat/completions",
    openrouter: "https://openrouter.ai/api/v1/chat/completions",
};

export class ProviderError extends Error {
    constructor(provider, status, message, retryable = false) {
        super(message);
        this.name = "ProviderError";
        this.provider = provider;
        this.status = status;
        this.retryable = retryable;
    }
}

function isRetryableStatus(status) {
    return [429, 500, 502, 503, 504].includes(status);
}

async function requestJson(url, options, provider, fetchImpl, timeoutMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetchImpl(url, { ...options, signal: controller.signal });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new ProviderError(
                provider,
                response.status,
                data.error?.message || "Provider request failed",
                isRetryableStatus(response.status),
            );
        }

        return data;
    } catch (error) {
        if (error instanceof ProviderError) throw error;
        const isTimeout = error.name === "AbortError";
        throw new ProviderError(provider, 0, isTimeout ? "Request timed out" : "Network request failed", true);
    } finally {
        clearTimeout(timeout);
    }
}

function openAiMessages(messages) {
    return [
        { role: "system", content: DRRM_SYSTEM_PROMPT },
        ...messages.map(({ role, content }) => ({
            role: role === "assistant" ? "assistant" : "user",
            content,
        })),
    ];
}

function extractOpenAiReply(data, provider) {
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new ProviderError(provider, 200, "Provider returned no text", true);
    return reply;
}

export function createProviderRequests({ config, fetchImpl = fetch, timeoutMs = config.providerTimeoutMs }) {
    return {
        async gemini(messages) {
            const contents = messages.map(({ role, content }) => ({
                role: role === "assistant" ? "model" : "user",
                parts: [{ text: content }],
            }));
            const data = await requestJson(
                `${GEMINI_URL}/${encodeURIComponent(config.models.gemini)}:generateContent?key=${encodeURIComponent(config.keys.gemini)}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: DRRM_SYSTEM_PROMPT }] },
                        contents,
                        generationConfig: { temperature: 0.2, maxOutputTokens: 900 },
                    }),
                },
                "gemini",
                fetchImpl,
                timeoutMs,
            );
            const reply = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
            if (!reply) throw new ProviderError("gemini", 200, "Provider returned no text", true);
            return reply;
        },

        async groq(messages) {
            const data = await requestJson(
                PROVIDER_URLS.groq,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${config.keys.groq}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: config.models.groq,
                        messages: openAiMessages(messages),
                        temperature: 0.2,
                        max_tokens: 900,
                    }),
                },
                "groq",
                fetchImpl,
                timeoutMs,
            );
            return extractOpenAiReply(data, "groq");
        },

        async openrouter(messages) {
            const data = await requestJson(
                PROVIDER_URLS.openrouter,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${config.keys.openrouter}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:5173",
                        "X-OpenRouter-Title": "AGOS DRRM Assistant",
                    },
                    body: JSON.stringify({
                        model: config.models.openrouter,
                        messages: openAiMessages(messages),
                        temperature: 0.2,
                        max_tokens: 900,
                    }),
                },
                "openrouter",
                fetchImpl,
                timeoutMs,
            );
            return extractOpenAiReply(data, "openrouter");
        },
    };
}