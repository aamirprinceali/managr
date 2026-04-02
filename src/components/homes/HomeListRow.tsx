// Home list row — compact view with manager name and attention flag
import { MapPin, Users, BedDouble, AlertTriangle, ChevronRight, UserCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type HomeListRowProps = {
  id: string;
  name: string;
  address: string | null;
  houseManagerName: string | null;
  residentCount: number;
  flaggedCount: number;
  bedCount: number;
};

export default function HomeListRow({ id, name, address, houseManagerName, residentCount, flaggedCount, bedCount }: HomeListRowProps) {
  const vacancies = bedCount > 0 ? bedCount - residentCount : null;
  const needsAttention = flaggedCount > 0;

  return (
    <Link href={`/homes/${id}`} className="block group">
      <div
        className="flex items-center gap-4 bg-white rounded-xl px-4 py-3.5 card-hover cursor-pointer border"
        style={{ borderColor: needsAttention ? "#FECACA" : "#DDE4ED" }}
      >
        {/* Left status bar */}
        <div
          className="w-1.5 h-10 rounded-full flex-shrink-0"
          style={{ background: needsAttention ? "#DC2626" : "#0284C7" }}
        />

        {/* Name + manager */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: "#0B1F3A" }}>{name}</p>
          <div className="flex items-center gap-3 mt-0.5">
            {houseManagerName && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "#0284C7" }}>
                <UserCircle size={10} />
                {houseManagerName}
              </span>
            )}
            {address && (
              <span className="flex items-center gap-1 text-xs truncate" style={{ color: "#94A3B8" }}>
                <MapPin size={10} />
                {address}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-sm">
            <Users size={13} style={{ color: "#94A3B8" }} />
            <span className="font-semibold" style={{ color: "#0B1F3A" }}>{residentCount}</span>
          </div>
          {vacancies !== null && (
            <div className="flex items-center gap-1.5 text-sm">
              <BedDouble size={13} style={{ color: "#94A3B8" }} />
              <span
                className="font-semibold"
                style={{ color: vacancies === 0 ? "#DC2626" : "#0B1F3A" }}
              >
                {vacancies}
              </span>
            </div>
          )}
          {needsAttention && (
            <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#DC2626" }}>
              <AlertTriangle size={13} />
              {flaggedCount}
            </div>
          )}
        </div>

        <ChevronRight size={15} style={{ color: "#CBD5E1" }} className="flex-shrink-0" />
      </div>
    </Link>
  );
}
