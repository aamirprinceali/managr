// Main Homes screen — the first thing you see after logging in
// Shows all houses as cards, lets admins add new homes
import { createClient } from "@/lib/supabase/server";
import HomeCard from "@/components/homes/HomeCard";
import AddHomeDialog from "@/components/homes/AddHomeDialog";
import { Building2 } from "lucide-react";

export default async function HomesPage() {
  const supabase = await createClient();

  // Fetch all homes and their residents (to show counts and flagged numbers)
  const { data: homes } = await supabase
    .from("homes")
    .select("*, residents(id, flag)")
    .order("name");

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Homes</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {homes?.length ?? 0} house{homes?.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <AddHomeDialog />
      </div>

      {/* Homes grid — 1 column on mobile, 2 on tablet+ */}
      {homes && homes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {homes.map(home => {
            const residents = (home.residents as { id: string; flag: string }[]) ?? [];
            const flaggedCount = residents.filter(r => r.flag === "Red").length;
            return (
              <HomeCard
                key={home.id}
                id={home.id}
                name={home.name}
                address={home.address}
                residentCount={residents.length}
                flaggedCount={flaggedCount}
              />
            );
          })}
        </div>
      ) : (
        // Empty state — shown when no homes have been added yet
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Building2 size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No homes yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs">
            Add your first home to start managing residents.
          </p>
          <AddHomeDialog />
        </div>
      )}
    </div>
  );
}
