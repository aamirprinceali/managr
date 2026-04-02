// Reports — nightly and weekly reports (coming soon)
import { FileText } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports</h1>
        <p className="text-gray-500 text-sm mt-0.5">Nightly reports, weekly summaries, and incident logs</p>
      </div>
      <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-gray-200 rounded-2xl">
        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
          <FileText size={26} className="text-amber-500" />
        </div>
        <h3 className="font-semibold text-slate-900 mb-1">Coming in Sprint 4</h3>
        <p className="text-gray-400 text-sm max-w-xs">
          Nightly report forms, weekly summaries, and incident report archive — built to match how your facility actually runs.
        </p>
      </div>
    </div>
  );
}
