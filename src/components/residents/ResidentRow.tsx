// A single resident row shown on the Home Dashboard
// Tapping it takes you to the full Resident Profile
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

type ResidentRowProps = {
  id: string;
  homeId: string;
  fullName: string;
  status: string;
  flag: string;
  points: number;
  sobrietyDate: string | null;
};

// Flag color → colored dot
const flagDot: Record<string, string> = {
  Green: "bg-green-500",
  Yellow: "bg-yellow-400",
  Red: "bg-red-500",
};

// Status badge styling
const statusStyle: Record<string, string> = {
  Active: "bg-green-100 text-green-800 border-green-200",
  "On Pass": "bg-blue-100 text-blue-800 border-blue-200",
  Discharged: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function ResidentRow({ id, homeId, fullName, status, flag, points, sobrietyDate }: ResidentRowProps) {
  // Calculate how many days sober based on their sobriety date
  const daysSober = sobrietyDate
    ? Math.floor((Date.now() - new Date(sobrietyDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Link href={`/homes/${homeId}/residents/${id}`}>
      <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm hover:border-gray-300 transition-all cursor-pointer group">
        {/* Flag color dot — Green/Yellow/Red at a glance */}
        <div className={cn("w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white shadow", flagDot[flag] ?? "bg-gray-300")} />

        {/* Resident name + stats */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate group-hover:text-amber-700 transition-colors">
            {fullName}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {daysSober !== null && (
              <span className="text-xs text-gray-400">{daysSober}d sober</span>
            )}
            <span className="text-xs text-gray-400">· {points} pts</span>
          </div>
        </div>

        {/* Status badge */}
        <Badge className={cn("flex-shrink-0 text-xs border font-medium", statusStyle[status] ?? "bg-gray-100 text-gray-600 border-gray-200")}>
          {status}
        </Badge>

        <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
      </div>
    </Link>
  );
}
