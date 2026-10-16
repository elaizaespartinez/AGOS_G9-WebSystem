import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import logo from "../assets/agos_logo.png";
import { User, Menu, X } from "lucide-react";

const links = [
    ["Home", "/"],
    ["Flood Map", "/flood-map"],
    ["Transportation", "/transportation"],
    ["Announcements", "/announcements"],
    ["Emergency", "/emergency"],
];

export default function Navbar() {
    const [open, setOpen] = useState(false);

    return (
        <nav
            className="
                sticky top-0 z-1000 flex h-18 md:h-20 min-h-[72px]  items-center
                border-b border-gray-200 bg-white px-[5%]
                shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)]
                max-md:flex-wrap max-md:py-3"
                aria-label="Main navigation"
        >
            <NavLink
                to="/"
                onClick={() => setOpen(false)}
                className="
                    flex items-center gap-2.5
                    text-[1.1rem] font-bold text-gray-900 no-underline
                "
                aria-label="Go to homepage"
            >
                <img
                    src={logo}
                    alt="Logo"
                    className="h-14 w-auto object-contain max-md:h-12"/>
            </NavLink>

            {open && (
                <div
                    className="fixed inset-0 z-1000 bg-black/40 md:hidden"
                    onClick={() => setOpen(false)}
                    aria-hidden="true"/>
            )}

            <ul
                className={`
                    flex flex-col items-start gap-4

                    max-md:fixed max-md:top-0 max-md:right-0 max-md:left-auto max-md:z-1001
                    max-md:h-screen max-md:w-64 max-md:bg-white
                    max-md:px-5 max-md:py-4 max-md:shadow-xl
                    max-md:transition-transform max-md:duration-300
                    ${open ? "max-md:translate-x-0" : "max-md:translate-x-full max-md:invisible"}

                    md:ml-auto md:flex md:w-auto md:flex-row md:items-center
                    md:gap-[clamp(16px,2.5vw,34px)] md:p-0
                `}
            >
                <li className="flex w-full items-center justify-end gap-2 md:hidden">
                    <Link
                        to="/login"
                        onClick={() => setOpen(false)}
                        className="
                            inline-flex h-10 w-10 items-center justify-center
                            rounded-full bg-primary/10 text-text
                            hover:bg-primary/30 drop-shadow-sm
                        "
                        aria-label="Log in"
                    >
                        <User className="h-5 w-5 text-primary" />
                    </Link>

                    <button
                        type="button"
                        aria-label="Close navigation"
                        onClick={() => setOpen(false)}
                        className="
                            inline-flex cursor-pointer border-0
                            bg-primary hover:bg-primary-hover
                            rounded-md p-2
                        "
                    >
                        <X className="h-5 w-5 text-white" />
                    </button>
                </li>

                {links.map(([label, path]) => (
                    <li key={label}>
                        <NavLink
                            to={path}
                            onClick={() => setOpen(false)}
                            className={({ isActive }) =>
                                `whitespace-nowrap text-[.95rem] font-semibold no-underline hover:text-primary ${
                                    isActive ? "text-primary" : "text-text"
                                }`
                            }
                        >
                            {label}
                        </NavLink>
                    </li>
                ))}
            </ul>

            <Link
                to="/login"
                onClick={() => setOpen(false)}
                className={`
                    ml-auto md:ml-8 hidden 
                    md:inline-flex h-10 w-10 items-center justify-center
                    rounded-full bg-primary/10 text-text
                    hover:bg-primary/30 drop-shadow-sm
                    ${open ? "max-md:hidden" : ""}
                `}
                aria-label="Log in"
            >
                <User className="h-5 w-5 text-primary" />
            </Link>

            <button
                className="
                    ml-auto inline-flex cursor-pointer border-0
                 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 
                    rounded-md p-2 text-text
                    md:hidden"
                type="button"
                aria-label="Toggle navigation"
                aria-expanded={open}
                onClick={() => setOpen((isOpen) => !isOpen)}>
                {open ? (
                    <X className="h-5 w-5 text-white" />
                ) : (
                    <Menu className="h-6 w-6 text-text" />
                )}
            </button>
        </nav>
    );
}