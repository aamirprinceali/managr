"use client";
import { useEffect, useState } from "react";
import HomeCard from "@/components/homes/HomeCard";
import HomeListRow from "@/components/homes/HomeListRow";
import AddHomeDialog from "@/components/homes/AddHomeDialog";
import { Building2, LayoutGrid, List, Users, DoorOpen, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useProfile } from "@/components/auth/UserProvider";
import { useRouter } from "next/navigation";

type Home = {
  id: string;
  name: string;
  address: string | null;
  bed_count: number;
  house_manager_name: string | null;
  residents: { id: string; flag: string }[];
};

export default function HomesPage() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [view, setView] = useState<"card" | "list">("card");
  const [loading, setLoading] = useState(true);
  const { profile } = useProfile();
  const router = useRouter();

  // Managers go straight to their home — this page is for the owner
  useEffect(() => {
    if (profile?.role === "manager" && profile?.home_id) {
      router.replace(`/homes/${profile.home_id}`);
    }
  }, [profile, router]);

  async function loadHomes() {
    const supabase = createClient();
    let query = supabase.from("homes").select("*, residents(id, flag)").order("name");
    // Managers only see their assigned home
    if (profile?.role === "manager" && profile?.home_id) {
      query = supabase.from("homes").select("*, residents(id, flag)").eq("id", profile.home_id);
    }
    const { data } = await query;
    setHomes((data as Home[]) ?? []);
    setLoading(false);
  }

  // BUG FIX: Always load homes — don't wait for profile (profile may never load if
  // profiles table isn't set up yet). Re-runs when profile changes for role filtering.
  useEffect(() => {
    loadHomes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const totalResidents = homes.reduce((s, h) => s + h.residents.length, 0);
  const totalBeds = homes.reduce((s, h) => s + (h.bed_count || 0), 0);
  const totalVacancies = homes.reduce((s, h) => s + Math.max(0, (h.bed_count || 0) - h.residents.length), 0);
  const totalFlagged = homes.reduce((s, h) => s + h.residents.filter(r => r.flag === "Red").length, 0);

  const stats = [
    { label: "Total Homes", value: homes.length, icon: Building2, color: "#60A5FA", bg: "rgba(59,130,246,0.12)" },
    { label: "Residents", value: totalResidents, icon: Users, color: "#64748B", bg: "rgba(100,116,139,0.08)" },
    { label: "Open Beds", value: totalVacancies, icon: DoorOpen, color: "#16A34A", bg: "rgba(22,163,74,0.08)" },
    { label: "Need Attention", value: totalFlagged, icon: AlertTriangle, color: totalFlagged > 0 ? "#DC2626" : "#94A3B8", bg: totalFlagged > 0 ? "rgba(220,38,38,0.08)" : "rgba(148,163,184,0.08)" },
  ];

  if (loading) return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 mt-2">
        {[1,2,3,4].map(i => (
          <div key={i} className="rounded-2xl p-4 animate-pulse h-24 bg-slate-100 border border-slate-200" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3].map(i => (
          <div key={i} className="rounded-2xl animate-pulse h-48 bg-slate-100 border border-slate-200" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Homes</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
            {homes.length} home{homes.length !== 1 ? "s" : ""} in your program
          </p>
        </div>
        <AddHomeDialog onAdded={loadHomes} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="dash-card p-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon size={18} style={{ color }} strokeWidth={2} />
            </div>
            <p className="text-2xl font-bold leading-none" style={{ color: "#0F172A" }}>{value}</p>
            <p className="text-xs font-medium mt-1" style={{ color: "#64748B" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Section header + view toggle */}
      {homes.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>All Homes</h2>
          <div className="flex items-center rounded-lg p-0.5 gap-0.5 bg-slate-100 border border-slate-200">
            {(["card", "list"] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150")}
                style={view === v
                  ? { background: "#FFFFFF", color: "#0F172A", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                  : { color: "#94A3B8" }
                }
              >
                {v === "card" ? <LayoutGrid size={13} /> : <List size={13} />}
                {v === "card" ? "Cards" : "List"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Homes list */}
      {homes.length > 0 ? (
        view === "card" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {homes.map(h => (
              <HomeCard key={h.id} id={h.id} name={h.name} address={h.address}
                houseManagerName={h.house_manager_name}
                residentCount={h.residents.length}
                flaggedCount={h.residents.filter(r => r.flag === "Red").length}
                bedCount={h.bed_count}
                onRefresh={loadHomes} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {homes.map(h => (
              <HomeListRow key={h.id} id={h.id} name={h.name} address={h.address}
                houseManagerName={h.house_manager_name}
                residentCount={h.residents.length}
                flaggedCount={h.residents.filter(r => r.flag === "Red").length}
                bedCount={h.bed_count}
                onRefresh={loadHomes} />
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl bg-white border border-slate-200">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(27,110,243,0.08)" }}>
            <Building2 size={28} style={{ color: "#1B6EF3" }} />
          </div>
          <h3 className="text-lg font-bold mb-1" style={{ color: "#0F172A" }}>No homes yet</h3>
          <p className="text-sm mb-6 max-w-xs" style={{ color: "#64748B" }}>
            Add your first home to start managing residents.
          </p>
          <AddHomeDialog onAdded={loadHomes} />
        </div>
      )}
    </div>
  );
}
