"use client";
// Main Homes screen — dashboard stats + card/list toggle
// House managers and admins land here first
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
  residents: { id: string; flag: string }[];
};

type ViewMode = "card" | "list";

export default function HomesPage() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [view, setView] = useState<ViewMode>("card");
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

  useEffect(() => {
    loadHomes();
  }, []);

  // Calculate program-wide stats
  const totalResidents = homes.reduce((sum, h) => sum + h.residents.length, 0);
  const totalBeds = homes.reduce((sum, h) => sum + (h.bed_count || 0), 0);
  const totalVacancies = homes.reduce((sum, h) => sum + Math.max(0, (h.bed_count || 0) - h.residents.length), 0);
  const totalFlagged = homes.reduce((sum, h) => sum + h.residents.filter(r => r.flag === "Red").length, 0);

  const stats = [
    { label: "Homes", value: homes.length, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Residents", value: totalResidents, icon: Users, color: "text-slate-700", bg: "bg-slate-50" },
    { label: "Vacancies", value: totalVacancies, icon: DoorOpen, color: "text-green-600", bg: "bg-green-50" },
    { label: "Flagged", value: totalFlagged, icon: AlertTriangle, color: totalFlagged > 0 ? "text-red-600" : "text-gray-400", bg: totalFlagged > 0 ? "bg-red-50" : "bg-gray-50" },
  ];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse">
              <div className="h-8 w-8 bg-gray-100 rounded-xl mb-3" />
              <div className="h-6 w-10 bg-gray-100 rounded mb-1" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {homes.length} home{homes.length !== 1 ? "s" : ""} in your program
          </p>
        </div>
        <AddHomeDialog onAdded={loadHomes} />
      </div>

      {/* Program-wide stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", bg)}>
              <Icon size={18} className={color} strokeWidth={2} />
            </div>
            <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Homes section header with view toggle */}
      {homes.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">All Homes</h2>
          {/* Card / List toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setView("card")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                view === "card"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-gray-500 hover:text-slate-700"
              )}
            >
              <LayoutGrid size={13} />
              Cards
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                view === "list"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-gray-500 hover:text-slate-700"
              )}
            >
              <List size={13} />
              List
            </button>
          </div>
        </div>
      )}

      {/* Homes display */}
      {homes.length > 0 ? (
        view === "card" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {homes.map(home => (
              <HomeCard
                key={home.id}
                id={home.id}
                name={home.name}
                address={home.address}
                residentCount={home.residents.length}
                flaggedCount={home.residents.filter(r => r.flag === "Red").length}
                bedCount={home.bed_count}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {homes.map(home => (
              <HomeListRow
                key={home.id}
                id={home.id}
                name={home.name}
                address={home.address}
                residentCount={home.residents.length}
                flaggedCount={home.residents.filter(r => r.flag === "Red").length}
                bedCount={home.bed_count}
              />
            ))}
          </div>
        )
      ) : (
        // Empty state
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mb-4">
            <Building2 size={28} className="text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No homes yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs">
            Add your first home to start managing residents and tracking your program.
          </p>
          <AddHomeDialog onAdded={loadHomes} />
        </div>
      )}
    </div>
  );
}
