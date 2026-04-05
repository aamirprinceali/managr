"use client";
// WeeklyDrugTests — tracks drug testing for the current calendar week (Monday–Sunday)
// Auto-resets every Monday because the week changes and no tests exist for the new week yet
// House manager can: flag everyone as due, mark individuals, or mark all as Negative at once
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  FlaskConical, CheckCircle, Clock, ChevronDown, ChevronUp,
  Check, AlertTriangle, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

// Returns Monday of the current week as YYYY-MM-DD
function getWeekMonday(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day; // Walk back to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split("T")[0];
}

// Returns Sunday of the current week as YYYY-MM-DD
function getWeekSunday(): string {
  const monday = new Date(getWeekMonday() + "T00:00:00");
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday.toISOString().split("T")[0];
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function WeeklyDrugTests({ homeId }: Props) {
  const [residents, setResidents] = useState<ResidentTestStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [sessionActive, setSessionActive] = useState(false); // "testing session" mode
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

    // Get all active residents for this home
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

    // Get all drug tests for these residents this week (Mon–Sun)
    const { data: tests } = await supabase
      .from("drug_tests")
      .select("id, resident_id, result, substance, test_date")
      .in("resident_id", ids)
      .gte("test_date", monday)
      .lte("test_date", sunday);

    // Map tests by resident_id (most recent if somehow multiple)
    const testMap: Record<string, { id: string; result: string; substance: string | null }> = {};
    (tests ?? []).forEach((t: { id: string; resident_id: string; result: string; substance: string | null }) => {
      testMap[t.resident_id] = { id: t.id, result: t.result, substance: t.substance };
    });

    const statuses: ResidentTestStatus[] = (residentData as { id: string; full_name: string; room_number: string | null }[]).map(r => ({
      id: r.id,
      full_name: r.full_name,
      room_number: r.room_number,
      testedThisWeek: !!testMap[r.id],
      testResult: testMap[r.id]?.result ?? null,
      testSubstance: testMap[r.id]?.substance ?? null,
      testId: testMap[r.id]?.id ?? null,
    }));

    setResidents(statuses);
    setLoading(false);
  }

  // Open the log test dialog for one resident
  function openLog(resident: ResidentTestStatus) {
    setLogTarget({ id: resident.id, name: resident.full_name });
    setLogForm({ result: "Negative", substance: "", notes: "", recorded_by: "" });
    setLogOpen(true);
  }

  // Save a drug test for one resident
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

    // If positive, also flag the resident as Red
    if (logForm.result === "Positive") {
      await supabase.from("residents").update({ flag: "Red" }).eq("id", logTarget.id);
    }

    setLogOpen(false);
    setLogLoading(false);
    loadData();
  }

  // Mark ALL untested residents as Negative — bulk action for days when everyone passes
  async function markAllTested() {
    setBulkLoading(true);
    const untested = residents.filter(r => !r.testedThisWeek);

    if (untested.length > 0) {
      const inserts = untested.map(r => ({
        resident_id: r.id,
        test_date: today,
        result: "Negative",
        recorded_by: "Bulk — all tested",
      }));
      await supabase.from("drug_tests").insert(inserts);
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

  const resultStyle = (result: string | null) => {
    if (result === "Negative") return { bg: "#DCFCE7", text: "#15803D", dot: "#16A34A" };
    if (result === "Positive") return { bg: "#FEE2E2", text: "#DC2626", dot: "#DC2626" };
    if (result === "Refused") return { bg: "#FEF3C7", text: "#D97706", dot: "#D97706" };
    if (result === "Inconclusive") return { bg: "#F1F5F9", text: "#64748B", dot: "#94A3B8" };
    return { bg: "#F1F5F9", text: "#64748B", dot: "#94A3B8" };
  };

  if (loading) {
    return (
      <div className="bg-white border rounded-2xl p-4 animate-pulse mb-6" style={{ borderColor: "#DDE4ED" }}>
        <div className="h-5 w-48 bg-gray-100 rounded mb-2" />
        <div className="h-2 w-full bg-gray-100 rounded" />
      </div>
    );
  }

  if (residents.length === 0) return null;

  return (
    <>
      <div className="bg-white border rounded-2xl overflow-hidden mb-6" style={{ borderColor: allTested ? "#BBF7D0" : "#DDE4ED" }}>

        {/* Header row — always visible */}
        <div
          className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: allTested ? "#DCFCE7" : "#FEF3C7" }}
            >
              <FlaskConical size={15} style={{ color: allTested ? "#16A34A" : "#D97706" }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#0B1F3A" }}>Weekly Drug Testing</p>
              <p className="text-xs" style={{ color: "#94A3B8" }}>
                Week of {formatDate(monday)} – {formatDate(sunday)}
                {" · "}
                <span style={{ color: allTested ? "#16A34A" : "#D97706", fontWeight: 600 }}>
                  {testedCount}/{totalCount} tested
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Compact progress bar */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "#EEF2F7" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%`, background: allTested ? "#16A34A" : "#D97706" }}
                />
              </div>
              <span className="text-xs font-bold" style={{ color: allTested ? "#16A34A" : "#D97706" }}>
                {progressPct}%
              </span>
            </div>
            {expanded ? <ChevronUp size={16} style={{ color: "#94A3B8" }} /> : <ChevronDown size={16} style={{ color: "#94A3B8" }} />}
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div>
            <div className="px-5 pb-2 border-t" style={{ borderColor: "#F1F5F9" }}>

              {/* Action buttons */}
              <div className="flex items-center gap-2 py-4 flex-wrap">
                {!sessionActive ? (
                  <Button
                    onClick={() => setSessionActive(true)}
                    className="gap-2 font-semibold"
                    style={{ background: "#0284C7", color: "white" }}
                  >
                    <FlaskConical size={14} />
                    Start Testing Session
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => setBulkConfirmOpen(true)}
                      disabled={allTested}
                      className="gap-2 font-semibold"
                      style={{ background: "#16A34A", color: "white" }}
                    >
                      <Check size={14} strokeWidth={2.5} />
                      Mark Everyone Tested (All Negative)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSessionActive(false)}
                      className="text-xs"
                    >
                      End Session
                    </Button>
                  </>
                )}
              </div>

              {/* Resident list */}
              <div className="space-y-2 pb-4">
                {residents.map(r => {
                  const rs = resultStyle(r.testResult);
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 border"
                      style={{ borderColor: r.testedThisWeek ? (r.testResult === "Positive" ? "#FECACA" : "#BBF7D0") : "#E2E8F0" }}
                    >
                      {/* Status dot */}
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: r.testedThisWeek ? rs.dot : "#CBD5E1" }}
                      />

                      {/* Name + room */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "#0B1F3A" }}>{r.full_name}</p>
                        {r.room_number && (
                          <p className="text-xs" style={{ color: "#94A3B8" }}>Room {r.room_number}</p>
                        )}
                      </div>

                      {/* Result badge or "Not tested" */}
                      {r.testedThisWeek ? (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{ background: rs.bg, color: rs.text }}
                          >
                            {r.testResult}
                            {r.testResult === "Positive" && r.testSubstance && ` — ${r.testSubstance}`}
                          </span>
                          {/* Allow editing if in session */}
                          {sessionActive && (
                            <button
                              onClick={() => openLog(r)}
                              className="text-xs underline flex-shrink-0"
                              style={{ color: "#94A3B8" }}
                            >
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
                          {/* Show Test button only during active session */}
                          {sessionActive && (
                            <Button
                              onClick={() => openLog(r)}
                              className="h-7 px-3 text-xs font-semibold"
                              style={{ background: "#0284C7", color: "white" }}
                            >
                              Log Test
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* All tested success state */}
              {allTested && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
                  <CheckCircle size={15} className="text-green-600" />
                  <p className="text-sm font-semibold text-green-700">
                    All residents tested this week
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bulk confirm dialog */}
      <Dialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold" style={{ color: "#0B1F3A" }}>
              Mark Everyone Tested?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm" style={{ color: "#1D4ED8" }}>
              <p className="font-semibold mb-1">This will log for {residents.filter(r => !r.testedThisWeek).length} resident(s):</p>
              <ul className="space-y-0.5 text-xs">
                {residents.filter(r => !r.testedThisWeek).map(r => (
                  <li key={r.id}>• {r.full_name}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs">Result: <strong>Negative</strong> · Date: <strong>Today</strong></p>
              <p className="mt-1 text-xs" style={{ color: "#3B82F6" }}>
                If anyone tested positive, click Cancel and log them individually so you can record the substance.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setBulkConfirmOpen(false)}>Cancel</Button>
              <Button
                className="flex-1 font-semibold gap-1.5"
                style={{ background: "#16A34A", color: "white" }}
                disabled={bulkLoading}
                onClick={markAllTested}
              >
                <Check size={14} strokeWidth={2.5} />
                {bulkLoading ? "Saving..." : "Confirm — All Negative"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual test log dialog */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold" style={{ color: "#0B1F3A" }}>
              Log Drug Test — {logTarget?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveTest} className="space-y-4 mt-1">

            {/* Result */}
            <div className="space-y-1.5">
              <Label>Result <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 gap-2">
                {["Negative", "Positive", "Refused", "Inconclusive"].map(opt => {
                  const selected = logForm.result === opt;
                  const colors: Record<string, { bg: string; border: string; text: string }> = {
                    Negative: { bg: "#DCFCE7", border: "#16A34A", text: "#15803D" },
                    Positive: { bg: "#FEE2E2", border: "#DC2626", text: "#DC2626" },
                    Refused: { bg: "#FEF3C7", border: "#D97706", text: "#D97706" },
                    Inconclusive: { bg: "#F1F5F9", border: "#94A3B8", text: "#64748B" },
                  };
                  const c = colors[opt];
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setLogForm(f => ({ ...f, result: opt, substance: "" }))}
                      className="py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                      style={selected ? { background: c.bg, borderColor: c.border, color: c.text } : { background: "white", borderColor: "#E2E8F0", color: "#64748B" }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Substance — only shown for Positive */}
            {logForm.result === "Positive" && (
              <div className="space-y-1.5">
                <Label>Substance / Drug <span className="text-red-500">*</span></Label>
                <Input
                  value={logForm.substance}
                  onChange={e => setLogForm(f => ({ ...f, substance: e.target.value }))}
                  placeholder="e.g. Methamphetamine, Opioids, THC..."
                  required={logForm.result === "Positive"}
                />
                <p className="text-xs" style={{ color: "#DC2626" }}>
                  ⚠ Resident will automatically be flagged Red.
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
                className="w-full border rounded-md px-3 py-2 text-sm outline-none resize-none"
                style={{ borderColor: "#DDE4ED" }}
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
              <Button type="button" variant="outline" className="flex-1" onClick={() => setLogOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                disabled={logLoading}
                className="flex-1 font-semibold"
                style={{ background: logForm.result === "Positive" ? "#DC2626" : "#0284C7", color: "white" }}
              >
                {logLoading ? "Saving..." : "Save Test"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
