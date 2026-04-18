"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database, Trash2, CheckCircle, Copy, AlertTriangle, FlaskConical, CheckSquare, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

// These are the SQL commands to run in Supabase, one at a time
const SQL_BLOCKS = [
  {
    number: 1,
    title: "Create all core app tables",
    sql: `CREATE TABLE IF NOT EXISTS homes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  bed_count INTEGER DEFAULT 0,
  house_manager_name TEXT,
  assistant_manager_name TEXT,
  house_manager_email TEXT,
  manager_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS residents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id UUID REFERENCES homes(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  dob TEXT,
  move_in_date DATE,
  sobriety_date DATE,
  drug_of_choice TEXT,
  status TEXT DEFAULT 'Active',
  flag TEXT DEFAULT 'Green',
  risk_level TEXT DEFAULT 'Low',
  room_number TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  sponsor_name TEXT,
  case_manager_name TEXT,
  therapist_name TEXT,
  notes TEXT,
  points INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drug_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  test_date DATE NOT NULL,
  result TEXT NOT NULL,
  substance TEXT,
  notes TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cadence TEXT DEFAULT 'Daily',
  status TEXT DEFAULT 'Pending',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'Note',
  body TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  prescriber TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS weekly_meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  meeting_date DATE NOT NULL,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS restrictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);`,
  },
  {
    number: 2,
    title: "Create the tasks table",
    sql: `CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id UUID REFERENCES homes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT DEFAULT 'Medium',
  type TEXT DEFAULT 'General',
  status TEXT DEFAULT 'Pending',
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);`,
  },
  {
    number: 3,
    title: "Create the profiles table (for user roles and logins)",
    sql: `CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'manager',
  home_id UUID REFERENCES homes(id) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);`,
  },
  {
    number: 4,
    title: "Create the messages table",
    sql: `CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_name TEXT NOT NULL,
  to_home_id UUID REFERENCES homes(id) ON DELETE CASCADE,
  subject TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);`,
  },
  {
    number: 5,
    title: "Create the nightly reports table",
    sql: `CREATE TABLE IF NOT EXISTS nightly_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id UUID REFERENCES homes(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  all_residents_accounted BOOLEAN DEFAULT true,
  incidents_tonight BOOLEAN DEFAULT false,
  incident_notes TEXT,
  medications_given BOOLEAN DEFAULT true,
  medication_notes TEXT,
  curfew_violations BOOLEAN DEFAULT false,
  curfew_notes TEXT,
  general_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);`,
  },
];

type SeedStatus = "idle" | "running" | "done" | "error";

