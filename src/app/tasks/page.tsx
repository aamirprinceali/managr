"use client";
// Tasks page — house manager task list with CRUD, bulk drug test flag, and priority filtering
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckSquare, Plus, FlaskConical, Check, Trash2, AlertTriangle, Building2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  type: string;
  status: string;
  assigned_to: string | null;
  home_id: string | null;
  home_name: string | null;
  created_at: string;
};

type Home = { id: string; name: string };

const PRIORITY_OPTS = ["Low", "Medium", "High", "Urgent"];
const TYPE_OPTS = ["General", "Drug Test", "Chore", "Alert", "Meeting", "Admin"];
const STATUS_FILTERS = ["All", "Pending", "In Progress", "Done"];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterHome, setFilterHome] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    title: "", description: "", due_date: "", priority: "Medium",
    type: "General", assigned_to: "", home_id: "",
  });

  const supabase = createClient();
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: homeData } = await supabase.from("homes").select("id, name").order("name");
    setHomes(homeData ?? []);

    const { data: taskData, error } = await supabase
      .from("tasks")
      .select("*")
      .order("due_date", { ascending: true, nullsFirst: false });

    if (error) { setTableExists(false); setLoading(false); return; }

    const nameMap: Record<string, string> = {};
    (homeData ?? []).forEach((h: Home) => { nameMap[h.id] = h.name; });

    setTasks(
      (taskData as Omit<Task, "home_name">[]).map(t => ({
        ...t,
        home_name: t.home_id ? (nameMap[t.home_id] ?? null) : null,
      }))
    );
    setLoading(false);
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from("tasks").insert({
      title: form.title,
      description: form.description || null,
      due_date: form.due_date || null,
      priority: form.priority,
      type: form.type,
      assigned_to: form.assigned_to || null,
      home_id: form.home_id || null,
      status: "Pending",
    });
    setAddOpen(false);
    setForm({ title: "", description: "", due_date: "", priority: "Medium", type: "General", assigned_to: "", home_id: "" });
    loadData();
  }

  async function markDone(id: string) {
    await supabase.from("tasks").update({ status: "Done", completed_at: new Date().toISOString() }).eq("id", id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: "Done" } : t));
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
  }

  async function markSelectedDone() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const now = new Date().toISOString();
    await supabase.from("tasks").update({ status: "Done", completed_at: now }).in("id", ids);
    setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, status: "Done" } : t));
    setSelected(new Set());
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleSelectAll() {
    const pendingIds = filtered.filter(t => t.status !== "Done").map(t => t.id);
    if (pendingIds.every(id => selected.has(id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingIds));
    }
  }

  async function deleteTask(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  async function bulkDrugTest() {
    setBulkLoading(true);
    const { data: residents } = await supabase
      .from("residents").select("id, full_name, home_id")
      .eq("is_archived", false).eq("status", "Active");

    if (residents && residents.length > 0) {
      const nameMap: Record<string, string> = {};
      homes.forEach(h => { nameMap[h.id] = h.name; });
      const inserts = (residents as { id: string; full_name: string; home_id: string }[]).map(r => ({
        title: `Drug Test — ${r.full_name}`,
        type: "Drug Test", priority: "High", status: "Pending",
        home_id: r.home_id, due_date: today,
        description: `Bulk drug test flagged for ${r.full_name}`,
      }));
      await supabase.from("tasks").insert(inserts);
      loadData();
    }
    setBulkLoading(false);
  }

  const priorityStyle = (p: string) => {
    if (p === "Urgent") return { background: "rgba(239,68,68,0.15)", color: "#F87171" };
    if (p === "High") return { background: "rgba(245,158,11,0.15)", color: "#FCD34D" };
    if (p === "Medium") return { background: "rgba(59,130,246,0.15)", color: "#60A5FA" };
    return { background: "rgba(100,116,139,0.15)", color: "#94A3B8" };
  };

  const typeStyle = (t: string) => {
    if (t === "Drug Test") return { background: "rgba(168,85,247,0.15)", color: "#C084FC" };
    if (t === "Alert") return { background: "rgba(239,68,68,0.15)", color: "#F87171" };
    if (t === "Chore") return { background: "rgba(34,197,94,0.15)", color: "#4ADE80" };
    return { background: "rgba(100,116,139,0.15)", color: "#94A3B8" };
  };

  const filtered = tasks.filter(t => {
    const statusMatch = filterStatus === "All" || t.status === filterStatus;
    const homeMatch = filterHome === "All" || t.home_id === filterHome;
    return statusMatch && homeMatch;
  });

  const pendingCount = tasks.filter(t => t.status === "Pending").length;
  const overdueCount = tasks.filter(t => t.status === "Pending" && t.due_date && t.due_date < today).length;

  if (!tableExists) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl font-semibold mb-2" style={{ color: "#F1F5F9" }}>Tasks</h1>
        <div className="dash-card p-8 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(245,158,11,0.1)" }}>
            <AlertTriangle size={22} style={{ color: "#FCD34D" }} />
          </div>
          <h3 className="font-semibold text-base mb-2" style={{ color: "#F1F5F9" }}>Tasks table not set up yet</h3>
          <p className="text-sm mb-4" style={{ color: "#475569" }}>
            Create the <code className="px-1 rounded" style={{ background: "#131929", color: "#94A3B8" }}>tasks</code> table in Supabase first.
          </p>
          <Link href="/seed">
            <Button style={{ background: "#3B82F6", color: "white" }}>Go to Setup Page</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "#F1F5F9" }}>Tasks</h1>
          <p className="text-sm mt-0.5" style={{ color: "#475569" }}>
            {pendingCount} pending
            {overdueCount > 0 && <span className="font-semibold" style={{ color: "#F87171" }}> · {overdueCount} overdue</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 font-medium text-xs h-8 px-3"
            style={{ borderColor: "rgba(168,85,247,0.3)", color: "#C084FC", background: "rgba(168,85,247,0.08)" }}
            onClick={bulkDrugTest}
            disabled={bulkLoading}
          >
            <FlaskConical size={13} />
            {bulkLoading ? "Flagging..." : "Bulk Drug Test"}
          </Button>
          <Button
            onClick={() => setAddOpen(true)}
            className="gap-2 font-medium text-xs h-8 px-3"
            style={{ background: "#3B82F6", color: "white" }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Add Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center rounded-lg p-0.5 gap-0.5" style={{ background: "#0F1523" }}>
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
              style={filterStatus === s
                ? { background: "#131929", color: "#F1F5F9" }
                : { color: "#334155" }
              }
            >
              {s}
            </button>
          ))}
        </div>

        {homes.length > 0 && (
          <select
            value={filterHome}
            onChange={e => setFilterHome(e.target.value)}
            className="text-xs font-medium rounded-lg px-3 py-1.5 outline-none"
            style={{ background: "#0F1523", border: "1px solid rgba(255,255,255,0.06)", color: "#94A3B8" }}
          >
            <option value="All">All Homes</option>
            {homes.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        )}
      </div>

      {/* Select-all bar */}
      {!loading && filtered.some(t => t.status !== "Done") && (
        <div className="flex items-center gap-3 mb-3 px-1">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs font-medium transition-colors"
            style={{ color: "#475569" }}
          >
            <div
              className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
              style={{
                borderColor: filtered.filter(t => t.status !== "Done").every(t => selected.has(t.id)) ? "#3B82F6" : "rgba(255,255,255,0.1)",
                background: filtered.filter(t => t.status !== "Done").every(t => selected.has(t.id)) ? "#3B82F6" : "transparent",
              }}
            >
              {filtered.filter(t => t.status !== "Done").every(t => selected.has(t.id)) && (
                <Check size={10} strokeWidth={3} className="text-white" />
              )}
            </div>
            Select All
          </button>

          {selected.size > 0 && (
            <>
              <span className="text-xs font-semibold" style={{ color: "#3B82F6" }}>
                {selected.size} selected
              </span>
              <Button
                onClick={markSelectedDone}
                className="h-7 px-3 text-xs font-semibold gap-1.5"
                style={{ background: "rgba(34,197,94,0.15)", color: "#4ADE80", border: "1px solid rgba(34,197,94,0.2)" }}
              >
                <CheckCheck size={13} />
                Mark All Done
              </Button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs"
                style={{ color: "#334155" }}
              >
                Clear
              </button>
            </>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="rounded-xl h-16 animate-pulse" style={{ background: "#0F1523" }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="dash-card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "#131929" }}>
            <CheckSquare size={22} style={{ color: "#334155" }} />
          </div>
          <p className="font-medium" style={{ color: "#F1F5F9" }}>No tasks found</p>
          <p className="text-sm mt-0.5" style={{ color: "#334155" }}>
            {filterStatus !== "All" ? `No ${filterStatus.toLowerCase()} tasks` : "Add your first task to get started"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => {
            const isOverdue = t.status === "Pending" && t.due_date && t.due_date < today;
            const isDone = t.status === "Done";
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 transition-colors"
                style={{
                  background: selected.has(t.id) ? "rgba(59,130,246,0.08)" : "#0F1523",
                  border: `1px solid ${isOverdue ? "rgba(239,68,68,0.3)" : selected.has(t.id) ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.06)"}`,
                  opacity: isDone ? 0.5 : 1,
                }}
              >
                {!isDone && (
                  <button
                    onClick={() => toggleSelect(t.id)}
                    className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{
                      borderColor: selected.has(t.id) ? "#3B82F6" : "rgba(255,255,255,0.1)",
                      background: selected.has(t.id) ? "#3B82F6" : "transparent",
                    }}
                  >
                    {selected.has(t.id) && <Check size={10} strokeWidth={3} className="text-white" />}
                  </button>
                )}

                <button
                  onClick={() => markDone(t.id)}
                  disabled={isDone}
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    borderColor: isDone ? "#4ADE80" : "rgba(255,255,255,0.1)",
                    background: isDone ? "rgba(34,197,94,0.15)" : "transparent",
                  }}
                >
                  {isDone && <Check size={11} strokeWidth={3} style={{ color: "#4ADE80" }} />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#F1F5F9", textDecoration: isDone ? "line-through" : "none" }}>
                    {t.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {t.home_name && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#334155" }}>
                        <Building2 size={10} />
                        {t.home_name}
                      </span>
                    )}
                    {t.due_date && (
                      <span className="text-xs" style={{ color: isOverdue ? "#F87171" : "#334155" }}>
                        {isOverdue ? "Overdue · " : ""}{new Date(t.due_date + "T00:00:00").toLocaleDateString()}
                      </span>
                    )}
                    {t.assigned_to && (
                      <span className="text-xs" style={{ color: "#334155" }}>→ {t.assigned_to}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={typeStyle(t.type)}>{t.type}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={priorityStyle(t.priority)}>{t.priority}</span>
                </div>

                <button
                  onClick={() => deleteTask(t.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                  style={{ color: "#1E293B" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#F87171"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#1E293B"}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg" style={{ background: "#0F1523", border: "1px solid rgba(255,255,255,0.08)" }}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={{ color: "#F1F5F9" }}>Add Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={addTask} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <Label style={{ color: "#94A3B8" }}>Title <span className="text-red-400">*</span></Label>
              <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Run drug tests for Oak House" required
                style={{ background: "#131929", border: "1px solid rgba(255,255,255,0.08)", color: "#F1F5F9" }} />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: "#94A3B8" }}>Description</Label>
              <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} placeholder="Optional details..."
                style={{ background: "#131929", border: "1px solid rgba(255,255,255,0.08)", color: "#F1F5F9" }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label style={{ color: "#94A3B8" }}>Due Date</Label>
                <Input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)}
                  style={{ background: "#131929", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }} />
              </div>
              <div className="space-y-1.5">
                <Label style={{ color: "#94A3B8" }}>Assigned To</Label>
                <Input value={form.assigned_to} onChange={e => set("assigned_to", e.target.value)} placeholder="Manager name"
                  style={{ background: "#131929", border: "1px solid rgba(255,255,255,0.08)", color: "#F1F5F9" }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Priority", key: "priority", opts: PRIORITY_OPTS },
                { label: "Type", key: "type", opts: TYPE_OPTS },
              ].map(({ label, key, opts }) => (
                <div key={key} className="space-y-1.5">
                  <Label style={{ color: "#94A3B8" }}>{label}</Label>
                  <select
                    value={form[key as keyof typeof form]}
                    onChange={e => set(key, e.target.value)}
                    className="w-full rounded-md px-3 py-2 text-sm outline-none"
                    style={{ background: "#131929", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}
                  >
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="space-y-1.5">
                <Label style={{ color: "#94A3B8" }}>Home</Label>
                <select
                  value={form.home_id}
                  onChange={e => set("home_id", e.target.value)}
                  className="w-full rounded-md px-3 py-2 text-sm outline-none"
                  style={{ background: "#131929", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}
                >
                  <option value="">All Homes</option>
                  {homes.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="flex-1"
                style={{ borderColor: "rgba(255,255,255,0.08)", color: "#94A3B8", background: "transparent" }}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 font-semibold" style={{ background: "#3B82F6", color: "white" }}>
                Add Task
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
