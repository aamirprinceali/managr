"use client";
// Reports page — drug test compliance, resident status overview, flag distribution, incidents
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileText, FlaskConical, Users, AlertTriangle, FileWarning, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type HomeReport = {
  id: string; name: string; total: number; active: number;
  onPass: number; discharged: number; green: number; yellow: number; red: number; bedCount: number;
};

type DrugTestReport = {
  residentId: string; name: string; homeName: string;
  lastTest: string | null; lastResult: string | null; daysSince: number; testCount: number;
};

type Incident = {
  id: string; body: string; created_at: string; resident_name: string; home_name: string;
};

export default function ReportsPage() {
  const [homeReports, setHomeReports] = useState<HomeReport[]>([]);
  const [drugTestReports, setDrugTestReports] = useState<DrugTestReport[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [dateRange, setDateRange] = useState("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadReports(); }, [dateRange]);

  async function loadReports() {
    setLoading(true);
    const supabase = createClient();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(dateRange));
    const cutoffStr = cutoff.toISOString().split("T")[0];

    const { data: homes } = await supabase
      .from("homes").select("id, name, bed_count, residents(id, status, flag, is_archived)").order("name");

    if (homes) {
      const reports: HomeReport[] = (homes as {
        id: string; name: string; bed_count: number;
        residents: { id: string; status: string; flag: string; is_archived: boolean }[];
      }[]).map(h => {
        const active = h.residents.filter(r => !r.is_archived);
        return {
          id: h.id, name: h.name, bedCount: h.bed_count, total: active.length,
          active: active.filter(r => r.status === "Active").length,
          onPass: active.filter(r => r.status === "On Pass").length,
          discharged: active.filter(r => r.status === "Discharged").length,
          green: active.filter(r => r.flag === "Green").length,
          yellow: active.filter(r => r.flag === "Yellow").length,
          red: active.filter(r => r.flag === "Red").length,
        };
      });
      setHomeReports(reports);
    }

    const { data: residents } = await supabase
      .from("residents").select("id, full_name, home_id, homes(name)")
      .eq("is_archived", false).eq("status", "Active");

    if (residents) {
      const dtReports: DrugTestReport[] = [];
      for (const r of residents as unknown as { id: string; full_name: string; homes: { name: string } | null }[]) {
        const { data: tests } = await supabase.from("drug_tests").select("test_date, result")
          .eq("resident_id", r.id).gte("test_date", cutoffStr).order("test_date", { ascending: false });
        const { data: lastTestAll } = await supabase.from("drug_tests").select("test_date, result")
          .eq("resident_id", r.id).order("test_date", { ascending: false }).limit(1).maybeSingle();
        const lastDate = lastTestAll?.test_date ?? null;
        const daysSince = lastDate
          ? Math.floor((new Date().getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)) : 999;
        dtReports.push({
          residentId: r.id, name: r.full_name, homeName: r.homes?.name ?? "Unknown",
          lastTest: lastDate, lastResult: lastTestAll?.result ?? null, daysSince, testCount: tests?.length ?? 0,
        });
      }
      setDrugTestReports(dtReports.sort((a, b) => b.daysSince - a.daysSince));
    }

    const { data: incidentData } = await supabase
      .from("notes").select("id, body, created_at, residents(full_name, homes(name))")
      .eq("type", "Incident").gte("created_at", cutoff.toISOString()).order("created_at", { ascending: false });

    if (incidentData) {
      setIncidents(
        (incidentData as unknown as {
          id: string; body: string; created_at: string;
          residents: { full_name: string; homes: { name: string } | null } | null;
        }[]).map(i => ({
          id: i.id, body: i.body, created_at: i.created_at,
          resident_name: i.residents?.full_name ?? "Unknown",
          home_name: i.residents?.homes?.name ?? "Unknown",
        }))
      );
    }

    setLoading(false);
  }

  const totalResidents = homeReports.reduce((s, h) => s + h.total, 0);
  const totalRed = homeReports.reduce((s, h) => s + h.red, 0);
  const totalYellow = homeReports.reduce((s, h) => s + h.yellow, 0);
  const totalGreen = homeReports.reduce((s, h) => s + h.green, 0);
  const testedCount = drugTestReports.filter(r => r.daysSince < 7).length;
  const compliance = totalResidents > 0 ? Math.round((testedCount / drugTestReports.length) * 100) : 0;

  const resultStyle = (result: string | null) => {
    if (result === "Negative") return { background: "rgba(34,197,94,0.15)", color: "#4ADE80" };
    if (result === "Positive") return { background: "rgba(239,68,68,0.15)", color: "#F87171" };
    if (result === "Refused") return { background: "rgba(245,158,11,0.15)", color: "#FCD34D" };
    return { background: "rgba(100,116,139,0.15)", color: "#94A3B8" };
  };

  const thStyle = { color: "#334155", fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", padding: "10px 12px" };
  const tdStyle = { color: "#94A3B8", fontSize: "0.8rem", padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.04)" };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "#F1F5F9" }}>Reports</h1>
          <p className="text-sm mt-0.5" style={{ color: "#475569" }}>Drug test compliance, resident status, and incident logs</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="text-xs font-medium rounded-lg px-3 py-1.5 outline-none"
            style={{ background: "#0F1523", border: "1px solid rgba(255,255,255,0.06)", color: "#94A3B8" }}
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button
            variant="outline"
            className="gap-2 text-xs h-8"
            style={{ borderColor: "rgba(255,255,255,0.08)", color: "#94A3B8", background: "transparent" }}
            onClick={() => window.print()}
          >
            <Printer size={13} />
            Print
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="rounded-2xl p-6 animate-pulse h-40" style={{ background: "#0F1523" }} />)}
        </div>
      ) : (
        <div className="space-y-5">

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Residents", value: totalResidents, icon: Users, color: "#60A5FA", bg: "rgba(59,130,246,0.1)" },
              { label: "Drug Test Compliance", value: `${compliance}%`, icon: FlaskConical,
                color: compliance >= 80 ? "#4ADE80" : "#F87171", bg: compliance >= 80 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" },
              { label: "Incidents", value: incidents.length, icon: FileWarning,
                color: incidents.length > 0 ? "#F87171" : "#334155", bg: incidents.length > 0 ? "rgba(239,68,68,0.1)" : "#131929" },
              { label: "Red Flags", value: totalRed, icon: AlertTriangle,
                color: totalRed > 0 ? "#F87171" : "#334155", bg: totalRed > 0 ? "rgba(239,68,68,0.1)" : "#131929" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="dash-card p-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                  <Icon size={17} style={{ color }} strokeWidth={2} />
                </div>
                <p className="text-2xl font-bold leading-none" style={{ color: "#F1F5F9" }}>{value}</p>
                <p className="text-xs font-medium mt-1" style={{ color: "#475569" }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Resident Status by Home */}
          <div className="dash-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <Users size={15} style={{ color: "#3B82F6" }} />
              <h2 className="font-semibold text-sm" style={{ color: "#F1F5F9" }}>Resident Status by Home</h2>
            </div>
            {homeReports.length === 0 ? (
              <p className="px-5 py-8 text-sm text-center" style={{ color: "#334155" }}>No homes yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "#131929" }}>
                      <th style={{ ...thStyle, textAlign: "left", paddingLeft: 20 }}>Home</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Capacity</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Active</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>On Pass</th>
                      <th style={{ ...thStyle, textAlign: "center", color: "#4ADE80" }}>Green</th>
                      <th style={{ ...thStyle, textAlign: "center", color: "#FCD34D" }}>Yellow</th>
                      <th style={{ ...thStyle, textAlign: "center", color: "#F87171" }}>Red</th>
                    </tr>
                  </thead>
                  <tbody>
                    {homeReports.map(h => (
                      <tr key={h.id} className="row-hover">
                        <td style={{ ...tdStyle, paddingLeft: 20 }}>
                          <Link href={`/homes/${h.id}`} className="font-medium hover:underline" style={{ color: "#F1F5F9" }}>
                            {h.name}
                          </Link>
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>{h.total}/{h.bedCount > 0 ? h.bedCount : "—"}</td>
                        <td style={{ ...tdStyle, textAlign: "center", color: "#F1F5F9", fontWeight: 600 }}>{h.active}</td>
                        <td style={{ ...tdStyle, textAlign: "center", color: "#60A5FA" }}>{h.onPass}</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#4ADE80" }}>{h.green}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.15)", color: "#FCD34D" }}>{h.yellow}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full`}
                            style={h.red > 0 ? { background: "rgba(239,68,68,0.15)", color: "#F87171" } : { background: "#131929", color: "#334155" }}>
                            {h.red}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "#131929", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <td style={{ ...tdStyle, paddingLeft: 20, color: "#475569", fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>TOTALS</td>
                      <td style={{ ...tdStyle, textAlign: "center", color: "#F1F5F9", fontWeight: 700 }}>{totalResidents}</td>
                      <td style={{ ...tdStyle, textAlign: "center", color: "#F1F5F9", fontWeight: 700 }}>{homeReports.reduce((s, h) => s + h.active, 0)}</td>
                      <td style={{ ...tdStyle, textAlign: "center", color: "#60A5FA", fontWeight: 700 }}>{homeReports.reduce((s, h) => s + h.onPass, 0)}</td>
                      <td style={{ ...tdStyle, textAlign: "center", color: "#4ADE80", fontWeight: 700 }}>{totalGreen}</td>
                      <td style={{ ...tdStyle, textAlign: "center", color: "#FCD34D", fontWeight: 700 }}>{totalYellow}</td>
                      <td style={{ ...tdStyle, textAlign: "center", color: "#F87171", fontWeight: 700 }}>{totalRed}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Drug Test Compliance */}
          <div className="dash-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex items-center gap-2">
                <FlaskConical size={15} style={{ color: "#C084FC" }} />
                <h2 className="font-semibold text-sm" style={{ color: "#F1F5F9" }}>Drug Test Status</h2>
              </div>
              <span className="text-xs" style={{ color: "#334155" }}>
                {testedCount} of {drugTestReports.length} tested in last 7 days ({compliance}%)
              </span>
            </div>
            {/* Compliance bar */}
            <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#131929" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${compliance}%`, background: compliance >= 80 ? "#4ADE80" : compliance >= 50 ? "#FCD34D" : "#F87171" }}
                />
              </div>
            </div>
            {drugTestReports.length === 0 ? (
              <p className="px-5 py-8 text-sm text-center" style={{ color: "#334155" }}>No active residents</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "#131929" }}>
                      <th style={{ ...thStyle, textAlign: "left", paddingLeft: 20 }}>Resident</th>
                      <th style={{ ...thStyle, textAlign: "left" }}>Home</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Last Tested</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Result</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Tests ({dateRange}d)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drugTestReports.map(r => {
                      const isOverdue = r.daysSince >= 7;
                      return (
                        <tr key={r.residentId} className="row-hover">
                          <td style={{ ...tdStyle, paddingLeft: 20, color: "#F1F5F9", fontWeight: 500 }}>{r.name}</td>
                          <td style={tdStyle}>{r.homeName}</td>
                          <td style={{ ...tdStyle, textAlign: "center", color: isOverdue ? "#F87171" : "#94A3B8", fontWeight: isOverdue ? 600 : 400 }}>
                            {r.lastTest ? new Date(r.lastTest + "T00:00:00").toLocaleDateString() : "Never"}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            {r.lastResult ? (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={resultStyle(r.lastResult)}>
                                {r.lastResult}
                              </span>
                            ) : <span style={{ color: "#1E293B" }}>—</span>}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "center", color: "#F1F5F9", fontWeight: 600 }}>{r.testCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Incidents */}
          <div className="dash-card overflow-hidden">
            <div className="flex items-center px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <FileWarning size={15} style={{ color: "#F87171" }} />
              <h2 className="font-semibold text-sm ml-2" style={{ color: "#F1F5F9" }}>Incident Log</h2>
              <span className="text-xs ml-auto" style={{ color: "#334155" }}>Last {dateRange} days · {incidents.length} total</span>
            </div>
            {incidents.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium" style={{ color: "#4ADE80" }}>No incidents</p>
                <p className="text-xs mt-0.5" style={{ color: "#334155" }}>No incidents reported in this time period</p>
              </div>
            ) : (
              <div>
                {incidents.map(i => (
                  <div key={i.id} className="px-5 py-4 row-hover" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm" style={{ color: "#F1F5F9" }}>{i.resident_name}</span>
                      <span className="text-xs" style={{ color: "#334155" }}>
                        {new Date(i.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs mb-1" style={{ color: "#334155" }}>{i.home_name}</p>
                    <p className="text-sm" style={{ color: "#94A3B8" }}>{i.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
