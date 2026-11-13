import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import useIsAdmin from "../hooks/useIsAdmin";



export default function AdminRoute() {
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  const isAdminPreview =
    import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === "true";

  if (loading || adminLoading) {
    return (
      <div className="grid min-h-dvh place-items-center">
        Checking administrator access…
      </div>
    );
  }

  if (isAdminPreview) return <Outlet />;
  if (!user) return <Navigate to="/admin/login" replace />;

  return isAdmin ? <Outlet /> : <Navigate to="/admin/not-authorized" replace />;
}