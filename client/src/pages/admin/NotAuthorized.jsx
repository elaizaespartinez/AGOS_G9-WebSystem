import { Link } from "react-router-dom";

export default function NotAuthorized() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background p-6 text-center">
      <div>
        <h1 className="text-3xl font-extrabold text-secondary">Access denied</h1>
        <p className="mt-2 text-text/70">
          Administrator access is required to view this page.
        </p>
        <Link
          className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 font-semibold text-white"
          to="/"
        >
          Return to AGOS
        </Link>
      </div>
    </main>
  );
}