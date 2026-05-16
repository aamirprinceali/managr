// All Residents — global view across all homes (coming soon)
import { Users } from "lucide-react";

export default function ResidentsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F172A" }}>All Residents</h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Global view across all homes</p>
      </div>
      <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl bg-white border border-slate-200">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "rgba(27,110,243,0.08)" }}>
          <Users size={26} style={{ color: "#1B6EF3" }} />
        </div>
        <h3 className="font-semibold mb-1" style={{ color: "#0F172A" }}>Coming in Sprint 2</h3>
        <p className="text-sm max-w-xs" style={{ color: "#64748B" }}>
          Global resident search and list across all homes. For now, access residents through each home&apos;s dashboard.
        </p>
      </div>
    </div>
  );
}
