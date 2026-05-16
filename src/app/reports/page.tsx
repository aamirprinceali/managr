"use client";
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
  const [homeReports,      setHomeReports]      = useState<HomeReport[]>([]);
  const [drugTestReports,  setDrugTestReports]  = useState<DrugTestReport[]>([]);
  const [incidents,        setIncidents]        = useState<Incident[]>([]);
  const [dateRange,        setDateRange]        = useState("30");
  const [loading,          setLoading]          = useState(true);

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
          active:     active.filter(r => r.status === "Active").length,
          onPass:     active.filter(r => r.status === "On Pass").length,
          discharged: active.filter(r => r.status === "Discharged").length,
          green:      active.filter(r => r.flag === "Green").length,
          yellow:     active.filter(r => r.flag === "Yellow").length,
          red:        active.filter(r => r.flag === "Red").length,
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
  const totalRed       = homeReports.reduce((s, h) => s + h.red, 0);
  const totalYellow    = homeReports.reduce((s, h) => s + h.yellow, 0);
  const totalGreen     = homeReports.reduce((s, h) => s + h.green, 0);
  const testedCount    = drugTestReports.filter(r => r.daysSince < 7).length;
  const compliance     = drugTestReports.length > 0 ? Math.round((testedCount / drugTestReports.length) * 100) : 0;

  const resultStyle = (result: string | null) => {
    if (result === "Negative")    return "pill-success";
    if (result === "Positive")    return "pill-danger";
    if (result === "Refused")     return "pill-warning";
    return "pill-neutral";
  };

  return (
    <div className="max-w-5xl mx-auto fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-sm mt-0.5 text-slate-500">Drug test compliance, resident status, and incident logs</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="text-xs font-medium rounded-lg px-3 py-1.5 outline-none border border-slate-200 bg-white text-slate-600"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button variant="outline" className="gap-2 text-xs h-8 border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={() => window.print()}>
            <Printer size={13} /> Print
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-xl h-40 animate-pulse bg-slate-100 border border-slate-200" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">

          {/* Summary stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Residents",       value: totalResidents, icon: Users,        pillClass: "stat-card-blue",  iconBg: "#DBEAFE", iconColor: "#1D4ED8" },
              { label: "Drug Test Compliance",  value: `${compliance}%`, icon: FlaskConical, pillClass: compliance >= 80 ? "stat-card-green" : "stat-card-red", iconBg: compliance >= 80 ? "#DCFCE7" : "#FEE2E2", iconColor: compliance >= 80 ? "#15803D" : "#B91C1C" },
              { label: "Incidents",             value: incidents.length, icon: FileWarning,  pillClass: incidents.length > 0 ? "stat-card-red" : "stat-card-teal", iconBg: incidents.length > 0 ? "#FEE2E2" : "#CFFAFE", iconColor: incidents.length > 0 ? "#B91C1C" : "#0E7490" },
              { label: "Red Flags",             value: totalRed,         icon: AlertTriangle, pillClass: totalRed > 0 ? "stat-card-red" : "stat-card-green", iconBg: totalRed > 0 ? "#FEE2E2" : "#DCFCE7", iconColor: totalRed > 0 ? "#B91C1C" : "#15803D" },
            ].map(({ label, value, icon: Icon, pillClass, iconBg, iconColor }) => (
              <div key={label} className={`stat-card ${pillClass}`}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: iconBg }}>
                  <Icon size={17} style={{ color: iconColor }} strokeWidth={2} />
                </div>
                <p className="text-2xl font-bold text-slate-800 leading-none">{value}</p>
                <p className="text-xs font-medium mt-1 text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Resident Status by Home */}
          <div className="dash-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <Users size={15} className="text-blue-500" />
              <h2 className="font-semibold text-sm text-slate-800">Resident Status by Home</h2>
            </div>
            {homeReports.length === 0 ? (
              <p className="px-5 py-8 text-sm text-center text-slate-400">No homes yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th className="text-left pl-5">Home</th>
                      <th className="text-center">Capacity</th>
                      <th className="text-center">Active</th>
                      <th className="text-center">On Pass</th>
                      <th className="text-center text-green-600">Green</th>
                      <th className="text-center text-amber-600">Yellow</th>
                      <th className="text-center text-red-600">Red</th>
                    </tr>
                  </thead>
                  <tbody>
                    {homeReports.map(h => (
                      <tr key={h.id}>
                        <td className="pl-5">
                          <Link href={`/homes/${h.id}`} className="font-semibold text-slate-700 hover:text-blue-600 transition-colors">
                            {h.name}
                          </Link>
                        </td>
                        <td className="text-center text-slate-500">{h.total}/{h.bedCount > 0 ? h.bedCount : "—"}</td>
                        <td className="text-center font-semibold text-slate-800">{h.active}</td>
                        <td className="text-center text-blue-600 font-medium">{h.onPass}</td>
                        <td className="text-center">
                          <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full pill-success">{h.green}</span>
                        </td>
                        <td className="text-center">
                          <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full pill-warning">{h.yellow}</span>
                        </td>
                        <td className="text-center">
                          {h.red > 0
                            ? <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full pill-danger">{h.red}</span>
                            : <span className="text-slate-300">—</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-semibold">
                      <td className="pl-5 py-3 text-xs uppercase tracking-wide text-slate-400 font-semibold">Totals</td>
                      <td className="text-center text-slate-700 font-bold">{totalResidents}</td>
                      <td className="text-center text-slate-700 font-bold">{homeReports.reduce((s, h) => s + h.active, 0)}</td>
                      <td className="text-center text-blue-600 font-bold">{homeReports.reduce((s, h) => s + h.onPass, 0)}</td>
                      <td className="text-center text-green-600 font-bold">{totalGreen}</td>
                      <td className="text-center text-amber-600 font-bold">{totalYellow}</td>
                      <td className="text-center text-red-600 font-bold">{totalRed}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Drug Test Compliance */}
          <div className="dash-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FlaskConical size={15} className="text-violet-500" />
                <h2 className="font-semibold text-sm text-slate-800">Drug Test Status</h2>
              </div>
              <span className="text-xs text-slate-400">
                {testedCount} of {drugTestReports.length} tested in last 7 days ({compliance}%)
              </span>
            </div>
            {/* Compliance progress bar */}
            <div className="px-5 py-3 border-b border-slate-100">
              <div className="h-2 rounded-full overflow-hidden bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${compliance}%`,
                    background: compliance >= 80 ? "#16A34A" : compliance >= 50 ? "#D97706" : "#DC2626",
                  }}
                />
              </div>
            </div>
            {drugTestReports.length === 0 ? (
              <p className="px-5 py-8 text-sm text-center text-slate-400">No active residents</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th className="text-left pl-5">Resident</th>
                      <th className="text-left">Home</th>
                      <th className="text-center">Last Tested</th>
                      <th className="text-center">Result</th>
                      <th className="text-center">Tests ({dateRange}d)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drugTestReports.map(r => {
                      const isOverdue = r.daysSince >= 7;
                      return (
                        <tr key={r.residentId}>
                          <td className="pl-5 font-semibold text-slate-700">{r.name}</td>
                          <td className="text-slate-500">{r.homeName}</td>
                          <td className={`text-center font-medium ${isOverdue ? "text-red-600" : "text-slate-500"}`}>
                            {r.lastTest ? new Date(r.lastTest + "T00:00:00").toLocaleDateString() : "Never"}
                          </td>
                          <td className="text-center">
                            {r.lastResult
                              ? <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${resultStyle(r.lastResult)}`}>{r.lastResult}</span>
                              : <span className="text-slate-300">—</span>
                            }
                          </td>
                          <td className="text-center font-bold text-slate-700">{r.testCount}</td>
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
            <div className="flex items-center px-5 py-4 border-b border-slate-100">
              <FileWarning size={15} className="text-red-500" />
              <h2 className="font-semibold text-sm text-slate-800 ml-2">Incident Log</h2>
              <span className="text-xs text-slate-400 ml-auto">Last {dateRange} days · {incidents.length} total</span>
            </div>
            {incidents.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-semibold text-green-600">No incidents</p>
                <p className="text-xs mt-0.5 text-slate-400">No incidents reported in this time period</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {incidents.map(i => (
                  <div key={i.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-slate-800">{i.resident_name}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(i.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-1">{i.home_name}</p>
                    <p className="text-sm text-slate-600">{i.body}</p>
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
