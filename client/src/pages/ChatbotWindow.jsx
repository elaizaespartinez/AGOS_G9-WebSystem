import { useEffect, useRef, useState } from "react";
import { CircleAlert, SendHorizontal, MoveRight, Paperclip, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import chatbotIcon from "../assets/chatbot-icon.png";
import { askChat } from "../services/chat";
import "../chatbot.css";

const INITIAL_MESSAGE = {
    role: "assistant",
    content: "Hi, I'm Agos. I can help with flood safety, disaster preparedness, evacuation planning, and other DRRM concerns. What do you need help with?",
    timestamp: new Date(),
};

const QUICK_PROMPTS = [
    "What should I prepare before heavy rain?",
    "What should I do if floodwater is rising?",
];

function formatTime(timestamp) {
    return new Intl.DateTimeFormat("en-PH", {
        hour: "numeric",
        minute: "2-digit",
    }).format(timestamp instanceof Date ? timestamp : new Date(timestamp));
}

function ChatbotWindow({ isOpen }) {
    const messagesRef = useRef(null);
    const shouldScrollRef = useRef(false);
    const isNearBottomRef = useRef(true);
    const [messages, setMessages] = useState([INITIAL_MESSAGE]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    function scrollMessagesToBottom(behavior = "smooth") {
        const container = messagesRef.current;
        if (!container) return;
        container.scrollTo({ top: container.scrollHeight, behavior });
    }

    function handleMessagesScroll() {
        const container = messagesRef.current;
        if (!container) return;
        isNearBottomRef.current = container.scrollHeight - container.scrollTop - container.clientHeight < 48;
    }

    useEffect(() => {
        const container = messagesRef.current;
        if (!container) return undefined;

        const resizeObserver = new ResizeObserver(() => {
            if (shouldScrollRef.current || isNearBottomRef.current) {
                scrollMessagesToBottom();
                shouldScrollRef.current = false;
            }
        });
        const mutationObserver = new MutationObserver(() => {
            if (shouldScrollRef.current || isNearBottomRef.current) {
                scrollMessagesToBottom();
                shouldScrollRef.current = false;
            }
        });
        resizeObserver.observe(container);
        mutationObserver.observe(container, { childList: true, subtree: true, characterData: true });
        return () => {
            resizeObserver.disconnect();
            mutationObserver.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        shouldScrollRef.current = true;
        requestAnimationFrame(() => scrollMessagesToBottom());
    }, [isOpen]);

    useEffect(() => {
        if (shouldScrollRef.current || isNearBottomRef.current) {
            requestAnimationFrame(() => {
                scrollMessagesToBottom();
                shouldScrollRef.current = false;
            });
        }
    }, [messages, isLoading, error]);

    async function handleSubmit(event, prompt = input) {
        event?.preventDefault();
        const text = prompt.trim();

        if (!text || isLoading) return;

        const userMessage = { role: "user", content: text, timestamp: new Date() };
        const conversation = [...messages, userMessage];

        shouldScrollRef.current = true;
        setMessages(conversation);
        setInput("");
        setError("");
        setIsLoading(true);

        try {
            const result = await askChat(conversation);
            setMessages((currentMessages) => [
                ...currentMessages,
                { role: "assistant", content: result.reply, provider: result.provider, timestamp: new Date() },
            ]);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <section
            className={`chatbot-panel ${isOpen ? "chatbot-panel-open" : "chatbot-panel-closed"}`}
            aria-hidden={!isOpen}
        >
            <header className="chatbot-header">
                <img src={chatbotIcon} alt="" className="chatbot-header-avatar" />
                <div>
                    <h2>Agos</h2>
                    <p><span className="chatbot-online-dot" /> Online</p>
                </div>
            </header>

            <div ref={messagesRef} className="chatbot-messages" onScroll={handleMessagesScroll}>
                {messages.map((message, index) => (
                    <div
                        key={`${message.role}-${index}`}
                        className={`chatbot-message-row ${message.role === "user" ? "chatbot-message-user" : "chatbot-message-bot"}`}
                    >
                        {message.role === "assistant" && <img src={chatbotIcon} alt="" className="chatbot-message-avatar" />}
                        <div>
                            <div className="chatbot-bubble">{message.content}</div>
                            <span className="chatbot-timestamp">{formatTime(message.timestamp)}</span>
                        </div>
                        {message.role === "user" && <span className="chatbot-user-avatar"><UserRound size={14} /></span>}
                    </div>
                ))}

                {isLoading && (
                    <div className="chatbot-message-row chatbot-message-bot">
                        <img src={chatbotIcon} alt="" className="chatbot-message-avatar" />
                        <div className="chatbot-bubble chatbot-thinking" aria-label="Agos is typing">
                            <span /><span /><span />
                        </div>
                    </div>
                )}

                {messages.length === 1 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {QUICK_PROMPTS.map((prompt) => (
                            <button
                                key={prompt}
                                type="button"
                                onClick={(event) => handleSubmit(event, prompt)}
                                className="chatbot-prompt"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                )}

                {error && (
                    <p className="chatbot-error">
                        {error}
                    </p>
                )}
            </div>

            <form className="chatbot-input-row" onSubmit={handleSubmit}>
                <button type="button" className="chatbot-attachment" aria-label="Attach a file">
                    <Paperclip size={18} />
                </button>
                <input
                    type="text" id="chat-input"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    disabled={isLoading}
                    placeholder="Type a message..."
                    className="chatbot-input"
                />

                <button
                    type="submit"
                    aria-label="Send message"
                    disabled={isLoading || !input.trim()}
                    className="chatbot-send"
                >
                    <SendHorizontal size={19} />
                </button>
            </form>

            <div className="chatbot-emergency">
                <CircleAlert size={20} />

                <p>In an immediate emergency, contact your local emergency hotline.</p>

                <Link to="/emergency" className="chatbot-emergency-link">
                    View Emergency Hotlines <MoveRight size={16} />
                </Link>
            </div>
        </section>
    );
}

export default ChatbotWindow;