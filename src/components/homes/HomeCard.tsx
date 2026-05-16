"use client";
// Home card — light CRM style. Click anywhere to open home, pencil button to edit.
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

  const barColor = occupancy === null ? "#1B6EF3"
    : occupancy >= 100 ? "#DC2626"
    : occupancy >= 80 ? "#D97706"
    : "#1B6EF3";

  return (
    <div
      onClick={() => router.push(`/homes/${id}`)}
      className="rounded-2xl p-5 card-hover cursor-pointer relative overflow-hidden group bg-white"
      style={{ border: `1px solid ${needsAttention ? "rgba(220,38,38,0.25)" : "#E2E8F0"}` }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{
          background: needsAttention
            ? "linear-gradient(90deg, #DC2626, #F87171)"
            : "linear-gradient(90deg, #1B6EF3, transparent)",
          opacity: needsAttention ? 1 : 0.6,
        }}
      />

      {/* Flagged banner */}
      {needsAttention && (
        <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 mb-3"
          style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
          <AlertTriangle size={12} style={{ color: "#DC2626" }} className="flex-shrink-0" />
          <span className="text-xs font-semibold" style={{ color: "#DC2626" }}>
            {flaggedCount} resident{flaggedCount > 1 ? "s" : ""} need{flaggedCount === 1 ? "s" : ""} attention
          </span>
        </div>
      )}

      {/* Name + edit button */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-bold text-base leading-snug truncate" style={{ color: "#0F172A" }}>
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
      <div className="flex items-center gap-1.5 mb-4"
        style={{ color: houseManagerName ? "#1B6EF3" : "#CBD5E1" }}>
        <UserCircle size={13} />
        <span className="text-xs font-medium">
          {houseManagerName ?? "No manager assigned"}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5">
          <Users size={13} style={{ color: "#94A3B8" }} />
          <span className="font-semibold" style={{ color: "#0F172A" }}>{residentCount}</span>
          <span className="text-xs" style={{ color: "#94A3B8" }}>residents</span>
        </div>

        {vacancies !== null && (
          <>
            <div className="w-px h-3 bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <BedDouble size={13} style={{ color: "#94A3B8" }} />
              <span className="font-semibold text-sm"
                style={{ color: vacancies === 0 ? "#DC2626" : isNearFull ? "#D97706" : "#0F172A" }}>
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
            <span className="text-[10px] font-bold" style={{ color: "#64748B" }}>{occupancy}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(occupancy, 100)}%`, background: barColor }}
            />
          </div>
        </div>
      )}

      {/* Hover chevron */}
      <ChevronRight
        size={14}
        className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ color: "#1B6EF3" }}
      />
    </div>
  );
}
