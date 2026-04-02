// Home list row — compact list view alternative to card view
import { MapPin, Users, BedDouble, AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type HomeListRowProps = {
  id: string;
  name: string;
  address: string | null;
  residentCount: number;
  flaggedCount: number;
  bedCount: number;
};

export default function HomeListRow({ id, name, address, residentCount, flaggedCount, bedCount }: HomeListRowProps) {
  const vacancies = bedCount > 0 ? bedCount - residentCount : null;

  return (
    <Link href={`/homes/${id}`} className="block group">
      <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-3.5 card-hover cursor-pointer">
        {/* Flag indicator */}
        <div className={cn(
          "w-2 h-8 rounded-full flex-shrink-0",
          flaggedCount > 0 ? "bg-red-400" : "bg-green-400"
        )} />

        {/* Name + address */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm group-hover:text-amber-600 transition-colors truncate">{name}</p>
          {address && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <MapPin size={10} />
              <span className="truncate">{address}</span>
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm flex-shrink-0">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Users size={14} />
            <span className="font-medium text-slate-800">{residentCount}</span>
          </div>
          {vacancies !== null && (
            <div className="flex items-center gap-1.5 text-gray-500">
              <BedDouble size={14} />
              <span className={cn("font-medium", vacancies === 0 ? "text-red-500" : "text-slate-800")}>{vacancies} open</span>
            </div>
          )}
          {flaggedCount > 0 && (
            <div className="flex items-center gap-1 text-red-500">
              <AlertTriangle size={13} />
              <span className="font-semibold text-xs">{flaggedCount}</span>
            </div>
          )}
        </div>

        <ChevronRight size={15} className="text-gray-300 group-hover:text-amber-500 transition-colors flex-shrink-0" />
      </div>
    </Link>
  );
}
