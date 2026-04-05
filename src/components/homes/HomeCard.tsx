"use client";
// Home card — click anywhere to open the home, pencil button to edit
import { MapPin, Users, BedDouble, AlertTriangle, ChevronRight, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import EditHomeDialog from "@/components/homes/EditHomeDialog";

type HomeCardProps = {
  id: string;
  name: string;
  address: string | null;
  houseManagerName: string | null;
  residentCount: number;
  flaggedCount: number;
  bedCount: number;
  onRefresh?: () => void;
};

export default function HomeCard({
  id, name, address, houseManagerName, residentCount, flaggedCount, bedCount, onRefresh
}: HomeCardProps) {
  const router = useRouter();
  const vacancies = bedCount > 0 ? bedCount - residentCount : null;
  const occupancy = bedCount > 0 ? Math.round((residentCount / bedCount) * 100) : null;
  const needsAttention = flaggedCount > 0;
  const isNearFull = occupancy !== null && occupancy >= 80;

  return (
    <div
      onClick={() => router.push(`/homes/${id}`)}
      className="bg-white rounded-2xl p-5 card-hover cursor-pointer relative overflow-hidden border group"
      style={{ borderColor: needsAttention ? "#FECACA" : "#DDE4ED" }}
    >
      {/* Top accent line — red if needs attention */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: needsAttention ? "#DC2626" : "transparent" }}
      />

      {/* Needs Attention banner */}
      {needsAttention && (
        <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 mb-3">
          <AlertTriangle size={12} className="text-red-600 flex-shrink-0" />
          <span className="text-xs font-semibold text-red-700">
            {flaggedCount} resident{flaggedCount > 1 ? "s" : ""} need{flaggedCount === 1 ? "s" : ""} attention
          </span>
        </div>
      )}

      {/* Home name + edit button row */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-bold text-base leading-snug truncate" style={{ color: "#0B1F3A" }}>
            {name}
          </h3>
          {address && (
            <div className="flex items-center gap-1 mt-0.5" style={{ color: "#94A3B8" }}>
              <MapPin size={11} />
              <span className="text-xs truncate">{address}</span>
            </div>
          )}
        </div>
        {/* Edit button — stopPropagation so it doesn't navigate */}
        <div onClick={e => e.stopPropagation()}>
          <EditHomeDialog homeId={id} homeName={name} onUpdated={onRefresh} onDeleted={onRefresh} />
        </div>
      </div>

      {/* House manager */}
      <div className="flex items-center gap-1.5 mb-4" style={{ color: houseManagerName ? "#0284C7" : "#CBD5E1" }}>
        <UserCircle size={13} />
        <span className="text-xs font-medium">
          {houseManagerName ?? "No manager assigned"}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5" style={{ color: "#475569" }}>
          <Users size={13} style={{ color: "#94A3B8" }} />
          <span className="font-semibold" style={{ color: "#0B1F3A" }}>{residentCount}</span>
          <span className="text-xs" style={{ color: "#94A3B8" }}>residents</span>
        </div>

        {vacancies !== null && (
          <>
            <div className="w-px h-3" style={{ background: "#E2E8F0" }} />
            <div className="flex items-center gap-1.5">
              <BedDouble size={13} style={{ color: "#94A3B8" }} />
              <span
                className="font-semibold text-sm"
                style={{ color: vacancies === 0 ? "#DC2626" : isNearFull ? "#D97706" : "#0B1F3A" }}
              >
                {vacancies}
              </span>
              <span className="text-xs" style={{ color: "#94A3B8" }}>open</span>
            </div>
          </>
        )}
      </div>

      {/* Occupancy bar */}
      {occupancy !== null && (
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-[10px] font-medium" style={{ color: "#94A3B8" }}>Occupancy</span>
            <span className="text-[10px] font-bold" style={{ color: "#475569" }}>{occupancy}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#EEF2F7" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(occupancy, 100)}%`,
                background: occupancy >= 100 ? "#DC2626" : occupancy >= 80 ? "#D97706" : "#0284C7"
              }}
            />
          </div>
        </div>
      )}

      {/* Chevron hint */}
      <ChevronRight
        size={14}
        className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ color: "#CBD5E1" }}
      />
    </div>
  );
}
