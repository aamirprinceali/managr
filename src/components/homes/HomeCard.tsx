// Home card — card view with hover animation and flag status
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, BedDouble, AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";

type HomeCardProps = {
  id: string;
  name: string;
  address: string | null;
  residentCount: number;
  flaggedCount: number;
  bedCount: number;
};

export default function HomeCard({ id, name, address, residentCount, flaggedCount, bedCount }: HomeCardProps) {
  const occupancy = bedCount > 0 ? Math.round((residentCount / bedCount) * 100) : null;
  const isNearFull = occupancy !== null && occupancy >= 80;
  const vacancies = bedCount > 0 ? bedCount - residentCount : null;

  return (
    <Link href={`/homes/${id}`} className="block group">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 card-hover cursor-pointer relative overflow-hidden">
        {/* Subtle top accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl transition-all duration-200 ${
          flaggedCount > 0 ? "bg-red-400" : "bg-amber-400 opacity-0 group-hover:opacity-100"
        }`} />

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-semibold text-slate-900 text-base leading-snug group-hover:text-amber-600 transition-colors truncate">
              {name}
            </h3>
            {address && (
              <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                <MapPin size={11} />
                <span className="truncate">{address}</span>
              </div>
            )}
          </div>
          <ChevronRight size={16} className="text-gray-300 group-hover:text-amber-500 transition-colors flex-shrink-0 mt-0.5" />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Users size={14} className="text-gray-400" />
            <span className="font-medium">{residentCount}</span>
            <span className="text-gray-400 text-xs">residents</span>
          </div>

          {vacancies !== null && (
            <>
              <div className="w-px h-3 bg-gray-200" />
              <div className="flex items-center gap-1.5 text-sm">
                <BedDouble size={14} className="text-gray-400" />
                <span className={`font-medium ${vacancies === 0 ? "text-red-500" : isNearFull ? "text-amber-600" : "text-gray-600"}`}>
                  {vacancies}
                </span>
                <span className="text-gray-400 text-xs">open</span>
              </div>
            </>
          )}

          {flaggedCount > 0 && (
            <>
              <div className="w-px h-3 bg-gray-200" />
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <AlertTriangle size={13} />
                <span className="font-semibold">{flaggedCount}</span>
              </div>
            </>
          )}
        </div>

        {/* Occupancy bar */}
        {occupancy !== null && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span>Occupancy</span>
              <span className="font-medium">{occupancy}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  occupancy >= 100 ? "bg-red-500" :
                  occupancy >= 80 ? "bg-amber-500" : "bg-green-500"
                }`}
                style={{ width: `${Math.min(occupancy, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
