"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/components/auth/UserProvider";
import {
  CheckSquare, Plus, Check, Trash2, AlertTriangle,
  ChevronDown, ChevronRight, FlaskConical, Moon, Sun,
  Clock, Repeat, Building2, User, Bell, ClipboardList,
  CheckCheck, ArrowRight, Users, UserCheck, Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────────

type TaskType = "standard" | "group_morning_meds" | "group_night_meds" | "group_drug_test";

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  category: string;
  task_type: TaskType;
  status: string;
  assigned_to: string | null;
  assigned_to_manager: string | null;
  assigned_by: string | null;
  home_id: string | null;
  home_name: string | null;
  is_recurring: boolean;
  recurrence_type: string | null;
  last_completed_at: string | null;
  completed_at: string | null;
  reminder_time: string | null;
  created_at: string;
};

type Home = { id: string; name: string };
type Resident = { id: string; full_name: string; home_id: string };
type MedRecord = { resident_id: string; frequency: string | null };
type GroupCompletion = { task_id: string; resident_id: string };

// ─── Constants ─────────────────────────────────────────────────────────────────

const MORNING_TERMS = ["morning", " am", "daily", "twice", "bid", "qd", "every day", "breakfast"];
const NIGHT_TERMS   = ["night", "nightly", "evening", " pm", "daily", "twice", "bid", "qd", "bedtime", "hs", "dinner"];

