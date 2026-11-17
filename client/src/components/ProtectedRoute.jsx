import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <main className="flex min-h-dvh items-center justify-center bg-primary">
                <p className="text-sm font-semibold text-white">
                    Checking your session...
                </p>
            </main>
        );
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />;
}
