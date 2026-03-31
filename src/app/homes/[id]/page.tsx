// Home Dashboard — shows everything about one specific home and its residents
// Red-flagged residents always appear at the top so managers see issues immediately
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ResidentRow from "@/components/residents/ResidentRow";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Plus, BedDouble } from "lucide-react";
import Link from "next/link";

type Params = Promise<{ id: string }>;

export default async function HomeDashboard({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch the home details
  const { data: home } = await supabase
    .from("homes")
    .select("*")
    .eq("id", id)
    .single();

  if (!home) notFound();

  // Fetch all active (non-archived) residents for this home
  const { data: residents } = await supabase
    .from("residents")
    .select("*")
    .eq("home_id", id)
    .eq("is_archived", false);

  // Sort residents: Red flagged first, then Yellow, then Green
  const flagOrder: Record<string, number> = { Red: 0, Yellow: 1, Green: 2 };
  const sorted = (residents ?? []).sort(
    (a, b) => (flagOrder[a.flag] ?? 3) - (flagOrder[b.flag] ?? 3)
  );

  // Calculate quick stats shown at the top
  const activeCount = sorted.filter(r => r.status === "Active").length;
  const onPassCount = sorted.filter(r => r.status === "On Pass").length;
  const flaggedCount = sorted.filter(r => r.flag === "Red").length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back to all homes */}
      <Link
        href="/homes"
        className="flex items-center gap-2 text-gray-400 hover:text-slate-900 transition-colors mb-6 text-sm"
      >
        <ArrowLeft size={16} />
        <span>All Homes</span>
      </Link>

      {/* Home name + address */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">{home.name}</h1>
        {home.address && (
          <p className="text-gray-500 mt-1 text-sm">{home.address}</p>
        )}
      </div>

      {/* Stats row — quick snapshot of the house */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
          <p className="text-xs text-gray-500 mt-1">Active</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{onPassCount}</p>
          <p className="text-xs text-gray-500 mt-1">On Pass</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className={`text-2xl font-bold ${flaggedCount > 0 ? "text-red-500" : "text-slate-900"}`}>
            {flaggedCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">Flagged</p>
        </div>
      </div>

      {/* Bed capacity (if set) */}
      {home.bed_count > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 bg-white border border-gray-200 rounded-xl px-4 py-3">
          <BedDouble size={16} />
          <span>{sorted.length} of {home.bed_count} beds occupied</span>
        </div>
      )}

      {/* Residents section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Users size={20} />
          Residents
        </h2>
        <Button size="sm" className="gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
          <Plus size={16} />
          Add Resident
        </Button>
      </div>

      {/* Resident list — sorted Red → Yellow → Green */}
      {sorted.length > 0 ? (
        <div className="space-y-2">
          {sorted.map(r => (
            <ResidentRow
              key={r.id}
              id={r.id}
              homeId={home.id}
              fullName={r.full_name}
              status={r.status}
              flag={r.flag}
              points={r.points}
              sobrietyDate={r.sobriety_date}
            />
          ))}
        </div>
      ) : (
        // Empty state
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Users size={28} className="text-gray-400" />
          </div>
          <p className="text-slate-900 font-semibold mb-1">No residents yet</p>
          <p className="text-gray-500 text-sm mb-5">Add the first resident to this home.</p>
          <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
            <Plus size={16} />
            Add Resident
          </Button>
        </div>
      )}
    </div>
  );
}
