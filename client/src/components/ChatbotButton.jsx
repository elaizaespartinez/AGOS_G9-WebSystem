import chatbotIcon from "../assets/chatbot-icon.png";

function ChatbotButton({ onClick, isOpen }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={isOpen ? "Close AGOS Assistant" : "Open AGOS Assistant"}
            className="
                fixed
                bottom-6
                right-3
                md:right-6
                z-[1101]
                flex
                items-center
                gap-1
                rounded-2xl
                rounded-br-xs
                bg-white
                px-2
                py-1
                text-text
                shadow-elevated
                chatbot-toggle
            "
        >
            <img
                src={chatbotIcon}
                alt=""
                className="h-13 w-13 shrink-0 object-contain"
            />

            <span className="hidden text-xs font-medium sm:text-sm md:block">
                {isOpen ? "Close" : "Need help?"}
            </span>
        </button>
    );
}

export default ChatbotButton;