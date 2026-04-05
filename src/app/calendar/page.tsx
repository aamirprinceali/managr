// Calendar — placeholder page for future Google Calendar / scheduling integration
import { Calendar } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Calendar</h1>
        <p className="text-gray-500 text-sm mt-0.5">Scheduled drug tests, house meetings, check-ins, and appointments</p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-gray-200 rounded-2xl">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#EEF2F7" }}>
          <Calendar size={26} style={{ color: "#0284C7" }} />
        </div>
        <h3 className="font-bold text-lg mb-2" style={{ color: "#0B1F3A" }}>Calendar — Coming Soon</h3>
        <p className="text-sm max-w-sm mb-4" style={{ color: "#64748B" }}>
          Schedule recurring drug tests, track house meeting attendance, and sync appointments.
          Will support Google Calendar integration so events show up on your phone.
        </p>

        {/* Feature preview list */}
        <div className="text-left space-y-2 bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 max-w-xs">
          {[
            "Recurring weekly drug test reminders",
            "House meeting schedule per resident",
            "Court dates and appointment tracking",
            "Google Calendar sync",
            "Email reminders to house managers",
          ].map(f => (
            <div key={f} className="flex items-center gap-2 text-xs" style={{ color: "#475569" }}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#0284C7" }} />
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
