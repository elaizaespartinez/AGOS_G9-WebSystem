export default function SectionPanel({ title, description, actions, children, className = "" }) {
    return (
        <section className={`overflow-hidden rounded-xl bg-white shadow-card ${className}`}>
            {(title || description || actions) && (
                <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
                    <div>
                        {title && <h2 className="font-extrabold text-secondary">{title}</h2>}
                        {description && <p className="mt-1 text-xs leading-relaxed text-text/60">{description}</p>}
                    </div>
                    {actions}
                </header>
            )}
            {children}
        </section>
    );
}
