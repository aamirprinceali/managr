"use client";
// Home list row — dark premium compact view with edit button
import { MapPin, Users, BedDouble, AlertTriangle, ChevronRight, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import EditHomeDialog from "@/components/homes/EditHomeDialog";

type HomeListRowProps = {
  id: string;
  name: string;
  address: string | null;
  houseManagerName: string | null;
  residentCount: number;
  flaggedCount: number;
  bedCount: number;
  onRefresh?: () => void;
};

export default function HomeListRow({ id, name, address, houseManagerName, residentCount, flaggedCount, bedCount, onRefresh }: HomeListRowProps) {
  const router = useRouter();
  const vacancies = bedCount > 0 ? bedCount - residentCount : null;
  const needsAttention = flaggedCount > 0;

  return (
    <div
      onClick={() => router.push(`/homes/${id}`)}
      className="flex items-center gap-4 rounded-xl px-4 py-3.5 card-hover cursor-pointer group"
      style={{
        background: "#161B27",
        border: `1px solid ${needsAttention ? "rgba(239,68,68,0.25)" : "#1E2535"}`,
      }}
    >
      {/* Left status bar */}
      <div
        className="w-1.5 h-10 rounded-full flex-shrink-0"
        style={{
          background: needsAttention
            ? "#EF4444"
            : "linear-gradient(180deg, #3B82F6, #60A5FA)",
          boxShadow: needsAttention ? "0 0 6px rgba(239,68,68,0.5)" : "0 0 4px rgba(59,130,246,0.4)",
        }}
      />

      {/* Name + manager */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate" style={{ color: "#E6EDF3" }}>{name}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {houseManagerName && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "#60A5FA" }}>
              <UserCircle size={10} />
              {houseManagerName}
            </span>
          )}
          {address && (
            <span className="flex items-center gap-1 text-xs truncate" style={{ color: "#4A6380" }}>
              <MapPin size={10} />
              {address}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-sm">
          <Users size={13} style={{ color: "#4A6380" }} />
          <span className="font-semibold" style={{ color: "#E6EDF3" }}>{residentCount}</span>
        </div>
        {vacancies !== null && (
          <div className="flex items-center gap-1.5 text-sm">
            <BedDouble size={13} style={{ color: "#4A6380" }} />
            <span className="font-semibold"
              style={{ color: vacancies === 0 ? "#EF4444" : "#E6EDF3" }}>
              {vacancies}
            </span>
          </div>
        )}
        {needsAttention && (
          <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#EF4444" }}>
            <AlertTriangle size={13} />
            {flaggedCount}
          </div>
        )}
      </div>

      {/* Edit button */}
      <div onClick={e => e.stopPropagation()}>
        <EditHomeDialog homeId={id} homeName={name} onUpdated={onRefresh} onDeleted={onRefresh} />
      </div>

      <ChevronRight size={15} style={{ color: "#2A3448" }} className="flex-shrink-0 group-hover:text-blue-400 transition-colors" />
    </div>
  );
}
