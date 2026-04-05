"use client";
// Home Dashboard — shows everything about one specific home and its residents
// Red-flagged residents always appear at the top so managers see issues immediately
// Converted to a client component so AddResidentDialog can trigger a data refresh via onAdded

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ResidentRow from "@/components/residents/ResidentRow";
import AddResidentDialog from "@/components/residents/AddResidentDialog";
import WeeklyDrugTests from "@/components/homes/WeeklyDrugTests";
import { ArrowLeft, Users, BedDouble } from "lucide-react";
import Link from "next/link";

// Types for the data we fetch from Supabase
type Home = {
  id: string;
  name: string;
  address: string | null;
  bed_count: number;
};

type Resident = {
  id: string;
  full_name: string;
  status: string;
  flag: string;
  points: number;
  sobriety_date: string | null;
  is_archived: boolean;
};

export default function HomeDashboard() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [home, setHome] = useState<Home | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch home + residents from Supabase (client-side)
  async function loadData() {
    const supabase = createClient();

    // Fetch home details
    const { data: homeData } = await supabase
      .from("homes")
      .select("*")
      .eq("id", id)
      .single();

    if (!homeData) {
      router.push("/404");
      return;
    }

    setHome(homeData);

    // Fetch all active (non-archived) residents for this home
    const { data: residentData } = await supabase
      .from("residents")
      .select("*")
      .eq("home_id", id)
      .eq("is_archived", false);

    setResidents(residentData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Sort residents: Red flagged first, then Yellow, then Green
  const flagOrder: Record<string, number> = { Red: 0, Yellow: 1, Green: 2 };
  const sorted = [...residents].sort(
    (a, b) => (flagOrder[a.flag] ?? 3) - (flagOrder[b.flag] ?? 3)
  );

  // Quick stats shown at the top of the dashboard
  const activeCount = sorted.filter((r) => r.status === "Active").length;
  const onPassCount = sorted.filter((r) => r.status === "On Pass").length;
  const flaggedCount = sorted.filter((r) => r.flag === "Red").length;

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="h-4 w-24 bg-gray-200 rounded mb-6" />
        <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-36 bg-gray-100 rounded mb-8" />
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (!home) return null;

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

      {/* Weekly drug test tracker — shows above resident list */}
      <WeeklyDrugTests homeId={home.id} />

      {/* Residents section header + Add Resident button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Users size={20} />
          Residents
        </h2>
        {/* AddResidentDialog — onAdded triggers a full data reload */}
        <AddResidentDialog homeId={home.id} onAdded={loadData} />
      </div>

      {/* Resident list — sorted Red → Yellow → Green */}
      {sorted.length > 0 ? (
        <div className="space-y-2">
          {sorted.map((r) => (
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
        // Empty state — shown when no residents exist yet
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Users size={28} className="text-gray-400" />
          </div>
          <p className="text-slate-900 font-semibold mb-1">No residents yet</p>
          <p className="text-gray-500 text-sm mb-5">Add the first resident to this home.</p>
          <AddResidentDialog homeId={home.id} onAdded={loadData} />
        </div>
      )}
    </div>
  );
}
