// Analytics — occupancy trends and program metrics (coming soon)
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics</h1>
        <p className="text-gray-500 text-sm mt-0.5">Occupancy trends, outcomes, and program metrics</p>
      </div>
      <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-gray-200 rounded-2xl">
        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
          <BarChart3 size={26} className="text-purple-500" />
        </div>
        <h3 className="font-semibold text-slate-900 mb-1">Coming Soon</h3>
        <p className="text-gray-400 text-sm max-w-xs">
          Occupancy rates over time, discharge outcomes, drug test pass rates — the data that helps you run a better program.
        </p>
      </div>
    </div>
  );
}
