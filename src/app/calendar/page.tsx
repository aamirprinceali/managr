// Calendar — placeholder page for future scheduling integration
import { Calendar, Clock, FlaskConical, Users, Gavel, Bell } from "lucide-react";

const COMING_FEATURES = [
  { icon: FlaskConical, label: "Recurring weekly drug test reminders", color: "#C084FC" },
  { icon: Users, label: "House meeting schedule per resident", color: "#60A5FA" },
  { icon: Gavel, label: "Court dates and appointment tracking", color: "#FCD34D" },
  { icon: Calendar, label: "Google Calendar sync", color: "#4ADE80" },
  { icon: Bell, label: "Email reminders to house managers", color: "#F87171" },
];

export default function CalendarPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "#F1F5F9" }}>Calendar</h1>
        <p className="text-sm mt-0.5" style={{ color: "#475569" }}>Scheduled drug tests, house meetings, check-ins, and appointments</p>
      </div>

      <div className="dash-card flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(59,130,246,0.1)" }}>
          <Calendar size={26} style={{ color: "#60A5FA" }} />
        </div>
        <h3 className="font-semibold text-base mb-2" style={{ color: "#F1F5F9" }}>Calendar — Coming Soon</h3>
        <p className="text-sm max-w-sm mb-6" style={{ color: "#475569" }}>
          Schedule recurring drug tests, track house meeting attendance, and sync appointments.
          Supports Google Calendar so events show up on your phone.
        </p>

        <div className="space-y-2.5 text-left rounded-xl px-5 py-4 max-w-xs w-full" style={{ background: "#131929", border: "1px solid rgba(255,255,255,0.04)" }}>
          <p className="card-label mb-3">Planned Features</p>
          {COMING_FEATURES.map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-3 text-xs" style={{ color: "#94A3B8" }}>
              <Icon size={13} style={{ color, flexShrink: 0 }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
