"use client";
// Home card — dark premium style. Click anywhere to open home, pencil button to edit.
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

  // Bar and accent color based on occupancy level
  const barColor = occupancy === null ? "#3B82F6"
    : occupancy >= 100 ? "#EF4444"
    : occupancy >= 80 ? "#F59E0B"
    : "#3B82F6";

  return (
    <div
      onClick={() => router.push(`/homes/${id}`)}
      className="rounded-2xl p-5 card-hover cursor-pointer relative overflow-hidden group"
      style={{
        background: "#161B27",
        border: `1px solid ${needsAttention ? "rgba(239,68,68,0.3)" : "#1E2535"}`,
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{
          background: needsAttention
            ? "linear-gradient(90deg, #EF4444, #F87171)"
            : "linear-gradient(90deg, #3B82F6, transparent)",
          opacity: needsAttention ? 1 : 0.5,
        }}
      />

      {/* Flagged banner */}
      {needsAttention && (
        <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 mb-3"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertTriangle size={12} style={{ color: "#EF4444" }} className="flex-shrink-0" />
          <span className="text-xs font-semibold" style={{ color: "#EF4444" }}>
            {flaggedCount} resident{flaggedCount > 1 ? "s" : ""} need{flaggedCount === 1 ? "s" : ""} attention
          </span>
        </div>
      )}

      {/* Name + edit button */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-bold text-base leading-snug truncate" style={{ color: "#E6EDF3" }}>
            {name}
          </h3>
          {address && (
            <div className="flex items-center gap-1 mt-0.5" style={{ color: "#4A6380" }}>
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
      <div className="flex items-center gap-1.5 mb-4"
        style={{ color: houseManagerName ? "#60A5FA" : "#2A3448" }}>
        <UserCircle size={13} />
        <span className="text-xs font-medium">
          {houseManagerName ?? "No manager assigned"}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5">
          <Users size={13} style={{ color: "#4A6380" }} />
          <span className="font-semibold" style={{ color: "#E6EDF3" }}>{residentCount}</span>
          <span className="text-xs" style={{ color: "#4A6380" }}>residents</span>
        </div>

        {vacancies !== null && (
          <>
            <div className="w-px h-3" style={{ background: "#1E2535" }} />
            <div className="flex items-center gap-1.5">
              <BedDouble size={13} style={{ color: "#4A6380" }} />
              <span className="font-semibold text-sm"
                style={{ color: vacancies === 0 ? "#EF4444" : isNearFull ? "#F59E0B" : "#E6EDF3" }}>
                {vacancies}
              </span>
              <span className="text-xs" style={{ color: "#4A6380" }}>open</span>
            </div>
          </>
        )}
      </div>

      {/* Occupancy bar with glow */}
      {occupancy !== null && (
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-[10px] font-medium" style={{ color: "#4A6380" }}>Occupancy</span>
            <span className="text-[10px] font-bold" style={{ color: "#8B9DB5" }}>{occupancy}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1E2535" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(occupancy, 100)}%`,
                background: `linear-gradient(90deg, ${barColor}, ${barColor}CC)`,
                boxShadow: `0 0 6px ${barColor}66`,
              }}
            />
          </div>
        </div>
      )}

      {/* Hover chevron */}
      <ChevronRight
        size={14}
        className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ color: "#3B82F6" }}
      />
    </div>
  );
}
