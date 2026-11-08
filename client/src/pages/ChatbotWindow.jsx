import { useState } from "react";
import { CircleAlert, SendHorizontal, MoveRight } from "lucide-react";
import { Link } from "react-router-dom";
import chatbotIcon from "../assets/chatbot-icon.png";
import { askChat } from "../services/chat";

const INITIAL_MESSAGE = {
    role: "assistant",
    content: "Hi, I'm Agos. I can help with flood safety, disaster preparedness, evacuation planning, and other DRRM concerns. What do you need help with?",
};

const QUICK_PROMPTS = [
    "What should I prepare before heavy rain?",
    "What should I do if floodwater is rising?",
];

function ChatbotWindow() {
    const [messages, setMessages] = useState([INITIAL_MESSAGE]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event, prompt = input) {
        event?.preventDefault();
        const text = prompt.trim();

        if (!text || isLoading) return;

        const userMessage = { role: "user", content: text };
        const conversation = [...messages, userMessage];

        setMessages(conversation);
        setInput("");
        setError("");
        setIsLoading(true);

        try {
            const result = await askChat(conversation);
            setMessages((currentMessages) => [
                ...currentMessages,
                { role: "assistant", content: result.reply, provider: result.provider },
            ]);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <section
            className="
                fixed
                top-24
                right-4
                bottom-24
                left-4
                z-[1100]
                flex
                flex-col
                rounded-xl
                bg-white
                overflow-hidden
                shadow-elevated

                md:top-20
                md:right-6
                md:bottom-24
                md:left-auto
                md:w-[min(90vw,60rem)]
            "
        >
            {/* Header */}
            <header className="shrink-0 border-b p-2 flex items-center gap-2">
                <img src={chatbotIcon} alt="Chatbot Icon" className="h-8 w-auto object-contain"></img>
                <h2 className="">
                    Agos
                </h2>
            </header>

            {/* Chat Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
                {messages.map((message, index) => (
                    <div
                        key={`${message.role}-${index}`}
                        className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                            message.role === "user"
                                ? "ml-auto bg-primary text-white"
                                : "bg-white text-text shadow-card"
                        }`}
                    >
                        {message.content}
                        {message.provider && message.provider !== "local-safety-guide" && (
                            <span className="mt-1 block text-[10px] opacity-60">
                                via {message.provider}
                            </span>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="max-w-[85%] rounded-lg bg-white px-3 py-2 text-sm text-text shadow-card">
                        Agos is checking that for you...
                    </div>
                )}

                {messages.length === 1 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {QUICK_PROMPTS.map((prompt) => (
                            <button
                                key={prompt}
                                type="button"
                                onClick={(event) => handleSubmit(event, prompt)}
                                className="rounded-full border border-primary/40 bg-white px-3 py-2 text-left text-xs text-primary hover:bg-primary/10"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                )}

                {error && (
                    <p className="rounded-lg bg-red-100 p-3 text-sm text-red-700">
                        {error}
                    </p>
                )}
            </div>

            {/* Message Input */}
            <form className="flex shrink-0 gap-2 border-t p-2" onSubmit={handleSubmit}>
                <input
                    type="text" id="chat-input"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    disabled={isLoading}
                    placeholder="Type a message..."
                    className="
                        min-w-0
                        flex-1
                        rounded-input
                        border
                        px-3
                        py-2
                        outline-none
                        focus:border-primary
                    "
                />

                <button
                    type="submit"
                    aria-label="Send message"
                    disabled={isLoading || !input.trim()}
                    className="
                        flex
                        shrink-0
                        items-center
                        justify-center
                        rounded-button
                        px-4
                        py-2
                        text-primary
                        hover:bg-primary/10
                    "
                >
                    <SendHorizontal className="h-5 w-5" />
                </button>
            </form>

            {/* Emergency Notice */}
            <div className="shrink-0 border-t bg-red-50 p-3 ">
                <div className="flex items-start gap-2">
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

                    <div className="min-w-0">
                        <p className="text-sm text-red-500">
                            In an immediate emergency, contact your local
                            emergency hotline.
                        </p>

                        <Link
                            to="/emergency"
                            className="
                                mt-1
                                inline-flex
                                items-center
                                gap-1
                                text-sm
                                font-medium
                                text-red-600
                                hover:underline
                            "
                        >
                            View Emergency Hotlines
                            <MoveRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default ChatbotWindow;