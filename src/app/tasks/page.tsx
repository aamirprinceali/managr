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
    // Load homes for filter + form
    const { data: homeData } = await supabase.from("homes").select("id, name").order("name");
    setHomes(homeData ?? []);

    // Load tasks — graceful if table doesn't exist
    const { data: taskData, error } = await supabase
      .from("tasks")
      .select("*")
      .order("due_date", { ascending: true, nullsFirst: false });

    if (error) {
      setTableExists(false);
      setLoading(false);
      return;
    }

    // Merge home names into tasks
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

  // Mark all selected tasks as done at once
  async function markSelectedDone() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const now = new Date().toISOString();
    await supabase.from("tasks").update({ status: "Done", completed_at: now }).in("id", ids);
    setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, status: "Done" } : t));
    setSelected(new Set());
  }

  // Toggle one task in the selection
  function toggleSelect(id: string) {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  // Select / deselect all visible pending tasks
  function toggleSelectAll() {
    const pendingIds = filtered.filter(t => t.status !== "Done").map(t => t.id);
    if (pendingIds.every(id => selected.has(id))) {
      setSelected(new Set()); // deselect all
    } else {
      setSelected(new Set(pendingIds)); // select all
    }
  }

  async function deleteTask(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  // Bulk drug test — creates one "Drug Test" task per active resident
  async function bulkDrugTest() {
    setBulkLoading(true);
    const { data: residents } = await supabase
      .from("residents")
      .select("id, full_name, home_id")
      .eq("is_archived", false)
      .eq("status", "Active");

    if (residents && residents.length > 0) {
      const nameMap: Record<string, string> = {};
      homes.forEach(h => { nameMap[h.id] = h.name; });

      const inserts = (residents as { id: string; full_name: string; home_id: string }[]).map(r => ({
        title: `Drug Test — ${r.full_name}`,
        type: "Drug Test",
        priority: "High",
        status: "Pending",
        home_id: r.home_id,
        due_date: today,
        description: `Bulk drug test flagged for ${r.full_name}`,
      }));

      await supabase.from("tasks").insert(inserts);
      loadData();
    }
    setBulkLoading(false);
  }

  const priorityColor = (p: string) => {
    if (p === "Urgent") return "bg-red-100 text-red-700";
    if (p === "High") return "bg-amber-100 text-amber-700";
    if (p === "Medium") return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-600";
  };

  const typeColor = (t: string) => {
    if (t === "Drug Test") return "bg-purple-100 text-purple-700";
    if (t === "Alert") return "bg-red-100 text-red-600";
    if (t === "Chore") return "bg-green-100 text-green-700";
    return "bg-gray-100 text-gray-600";
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
        <h1 className="text-2xl font-bold mb-2" style={{ color: "#0B1F3A" }}>Tasks</h1>
        <div className="bg-white border border-amber-200 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={22} className="text-amber-500" />
          </div>
          <h3 className="font-bold text-lg mb-2" style={{ color: "#0B1F3A" }}>Tasks table not set up yet</h3>
          <p className="text-sm mb-4" style={{ color: "#64748B" }}>
            You need to create the <code className="bg-gray-100 px-1 rounded">tasks</code> table in Supabase before using this page.
          </p>
          <Link href="/seed">
            <Button style={{ background: "#0284C7", color: "white" }}>Go to Setup Page</Button>
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
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0B1F3A" }}>Tasks</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
            {pendingCount} pending
            {overdueCount > 0 && <span className="text-red-500 font-semibold"> · {overdueCount} overdue</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Bulk drug test button */}
          <Button
            variant="outline"
            className="gap-2 font-semibold border-purple-200 text-purple-700 hover:bg-purple-50"
            onClick={bulkDrugTest}
            disabled={bulkLoading}
          >
            <FlaskConical size={15} />
            {bulkLoading ? "Flagging..." : "Bulk Drug Test"}
          </Button>
          <Button onClick={() => setAddOpen(true)} className="gap-2 font-semibold" style={{ background: "#0284C7", color: "white" }}>
            <Plus size={15} strokeWidth={2.5} />
            Add Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Status filter tabs */}
        <div className="flex items-center rounded-lg p-0.5 gap-0.5" style={{ background: "#EEF2F7" }}>
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150"
              style={filterStatus === s
                ? { background: "white", color: "#0B1F3A", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                : { color: "#94A3B8" }
              }
            >
              {s}
            </button>
          ))}
        </div>

        {/* Home filter */}
        {homes.length > 0 && (
          <select
            value={filterHome}
            onChange={e => setFilterHome(e.target.value)}
            className="text-xs font-medium border rounded-lg px-3 py-1.5 outline-none"
            style={{ borderColor: "#DDE4ED", color: "#0B1F3A" }}
          >
            <option value="All">All Homes</option>
            {homes.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        )}
      </div>

      {/* Task list */}
      {/* Select-all bar — only shows when there are pending tasks */}
      {!loading && filtered.some(t => t.status !== "Done") && (
        <div className="flex items-center gap-3 mb-3 px-1">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs font-semibold transition-colors"
            style={{ color: "#64748B" }}
          >
            <div
              className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
              style={{
                borderColor: filtered.filter(t => t.status !== "Done").every(t => selected.has(t.id)) ? "#0284C7" : "#CBD5E1",
                background: filtered.filter(t => t.status !== "Done").every(t => selected.has(t.id)) ? "#0284C7" : "white",
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
              <span className="text-xs font-semibold" style={{ color: "#0284C7" }}>
                {selected.size} selected
              </span>
              <Button
                onClick={markSelectedDone}
                className="h-7 px-3 text-xs font-semibold gap-1.5"
                style={{ background: "#16A34A", color: "white" }}
              >
                <CheckCheck size={13} />
                Mark All Done
              </Button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs"
                style={{ color: "#94A3B8" }}
              >
                Clear
              </button>
            </>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="bg-white border border-gray-100 rounded-xl h-16 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border rounded-2xl text-center" style={{ borderColor: "#DDE4ED" }}>
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
            <CheckSquare size={22} style={{ color: "#94A3B8" }} />
          </div>
          <p className="font-semibold" style={{ color: "#0B1F3A" }}>No tasks found</p>
          <p className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>
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
                className="flex items-center gap-3 bg-white border rounded-xl px-4 py-3.5"
                style={{ borderColor: isOverdue ? "#FECACA" : selected.has(t.id) ? "#BFDBFE" : "#DDE4ED", opacity: isDone ? 0.6 : 1, background: selected.has(t.id) ? "#F0F9FF" : "white" }}
              >
                {/* Row selection checkbox */}
                {!isDone && (
                  <button
                    onClick={() => toggleSelect(t.id)}
                    className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{
                      borderColor: selected.has(t.id) ? "#0284C7" : "#CBD5E1",
                      background: selected.has(t.id) ? "#0284C7" : "white",
                    }}
                  >
                    {selected.has(t.id) && <Check size={10} strokeWidth={3} className="text-white" />}
                  </button>
                )}

                {/* Complete button */}
                <button
                  onClick={() => markDone(t.id)}
                  disabled={isDone}
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    borderColor: isDone ? "#16A34A" : "#CBD5E1",
                    background: isDone ? "#DCFCE7" : "transparent",
                  }}
                >
                  {isDone && <Check size={11} className="text-green-600" strokeWidth={3} />}
                </button>

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#0B1F3A", textDecoration: isDone ? "line-through" : "none" }}>
                    {t.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {t.home_name && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#94A3B8" }}>
                        <Building2 size={10} />
                        {t.home_name}
                      </span>
                    )}
                    {t.due_date && (
                      <span className="text-xs" style={{ color: isOverdue ? "#DC2626" : "#94A3B8" }}>
                        {isOverdue ? "Overdue · " : ""}{new Date(t.due_date + "T00:00:00").toLocaleDateString()}
                      </span>
                    )}
                    {t.assigned_to && (
                      <span className="text-xs" style={{ color: "#94A3B8" }}>→ {t.assigned_to}</span>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeColor(t.type)}`}>{t.type}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityColor(t.priority)}`}>{t.priority}</span>
                </div>

                {/* Delete */}
                <button
                  onClick={() => deleteTask(t.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50 flex-shrink-0"
                  style={{ color: "#CBD5E1" }}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ color: "#0B1F3A" }}>Add Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={addTask} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Run drug tests for Oak House" required />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} placeholder="Optional details..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Assigned To</Label>
                <Input value={form.assigned_to} onChange={e => set("assigned_to", e.target.value)} placeholder="Manager name" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <select
                  value={form.priority}
                  onChange={e => set("priority", e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm outline-none"
                  style={{ borderColor: "#DDE4ED" }}
                >
                  {PRIORITY_OPTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select
                  value={form.type}
                  onChange={e => set("type", e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm outline-none"
                  style={{ borderColor: "#DDE4ED" }}
                >
                  {TYPE_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Home</Label>
                <select
                  value={form.home_id}
                  onChange={e => set("home_id", e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm outline-none"
                  style={{ borderColor: "#DDE4ED" }}
                >
                  <option value="">All Homes</option>
                  {homes.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1 font-semibold" style={{ background: "#0284C7", color: "white" }}>Add Task</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
