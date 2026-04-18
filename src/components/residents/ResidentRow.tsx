// A single resident row shown on the Home Dashboard — dark premium style
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

// Flag dot glow colors
const flagColors: Record<string, { dot: string; glow: string }> = {
  Green: { dot: "#22C55E", glow: "rgba(34,197,94,0.5)" },
  Yellow: { dot: "#F59E0B", glow: "rgba(245,158,11,0.5)" },
  Red: { dot: "#EF4444", glow: "rgba(239,68,68,0.5)" },
};

// Status badge styling for dark theme
const statusStyle: Record<string, { bg: string; text: string; border: string }> = {
  Active: { bg: "rgba(34,197,94,0.1)", text: "#22C55E", border: "rgba(34,197,94,0.2)" },
  "On Pass": { bg: "rgba(59,130,246,0.1)", text: "#60A5FA", border: "rgba(59,130,246,0.2)" },
  Discharged: { bg: "rgba(74,99,128,0.1)", text: "#4A6380", border: "rgba(74,99,128,0.2)" },
};

export default function ResidentRow({ id, homeId, fullName, status, flag, points, sobrietyDate }: ResidentRowProps) {
  const daysSober = sobrietyDate
    ? Math.floor((Date.now() - new Date(sobrietyDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const flagStyle = flagColors[flag] ?? { dot: "#4A6380", glow: "rgba(74,99,128,0.3)" };
  const sBadge = statusStyle[status] ?? { bg: "rgba(74,99,128,0.1)", text: "#4A6380", border: "rgba(74,99,128,0.2)" };
  const isRed = flag === "Red";

  return (
    <Link href={`/homes/${homeId}/residents/${id}`}>
      <div
        className="flex items-center gap-4 p-4 rounded-xl cursor-pointer group transition-all duration-150"
        style={{
          background: "#161B27",
          border: `1px solid ${isRed ? "rgba(239,68,68,0.2)" : "#1E2535"}`,
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#1A2236"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#161B27"}
      >
        {/* Flag dot with glow */}
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{
            background: flagStyle.dot,
            boxShadow: `0 0 6px ${flagStyle.glow}`,
          }}
        />

        {/* Name + stats */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate transition-colors" style={{ color: "#E6EDF3" }}>
            {fullName}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {daysSober !== null && (
              <span className="text-xs" style={{ color: "#4A6380" }}>{daysSober}d sober</span>
            )}
            <span className="text-xs" style={{ color: "#4A6380" }}>· {points} pts</span>
          </div>
        </div>

        {/* Status badge */}
        <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: sBadge.bg, color: sBadge.text, border: `1px solid ${sBadge.border}` }}>
          {status}
        </span>

        <ChevronRight size={15} style={{ color: "#2A3448" }} className="flex-shrink-0" />
      </div>
    </Link>
  );
}
