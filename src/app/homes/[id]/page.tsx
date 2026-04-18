"use client";
// Home Dashboard — shows everything about one specific home and its residents
// Red-flagged residents always appear at the top so managers see issues immediately

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ResidentRow from "@/components/residents/ResidentRow";
import AddResidentDialog from "@/components/residents/AddResidentDialog";
import WeeklyDrugTests from "@/components/homes/WeeklyDrugTests";
import { ArrowLeft, Users, BedDouble, AlertTriangle, UserCheck } from "lucide-react";
import Link from "next/link";

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

  async function loadData() {
    const supabase = createClient();

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

  // Sort: Red → Yellow → Green
  const flagOrder: Record<string, number> = { Red: 0, Yellow: 1, Green: 2 };
  const sorted = [...residents].sort((a, b) => (flagOrder[a.flag] ?? 3) - (flagOrder[b.flag] ?? 3));

  const activeCount = sorted.filter(r => r.status === "Active").length;
  const onPassCount = sorted.filter(r => r.status === "On Pass").length;
  const flaggedCount = sorted.filter(r => r.flag === "Red").length;
  const occupancy = home?.bed_count ? Math.round((sorted.length / home.bed_count) * 100) : null;
  const barColor = occupancy === null ? "#3B82F6" : occupancy >= 100 ? "#EF4444" : occupancy >= 80 ? "#F59E0B" : "#3B82F6";

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="h-4 w-24 rounded mb-6" style={{ background: "#1E2535" }} />
        <div className="h-8 w-48 rounded mb-2" style={{ background: "#1E2535" }} />
        <div className="h-4 w-36 rounded mb-8" style={{ background: "#161B27" }} />
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-xl h-20" style={{ background: "#161B27", border: "1px solid #1E2535" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!home) return null;

  return (
    <div className="max-w-2xl mx-auto">

      {/* Back link */}
      <Link
        href="/homes"
        className="flex items-center gap-2 mb-6 text-sm transition-colors"
        style={{ color: "#4A6380" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#8B9DB5"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#4A6380"}
      >
        <ArrowLeft size={16} />
        <span>All Homes</span>
      </Link>

      {/* Home name + address */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: "#E6EDF3" }}>{home.name}</h1>
        {home.address && (
          <p className="mt-1 text-sm" style={{ color: "#4A6380" }}>{home.address}</p>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl p-4 text-center" style={{ background: "#161B27", border: "1px solid #1E2535" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-2"
            style={{ background: "rgba(59,130,246,0.1)" }}>
            <UserCheck size={14} style={{ color: "#60A5FA" }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: "#E6EDF3" }}>{activeCount}</p>
          <p className="text-xs mt-0.5" style={{ color: "#4A6380" }}>Active</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: "#161B27", border: "1px solid #1E2535" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-2"
            style={{ background: "rgba(245,158,11,0.1)" }}>
            <Users size={14} style={{ color: "#F59E0B" }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: "#E6EDF3" }}>{onPassCount}</p>
          <p className="text-xs mt-0.5" style={{ color: "#4A6380" }}>On Pass</p>
        </div>
        <div className="rounded-xl p-4 text-center"
          style={{ background: "#161B27", border: `1px solid ${flaggedCount > 0 ? "rgba(239,68,68,0.25)" : "#1E2535"}` }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-2"
            style={{ background: flaggedCount > 0 ? "rgba(239,68,68,0.1)" : "rgba(74,99,128,0.1)" }}>
            <AlertTriangle size={14} style={{ color: flaggedCount > 0 ? "#EF4444" : "#4A6380" }} />
          </div>
          <p className="text-2xl font-bold"
            style={{ color: flaggedCount > 0 ? "#EF4444" : "#E6EDF3" }}>
            {flaggedCount}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#4A6380" }}>Flagged</p>
        </div>
      </div>

      {/* Bed capacity + occupancy bar */}
      {home.bed_count > 0 && (
        <div className="flex flex-col gap-1 mb-6 px-4 py-3 rounded-xl"
          style={{ background: "#161B27", border: "1px solid #1E2535" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BedDouble size={14} style={{ color: "#4A6380" }} />
              <span className="text-sm" style={{ color: "#8B9DB5" }}>
                {sorted.length} of {home.bed_count} beds occupied
              </span>
            </div>
            <span className="text-xs font-bold" style={{ color: barColor }}>{occupancy}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mt-1" style={{ background: "#1E2535" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(occupancy ?? 0, 100)}%`,
                background: `linear-gradient(90deg, ${barColor}, ${barColor}CC)`,
                boxShadow: `0 0 6px ${barColor}66`,
              }}
            />
          </div>
        </div>
      )}

      {/* Weekly drug test tracker */}
      <WeeklyDrugTests homeId={home.id} />

      {/* Residents header + Add button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: "#E6EDF3" }}>
          <Users size={18} style={{ color: "#4A6380" }} />
          Residents
        </h2>
        <AddResidentDialog homeId={home.id} onAdded={loadData} />
      </div>

      {/* Resident list */}
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
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl"
          style={{ background: "#161B27", border: "1px solid #1E2535" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(59,130,246,0.08)" }}>
            <Users size={28} style={{ color: "#3B82F6" }} />
          </div>
          <p className="font-semibold mb-1" style={{ color: "#E6EDF3" }}>No residents yet</p>
          <p className="text-sm mb-5" style={{ color: "#4A6380" }}>Add the first resident to this home.</p>
          <AddResidentDialog homeId={home.id} onAdded={loadData} />
        </div>
      )}
    </div>
  );
}