export default function SeedPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [completedBlocks, setCompletedBlocks] = useState<number[]>([]);
  const [seedStatus, setSeedStatus] = useState<SeedStatus>("idle");
  const [clearStatus, setClearStatus] = useState<SeedStatus>("idle");
  const [log, setLog] = useState<string[]>([]);

  const supabase = createClient();
  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  function copySQL(index: number, sql: string) {
    navigator.clipboard.writeText(sql);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 3000);
  }

  function markBlockDone(index: number) {
    if (!completedBlocks.includes(index)) {
      setCompletedBlocks(prev => [...prev, index]);
    }
  }

  async function seedData() {
    setSeedStatus("running");
    setLog([]);
    try {
      addLog("Creating test homes...");
      const { data: homes, error: homesError } = await supabase.from("homes").insert([
        { name: "Oak House", address: "1234 Oak Street, Plano TX 75024", bed_count: 8, house_manager_name: "Sarah Johnson", house_manager_email: "sarah@test.com", manager_phone: "972-555-0101", notes: "Primary men's house" },
        { name: "Cedar House", address: "567 Cedar Ave, Plano TX 75025", bed_count: 6, house_manager_name: "James Williams", house_manager_email: "james@test.com", manager_phone: "972-555-0102", notes: "Secondary men's house" },
        { name: "Maple House", address: "890 Maple Blvd, Plano TX 75023", bed_count: 10, house_manager_name: "Maria Garcia", house_manager_email: "maria@test.com", manager_phone: "972-555-0103", notes: "Women's house" },
      ]).select("id, name");

      if (homesError) { addLog(`ERROR: ${homesError.message}`); setSeedStatus("error"); return; }
      addLog(`✓ Created ${homes?.length} homes`);
      const [oak, cedar, maple] = homes ?? [];

      if (oak) {
        const { data: res } = await supabase.from("residents").insert([
          { home_id: oak.id, full_name: "Marcus Davis", status: "Active", flag: "Red", risk_level: "High", phone: "972-555-1001", sobriety_date: "2025-11-15", move_in_date: "2025-11-15", drug_of_choice: "Methamphetamine", room_number: "1", points: 10 },
          { home_id: oak.id, full_name: "Tyler Brooks", status: "Active", flag: "Yellow", risk_level: "Medium", phone: "972-555-1002", sobriety_date: "2025-09-01", move_in_date: "2025-09-01", drug_of_choice: "Alcohol", room_number: "2", points: 45 },
          { home_id: oak.id, full_name: "Derek Johnson", status: "Active", flag: "Green", risk_level: "Low", phone: "972-555-1003", sobriety_date: "2025-03-20", move_in_date: "2025-03-20", drug_of_choice: "Opioids", room_number: "3", points: 120 },
          { home_id: oak.id, full_name: "Chris Martinez", status: "On Pass", flag: "Green", risk_level: "Low", phone: "972-555-1004", sobriety_date: "2024-12-01", move_in_date: "2024-12-01", drug_of_choice: "Cocaine", room_number: "4", points: 200 },
          { home_id: oak.id, full_name: "Anthony Wilson", status: "Active", flag: "Yellow", risk_level: "Medium", phone: "972-555-1005", sobriety_date: "2026-01-10", move_in_date: "2026-01-10", drug_of_choice: "Heroin", room_number: "5", points: 30 },
        ]).select("id");
        addLog(`✓ Added residents to Oak House`);
        if (res) {
          const d10 = new Date(); d10.setDate(d10.getDate() - 10);
          await supabase.from("drug_tests").insert([
            { resident_id: res[0].id, test_date: d10.toISOString().split("T")[0], result: "Positive", substance: "Methamphetamine", recorded_by: "Sarah Johnson" },
            { resident_id: res[2].id, test_date: new Date().toISOString().split("T")[0], result: "Negative", recorded_by: "Sarah Johnson" },
          ]);
          await supabase.from("notes").insert([
            { resident_id: res[0].id, type: "Incident", body: "Marcus found with paraphernalia during routine check.", created_by: "Sarah Johnson" },
            { resident_id: res[1].id, type: "Note", body: "Tyler missed morning check-in. Called and confirmed at work.", created_by: "Sarah Johnson" },
          ]);
          await supabase.from("chores").insert([
            { resident_id: res[2].id, title: "Kitchen clean", cadence: "Daily", status: "Pending" },
          ]);
          addLog(`✓ Added drug tests, notes, chores for Oak House`);
        }
      }

      if (cedar) {
        const { data: res } = await supabase.from("residents").insert([
          { home_id: cedar.id, full_name: "Robert Thompson", status: "Active", flag: "Green", risk_level: "Low", phone: "972-555-2001", sobriety_date: "2025-06-15", move_in_date: "2025-06-15", drug_of_choice: "Alcohol", room_number: "1", points: 85 },
          { home_id: cedar.id, full_name: "Kevin Anderson", status: "Active", flag: "Red", risk_level: "High", phone: "972-555-2002", sobriety_date: "2026-02-01", move_in_date: "2026-02-01", drug_of_choice: "Opioids", room_number: "2", points: 5 },
          { home_id: cedar.id, full_name: "Mike Torres", status: "Active", flag: "Green", risk_level: "Low", phone: "972-555-2003", sobriety_date: "2024-08-20", move_in_date: "2024-08-20", drug_of_choice: "Methamphetamine", room_number: "3", points: 310 },
        ]).select("id");
        addLog(`✓ Added residents to Cedar House`);
        if (res) {
          await supabase.from("notes").insert([
            { resident_id: res[1].id, type: "Incident", body: "Kevin threatened another resident after dinner.", created_by: "James Williams" },
          ]);
        }
      }

      if (maple) {
        await supabase.from("residents").insert([
          { home_id: maple.id, full_name: "Jennifer Lee", status: "Active", flag: "Green", risk_level: "Low", phone: "972-555-3001", sobriety_date: "2025-07-04", move_in_date: "2025-07-04", drug_of_choice: "Alcohol", room_number: "1", points: 95 },
          { home_id: maple.id, full_name: "Ashley Brown", status: "Active", flag: "Yellow", risk_level: "Medium", phone: "972-555-3002", sobriety_date: "2025-12-20", move_in_date: "2025-12-20", drug_of_choice: "Cocaine", room_number: "2", points: 25 },
          { home_id: maple.id, full_name: "Stephanie Clark", status: "On Pass", flag: "Green", risk_level: "Low", phone: "972-555-3003", sobriety_date: "2024-05-10", move_in_date: "2024-05-10", drug_of_choice: "Opioids", room_number: "3", points: 450 },
          { home_id: maple.id, full_name: "Rachel White", status: "Active", flag: "Green", risk_level: "Low", phone: "972-555-3004", sobriety_date: "2025-10-01", move_in_date: "2025-10-01", drug_of_choice: "Heroin", room_number: "4", points: 60 },
        ]);
        addLog(`✓ Added residents to Maple House`);
      }

      if (oak && cedar && maple) {
        const today = new Date().toISOString().split("T")[0];
        const yday = new Date(); yday.setDate(yday.getDate() - 1);
        const tmrw = new Date(); tmrw.setDate(tmrw.getDate() + 1);
        const { error: taskErr } = await supabase.from("tasks").insert([
          { home_id: oak.id, title: "Weekly drug tests — Oak House", type: "Drug Test", priority: "High", status: "Pending", due_date: today, assigned_to: "Sarah Johnson" },
          { home_id: cedar.id, title: "Follow up with Kevin's case manager", type: "General", priority: "Urgent", status: "Pending", due_date: yday.toISOString().split("T")[0] },
          { home_id: maple.id, title: "Monthly house meeting", type: "Meeting", priority: "Medium", status: "Pending", due_date: tmrw.toISOString().split("T")[0] },
        ]);
        if (taskErr) addLog("⚠ Tasks skipped — run Block 4 SQL first");
        else addLog("✓ Added sample tasks");
      }

      addLog("✅ All done! Go explore the app.");
      setSeedStatus("done");
    } catch (err) {
      addLog(`ERROR: ${String(err)}`);
      setSeedStatus("error");
    }
  }

  async function clearTestData() {
    setClearStatus("running");
    setLog([]);
    addLog("Deleting everything...");
    const { error } = await supabase.from("homes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) { addLog(`Error: ${error.message}`); setClearStatus("error"); }
    else { addLog("✓ All data cleared. App is empty."); setClearStatus("done"); }
  }

  return (
    <div className="max-w-2xl mx-auto">

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0B1F3A" }}>Setup & Test Data</h1>
        <p className="text-sm mt-1" style={{ color: "#64748B" }}>
          You need to run 5 quick commands in Supabase before the full app works. Takes about 3 minutes total.
        </p>
      </div>

      {/* ── STEP 1 INSTRUCTIONS ── */}
      <div className="rounded-2xl border-2 border-blue-300 bg-blue-50 p-5 mb-6">
        <p className="font-bold text-blue-900 mb-3 text-base">Step 1 — Run 5 SQL commands in Supabase</p>
        <div className="space-y-2 text-sm text-blue-800">
          <p>① Open <strong>supabase.com</strong> → go to your project</p>
          <p>② Click <strong>SQL Editor</strong> in the left sidebar</p>
          <p>③ Click <strong>New query</strong> (top left of the editor)</p>
          <p>④ For each block below: hit <strong>Copy SQL</strong>, paste it into the editor, click <strong>Run</strong></p>
          <p>⑤ Wait for <span className="bg-green-200 text-green-900 px-1 rounded font-mono text-xs">Success. No rows returned</span> before doing the next one</p>
        </div>
        <div className="mt-3 p-3 bg-white border border-blue-200 rounded-xl">
          <p className="text-xs font-bold text-red-600">⚠ Important — only paste the SQL, nothing else</p>
          <p className="text-xs text-blue-700 mt-1">
            Each gray box below contains the SQL. Use the blue <strong>Copy SQL</strong> button — don&apos;t try to highlight and copy manually. After copying, the Supabase editor should show only a short command like <code className="bg-gray-100 px-1 rounded">ALTER TABLE...</code> or <code className="bg-gray-100 px-1 rounded">CREATE TABLE...</code> — nothing else.
          </p>
        </div>
      </div>

      {/* ── SQL BLOCKS ── */}
      <div className="space-y-4 mb-8">
        {SQL_BLOCKS.map((block, i) => {
          const isDone = completedBlocks.includes(i);
          const isCopied = copiedIndex === i;
          return (
            <div
              key={i}
              className="rounded-2xl border-2 overflow-hidden"
              style={{ borderColor: isDone ? "#86EFAC" : "#DDE4ED" }}
            >
              {/* Block header */}
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ background: isDone ? "#F0FDF4" : "#F8FAFC" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: isDone ? "#16A34A" : "#0284C7", color: "white" }}
                  >
                    {isDone ? <Check size={14} strokeWidth={3} /> : block.number}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#0B1F3A" }}>{block.title}</p>
                    <p className="text-xs" style={{ color: "#64748B" }}>
                      {isDone ? "✓ Marked as done" : "Copy this SQL → paste in Supabase → click Run"}
                    </p>
                  </div>
                </div>
              </div>

              {/* SQL box */}
              <div className="px-5 pt-3 pb-2" style={{ background: "white" }}>
                <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: "#94A3B8" }}>
                  ▼ Copy everything in this box
                </p>
                <div
                  className="rounded-xl p-4 border-2 border-dashed mb-3 overflow-x-auto"
                  style={{ background: "#0F172A", borderColor: "#334155" }}
                >
                  <pre className="text-sm font-mono whitespace-pre" style={{ color: "#4ADE80" }}>{block.sql}</pre>
                </div>

                <div className="flex items-center gap-3 pb-3">
                  {/* Copy button — big and obvious */}
                  <button
                    onClick={() => copySQL(i, block.sql)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                    style={{
                      background: isCopied ? "#16A34A" : "#0284C7",
                      color: "white",
                      minWidth: "160px",
                    }}
                  >
                    {isCopied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    {isCopied ? "✓ Copied! Now paste in Supabase" : "Copy SQL"}
                  </button>

                  {/* Mark done button */}
                  {!isDone ? (
                    <button
                      onClick={() => markBlockDone(i)}
                      className="text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all"
                      style={{ borderColor: "#DDE4ED", color: "#64748B" }}
                    >
                      Mark as done ✓
                    </button>
                  ) : (
                    <span className="text-sm font-semibold" style={{ color: "#16A34A" }}>
                      ✓ Done
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── STEP 2: SEED DATA ── */}
      <div className="rounded-2xl border-2 overflow-hidden mb-4" style={{ borderColor: "#DDE4ED" }}>
        <div
          className="flex items-center gap-3 px-5 py-4 border-b"
          style={{ borderColor: "#F1F5F9", background: "#F8FAFC" }}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "#0284C7" }}>
            2
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: "#0B1F3A" }}>Load test data into the app</p>
            <p className="text-xs" style={{ color: "#64748B" }}>Do this AFTER running all 5 SQL blocks above</p>
          </div>
        </div>

        <div className="p-5 space-y-4 bg-white">
          <div className="grid grid-cols-3 gap-3 text-xs">
            {[
              { icon: Database, label: "3 test homes", sub: "Oak, Cedar, Maple" },
              { icon: CheckSquare, label: "12 residents", sub: "Mix of flags & statuses" },
              { icon: FlaskConical, label: "Sample records", sub: "Drug tests, notes, chores, tasks" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center gap-1 p-3 rounded-xl" style={{ background: "#F8FAFC" }}>
                <Icon size={18} style={{ color: "#0284C7" }} />
                <p className="font-semibold" style={{ color: "#0B1F3A" }}>{label}</p>
                <p style={{ color: "#94A3B8" }}>{sub}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={seedData}
              disabled={seedStatus === "running"}
              className="flex-1 font-bold gap-2 py-3"
              style={{ background: "#0284C7", color: "white" }}
            >
              <Database size={15} />
              {seedStatus === "running" ? "Adding data..." : seedStatus === "done" ? "Add More Test Data" : "Seed Test Data"}
            </Button>
            <Button
              onClick={clearTestData}
              disabled={clearStatus === "running"}
              variant="outline"
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 size={14} />
              {clearStatus === "running" ? "Clearing..." : "Clear All Data"}
            </Button>
          </div>

          {log.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-4 max-h-52 overflow-y-auto">
              {log.map((line, i) => (
                <p
                  key={i}
                  className="text-xs font-mono leading-relaxed"
                  style={{
                    color: line.startsWith("✓") || line.startsWith("✅") ? "#4ADE80"
                      : line.startsWith("⚠") ? "#FCD34D"
                      : line.startsWith("ERROR") ? "#F87171"
                      : "#D1D5DB",
                  }}
                >
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <AlertTriangle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs" style={{ color: "#92400E" }}>
          <strong>Clear All Data</strong> permanently deletes every home, resident, and record. Only use this to reset for testing.
        </p>
      </div>
    </div>
  );
}