const PRIORITIES  = ["Low", "Medium", "High", "Urgent"];
const CATEGORIES  = ["House Operations", "Medications", "Drug Test", "Nightly Report", "Resident Task", "Personal", "General"];
const RECUR_OPTS  = [{ value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" }];
const TABS        = ["Today", "All", "Assigned", "Recurring"];

const TYPE_META: Record<TaskType, { label: string; icon: React.ElementType; color: string; bg: string; desc: string }> = {
  standard:           { label: "Custom Task",       icon: ClipboardList, color: "#60A5FA", bg: "rgba(59,130,246,0.12)",  desc: "Any task, reminder, or to-do" },
  group_morning_meds: { label: "Morning Meds",      icon: Sun,            color: "#FCD34D", bg: "rgba(245,158,11,0.12)",  desc: "Check off AM meds per resident" },
  group_night_meds:   { label: "Night Meds",        icon: Moon,           color: "#C084FC", bg: "rgba(168,85,247,0.12)",  desc: "Check off PM meds per resident" },
  group_drug_test:    { label: "Drug Test Round",   icon: FlaskConical,  color: "#F472B6", bg: "rgba(236,72,153,0.12)",  desc: "Track tests across all residents" },
};

const PRIORITY_STYLE: Record<string, { color: string; bg: string }> = {
  Urgent: { color: "#F87171", bg: "rgba(239,68,68,0.15)" },
  High:   { color: "#FCD34D", bg: "rgba(245,158,11,0.15)" },
  Medium: { color: "#60A5FA", bg: "rgba(59,130,246,0.15)" },
  Low:    { color: "#94A3B8", bg: "rgba(100,116,139,0.12)" },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getMonday(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d); m.setDate(d.getDate() + diff); m.setHours(0, 0, 0, 0);
  return m;
}

function isRecurringDue(t: Task, today: string) {
  if (!t.is_recurring) return false;
  if (!t.last_completed_at) return true;
  const last = new Date(t.last_completed_at);
  const now  = new Date();
  if (t.recurrence_type === "daily")   return last.toISOString().split("T")[0] < today;
  if (t.recurrence_type === "weekly")  return last < getMonday(now);
  if (t.recurrence_type === "monthly") return last < new Date(now.getFullYear(), now.getMonth(), 1);
  return true;
}

function isRecurringDoneToday(t: Task, today: string) {
  return !!(t.is_recurring && t.last_completed_at && t.last_completed_at.split("T")[0] === today);
}

function hasMorningMed(meds: MedRecord[]) {
  return meds.some(m => m.frequency && MORNING_TERMS.some(k => m.frequency!.toLowerCase().includes(k)));
}
function hasNightMed(meds: MedRecord[]) {
  return meds.some(m => m.frequency && NIGHT_TERMS.some(k => m.frequency!.toLowerCase().includes(k)));
}

function formatDue(due: string, today: string) {
  if (due === today) return "Today";
  const d    = new Date(due + "T00:00:00");
  const diff = Math.round((d.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
  if (diff === 1)  return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < -1)   return `${Math.abs(diff)}d overdue`;
  if (diff < 7)    return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type DisplayCat = "overdue" | "today" | "upcoming" | "done";

function getDisplayCat(t: Task, today: string): DisplayCat {
  if (t.task_type !== "standard") return isRecurringDoneToday(t, today) ? "done" : "today";
  if (t.is_recurring)             return isRecurringDoneToday(t, today) ? "done" : isRecurringDue(t, today) ? "today" : "upcoming";
  if (t.status === "Done")        return "done";
  if (t.due_date && t.due_date < today) return "overdue";
  if (t.due_date === today)       return "today";
  return "upcoming";
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const { profile } = useProfile();
  const isOwner = profile?.role === "owner";

  const [tasks,          setTasks]          = useState<Task[]>([]);
  const [homes,          setHomes]          = useState<Home[]>([]);
  const [residents,      setResidents]      = useState<Resident[]>([]);
  const [meds,           setMeds]           = useState<MedRecord[]>([]);
  const [completions,    setCompletions]    = useState<GroupCompletion[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [loading,        setLoading]        = useState(true);
  const [tableExists,    setTableExists]    = useState(true);
  const [needsUpgrade,   setNeedsUpgrade]   = useState(false);
  const [activeTab,      setActiveTab]      = useState("Today");
  const [filterHome,     setFilterHome]     = useState("All");
  const [addOpen,        setAddOpen]        = useState(false);
  const [addStep,        setAddStep]        = useState<1 | 2>(1);
  const [selType,        setSelType]        = useState<TaskType>("standard");
  const [form,           setForm]           = useState({
    title: "", description: "", due_date: "", priority: "Medium", category: "General",
    assigned_to_manager: "", home_id: "", is_recurring: false, recurrence_type: "daily", reminder_time: "",
  });

  const supabase = createClient();
  const today    = new Date().toISOString().split("T")[0];
  const setF     = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [homeRes, resRes, medRes, taskRes, compRes] = await Promise.all([
        supabase.from("homes").select("id, name").order("name"),
        supabase.from("residents").select("id, full_name, home_id").eq("status", "Active"),
        supabase.from("medications").select("resident_id, frequency"),
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("task_group_completions").select("task_id, resident_id").eq("completed_date", today),
      ]);

      if (taskRes.error) {
        setTableExists(false); setLoading(false); return;
      }
      if (compRes.error?.code === "42P01") {
        setNeedsUpgrade(true); setLoading(false); return;
      }

      const homeList: Home[] = homeRes.data ?? [];
      const homeMap: Record<string, string> = {};
      homeList.forEach(h => { homeMap[h.id] = h.name; });

      setHomes(homeList);
      setResidents(resRes.data ?? []);
      setMeds(medRes.data ?? []);
      setCompletions(compRes.data ?? []);

      setTasks(
        (taskRes.data ?? []).map((t: Record<string, unknown>) => ({
          ...t,
          task_type:            (t.task_type as TaskType)          ?? "standard",
          category:             (t.category as string)             ?? "General",
          is_recurring:         (t.is_recurring as boolean)        ?? false,
          recurrence_type:      (t.recurrence_type as string)      ?? null,
          last_completed_at:    (t.last_completed_at as string)    ?? null,
          assigned_to_manager:  (t.assigned_to_manager as string)  ?? null,
          assigned_by:          (t.assigned_by as string)          ?? null,
          reminder_time:        (t.reminder_time as string)        ?? null,
          home_name: t.home_id ? (homeMap[t.home_id as string] ?? null) : null,
        } as Task))
      );
      setLoading(false);
    } catch {
      setTableExists(false); setLoading(false);
    }
  }

  // Returns residents that belong to a group task (based on home + meds/drug test)
  function groupResidents(task: Task): Resident[] {
    const pool = task.home_id ? residents.filter(r => r.home_id === task.home_id) : residents;
    if (task.task_type === "group_drug_test") return pool;
    const medMap: Record<string, MedRecord[]> = {};
    meds.forEach(m => { (medMap[m.resident_id] = medMap[m.resident_id] ?? []).push(m); });
    return pool.filter(r => {
      const m = medMap[r.id] ?? [];
      if (task.task_type === "group_morning_meds") return hasMorningMed(m);
      if (task.task_type === "group_night_meds")   return hasNightMed(m);
      return false;
    });
  }

  function completedCount(taskId: string) {
    return completions.filter(c => c.task_id === taskId).length;
  }
  function isComplete(taskId: string, residentId: string) {
    return completions.some(c => c.task_id === taskId && c.resident_id === residentId);
  }

  async function toggleResident(taskId: string, residentId: string) {
    if (isComplete(taskId, residentId)) {
      await supabase.from("task_group_completions")
        .delete().eq("task_id", taskId).eq("resident_id", residentId).eq("completed_date", today);
      setCompletions(p => p.filter(c => !(c.task_id === taskId && c.resident_id === residentId)));
    } else {
      await supabase.from("task_group_completions").insert({
        task_id: taskId, resident_id: residentId, completed_date: today,
        completed_by: profile?.full_name ?? "Manager",
      });
      setCompletions(p => [...p, { task_id: taskId, resident_id: residentId }]);
    }
  }

  async function markGroupAllDone(task: Task) {
    const grp = groupResidents(task);
    const incomplete = grp.filter(r => !isComplete(task.id, r.id));
    if (!incomplete.length) return;
    await supabase.from("task_group_completions").upsert(
      incomplete.map(r => ({ task_id: task.id, resident_id: r.id, completed_date: today, completed_by: profile?.full_name ?? "Manager" })),
      { onConflict: "task_id,resident_id,completed_date" }
    );
    await supabase.from("tasks").update({ last_completed_at: new Date().toISOString() }).eq("id", task.id);
    setCompletions(p => [...p, ...incomplete.map(r => ({ task_id: task.id, resident_id: r.id }))]);
    loadData();
  }

  async function markStandardDone(task: Task) {
    if (task.is_recurring) {
      await supabase.from("tasks").update({ last_completed_at: new Date().toISOString() }).eq("id", task.id);
    } else {
      await supabase.from("tasks").update({ status: "Done", completed_at: new Date().toISOString() }).eq("id", task.id);
    }
    loadData();
  }

  async function deleteTask(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
    setTasks(p => p.filter(t => t.id !== id));
  }

  function toggleExpand(id: string) {
    setExpandedGroups(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const isGroup = selType !== "standard";
    const meta    = TYPE_META[selType];
    await supabase.from("tasks").insert({
      title:               isGroup ? meta.label : form.title,
      description:         form.description || null,
      due_date:            !isGroup && !form.is_recurring ? (form.due_date || null) : null,
      priority:            form.priority,
      category:            isGroup ? meta.label : form.category,
      task_type:           selType,
      status:              "Pending",
      assigned_to_manager: form.assigned_to_manager || null,
      assigned_by:         isOwner ? (profile?.full_name ?? "Mike") : null,
      home_id:             form.home_id || null,
      is_recurring:        isGroup ? true : form.is_recurring,
      recurrence_type:     isGroup || form.is_recurring ? (isGroup ? "daily" : form.recurrence_type) : null,
      reminder_time:       form.reminder_time || null,
    });
    resetDialog();
    loadData();
  }

  function resetDialog() {
    setAddOpen(false); setAddStep(1); setSelType("standard");
    setForm({ title: "", description: "", due_date: "", priority: "Medium", category: "General",
      assigned_to_manager: "", home_id: "", is_recurring: false, recurrence_type: "daily", reminder_time: "" });
  }

  // ── Filtered / sectioned data ────────────────────────────────────────────────

  const filtered = useMemo(() => tasks.filter(t => {
    if (filterHome !== "All" && t.home_id !== filterHome) return false;
    if (activeTab === "Assigned")  return !!t.assigned_by;
    if (activeTab === "Recurring") return t.is_recurring && t.task_type === "standard";
    return true;
  }), [tasks, filterHome, activeTab]);

  const { groupTasks, standardTasks } = useMemo(() => ({
    groupTasks:    filtered.filter(t => t.task_type !== "standard"),
    standardTasks: filtered.filter(t => t.task_type === "standard"),
  }), [filtered]);

  const sections = useMemo(() => {
    const o: Task[] = [], td: Task[] = [], up: Task[] = [], dn: Task[] = [];
    standardTasks.forEach(t => {
      const c = getDisplayCat(t, today);
      if (c === "overdue")  o.push(t);
      else if (c === "today")    td.push(t);
      else if (c === "done")     dn.push(t);
      else                       up.push(t);
    });
    return { overdue: o, today: td, upcoming: up, done: dn };
  }, [standardTasks, today]);

  const pendingStd   = standardTasks.filter(t => t.is_recurring ? isRecurringDue(t, today) : t.status !== "Done").length;
  const overdueCount = sections.overdue.length;
  const grpPending   = groupTasks.filter(t => completedCount(t.id) < groupResidents(t).length).length;

  // ── Error states ─────────────────────────────────────────────────────────────

  if (!tableExists) return (
    <UpgradePrompt
      title="Tasks table not found"
      body="Run Block 2 in the setup page to create the tasks table."
    />
  );
  if (needsUpgrade) return (
    <UpgradePrompt
      title="Tasks need an upgrade"
      body="Run Block 6 in the setup page to unlock group tasks, assignments, and reminders."
    />
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "#F1F5F9" }}>Tasks</h1>
          <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
            {pendingStd > 0 && (
              <span className="text-xs" style={{ color: "#475569" }}>
                {pendingStd} pending
              </span>
            )}
            {overdueCount > 0 && (
              <BadgePill color="#F87171" bg="rgba(239,68,68,0.1)">
                <Clock size={9} /> {overdueCount} overdue
              </BadgePill>
            )}
            {grpPending > 0 && (
              <BadgePill color="#C084FC" bg="rgba(168,85,247,0.1)">
                <Users size={9} /> {grpPending} group{grpPending !== 1 ? "s" : ""} in progress
              </BadgePill>
            )}
          </div>
        </div>
        <Button
          onClick={() => { setAddStep(1); setAddOpen(true); }}
          className="gap-2 font-semibold text-sm h-9 px-4 flex-shrink-0"
          style={{ background: "#3B82F6", color: "white" }}
        >
          <Plus size={14} strokeWidth={2.5} /> New Task
        </Button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "#0F1523" }}>
        {TABS.map(tab => (
          <button
            key={tab} onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150"
            style={activeTab === tab ? { background: "#131929", color: "#F1F5F9" } : { color: "#334155" }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Home filter */}
      {homes.length > 1 && (
        <select
          value={filterHome} onChange={e => setFilterHome(e.target.value)}
          className="text-xs font-medium rounded-lg px-3 py-2 outline-none"
          style={{ background: "#0F1523", border: "1px solid rgba(255,255,255,0.06)", color: "#94A3B8" }}
        >
          <option value="All">All Homes</option>
          {homes.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      )}

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState onAdd={() => { setAddStep(1); setAddOpen(true); }} />
      ) : (
        <div className="space-y-7">

          {/* Group tasks */}
          {groupTasks.length > 0 && (
            <div className="space-y-2.5">
              <SectionLabel label="Group Tasks" count={groupTasks.length} color="#A78BFA" />
              {groupTasks.map(task => (
                <GroupTaskCard
                  key={task.id}
                  task={task}
                  residents={groupResidents(task)}
                  completedCount={completedCount(task.id)}
                  isComplete={id => isComplete(task.id, id)}
                  expanded={expandedGroups.has(task.id)}
                  onToggleExpand={() => toggleExpand(task.id)}
                  onToggleResident={id => toggleResident(task.id, id)}
                  onMarkAllDone={() => markGroupAllDone(task)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}
            </div>
          )}

          {/* Standard task sections */}
          {sections.overdue.length > 0 && (
            <TaskSection label="Overdue" color="#F87171" tasks={sections.overdue}
              today={today} onDone={markStandardDone} onDelete={deleteTask} dimmed={false} />
          )}
          {sections.today.length > 0 && (
            <TaskSection label="Due Today" color="#3B82F6" tasks={sections.today}
              today={today} onDone={markStandardDone} onDelete={deleteTask} dimmed={false} />
          )}
          {sections.upcoming.length > 0 && (
            <TaskSection label="Upcoming" color="#94A3B8" tasks={sections.upcoming}
              today={today} onDone={markStandardDone} onDelete={deleteTask} dimmed={false} />
          )}
          {sections.done.length > 0 && (
            <TaskSection label="Completed" color="#4ADE80" tasks={sections.done}
              today={today} onDone={markStandardDone} onDelete={deleteTask} dimmed />
          )}
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={o => { if (!o) resetDialog(); else setAddOpen(true); }}
      >
        <DialogContent className="sm:max-w-lg" style={{ background: "#0F1523", border: "1px solid rgba(255,255,255,0.08)" }}>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold" style={{ color: "#F1F5F9" }}>
              {addStep === 1 ? "What kind of task?" : `New ${TYPE_META[selType].label}`}
            </DialogTitle>
          </DialogHeader>

          {addStep === 1 ? (
            <TypePicker selected={selType} onSelect={setSelType}
              onContinue={() => setAddStep(2)} onCancel={resetDialog} />
          ) : (
            <form onSubmit={addTask} className="space-y-4 mt-1">
              {selType === "standard" ? (
                <StandardForm form={form} setF={setF} homes={homes} isOwner={isOwner} />
              ) : (
                <GroupForm form={form} setF={setF} homes={homes} taskType={selType} />
              )}
              <div className="flex gap-2.5 pt-1">
                <Button type="button" variant="outline" onClick={() => setAddStep(1)}
                  className="px-3 flex-shrink-0"
                  style={{ borderColor: "rgba(255,255,255,0.08)", color: "#94A3B8", background: "transparent" }}>
                  ← Back
                </Button>
                <Button type="button" variant="outline" onClick={resetDialog} className="flex-1"
                  style={{ borderColor: "rgba(255,255,255,0.08)", color: "#94A3B8", background: "transparent" }}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 font-semibold" style={{ background: "#3B82F6", color: "white" }}>
                  Create Task
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function BadgePill({ color, bg, children }: { color: string; bg: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: bg, color }}>
      {children}
    </span>
  );
}

function SectionLabel({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
      <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
        style={{ background: "rgba(255,255,255,0.05)", color: "#475569" }}>{count}</span>
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
    </div>
  );
}

// ── Group Task Card ─────────────────────────────────────────────────────────────

function GroupTaskCard({
  task, residents, completedCount, isComplete,
  expanded, onToggleExpand, onToggleResident, onMarkAllDone, onDelete,
}: {
  task: Task; residents: Resident[]; completedCount: number;
  isComplete: (id: string) => boolean; expanded: boolean;
  onToggleExpand: () => void; onToggleResident: (id: string) => void;
  onMarkAllDone: () => void; onDelete: () => void;
}) {
  const meta    = TYPE_META[task.task_type];
  const Icon    = meta.icon;
  const total   = residents.length;
  const pct     = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const allDone = completedCount >= total && total > 0;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#0F1523",
        border: `1px solid ${allDone ? "rgba(74,222,128,0.18)" : "rgba(255,255,255,0.06)"}`,
        transition: "border-color 0.3s ease",
      }}
    >
      {/* Header */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-3.5 px-4 py-4 text-left transition-colors hover:bg-white/[0.018]"
      >
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: meta.bg }}>
          <Icon size={17} style={{ color: meta.color }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-sm font-semibold"
              style={{ color: allDone ? "#4ADE80" : "#F1F5F9" }}>
              {task.title}
            </span>
            {task.assigned_by && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(59,130,246,0.12)", color: "#60A5FA" }}>
                From {task.assigned_by}
              </span>
            )}
          </div>

          {/* Progress bar + meta */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-28 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: allDone ? "#4ADE80" : meta.color,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <span className="text-xs font-semibold tabular-nums"
                style={{ color: allDone ? "#4ADE80" : "#94A3B8" }}>
                {completedCount}/{total}
              </span>
            </div>
            {task.home_name && (
              <span className="flex items-center gap-1 text-[11px]" style={{ color: "#334155" }}>
                <Building2 size={9} />{task.home_name}
              </span>
            )}
            <span className="text-[11px]" style={{ color: "#334155" }}>
              {total} resident{total !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {allDone && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(74,222,128,0.1)", color: "#4ADE80" }}>
              <Check size={9} strokeWidth={3} />Done
            </span>
          )}
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: expanded ? "rgba(255,255,255,0.05)" : "transparent" }}>
            {expanded
              ? <ChevronDown size={14} style={{ color: "#475569" }} />
              : <ChevronRight size={14} style={{ color: "#334155" }} />}
          </div>
        </div>
      </button>

      {/* Expanded checklist */}
      {expanded && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {total === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>
                No residents found for this task.
                {task.task_type !== "group_drug_test" && (
                  <> Add medications in resident profiles with the correct frequency.</>
                )}
              </p>
            </div>
          ) : (
            <>
              <div className="px-2 py-2 space-y-0.5">
                {residents.map(r => {
                  const done = isComplete(r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => onToggleResident(r.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-white/[0.025]"
                    >
                      <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          borderColor: done ? "#4ADE80" : "rgba(255,255,255,0.1)",
                          background:  done ? "rgba(74,222,128,0.12)" : "transparent",
                        }}
                      >
                        {done && <Check size={9} strokeWidth={3} style={{ color: "#4ADE80" }} />}
                      </div>
                      <span className="text-sm flex-1 text-left font-medium"
                        style={{ color: done ? "#475569" : "#CBD5E1" }}>
                        {r.full_name}
                      </span>
                      {done && (
                        <span className="text-[10px] font-semibold" style={{ color: "#4ADE80" }}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {!allDone && (
                <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <button
                    onClick={onMarkAllDone}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-85"
                    style={{
                      background: `${meta.color}18`,
                      color: meta.color,
                      border: `1px solid ${meta.color}30`,
                    }}
                  >
                    <CheckCheck size={14} /> Mark All Done
                  </button>
                </div>
              )}
            </>
          )}

          <div className="px-4 pb-3 flex justify-end">
            <button
              onClick={onDelete}
              className="text-xs flex items-center gap-1.5 transition-colors"
              style={{ color: "#1E293B" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#F87171"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#1E293B"}
            >
              <Trash2 size={10} /> Remove task
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Standard Task Section + Row ────────────────────────────────────────────────

function TaskSection({ label, color, tasks, today, onDone, onDelete, dimmed }: {
  label: string; color: string; tasks: Task[]; today: string;
  onDone: (t: Task) => void; onDelete: (id: string) => void; dimmed: boolean;
}) {
  return (
    <div className="space-y-2">
      <SectionLabel label={label} count={tasks.length} color={color} />
      {tasks.map(t => (
        <TaskRow key={t.id} task={t} today={today} onDone={onDone} onDelete={onDelete} dimmed={dimmed} />
      ))}
    </div>
  );
}

function TaskRow({ task: t, today, onDone, onDelete, dimmed }: {
  task: Task; today: string; onDone: (t: Task) => void; onDelete: (id: string) => void; dimmed: boolean;
}) {
  const isDone    = t.is_recurring ? isRecurringDoneToday(t, today) : t.status === "Done";
  const isOverdue = !t.is_recurring && t.status !== "Done" && !!t.due_date && t.due_date < today;
  const isAssigned = !!t.assigned_by;
  const pStyle    = PRIORITY_STYLE[t.priority] ?? PRIORITY_STYLE.Low;

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3.5 group transition-colors"
      style={{
        background: isAssigned ? "rgba(59,130,246,0.035)" : "#0F1523",
        border: `1px solid ${
          isOverdue   ? "rgba(248,113,113,0.18)" :
          isAssigned  ? "rgba(59,130,246,0.14)"  :
          "rgba(255,255,255,0.05)"
        }`,
        opacity: dimmed && isDone ? 0.44 : 1,
      }}
    >
      {/* Complete circle */}
      <button
        onClick={() => !isDone && onDone(t)}
        disabled={isDone}
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          borderColor: isDone ? "#4ADE80" : isOverdue ? "#F87171" : "rgba(255,255,255,0.12)",
          background:  isDone ? "rgba(74,222,128,0.14)" : "transparent",
        }}
      >
        {isDone && <Check size={10} strokeWidth={3} style={{ color: "#4ADE80" }} />}
      </button>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium"
            style={{
              color: isDone ? "#475569" : "#F1F5F9",
              textDecoration: isDone && !t.is_recurring ? "line-through" : "none",
            }}>
            {t.title}
          </p>
          {isAssigned && (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: "rgba(59,130,246,0.12)", color: "#60A5FA" }}>
              <UserCheck size={9} /> From {t.assigned_by}
            </span>
          )}
          {t.is_recurring && (
            <span className="flex items-center gap-0.5 text-[10px] font-medium flex-shrink-0"
              style={{ color: "#3B82F6" }}>
              <Repeat size={8} />{t.recurrence_type}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {t.home_name && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "#334155" }}>
              <Building2 size={9} />{t.home_name}
            </span>
          )}
          {t.assigned_to_manager && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "#FCD34D" }}>
              <User size={9} />→ {t.assigned_to_manager}
            </span>
          )}
          {!t.is_recurring && t.due_date && (
            <span className="flex items-center gap-1 text-[11px] font-medium"
              style={{ color: isOverdue ? "#F87171" : "#334155" }}>
              <Clock size={9} />{formatDue(t.due_date, today)}
            </span>
          )}
          {t.reminder_time && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "#334155" }}>
              <Bell size={9} />{t.reminder_time}
            </span>
          )}
        </div>
      </div>

      {/* Priority */}
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ background: pStyle.bg, color: pStyle.color }}>
        {t.priority}
      </span>

      {/* Delete */}
      <button
        onClick={() => onDelete(t.id)}
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: "#334155" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#F87171"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#334155"}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ── Dialog: Type Picker ─────────────────────────────────────────────────────────

function TypePicker({ selected, onSelect, onContinue, onCancel }: {
  selected: TaskType; onSelect: (t: TaskType) => void;
  onContinue: () => void; onCancel: () => void;
}) {
  const types: TaskType[] = ["standard", "group_morning_meds", "group_night_meds", "group_drug_test"];
  return (
    <div className="space-y-4 mt-2">
      <div className="grid grid-cols-2 gap-2.5">
        {types.map(type => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          const sel  = selected === type;
          return (
            <button
              key={type} type="button" onClick={() => onSelect(type)}
              className="flex flex-col items-start gap-2.5 p-4 rounded-2xl text-left transition-all"
              style={{
                background: sel ? `${meta.color}14` : "#131929",
                border: `1.5px solid ${sel ? meta.color + "55" : "rgba(255,255,255,0.05)"}`,
              }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: sel ? `${meta.color}22` : "rgba(255,255,255,0.05)" }}>
                <Icon size={17} style={{ color: sel ? meta.color : "#475569" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: sel ? "#F1F5F9" : "#94A3B8" }}>
                  {meta.label}
                </p>
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: sel ? "#64748B" : "#334155" }}>
                  {meta.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex gap-2.5">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1"
          style={{ borderColor: "rgba(255,255,255,0.08)", color: "#94A3B8", background: "transparent" }}>
          Cancel
        </Button>
        <Button type="button" onClick={onContinue} className="flex-1 font-semibold gap-1.5"
          style={{ background: "#3B82F6", color: "white" }}>
          Continue <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  );
}

// ── Dialog: Standard Task Form ──────────────────────────────────────────────────

type FormState = {
  title: string; description: string; due_date: string; priority: string;
  category: string; assigned_to_manager: string; home_id: string;
  is_recurring: boolean; recurrence_type: string; reminder_time: string;
};

function StandardForm({ form, setF, homes, isOwner }: {
  form: FormState; setF: (k: string, v: string | boolean) => void;
  homes: Home[]; isOwner: boolean;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label style={{ color: "#94A3B8" }}>Title <span style={{ color: "#F87171" }}>*</span></Label>
        <Input value={form.title} onChange={e => setF("title", e.target.value)} required
          placeholder="e.g. Distribute evening medications"
          style={{ background: "#131929", border: "1px solid rgba(255,255,255,0.08)", color: "#F1F5F9" }} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label style={{ color: "#94A3B8" }}>Category</Label>
          <select value={form.category} onChange={e => setF("category", e.target.value)}
            className="w-full rounded-md px-3 py-2 text-sm outline-none"
            style={{ background: "#131929", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label style={{ color: "#94A3B8" }}>Priority</Label>
          <select value={form.priority} onChange={e => setF("priority", e.target.value)}
            className="w-full rounded-md px-3 py-2 text-sm outline-none"
            style={{ background: "#131929", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {isOwner && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label style={{ color: "#94A3B8" }}>Assign to Manager</Label>
            <Input value={form.assigned_to_manager} onChange={e => setF("assigned_to_manager", e.target.value)}
              placeholder="Manager name"
              style={{ background: "#131929", border: "1px solid rgba(255,255,255,0.08)", color: "#F1F5F9" }} />
          </div>
          <div className="space-y-1.5">
            <Label style={{ color: "#94A3B8" }}>Home</Label>
            <select value={form.home_id} onChange={e => setF("home_id", e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              style={{ background: "#131929", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}>
              <option value="">All Homes</option>
              {homes.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Recurring toggle */}
      <div className="rounded-xl p-3.5 space-y-3" style={{ background: "#131929", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat size={13} style={{ color: "#60A5FA" }} />
            <span className="text-sm font-medium" style={{ color: "#94A3B8" }}>Recurring</span>
          </div>
          <button
            type="button"
            onClick={() => setF("is_recurring", !form.is_recurring)}
            className="w-9 h-5 rounded-full relative transition-colors"
            style={{ background: form.is_recurring ? "#3B82F6" : "#1E293B" }}
          >
            <span className="absolute top-0.5 rounded-full w-4 h-4 bg-white transition-all"
              style={{ left: form.is_recurring ? "19px" : "2px" }} />
          </button>
        </div>
        {form.is_recurring && (
          <div className="flex gap-2">
            {RECUR_OPTS.map(o => (
              <button key={o.value} type="button" onClick={() => setF("recurrence_type", o.value)}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={form.recurrence_type === o.value
                  ? { background: "#3B82F6", color: "white" }
                  : { background: "#0F1523", color: "#475569" }}>
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!form.is_recurring && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label style={{ color: "#94A3B8" }}>Due Date</Label>
            <Input type="date" value={form.due_date} onChange={e => setF("due_date", e.target.value)}
              style={{ background: "#131929", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }} />
          </div>
          <div className="space-y-1.5">
            <Label style={{ color: "#94A3B8" }}>Reminder Time</Label>
            <Input type="time" value={form.reminder_time} onChange={e => setF("reminder_time", e.target.value)}
              style={{ background: "#131929", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }} />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label style={{ color: "#94A3B8" }}>Notes <span className="opacity-40">(optional)</span></Label>
        <Textarea value={form.description} onChange={e => setF("description", e.target.value)} rows={2}
          placeholder="Additional details..."
          style={{ background: "#131929", border: "1px solid rgba(255,255,255,0.08)", color: "#F1F5F9" }} />
      </div>
    </>
  );
}

// ── Dialog: Group Task Form ─────────────────────────────────────────────────────

function GroupForm({ form, setF, homes, taskType }: {
  form: FormState; setF: (k: string, v: string | boolean) => void;
  homes: Home[]; taskType: TaskType;
}) {
  const meta = TYPE_META[taskType];
  const Icon = meta.icon;
  return (
    <>
      {/* Info banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl" style={{ background: meta.bg }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${meta.color}22` }}>
          <Icon size={15} style={{ color: meta.color }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#F1F5F9" }}>{meta.label}</p>
          <p className="text-xs mt-0.5 leading-snug" style={{ color: "#64748B" }}>
            {taskType === "group_drug_test"
              ? "Auto-loads all active residents. Check them off as each test is done."
              : "Auto-loads residents based on medication frequency in their profile. Resets daily."}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label style={{ color: "#94A3B8" }}>Which home?</Label>
        <select value={form.home_id} onChange={e => setF("home_id", e.target.value)}
          className="w-full rounded-md px-3 py-2 text-sm outline-none"
          style={{ background: "#131929", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}>
          <option value="">All Homes</option>
          {homes.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label style={{ color: "#94A3B8" }}>Notes <span className="opacity-40">(optional)</span></Label>
        <Textarea value={form.description} onChange={e => setF("description", e.target.value)} rows={2}
          placeholder="e.g. Use blister packs, double-check dosages..."
          style={{ background: "#131929", border: "1px solid rgba(255,255,255,0.08)", color: "#F1F5F9" }} />
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
        style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)" }}>
        <Repeat size={12} style={{ color: "#60A5FA" }} />
        <p className="text-xs" style={{ color: "#64748B" }}>This task automatically repeats daily and resets each morning.</p>
      </div>
    </>
  );
}

// ── Empty / Loading / Upgrade states ───────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl flex flex-col items-center justify-center py-20 text-center"
      style={{ background: "#0F1523", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: "#131929" }}>
        <CheckSquare size={22} style={{ color: "#334155" }} />
      </div>
      <p className="font-semibold" style={{ color: "#F1F5F9" }}>No tasks yet</p>
      <p className="text-sm mt-1 mb-5" style={{ color: "#334155" }}>
        Add your first task or create a group checklist
      </p>
      <button onClick={onAdd}
        className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
        style={{ background: "#131929", color: "#60A5FA", border: "1px solid rgba(59,130,246,0.2)" }}>
        <Plus size={14} /> New Task
      </button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="rounded-xl h-16 animate-pulse" style={{ background: "#0F1523" }} />
      ))}
    </div>
  );
}

function UpgradePrompt({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-4" style={{ color: "#F1F5F9" }}>Tasks</h1>
      <div className="rounded-2xl p-8 text-center"
        style={{ background: "#0F1523", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(245,158,11,0.1)" }}>
          <AlertTriangle size={22} style={{ color: "#FCD34D" }} />
        </div>
        <h3 className="font-semibold text-base mb-2" style={{ color: "#F1F5F9" }}>{title}</h3>
        <p className="text-sm mb-5" style={{ color: "#475569" }}>{body}</p>
        <Link href="/seed">
          <Button style={{ background: "#3B82F6", color: "white" }}>Go to Setup Page →</Button>
        </Link>
      </div>
    </div>
  );
}
