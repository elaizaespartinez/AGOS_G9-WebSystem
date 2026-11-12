import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

export default function useIsAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const checkAdmin = async () => {
      if (authLoading) return;

      if (!user?.id) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error("useIsAdmin error:", error);
        setIsAdmin(false);
      } else {
        setIsAdmin(String(data?.role || "").toLowerCase() === "admin");
      }

      setLoading(false);
    };

    checkAdmin();

    return () => {
      active = false;
    };
  }, [user?.id, authLoading]);

  return { isAdmin, loading };
}