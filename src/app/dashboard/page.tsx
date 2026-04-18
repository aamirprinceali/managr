"use client";
// Dashboard router — loads the correct dashboard based on the user's role
// Owner (Mike) → OwnerDashboard — command center view across all homes
// Manager → ManagerDashboard — daily ops view for their home
import { useProfile } from "@/components/auth/UserProvider";
import OwnerDashboard from "./OwnerDashboard";
import ManagerDashboard from "./ManagerDashboard";

// Loading skeleton while auth resolves
function LoadingState() {
  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: "#161B22" }} />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: "#161B22" }} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-56 rounded-xl animate-pulse" style={{ background: "#161B22" }} />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { profile, loading } = useProfile();

  if (loading) return <LoadingState />;
  if (profile?.role === "owner") return <OwnerDashboard />;
  return <ManagerDashboard />;
}
