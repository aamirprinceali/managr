"use client";
// Reports page — drug test compliance, resident status overview, flag distribution, incidents
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileText, FlaskConical, Users, AlertTriangle, FileWarning, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type HomeReport = {
  id: string;
  name: string;
  total: number;
  active: number;
  onPass: number;
  discharged: number;
  green: number;
  yellow: number;
  red: number;
  bedCount: number;
};

type DrugTestReport = {
  residentId: string;
  name: string;
  homeName: string;
  lastTest: string | null;
  lastResult: string | null;
  daysSince: number;
  testCount: number;
};

type Incident = {
  id: string;
  body: string;
  created_at: string;
  resident_name: string;
  home_name: string;
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

    // Load all homes with residents
    const { data: homes } = await supabase
      .from("homes")
      .select("id, name, bed_count, residents(id, status, flag, is_archived)")
      .order("name");

    if (homes) {
      const reports: HomeReport[] = (homes as {
        id: string; name: string; bed_count: number;
        residents: { id: string; status: string; flag: string; is_archived: boolean }[];
      }[]).map(h => {
        const active = h.residents.filter(r => !r.is_archived);
        return {
          id: h.id,
          name: h.name,
          total: active.length,
          active: active.filter(r => r.status === "Active").length,
          onPass: active.filter(r => r.status === "On Pass").length,
          discharged: active.filter(r => r.status === "Discharged").length,
          green: active.filter(r => r.flag === "Green").length,
          yellow: active.filter(r => r.flag === "Yellow").length,
          red: active.filter(r => r.flag === "Red").length,
          bedCount: h.bed_count,
        };
      });
      setHomeReports(reports);
    }

    // Load all active residents with their last drug test
    const { data: residents } = await supabase
      .from("residents")
      .select("id, full_name, home_id, homes(name)")
      .eq("is_archived", false)
      .eq("status", "Active");

    if (residents) {
      const dtReports: DrugTestReport[] = [];
      for (const r of residents as { id: string; full_name: string; homes: { name: string } | null }[]) {
        const { data: tests } = await supabase
          .from("drug_tests")
          .select("test_date, result")
          .eq("resident_id", r.id)
          .gte("test_date", cutoffStr)
          .order("test_date", { ascending: false });

        const { data: lastTestAll } = await supabase
          .from("drug_tests")
          .select("test_date, result")
          .eq("resident_id", r.id)
          .order("test_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        const lastDate = lastTestAll?.test_date ?? null;
        const daysSince = lastDate
          ? Math.floor((new Date().getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        dtReports.push({
          residentId: r.id,
          name: r.full_name,
          homeName: r.homes?.name ?? "Unknown",
          lastTest: lastDate,
          lastResult: lastTestAll?.result ?? null,
          daysSince,
          testCount: tests?.length ?? 0,
        });
      }
      setDrugTestReports(dtReports.sort((a, b) => b.daysSince - a.daysSince));
    }

    // Load incidents in date range
    const { data: incidentData } = await supabase
      .from("notes")
      .select("id, body, created_at, residents(full_name, homes(name))")
      .eq("type", "Incident")
      .gte("created_at", cutoff.toISOString())
      .order("created_at", { ascending: false });

    if (incidentData) {
      setIncidents(
        (incidentData as {
          id: string; body: string; created_at: string;
          residents: { full_name: string; homes: { name: string } | null } | null;
        }[]).map(i => ({
          id: i.id,
          body: i.body,
          created_at: i.created_at,
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

  const resultColor = (result: string | null) => {
    if (result === "Negative") return { bg: "#DCFCE7", text: "#16A34A" };
    if (result === "Positive") return { bg: "#FEE2E2", text: "#DC2626" };
    if (result === "Refused") return { bg: "#FEF3C7", text: "#D97706" };
    return { bg: "#F1F5F9", text: "#64748B" };
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0B1F3A" }}>Reports</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Drug test compliance, resident status, and incident logs</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date range filter */}
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="text-xs font-medium border rounded-lg px-3 py-1.5 outline-none"
            style={{ borderColor: "#DDE4ED", color: "#0B1F3A" }}
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button
            variant="outline"
            className="gap-2 text-xs"
            onClick={() => window.print()}
          >
            <Printer size={13} />
            Print
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse h-40" />)}
        </div>
      ) : (
        <div className="space-y-6">

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Residents", value: totalResidents, color: "#0B1F3A", bg: "#EEF2F7", icon: Users },
              { label: "Drug Test Compliance", value: `${compliance}%`, color: compliance >= 80 ? "#16A34A" : "#DC2626", bg: compliance >= 80 ? "#DCFCE7" : "#FEE2E2", icon: FlaskConical },
              { label: "Incidents", value: incidents.length, color: incidents.length > 0 ? "#DC2626" : "#94A3B8", bg: incidents.length > 0 ? "#FEE2E2" : "#F1F5F9", icon: FileWarning },
              { label: "Red Flags", value: totalRed, color: totalRed > 0 ? "#DC2626" : "#94A3B8", bg: totalRed > 0 ? "#FEE2E2" : "#F1F5F9", icon: AlertTriangle },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <div key={label} className="bg-white border rounded-2xl p-4" style={{ borderColor: "#DDE4ED" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                  <Icon size={18} style={{ color }} strokeWidth={2} />
                </div>
                <p className="text-2xl font-bold leading-none" style={{ color: "#0B1F3A" }}>{value}</p>
                <p className="text-xs font-medium mt-1" style={{ color: "#64748B" }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Resident Status by Home */}
          <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "#DDE4ED" }}>
            <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
              <Users size={16} style={{ color: "#0284C7" }} />
              <h2 className="font-bold text-sm" style={{ color: "#0B1F3A" }}>Resident Status by Home</h2>
            </div>
            {homeReports.length === 0 ? (
              <p className="px-5 py-6 text-sm text-center" style={{ color: "#94A3B8" }}>No homes yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#F8FAFC" }}>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>Home</th>
                      <th className="text-center px-3 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>Capacity</th>
                      <th className="text-center px-3 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>Active</th>
                      <th className="text-center px-3 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>On Pass</th>
                      <th className="text-center px-3 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#16A34A" }}>Green</th>
                      <th className="text-center px-3 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#D97706" }}>Yellow</th>
                      <th className="text-center px-3 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#DC2626" }}>Red</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "#F1F5F9" }}>
                    {homeReports.map(h => (
                      <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <Link href={`/homes/${h.id}`} className="font-semibold hover:underline" style={{ color: "#0B1F3A" }}>
                            {h.name}
                          </Link>
                        </td>
                        <td className="text-center px-3 py-3" style={{ color: "#64748B" }}>
                          {h.total}/{h.bedCount > 0 ? h.bedCount : "—"}
                        </td>
                        <td className="text-center px-3 py-3 font-semibold" style={{ color: "#0B1F3A" }}>{h.active}</td>
                        <td className="text-center px-3 py-3 font-semibold" style={{ color: "#0284C7" }}>{h.onPass}</td>
                        <td className="text-center px-3 py-3">
                          <span className="inline-block font-bold text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{h.green}</span>
                        </td>
                        <td className="text-center px-3 py-3">
                          <span className="inline-block font-bold text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{h.yellow}</span>
                        </td>
                        <td className="text-center px-3 py-3">
                          <span className={`inline-block font-bold text-xs px-2 py-0.5 rounded-full ${h.red > 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-400"}`}>{h.red}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals row */}
                  <tfoot>
                    <tr style={{ background: "#F8FAFC", borderTop: "2px solid #E2E8F0" }}>
                      <td className="px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>TOTALS</td>
                      <td className="text-center px-3 py-3 font-bold text-sm" style={{ color: "#0B1F3A" }}>{totalResidents}</td>
                      <td className="text-center px-3 py-3 font-bold text-sm" style={{ color: "#0B1F3A" }}>
                        {homeReports.reduce((s, h) => s + h.active, 0)}
                      </td>
                      <td className="text-center px-3 py-3 font-bold text-sm" style={{ color: "#0284C7" }}>
                        {homeReports.reduce((s, h) => s + h.onPass, 0)}
                      </td>
                      <td className="text-center px-3 py-3 font-bold text-sm text-green-700">{totalGreen}</td>
                      <td className="text-center px-3 py-3 font-bold text-sm text-amber-700">{totalYellow}</td>
                      <td className="text-center px-3 py-3 font-bold text-sm text-red-700">{totalRed}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Drug Test Compliance */}
          <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "#DDE4ED" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
              <div className="flex items-center gap-2">
                <FlaskConical size={16} style={{ color: "#9333EA" }} />
                <h2 className="font-bold text-sm" style={{ color: "#0B1F3A" }}>Drug Test Status</h2>
              </div>
              <span className="text-xs" style={{ color: "#94A3B8" }}>
                {testedCount} of {drugTestReports.length} tested in last 7 days ({compliance}%)
              </span>
            </div>
            {/* Compliance bar */}
            <div className="px-5 py-3 border-b" style={{ borderColor: "#F1F5F9" }}>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "#EEF2F7" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${compliance}%`, background: compliance >= 80 ? "#16A34A" : compliance >= 50 ? "#D97706" : "#DC2626" }}
                />
              </div>
            </div>
            {drugTestReports.length === 0 ? (
              <p className="px-5 py-6 text-sm text-center" style={{ color: "#94A3B8" }}>No active residents</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#F8FAFC" }}>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>Resident</th>
                      <th className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>Home</th>
                      <th className="text-center px-3 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>Last Tested</th>
                      <th className="text-center px-3 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>Result</th>
                      <th className="text-center px-3 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>Tests ({dateRange}d)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "#F1F5F9" }}>
                    {drugTestReports.map(r => {
                      const rc = resultColor(r.lastResult);
                      const isOverdue = r.daysSince >= 7;
                      return (
                        <tr key={r.residentId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 font-semibold" style={{ color: "#0B1F3A" }}>{r.name}</td>
                          <td className="px-3 py-3 text-xs" style={{ color: "#64748B" }}>{r.homeName}</td>
                          <td className="text-center px-3 py-3 text-xs" style={{ color: isOverdue ? "#DC2626" : "#64748B", fontWeight: isOverdue ? 600 : 400 }}>
                            {r.lastTest ? new Date(r.lastTest + "T00:00:00").toLocaleDateString() : "Never"}
                          </td>
                          <td className="text-center px-3 py-3">
                            {r.lastResult ? (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: rc.bg, color: rc.text }}>
                                {r.lastResult}
                              </span>
                            ) : (
                              <span className="text-xs" style={{ color: "#CBD5E1" }}>—</span>
                            )}
                          </td>
                          <td className="text-center px-3 py-3 font-semibold text-xs" style={{ color: "#0B1F3A" }}>{r.testCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Incidents */}
          <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "#DDE4ED" }}>
            <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
              <FileWarning size={16} style={{ color: "#DC2626" }} />
              <h2 className="font-bold text-sm" style={{ color: "#0B1F3A" }}>Incident Log</h2>
              <span className="text-xs ml-auto" style={{ color: "#94A3B8" }}>Last {dateRange} days · {incidents.length} total</span>
            </div>
            {incidents.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm font-semibold" style={{ color: "#16A34A" }}>No incidents</p>
                <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>No incidents reported in this time period</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
                {incidents.map(i => (
                  <div key={i.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm" style={{ color: "#0B1F3A" }}>{i.resident_name}</span>
                      <span className="text-xs" style={{ color: "#94A3B8" }}>
                        {new Date(i.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs mb-1" style={{ color: "#94A3B8" }}>{i.home_name}</p>
                    <p className="text-sm" style={{ color: "#475569" }}>{i.body}</p>
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
