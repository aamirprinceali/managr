// Settings — user management, roles, and facility config (coming soon)
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Users, roles, and facility configuration</p>
      </div>
      <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-gray-200 rounded-2xl">
        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
          <Settings size={26} className="text-gray-400" />
        </div>
        <h3 className="font-semibold text-slate-900 mb-1">Coming in Sprint 5</h3>
        <p className="text-gray-400 text-sm max-w-xs">
          Add house managers, assign them to homes, set roles (Admin / Manager / Viewer), and configure your facility settings.
        </p>
      </div>
    </div>
  );
}
