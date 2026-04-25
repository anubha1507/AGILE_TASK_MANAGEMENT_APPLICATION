import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Loader2 } from "lucide-react";
import { ManagerDashboard } from "./ManagerDashboard";
import { HRDashboard } from "./HRDashboard";
import { TeamLeaderDashboard } from "./TeamLeaderDashboard";
import { MemberDashboard } from "./MemberDashboard";

export function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        setRole(data?.role || "Member");
      }
      setLoading(false);
    }
    fetchRole();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (role === "Manager") return <ManagerDashboard />;
  if (role === "Team Leader") return <TeamLeaderDashboard />;
  if (role === "HR") return <HRDashboard />;
  return <MemberDashboard />;
}
