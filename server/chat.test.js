import test from "node:test";
import assert from "node:assert/strict";
import { getChatReply } from "./chat.js";
import { ProviderError } from "./providers.js";

const config = {
    providerOrder: ["groq", "gemini", "openrouter"],
    keys: { gemini: "test", groq: "test", openrouter: "test" },
    hotline: "123-4567",
};

const messages = [{ role: "user", content: "What should I do before a typhoon?" }];

test("falls back to Gemini after Groq temporary failures", async () => {
    let groqAttempts = 0;
    const result = await getChatReply(messages, {
        config,
        sleep: async () => {},
        providers: {
            groq: async () => {
                groqAttempts += 1;
                throw new ProviderError("groq", 503, "unavailable", true);
            },
            gemini: async () => "Prepare a go-bag and follow official advisories.",
        },
    });

    assert.equal(groqAttempts, 2);
    assert.deepEqual(result, {
        reply: "Prepare a go-bag and follow official advisories.",
        provider: "gemini",
    });
});

test("returns a friendly configured message when all providers fail", async () => {
    const result = await getChatReply(messages, {
        config,
        sleep: async () => {},
        providers: {
            groq: async () => { throw new ProviderError("groq", 503, "unavailable", true); },
            gemini: async () => { throw new ProviderError("gemini", 401, "bad key"); },
            openrouter: async () => { throw new ProviderError("openrouter", 400, "bad request"); },
        },
    });

    assert.equal(result.provider, "local-safety-guide");
    assert.match(result.reply, /go-bag|PAGASA/);
});