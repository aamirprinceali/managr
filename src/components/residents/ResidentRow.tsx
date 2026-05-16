// A single resident row shown on the Home Dashboard — light CRM style
import Link from "next/link";
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

// Flag dot colors (semantic — kept same across themes)
const flagColors: Record<string, string> = {
  Green: "#16A34A",
  Yellow: "#D97706",
  Red: "#DC2626",
};

// Status badge styling — light theme
const statusStyle: Record<string, { bg: string; text: string; border: string }> = {
  Active:     { bg: "#DCFCE7", text: "#15803D", border: "rgba(22,163,74,0.2)" },
  "On Pass":  { bg: "#DBEAFE", text: "#1D4ED8", border: "rgba(29,78,216,0.2)" },
  Discharged: { bg: "#F1F5F9", text: "#475569", border: "#E2E8F0" },
};

export default function ResidentRow({ id, homeId, fullName, status, flag, points, sobrietyDate }: ResidentRowProps) {
  const daysSober = sobrietyDate
    ? Math.floor((Date.now() - new Date(sobrietyDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const dotColor = flagColors[flag] ?? "#94A3B8";
  const sBadge = statusStyle[status] ?? { bg: "#F1F5F9", text: "#475569", border: "#E2E8F0" };
  const isRed = flag === "Red";

  return (
    <Link href={`/homes/${homeId}/residents/${id}`}>
      <div
        className="flex items-center gap-4 p-4 rounded-xl cursor-pointer group transition-all duration-150 bg-white hover:bg-slate-50"
        style={{ border: `1px solid ${isRed ? "rgba(220,38,38,0.2)" : "#E2E8F0"}` }}
      >
        {/* Flag dot */}
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: dotColor }}
        />

        {/* Name + stats */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate" style={{ color: "#0F172A" }}>
            {fullName}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {daysSober !== null && (
              <span className="text-xs" style={{ color: "#64748B" }}>{daysSober}d sober</span>
            )}
            <span className="text-xs" style={{ color: "#94A3B8" }}>· {points} pts</span>
          </div>
        </div>

        {/* Status badge */}
        <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: sBadge.bg, color: sBadge.text, border: `1px solid ${sBadge.border}` }}>
          {status}
        </span>

        <ChevronRight size={15} style={{ color: "#CBD5E1" }} className="flex-shrink-0 group-hover:text-blue-400 transition-colors" />
      </div>
    </Link>
  );
}
