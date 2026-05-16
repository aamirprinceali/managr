// Calendar — placeholder page for future scheduling integration
import { Calendar, Clock, FlaskConical, Users, Gavel, Bell } from "lucide-react";

const COMING_FEATURES = [
  { icon: FlaskConical, label: "Recurring weekly drug test reminders", color: "#7C3AED" },
  { icon: Users, label: "House meeting schedule per resident", color: "#1B6EF3" },
  { icon: Gavel, label: "Court dates and appointment tracking", color: "#D97706" },
  { icon: Calendar, label: "Google Calendar sync", color: "#16A34A" },
  { icon: Bell, label: "Email reminders to house managers", color: "#DC2626" },
];

export default function CalendarPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "#0F172A" }}>Calendar</h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Scheduled drug tests, house meetings, check-ins, and appointments</p>
      </div>

      <div className="dash-card flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(27,110,243,0.08)" }}>
          <Calendar size={26} style={{ color: "#1B6EF3" }} />
        </div>
        <h3 className="font-semibold text-base mb-2" style={{ color: "#0F172A" }}>Calendar — Coming Soon</h3>
        <p className="text-sm max-w-sm mb-6" style={{ color: "#64748B" }}>
          Schedule recurring drug tests, track house meeting attendance, and sync appointments.
          Supports Google Calendar so events show up on your phone.
        </p>

        <div className="space-y-2.5 text-left rounded-xl px-5 py-4 max-w-xs w-full bg-slate-50 border border-slate-200">
          <p className="card-label mb-3">Planned Features</p>
          {COMING_FEATURES.map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-3 text-xs" style={{ color: "#64748B" }}>
              <Icon size={13} style={{ color, flexShrink: 0 }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
