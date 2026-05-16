"use client";
// Nightly Reports page
// Manager: submit tonight's report (or see "Already submitted" if done)
// Owner: see all homes' nightly report status and read submitted reports
import { useEffect, useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/components/auth/UserProvider";
import {
  Moon, CheckCircle, ChevronRight, Building2, Clock,
  AlertCircle, FileText, ChevronDown, ChevronUp
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type NightlyReport = {
  id: string;
  home_id: string;
  submitted_at: string;
  all_residents_accounted: boolean;
  incidents_tonight: boolean;
  incident_notes: string | null;
  medications_given: boolean;
  medication_notes: string | null;
  curfew_violations: boolean;
  curfew_notes: string | null;
  general_notes: string | null;
};

type HomeStatus = {
  id: string;
  name: string;
  submitted: boolean;
  report: NightlyReport | null;
};

// ─── Form: Manager submits nightly ────────────────────────────────────────────

function ManagerForm({ homeId, homeName, onSubmitted }: {
  homeId: string;
  homeName: string;
  onSubmitted: () => void;
}) {
  const { profile } = useProfile();
  const [form, setForm] = useState({
    all_residents_accounted: true,
    incidents_tonight: false,
    incident_notes: "",
    medications_given: true,
    medication_notes: "",
    curfew_violations: false,
    curfew_notes: "",
    general_notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.from("nightly_reports").insert({
      home_id: homeId,
      submitted_by: profile?.id ?? null,
      all_residents_accounted: form.all_residents_accounted,
      incidents_tonight: form.incidents_tonight,
      incident_notes: form.incidents_tonight ? form.incident_notes : null,
      medications_given: form.medications_given,
      medication_notes: !form.medications_given ? form.medication_notes : null,
      curfew_violations: form.curfew_violations,
      curfew_notes: form.curfew_violations ? form.curfew_notes : null,
      general_notes: form.general_notes || null,
    });
    if (err) {
      setError(err.message.includes("does not exist")
        ? "Nightly reports table not set up yet. Run Block 5 in Setup & Seed."
        : err.message);
      setSubmitting(false);
    } else {
      onSubmitted();
    }
  }

  const yesStyle = (active: boolean) => active
    ? { background: "rgba(22,163,74,0.1)", color: "#16A34A", border: "1px solid rgba(22,163,74,0.25)" }
    : { background: "#F1F5F9", color: "#94A3B8", border: "1px solid #E2E8F0" };

  const noStyle = (active: boolean) => active
    ? { background: "rgba(220,38,38,0.08)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)" }
    : { background: "#F1F5F9", color: "#94A3B8", border: "1px solid #E2E8F0" };

  const textareaStyle = { background: "#FFFFFF", color: "#0F172A", border: "1px solid #E2E8F0" };

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Moon size={16} style={{ color: "#1B6EF3" }} strokeWidth={2} />
          <span className="section-label" style={{ color: "#1B6EF3" }}>Nightly Report</span>
        </div>
        <h1 className="page-title">
          Tonight&apos;s Report
        </h1>
        <p className="text-sm mt-1" style={{ color: "#64748B" }}>
          {homeName} · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* All residents accounted for */}
        <div className="rounded-xl p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>All residents accounted for?</p>
              <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Everyone is present or on approved pass</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, all_residents_accounted: true }))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={yesStyle(form.all_residents_accounted)}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, all_residents_accounted: false }))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={noStyle(!form.all_residents_accounted)}
              >
                No
              </button>
            </div>
          </div>
        </div>

        {/* Incidents tonight */}
        <div className="rounded-xl p-4 bg-white border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>Any incidents tonight?</p>
              <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Fights, violations, medical issues, etc.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, incidents_tonight: true }))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={noStyle(form.incidents_tonight)}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, incidents_tonight: false }))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={yesStyle(!form.incidents_tonight)}
              >
                No
              </button>
            </div>
          </div>
          {form.incidents_tonight && (
            <textarea
              placeholder="Describe what happened..."
              value={form.incident_notes}
              onChange={e => setForm(f => ({ ...f, incident_notes: e.target.value }))}
              rows={3}
              className="w-full text-sm rounded-lg px-3 py-2 resize-none outline-none focus:ring-2 focus:ring-sky-200"
              style={textareaStyle}
            />
          )}
        </div>

        {/* Medications given */}
        <div className="rounded-xl p-4 bg-white border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>Night medications given?</p>
              <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>All scheduled night meds administered</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, medications_given: true }))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={yesStyle(form.medications_given)}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, medications_given: false }))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={noStyle(!form.medications_given)}
              >
                No
              </button>
            </div>
          </div>
          {!form.medications_given && (
            <textarea
              placeholder="Which medications were missed and why?"
              value={form.medication_notes}
              onChange={e => setForm(f => ({ ...f, medication_notes: e.target.value }))}
              rows={2}
              className="w-full text-sm rounded-lg px-3 py-2 resize-none outline-none focus:ring-2 focus:ring-sky-200"
              style={textareaStyle}
            />
          )}
        </div>

        {/* Curfew violations */}
        <div className="rounded-xl p-4 bg-white border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>Any curfew violations?</p>
              <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Late returns or unauthorized absences</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, curfew_violations: true }))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={noStyle(form.curfew_violations)}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, curfew_violations: false }))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={yesStyle(!form.curfew_violations)}
              >
                No
              </button>
            </div>
          </div>
          {form.curfew_violations && (
            <textarea
              placeholder="Who violated curfew and what happened?"
              value={form.curfew_notes}
              onChange={e => setForm(f => ({ ...f, curfew_notes: e.target.value }))}
              rows={2}
              className="w-full text-sm rounded-lg px-3 py-2 resize-none outline-none focus:ring-2 focus:ring-sky-200"
              style={textareaStyle}
            />
          )}
        </div>

        {/* General notes */}
        <div className="rounded-xl p-4 bg-white border border-slate-200">
          <p className="text-sm font-semibold mb-2" style={{ color: "#0F172A" }}>General notes</p>
          <textarea
            placeholder="Anything else worth noting tonight..."
            value={form.general_notes}
            onChange={e => setForm(f => ({ ...f, general_notes: e.target.value }))}
            rows={3}
            className="w-full text-sm rounded-lg px-3 py-2 resize-none outline-none focus:ring-2 focus:ring-sky-200"
            style={textareaStyle}
          />
        </div>

        {error && (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}
          >
            <AlertCircle size={13} style={{ color: "#DC2626" }} />
            <p className="text-xs" style={{ color: "#DC2626" }}>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-colors"
          style={{ background: "#1B6EF3", color: "white", opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? "Submitting..." : "Submit Nightly Report"}
        </button>
      </form>
    </div>
  );
}

