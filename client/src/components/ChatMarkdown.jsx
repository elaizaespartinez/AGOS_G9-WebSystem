import { Fragment } from "react";

/**
 * Renders the small markdown subset Agos replies with: headings, bold,
 * italics, bullet and numbered lists (one nested level) and "> " callouts.
 * It builds React elements directly, so reply text is never injected as HTML.
 */

const URGENT_PATTERN = /\b(911|emergency|danger|immediately|now|evacuate|rising fast)\b/i;

function renderInline(text) {
    return text
        .split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g)
        .filter(Boolean)
        .map((part, index) => {
            if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={index}>{part.slice(2, -2)}</strong>;
            if (/^\*[^*]+\*$/.test(part)) return <em key={index}>{part.slice(1, -1)}</em>;
            return <Fragment key={index}>{part}</Fragment>;
        });
}

function parseBlocks(source) {
    const blocks = [];
    let paragraph = [];
    let list = null;
    let quote = null;

    const flushParagraph = () => {
        if (!paragraph.length) return;
        const text = paragraph.join(" ");
        // A line that is entirely bold acts as a heading.
        const boldOnly = text.match(/^\*\*([^*]+)\*\*:?$/);
        blocks.push(boldOnly ? { type: "heading", text: boldOnly[1] } : { type: "paragraph", text });
        paragraph = [];
    };
    const flushList = () => {
        if (list) blocks.push({ type: "list", ...list });
        list = null;
    };
    const flushQuote = () => {
        if (quote) blocks.push({ type: "callout", text: quote.join(" ") });
        quote = null;
    };
    const flushAll = () => {
        flushParagraph();
        flushList();
        flushQuote();
    };

    for (const rawLine of source.replace(/\r/g, "").split("\n")) {
        const line = rawLine.replace(/\s+$/, "");

        if (!line.trim()) {
            // Keep an open list so numbered items separated by blank lines stay together.
            flushParagraph();
            flushQuote();
            continue;
        }

        const heading = line.match(/^\s{0,3}#{1,4}\s+(.+)$/);
        if (heading) {
            flushAll();
            blocks.push({ type: "heading", text: heading[1].replace(/\*\*/g, "") });
            continue;
        }

        const quoted = line.match(/^\s{0,3}>\s?(.*)$/);
        if (quoted) {
            flushParagraph();
            flushList();
            (quote ||= []).push(quoted[1]);
            continue;
        }

        const item = line.match(/^(\s*)([-*\u2022]|\d+[.)])\s+(.+)$/);
        if (item) {
            flushParagraph();
            flushQuote();
            const ordered = /\d/.test(item[2]);

            if (item[1].length >= 2 && list?.items.length) {
                // Indented line: nested under the previous item.
                list.items.at(-1).children.push(item[3]);
            } else {
                if (!list || list.ordered !== ordered) {
                    flushList();
                    list = { ordered, start: ordered ? parseInt(item[2], 10) : 1, items: [] };
                }
                list.items.push({ text: item[3], children: [] });
            }
            continue;
        }

        flushList();
        flushQuote();
        paragraph.push(line.trim());
    }

    flushAll();
    return blocks;
}

function ChatMarkdown({ content }) {
    const blocks = parseBlocks(content || "");

    return (
        <div className="chat-md">
            {blocks.map((block, index) => {
                if (block.type === "heading") {
                    return <h4 key={index} className="chat-md-heading">{renderInline(block.text)}</h4>;
                }

                if (block.type === "callout") {
                    const urgent = URGENT_PATTERN.test(block.text);
                    return (
                        <aside
                            key={index}
                            role="note"
                            className={`chat-md-callout ${urgent ? "chat-md-callout-urgent" : ""}`}
                        >
                            {renderInline(block.text)}
                        </aside>
                    );
                }

                if (block.type === "list") {
                    const ListTag = block.ordered ? "ol" : "ul";
                    return (
                        <ListTag
                            key={index}
                            className="chat-md-list"
                            {...(block.ordered ? { start: block.start } : {})}
                        >
                            {block.items.map((item, itemIndex) => (
                                <li key={itemIndex}>
                                    {renderInline(item.text)}
                                    {item.children.length > 0 && (
                                        <ul className="chat-md-sublist">
                                            {item.children.map((child, childIndex) => (
                                                <li key={childIndex}>{renderInline(child)}</li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ListTag>
                    );
                }

                return <p key={index}>{renderInline(block.text)}</p>;
            })}
        </div>
    );
}

export default ChatMarkdown;