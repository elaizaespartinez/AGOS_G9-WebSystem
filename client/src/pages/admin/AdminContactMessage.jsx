import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
    Search,
    Mail,
    CheckCircle,
    MessageSquare,
    Eye,
    X,
    MapPin,
    Phone,
    CalendarDays,
    UserRound,
    Inbox,
} from "lucide-react";

// Format database status
const formatStatus = (status) => {
    return String(status || "unread").charAt(0).toUpperCase() +
        String(status || "unread").slice(1);
};

// Format date
const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

// Format Supabase data
const formatMessage = (item) => ({
    id: item.id,
    name: item.name || "",
    email: item.email || "",
    number: item.phone_number || "",
    location: item.location || "",
    message: item.message || "",
    status: formatStatus(item.status),
    date: formatDate(item.created_at),
});

const statusStyles = {
    Unread: "bg-blue-100 text-blue-700",
    Read: "bg-gray-100 text-gray-600",
    Resolved: "bg-green-100 text-green-700",
};

function AdminContactMessages() {
    const [messages, setMessages] = useState([]);
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const filters = ["All", "Unread", "Read", "Resolved"];

    // Fetch messages
    const fetchMessages = async () => {
        setIsLoading(true);
        setError("");

        try {
            const { data, error } = await supabase
                .from("contact_messages")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            setMessages((data || []).map(formatMessage));
        } catch (err) {
            console.error("Failed to fetch contact messages:", err);
            setError(
                "Unable to load contact messages. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    // Filter and search messages
    const filteredMessages = useMemo(() => {
        return messages.filter((message) => {
            const matchesFilter =
                activeFilter === "All" ||
                message.status === activeFilter;

            const searchText = search.toLowerCase();

            const matchesSearch = [
                message.name,
                message.email,
                message.number,
                message.location,
                message.message,
            ].some((value) =>
                String(value || "").toLowerCase().includes(searchText)
            );

            return matchesFilter && matchesSearch;
        });
    }, [messages, search, activeFilter]);

    // Summary counts
    const unreadCount = messages.filter(
        (message) => message.status === "Unread"
    ).length;

    const resolvedCount = messages.filter(
        (message) => message.status === "Resolved"
    ).length;

    // Update message status in Supabase
    const updateStatus = async (id, status) => {
        setError("");

        try {
            const { error } = await supabase
                .from("contact_messages")
                .update({
                    status: status.toLowerCase(),
                })
                .eq("id", id);

            if (error) throw error;

            setMessages((prev) =>
                prev.map((message) =>
                    message.id === id
                        ? { ...message, status }
                        : message
                )
            );

            setSelectedMessage((prev) =>
                prev && prev.id === id
                    ? { ...prev, status }
                    : prev
            );
        } catch (err) {
            console.error("Failed to update message status:", err);
            setError(
                "Unable to update message status. Please try again."
            );
        }
    };

    // Open message and automatically mark unread as read
    const openMessage = (message) => {
        setSelectedMessage(message);

        if (message.status === "Unread") {
            updateStatus(message.id, "Read");
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6">

            {/* Page heading */}
            <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                    Communications
                </p>

                <h1 className="mt-1 text-2xl font-extrabold text-text md:text-3xl">
                    Contact Messages
                </h1>

                <p className="mt-2 text-sm text-text/60">
                    View and manage messages submitted through the Contact Us page.
                </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <SummaryCard
                    label="Total Messages"
                    value={messages.length}
                    icon={MessageSquare}
                />

                <SummaryCard
                    label="Unread Messages"
                    value={unreadCount}
                    icon={Mail}
                />

                <SummaryCard
                    label="Resolved Messages"
                    value={resolvedCount}
                    icon={CheckCircle}
                />
            </div>

            {/* Inbox */}
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-card shadow-card">

                {/* Search and filters */}
                <div className="space-y-4 border-b border-gray-200 p-4 md:p-5">

                    <div className="relative">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, email, location, or message..."
                            className="w-full rounded-lg border border-gray-200 bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                        />
                    </div>

                    {/* Filter buttons */}
                    <div className="flex flex-wrap gap-2">
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                type="button"
                                onClick={() => setActiveFilter(filter)}
                                className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                                    activeFilter === filter
                                        ? "bg-primary text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                {filter}
                                {filter === "Unread" && unreadCount > 0 && (
                                    <span className="ml-2">
                                        ({unreadCount})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Message list header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
                    <h2 className="text-sm font-bold text-text">
                        Inbox
                    </h2>

                    <span className="text-xs text-text">
                        {filteredMessages.length} messages
                    </span>
                </div>

                {/* Loading, error, empty, and message states */}
                {isLoading ? (
                    <div className="py-16 text-center">
                        <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
                        <p className="text-sm text-gray-500">
                            Loading messages...
                        </p>
                    </div>
                ) : error && messages.length === 0 ? (
                    <div className="py-16 text-center">
                        <Inbox
                            size={40}
                            className="mx-auto mb-3 text-gray-300"
                        />

                        <p className="font-semibold text-gray-700">
                            Unable to load messages
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={fetchMessages}
                            className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-hover"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                        <Inbox
                            size={40}
                            className="mb-3 text-gray-300"
                        />

                        <h3 className="font-bold text-text">
                            No messages found
                        </h3>

                        <p className="mt-1 text-xs text-text/50">
                            {search || activeFilter !== "All"
                                ? "Try changing your search or filter."
                                : "Messages will appear here when users contact AGOS."
                            }
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredMessages.map((message) => (
                            <button
                                key={message.id}
                                type="button"
                                onClick={() => openMessage(message)}
                                className={`flex w-full flex-col gap-3 p-4 text-left transition hover:bg-gray-50 md:flex-row md:items-center md:justify-between md:px-5 ${
                                    message.status === "Unread"
                                        ? "bg-blue-50/40"
                                        : ""
                                }`}
                            >
                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <UserRound size={19} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className={`text-sm text-text ${
                                                    message.status === "Unread"
                                                        ? "font-extrabold"
                                                        : "font-semibold"
                                                }`}
                                            >
                                                {message.name}
                                            </span>

                                            <span
                                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                                    statusStyles[message.status]
                                                }`}
                                            >
                                                {message.status}
                                            </span>
                                        </div>

                                        <p className="mt-1 text-xs text-text/60">
                                            {message.email}
                                        </p>

                                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-text/70">
                                            {message.message}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center justify-between gap-4 md:flex-col md:items-end">
                                    <span className="text-[11px] text-text/50">
                                        {message.date}
                                    </span>

                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-secondary">
                                        <Eye size={14} />
                                        View
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Status update error */}
                {error && messages.length > 0 && (
                    <div className="border-t border-red-100 bg-red-50 px-5 py-3">
                        <p className="text-xs text-red-600">
                            {error}
                        </p>
                    </div>
                )}
            </section>

            {/* Message details modal */}
            {selectedMessage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setSelectedMessage(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="message-title"
                        onClick={(e) => e.stopPropagation()}
                        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-card p-5 shadow-xl md:p-7"
                    >
                        {/* Modal heading */}
                        <div className="mb-5 flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                                    Message Details
                                </p>

                                <h2
                                    id="message-title"
                                    className="mt-1 text-xl font-extrabold text-text"
                                >
                                    {selectedMessage.name}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedMessage(null)}
                                aria-label="Close dialog"
                                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Status and date */}
                        <div className="mb-5 flex flex-wrap items-center gap-2">
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    statusStyles[selectedMessage.status]
                                }`}
                            >
                                {selectedMessage.status}
                            </span>

                            <span className="text-xs text-text/50">
                                {selectedMessage.date}
                            </span>
                        </div>

                        {/* Sender information */}
                        <div className="space-y-4 border-y border-gray-200 py-5">
                            <DetailRow
                                icon={UserRound}
                                label="Full Name"
                                value={selectedMessage.name}
                            />

                            <DetailRow
                                icon={Mail}
                                label="Email Address"
                                value={selectedMessage.email}
                            />

                            <DetailRow
                                icon={Phone}
                                label="Contact Number"
                                value={selectedMessage.number}
                            />

                            <DetailRow
                                icon={MapPin}
                                label="Location"
                                value={selectedMessage.location}
                            />

                            <DetailRow
                                icon={CalendarDays}
                                label="Date Submitted"
                                value={selectedMessage.date}
                            />
                        </div>

                        {/* Message content */}
                        <div className="py-5">
                            <h3 className="mb-2 text-sm font-bold text-text">
                                Message
                            </h3>

                            <div className="whitespace-pre-wrap rounded-lg bg-background p-4 text-sm leading-relaxed text-text/80">
                                {selectedMessage.message}
                            </div>
                        </div>

                        {/* Modal actions */}
                        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-between">
                            <button
                                type="button"
                                onClick={() => {
                                    updateStatus(
                                        selectedMessage.id,
                                        selectedMessage.status === "Unread"
                                            ? "Read"
                                            : "Unread"
                                    );
                                }}
                                className="rounded-lg border border-gray-300 px-4 py-2.5 text-xs font-bold text-text hover:bg-gray-100"
                            >
                                {selectedMessage.status === "Unread"
                                    ? "Mark as Read"
                                    : "Mark as Unread"
                                }
                            </button>

                            {selectedMessage.status !== "Resolved" && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        updateStatus(
                                            selectedMessage.id,
                                            "Resolved"
                                        )
                                    }
                                    className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-primary-hover"
                                >
                                    <CheckCircle size={15} />
                                    Mark as Resolved
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Summary card component
function SummaryCard({ label, value, icon: Icon }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-card p-4 shadow-card">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-text/60">
                    {label}
                </p>

                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon size={18} />
                </div>
            </div>

            <p className="mt-3 text-2xl font-extrabold text-text">
                {value}
            </p>
        </div>
    );
}

// Message detail row
function DetailRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <Icon size={17} className="mt-0.5 shrink-0 text-text/50" />

            <div className="min-w-0">
                <p className="text-[11px] font-semibold text-text/50">
                    {label}
                </p>

                <p className="break-words text-sm font-medium text-text">
                    {value}
                </p>
            </div>
        </div>
    );
}

export default AdminContactMessages;
