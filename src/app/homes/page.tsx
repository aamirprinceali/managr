"use client";
import { useEffect, useState } from "react";
import HomeCard from "@/components/homes/HomeCard";
import HomeListRow from "@/components/homes/HomeListRow";
import AddHomeDialog from "@/components/homes/AddHomeDialog";
import { Building2, LayoutGrid, List, BedDouble, Users, DoorOpen, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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

  async function loadHomes() {
    const supabase = createClient();
    const { data } = await supabase
      .from("homes")
      .select("*, residents(id, flag)")
      .order("name");
    setHomes((data as Home[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { loadHomes(); }, []);

  const totalResidents = homes.reduce((s, h) => s + h.residents.length, 0);
  const totalBeds = homes.reduce((s, h) => s + (h.bed_count || 0), 0);
  const totalVacancies = homes.reduce((s, h) => s + Math.max(0, (h.bed_count || 0) - h.residents.length), 0);
  const totalFlagged = homes.reduce((s, h) => s + h.residents.filter(r => r.flag === "Red").length, 0);

  const stats = [
    { label: "Total Homes", value: homes.length, icon: Building2, color: "#0284C7", bg: "#E8F4FD" },
    { label: "Residents", value: totalResidents, icon: Users, color: "#0B1F3A", bg: "#EEF2F7" },
    { label: "Open Beds", value: totalVacancies, icon: DoorOpen, color: "#16A34A", bg: "#DCFCE7" },
    { label: "Need Attention", value: totalFlagged, icon: AlertTriangle, color: totalFlagged > 0 ? "#DC2626" : "#94A3B8", bg: totalFlagged > 0 ? "#FEE2E2" : "#F1F5F9" },
  ];

  if (loading) return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 mt-2">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse h-24" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0B1F3A" }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
            {homes.length} home{homes.length !== 1 ? "s" : ""} in your program
          </p>
        </div>
        <AddHomeDialog onAdded={loadHomes} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border rounded-2xl p-4" style={{ borderColor: "#DDE4ED" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon size={18} style={{ color }} strokeWidth={2} />
            </div>
            <p className="text-2xl font-bold leading-none" style={{ color: "#0B1F3A" }}>{value}</p>
            <p className="text-xs font-medium mt-1" style={{ color: "#64748B" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Section header + toggle */}
      {homes.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>All Homes</h2>
          <div className="flex items-center rounded-lg p-0.5 gap-0.5" style={{ background: "#EEF2F7" }}>
            {(["card", "list"] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150",
                )}
                style={view === v
                  ? { background: "white", color: "#0B1F3A", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
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

      {/* Homes */}
      {homes.length > 0 ? (
        view === "card" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {homes.map(h => (
              <HomeCard key={h.id} id={h.id} name={h.name} address={h.address}
                houseManagerName={h.house_manager_name}
                residentCount={h.residents.length}
                flaggedCount={h.residents.filter(r => r.flag === "Red").length}
                bedCount={h.bed_count} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {homes.map(h => (
              <HomeListRow key={h.id} id={h.id} name={h.name} address={h.address}
                houseManagerName={h.house_manager_name}
                residentCount={h.residents.length}
                flaggedCount={h.residents.filter(r => r.flag === "Red").length}
                bedCount={h.bed_count} />
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white border rounded-2xl" style={{ borderColor: "#DDE4ED" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#E8F4FD" }}>
            <Building2 size={28} style={{ color: "#0284C7" }} />
          </div>
          <h3 className="text-lg font-bold mb-1" style={{ color: "#0B1F3A" }}>No homes yet</h3>
          <p className="text-sm mb-6 max-w-xs" style={{ color: "#64748B" }}>
            Add your first home to start managing residents.
          </p>
          <AddHomeDialog onAdded={loadHomes} />
        </div>
      )}
    </div>
  );
}
