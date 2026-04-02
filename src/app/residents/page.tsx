// All Residents — global view across all homes (coming soon)
import { Users } from "lucide-react";

export default function ResidentsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">All Residents</h1>
        <p className="text-gray-500 text-sm mt-0.5">Global view across all homes</p>
      </div>
      <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-gray-200 rounded-2xl">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
          <Users size={26} className="text-blue-500" />
        </div>
        <h3 className="font-semibold text-slate-900 mb-1">Coming in Sprint 2</h3>
        <p className="text-gray-400 text-sm max-w-xs">
          Global resident search and list across all homes. For now, access residents through each home's dashboard.
        </p>
      </div>
    </div>
  );
}
