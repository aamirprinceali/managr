"use client";
// WeeklyDrugTests — tracks drug testing for the current calendar week (Monday–Sunday)
// Auto-resets every Monday. Light CRM theme.
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  FlaskConical, CheckCircle, Clock, ChevronDown, ChevronUp, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Props = { homeId: string };

type ResidentTestStatus = {
  id: string;
  full_name: string;
  room_number: string | null;
  testedThisWeek: boolean;
  testResult: string | null;
  testSubstance: string | null;
  testId: string | null;
};

type LogForm = {
  result: string;
  substance: string;
  notes: string;
  recorded_by: string;
};

function getWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split("T")[0];
}

function getWeekSunday(): string {
  const monday = new Date(getWeekMonday() + "T00:00:00");
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday.toISOString().split("T")[0];
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Result badge colors — light theme
const resultStyle = (result: string | null) => {
  if (result === "Negative")    return { bg: "#DCFCE7", text: "#15803D", dot: "#16A34A", border: "rgba(22,163,74,0.2)" };
  if (result === "Positive")    return { bg: "#FEE2E2", text: "#B91C1C", dot: "#DC2626", border: "rgba(220,38,38,0.2)" };
  if (result === "Refused")     return { bg: "#FEF3C7", text: "#B45309", dot: "#D97706", border: "rgba(217,119,6,0.2)" };
  if (result === "Inconclusive") return { bg: "#F1F5F9", text: "#475569", dot: "#94A3B8", border: "#E2E8F0" };
  return { bg: "#F1F5F9", text: "#64748B", dot: "#94A3B8", border: "#E2E8F0" };
};

export default function WeeklyDrugTests({ homeId }: Props) {
  const [residents, setResidents] = useState<ResidentTestStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [logTarget, setLogTarget] = useState<{ id: string; name: string } | null>(null);
  const [logForm, setLogForm] = useState<LogForm>({ result: "Negative", substance: "", notes: "", recorded_by: "" });
  const [logLoading, setLogLoading] = useState(false);

  const supabase = createClient();
  const monday = getWeekMonday();
  const sunday = getWeekSunday();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeId]);

  async function loadData() {
    setLoading(true);

    const { data: residentData } = await supabase
      .from("residents")
      .select("id, full_name, room_number")
      .eq("home_id", homeId)
      .eq("is_archived", false)
      .eq("status", "Active")
      .order("full_name");

    if (!residentData || residentData.length === 0) {
      setResidents([]);
      setLoading(false);
      return;
    }

    const ids = residentData.map((r: { id: string }) => r.id);

    const { data: tests } = await supabase
      .from("drug_tests")
      .select("id, resident_id, result, substance, test_date")
      .in("resident_id", ids)
      .gte("test_date", monday)
      .lte("test_date", sunday);

    const testMap: Record<string, { id: string; result: string; substance: string | null }> = {};
    (tests ?? []).forEach((t: { id: string; resident_id: string; result: string; substance: string | null }) => {
      testMap[t.resident_id] = { id: t.id, result: t.result, substance: t.substance };
    });

    setResidents(
      (residentData as { id: string; full_name: string; room_number: string | null }[]).map(r => ({
        id: r.id,
        full_name: r.full_name,
        room_number: r.room_number,
        testedThisWeek: !!testMap[r.id],
        testResult: testMap[r.id]?.result ?? null,
        testSubstance: testMap[r.id]?.substance ?? null,
        testId: testMap[r.id]?.id ?? null,
      }))
    );
    setLoading(false);
  }

  function openLog(resident: ResidentTestStatus) {
    setLogTarget({ id: resident.id, name: resident.full_name });
    setLogForm({ result: "Negative", substance: "", notes: "", recorded_by: "" });
    setLogOpen(true);
  }

  async function saveTest(e: React.FormEvent) {
    e.preventDefault();
    if (!logTarget) return;
    setLogLoading(true);

    await supabase.from("drug_tests").insert({
      resident_id: logTarget.id,
      test_date: today,
      result: logForm.result,
      substance: logForm.result === "Positive" ? (logForm.substance || null) : null,
      notes: logForm.notes || null,
      recorded_by: logForm.recorded_by || null,
    });

    if (logForm.result === "Positive") {
      await supabase.from("residents").update({ flag: "Red" }).eq("id", logTarget.id);
    }

    setLogOpen(false);
    setLogLoading(false);
    loadData();
  }

  async function markAllTested() {
    setBulkLoading(true);
    const untested = residents.filter(r => !r.testedThisWeek);
    if (untested.length > 0) {
      await supabase.from("drug_tests").insert(
        untested.map(r => ({ resident_id: r.id, test_date: today, result: "Negative", recorded_by: "Bulk — all tested" }))
      );
    }
    setBulkConfirmOpen(false);
    setBulkLoading(false);
    setSessionActive(false);
    loadData();
  }

  const testedCount = residents.filter(r => r.testedThisWeek).length;
  const totalCount = residents.length;
  const allTested = testedCount === totalCount && totalCount > 0;
  const progressPct = totalCount > 0 ? Math.round((testedCount / totalCount) * 100) : 0;

  const barColor = allTested ? "#16A34A" : "#D97706";

  if (loading) {
    return (
      <div className="rounded-2xl p-4 animate-pulse mb-6 bg-slate-100 border border-slate-200">
        <div className="h-5 w-48 rounded mb-2 bg-slate-200" />
        <div className="h-2 w-full rounded bg-slate-200" />
      </div>
    );
  }

  if (residents.length === 0) return null;

  return (
    <>
      <div className="rounded-2xl overflow-hidden mb-6 bg-white"
        style={{ border: `1px solid ${allTested ? "rgba(22,163,74,0.2)" : "#E2E8F0"}` }}>

        {/* Collapsed header */}
        <div
          className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
          style={{ borderBottom: expanded ? "1px solid #E2E8F0" : "none" }}
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: allTested ? "rgba(22,163,74,0.1)" : "rgba(217,119,6,0.1)" }}>
              <FlaskConical size={15} style={{ color: allTested ? "#16A34A" : "#D97706" }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#0F172A" }}>Weekly Drug Testing</p>
              <p className="text-xs" style={{ color: "#64748B" }}>
                {formatDate(monday)} – {formatDate(sunday)}
                {" · "}
                <span style={{ color: allTested ? "#16A34A" : "#D97706", fontWeight: 600 }}>
                  {testedCount}/{totalCount} tested
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-24 h-1.5 rounded-full overflow-hidden bg-slate-100">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%`, background: barColor }} />
              </div>
              <span className="text-xs font-bold" style={{ color: barColor }}>{progressPct}%</span>
            </div>
            {expanded
              ? <ChevronUp size={16} style={{ color: "#94A3B8" }} />
              : <ChevronDown size={16} style={{ color: "#94A3B8" }} />}
          </div>
        </div>

        {/* Expanded body */}
        {expanded && (
          <div className="px-5 pb-4">

            {/* Action buttons */}
            <div className="flex items-center gap-2 py-4 flex-wrap">
              {!sessionActive ? (
                <Button onClick={() => setSessionActive(true)} className="gap-2 font-semibold"
                  style={{ background: "#1B6EF3", color: "white" }}>
                  <FlaskConical size={14} />
                  Start Testing Session
                </Button>
              ) : (
                <>
                  <Button onClick={() => setBulkConfirmOpen(true)} disabled={allTested}
                    className="gap-2 font-semibold" style={{ background: "#16A34A", color: "white" }}>
                    <Check size={14} strokeWidth={2.5} />
                    Mark Everyone Tested (All Negative)
                  </Button>
                  <Button variant="outline" onClick={() => setSessionActive(false)} className="text-xs">
                    End Session
                  </Button>
                </>
              )}
            </div>

            {/* Resident rows */}
            <div className="space-y-2">
              {residents.map(r => {
                const rs = resultStyle(r.testResult);
                return (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl px-4 py-3 bg-slate-50"
                    style={{
                      border: `1px solid ${r.testedThisWeek
                        ? (r.testResult === "Positive" ? "rgba(220,38,38,0.15)" : "rgba(22,163,74,0.15)")
                        : "#E2E8F0"}`,
                    }}>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: r.testedThisWeek ? rs.dot : "#CBD5E1" }} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>{r.full_name}</p>
                      {r.room_number && (
                        <p className="text-xs" style={{ color: "#94A3B8" }}>Room {r.room_number}</p>
                      )}
                    </div>

                    {r.testedThisWeek ? (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full border"
                          style={{ background: rs.bg, color: rs.text, borderColor: rs.border }}>
                          {r.testResult}
                          {r.testResult === "Positive" && r.testSubstance && ` — ${r.testSubstance}`}
                        </span>
                        {sessionActive && (
                          <button onClick={() => openLog(r)} className="text-xs underline flex-shrink-0"
                            style={{ color: "#64748B" }}>
                            Edit
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-medium flex items-center gap-1" style={{ color: "#94A3B8" }}>
                          <Clock size={12} />
                          Not tested
                        </span>
                        {sessionActive && (
                          <Button onClick={() => openLog(r)} className="h-7 px-3 text-xs font-semibold"
                            style={{ background: "#1B6EF3", color: "white" }}>
                            Log Test
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* All tested banner */}
            {allTested && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 mt-3"
                style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.15)" }}>
                <CheckCircle size={15} style={{ color: "#16A34A" }} />
                <p className="text-sm font-semibold" style={{ color: "#16A34A" }}>
                  All residents tested this week
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk confirm dialog */}
      <Dialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
        <DialogContent className="sm:max-w-sm bg-white border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold" style={{ color: "#0F172A" }}>
              Mark Everyone Tested?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            <div className="rounded-xl p-4 text-sm"
              style={{ background: "rgba(27,110,243,0.06)", border: "1px solid rgba(27,110,243,0.15)", color: "#1B6EF3" }}>
              <p className="font-semibold mb-1">
                This will log for {residents.filter(r => !r.testedThisWeek).length} resident(s):
              </p>
              <ul className="space-y-0.5 text-xs">
                {residents.filter(r => !r.testedThisWeek).map(r => (
                  <li key={r.id}>• {r.full_name}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs">Result: <strong>Negative</strong> · Date: <strong>Today</strong></p>
              <p className="mt-1 text-xs opacity-75">
                Log anyone positive individually to record the substance.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setBulkConfirmOpen(false)}>Cancel</Button>
              <Button className="flex-1 font-semibold gap-1.5"
                style={{ background: "#16A34A", color: "white" }}
                disabled={bulkLoading}
                onClick={markAllTested}>
                <Check size={14} strokeWidth={2.5} />
                {bulkLoading ? "Saving..." : "Confirm — All Negative"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual test dialog */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="sm:max-w-sm bg-white border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold" style={{ color: "#0F172A" }}>
              Log Drug Test — {logTarget?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveTest} className="space-y-4 mt-1">

            {/* Result selector */}
            <div className="space-y-1.5">
              <Label>Result <span style={{ color: "#DC2626" }}>*</span></Label>
              <div className="grid grid-cols-2 gap-2">
                {["Negative", "Positive", "Refused", "Inconclusive"].map(opt => {
                  const selected = logForm.result === opt;
                  const rs = resultStyle(opt);
                  return (
                    <button key={opt} type="button"
                      onClick={() => setLogForm(f => ({ ...f, result: opt, substance: "" }))}
                      className="py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                      style={selected
                        ? { background: rs.bg, borderColor: rs.dot, color: rs.text }
                        : { background: "#F8FAFC", borderColor: "#E2E8F0", color: "#94A3B8" }
                      }>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Substance (Positive only) */}
            {logForm.result === "Positive" && (
              <div className="space-y-1.5">
                <Label>Substance / Drug <span style={{ color: "#DC2626" }}>*</span></Label>
                <Input
                  value={logForm.substance}
                  onChange={e => setLogForm(f => ({ ...f, substance: e.target.value }))}
                  placeholder="e.g. Methamphetamine, Opioids, THC..."
                  required={logForm.result === "Positive"}
                />
                <p className="text-xs" style={{ color: "#DC2626" }}>
                  ⚠ Resident will be flagged Red automatically.
                </p>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <textarea
                value={logForm.notes}
                onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional notes..."
                rows={2}
                className="w-full rounded-md px-3 py-2 text-sm outline-none resize-none border border-slate-200 focus:ring-2 focus:ring-sky-200"
                style={{ background: "#FFFFFF", color: "#0F172A" }}
              />
            </div>

            {/* Recorded by */}
            <div className="space-y-1.5">
              <Label>Recorded By</Label>
              <Input
                value={logForm.recorded_by}
                onChange={e => setLogForm(f => ({ ...f, recorded_by: e.target.value }))}
                placeholder="Your name"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setLogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={logLoading} className="flex-1 font-semibold"
                style={{ background: logForm.result === "Positive" ? "#DC2626" : "#1B6EF3", color: "white" }}>
                {logLoading ? "Saving..." : "Save Test"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