// ─── Confirmed: already submitted ─────────────────────────────────────────────

function AlreadySubmitted({ report }: { report: NightlyReport }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="max-w-xl mx-auto">
      {/* Success card */}
      <div
        className="rounded-xl p-6 mb-4 text-center fade-in bg-white border"
        style={{ borderColor: "rgba(22,163,74,0.3)" }}
      >
        <CheckCircle size={32} style={{ color: "#16A34A" }} strokeWidth={1.5} className="mx-auto mb-3" />
        <p className="text-lg font-semibold" style={{ color: "#16A34A" }}>Nightly Report Submitted</p>
        <p className="text-sm mt-1" style={{ color: "#64748B" }}>
          {new Date(report.submitted_at).toLocaleString("en-US", {
            weekday: "long", month: "long", day: "numeric",
            hour: "numeric", minute: "2-digit"
          })}
        </p>
      </div>

      {/* View summary toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors bg-white border border-slate-200 hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          <FileText size={13} style={{ color: "#64748B" }} strokeWidth={2} />
          <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>View tonight&apos;s report</span>
        </div>
        {expanded ? <ChevronUp size={14} style={{ color: "#64748B" }} /> : <ChevronDown size={14} style={{ color: "#64748B" }} />}
      </button>

      {expanded && (
        <div
          className="mt-2 rounded-xl divide-y divide-slate-100 fade-in bg-white border border-slate-200"
        >
          {[
            { label: "All residents accounted for", value: report.all_residents_accounted, notes: null },
            { label: "Incidents tonight", value: report.incidents_tonight, notes: report.incident_notes },
            { label: "Medications given", value: report.medications_given, notes: report.medication_notes },
            { label: "Curfew violations", value: report.curfew_violations, notes: report.curfew_notes },
          ].map(item => (
            <div key={item.label} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: "#64748B" }}>{item.label}</span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: item.value ? "#16A34A" : "#DC2626" }}
                >
                  {item.value ? "Yes" : "No"}
                </span>
              </div>
              {item.notes && (
                <p className="text-xs mt-1" style={{ color: "#64748B" }}>{item.notes}</p>
              )}
            </div>
          ))}
          {report.general_notes && (
            <div className="px-4 py-3">
              <p className="text-xs font-medium mb-1" style={{ color: "#64748B" }}>General notes</p>
              <p className="text-xs" style={{ color: "#475569" }}>{report.general_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Owner view: all homes nightly status ─────────────────────────────────────

function OwnerNightlyView() {
  const [homes, setHomes] = useState<HomeStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { loadHomes(); }, []);

  async function loadHomes() {
    const supabase = createClient();
    const { data: homesData } = await supabase
      .from("homes")
      .select("id, name")
      .order("name");

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const statuses: HomeStatus[] = [];
    for (const home of (homesData ?? [])) {
      let report: NightlyReport | null = null;
      try {
        const { data } = await supabase
          .from("nightly_reports")
          .select("*")
          .eq("home_id", home.id)
          .gte("submitted_at", todayStart.toISOString())
          .order("submitted_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        report = data as NightlyReport | null;
      } catch { /* table not set up */ }

      statuses.push({ id: home.id, name: home.name, submitted: !!report, report });
    }
    setHomes(statuses);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        {[1,2,3].map(i => (
          <div key={i} className="h-16 rounded-xl animate-pulse bg-slate-200" />
        ))}
      </div>
    );
  }

  const submitted = homes.filter(h => h.submitted).length;
  const missing = homes.filter(h => !h.submitted).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Moon size={16} style={{ color: "#1B6EF3" }} strokeWidth={2} />
          <span className="section-label" style={{ color: "#1B6EF3" }}>Tonight&apos;s Reports</span>
        </div>
        <h1 className="page-title">Nightly Reports</h1>
        <p className="text-sm mt-1" style={{ color: "#64748B" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          &nbsp;·&nbsp;{submitted}/{homes.length} submitted
          {missing > 0 && <span style={{ color: "#DC2626" }}> · {missing} missing</span>}
        </p>
      </div>

      <div className="space-y-2">
        {homes.map(home => (
          <div
            key={home.id}
            className="rounded-xl overflow-hidden bg-white"
            style={{ border: `1px solid ${!home.submitted ? "rgba(220,38,38,0.2)" : "#E2E8F0"}` }}
          >
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
              onClick={() => setExpanded(expanded === home.id ? null : home.id)}
              disabled={!home.submitted}
            >
              <Building2 size={14} style={{ color: "#64748B" }} strokeWidth={2} />
              <span className="flex-1 text-sm font-semibold" style={{ color: "#0F172A" }}>{home.name}</span>
              {home.submitted ? (
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={13} style={{ color: "#16A34A" }} strokeWidth={2.5} />
                  <span className="text-xs font-medium" style={{ color: "#16A34A" }}>Submitted</span>
                  {expanded === home.id ? (
                    <ChevronUp size={13} style={{ color: "#64748B" }} />
                  ) : (
                    <ChevronDown size={13} style={{ color: "#64748B" }} />
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Clock size={13} style={{ color: "#DC2626" }} strokeWidth={2} />
                  <span className="text-xs font-medium" style={{ color: "#DC2626" }}>Missing</span>
                </div>
              )}
            </button>

            {/* Expanded report detail */}
            {expanded === home.id && home.report && (
              <div
                className="divide-y divide-slate-100 fade-in"
                style={{ borderTop: "1px solid #E2E8F0" }}
              >
                {[
                  { label: "All residents accounted for", value: home.report.all_residents_accounted, notes: null },
                  { label: "Incidents tonight", value: home.report.incidents_tonight, notes: home.report.incident_notes },
                  { label: "Medications given", value: home.report.medications_given, notes: home.report.medication_notes },
                  { label: "Curfew violations", value: home.report.curfew_violations, notes: home.report.curfew_notes },
                ].map(item => (
                  <div key={item.label} className="px-4 py-3 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-medium" style={{ color: "#64748B" }}>{item.label}</p>
                      {item.notes && <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{item.notes}</p>}
                    </div>
                    <span
                      className="text-xs font-semibold flex-shrink-0"
                      style={{ color: item.value ? "#16A34A" : "#DC2626" }}
                    >
                      {item.value ? "Yes" : "No"}
                    </span>
                  </div>
                ))}
                {home.report.general_notes && (
                  <div className="px-4 py-3">
                    <p className="text-xs font-medium mb-0.5" style={{ color: "#64748B" }}>General notes</p>
                    <p className="text-xs" style={{ color: "#475569" }}>{home.report.general_notes}</p>
                  </div>
                )}
                <div className="px-4 py-2">
                  <p className="text-[10px]" style={{ color: "#94A3B8" }}>
                    Submitted {new Date(home.report.submitted_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Manager view wrapper (handles submitted / not submitted) ─────────────────

function ManagerNightlyView() {
  const { profile } = useProfile();
  const homeId = profile?.home_id ?? "";
  const [homeName, setHomeName] = useState("");
  const [report, setReport] = useState<NightlyReport | null | undefined>(undefined); // undefined = loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (homeId) checkStatus();
  }, [homeId]);

  async function checkStatus() {
    const supabase = createClient();

    const { data: home } = await supabase
      .from("homes")
      .select("name")
      .eq("id", homeId)
      .maybeSingle();
    setHomeName(home?.name ?? "Your Home");

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    try {
      const { data } = await supabase
        .from("nightly_reports")
        .select("*")
        .eq("home_id", homeId)
        .gte("submitted_at", todayStart.toISOString())
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setReport(data as NightlyReport | null);
    } catch {
      setReport(null); // table not set up, show form anyway
    }
    setLoading(false);
  }

  if (loading || report === undefined) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-20 rounded-xl animate-pulse bg-slate-200" />
        ))}
      </div>
    );
  }

  if (report) return <AlreadySubmitted report={report} />;
  return <ManagerForm homeId={homeId} homeName={homeName} onSubmitted={() => checkStatus()} />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function NightlyPageContent() {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-20 rounded-xl animate-pulse bg-slate-200" />
        ))}
      </div>
    );
  }

  if (profile?.role === "owner") return <OwnerNightlyView />;
  return <ManagerNightlyView />;
}

export default function NightlyPage() {
  return (
    <Suspense fallback={
      <div className="max-w-xl mx-auto space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-20 rounded-xl animate-pulse bg-slate-200" />
        ))}
      </div>
    }>
      <NightlyPageContent />
    </Suspense>
  );
}
