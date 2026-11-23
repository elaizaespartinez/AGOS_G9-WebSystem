import { loadConfig } from "./config.js";
import { createProviderRequests, ProviderError } from "./providers.js";
import { getLocalReply } from "./localReply.js";

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_TOTAL_LENGTH = 20000;
const RETRIES_PER_PROVIDER = 1;

export function normalizeMessages(messages) {
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
        throw new Error("Conversation must contain between 1 and 20 messages.");
    }

    let totalLength = 0;
    const normalized = messages.map((message) => {
        if (!message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string") {
            throw new Error("Each message must have a user or assistant role and text content.");
        }

        const content = message.content.trim();
        if (!content || content.length > MAX_MESSAGE_LENGTH) {
            throw new Error(`Each message must be between 1 and ${MAX_MESSAGE_LENGTH} characters.`);
        }

        totalLength += content.length;
        return { role: message.role, content };
    });

    if (totalLength > MAX_TOTAL_LENGTH) {
        throw new Error(`Conversation must be shorter than ${MAX_TOTAL_LENGTH} characters.`);
    }

    return normalized.slice(-MAX_MESSAGES);
}

function wait(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function getChatReply(messages, options = {}) {
    const config = options.config || loadConfig();
    const normalizedMessages = normalizeMessages(messages);
    const providers = options.providers || createProviderRequests({ config });
    const sleep = options.sleep || wait;

    for (const provider of config.providerOrder) {
        if (!config.keys[provider] && !options.providers?.[provider]) continue;

        for (let attempt = 0; attempt <= RETRIES_PER_PROVIDER; attempt += 1) {
            try {
                const reply = await providers[provider](normalizedMessages);
                return { reply, provider };
            } catch (error) {
                const providerError = error instanceof ProviderError
                    ? error
                    : new ProviderError(provider, 0, "Unexpected provider error", true);
                const shouldRetry = providerError.retryable && attempt < RETRIES_PER_PROVIDER;

                if (shouldRetry) {
                    await sleep(1000 * (2 ** attempt));
                } else {
                    console.error(`[${provider}] request failed (${providerError.status || "network"}); moving to the next provider.`);
                    break;
                }
            }
        }
    }

    return { reply: getLocalReply(normalizedMessages, config.hotline), provider: "local-safety-guide" };
}