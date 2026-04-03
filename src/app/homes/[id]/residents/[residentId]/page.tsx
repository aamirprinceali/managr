"use client";
// Resident Profile page — shows everything about a single resident
// Route: /homes/[homeId]/residents/[residentId]
// All data is fetched client-side from Supabase

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// ─── Type Definitions ────────────────────────────────────────────────────────

type Resident = {
  id: string;
  home_id: string;
  full_name: string;
  status: string;
  flag: string;
  points: number;
  sobriety_date: string | null;
  intake_date: string | null;
  move_in_date: string | null;
  drug_of_choice: string | null;
  risk_level: string | null;
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  sponsor_name: string | null;
  case_manager_name: string | null;
  therapist_name: string | null;
  notes: string | null;
  room_number: string | null;
  dob: string | null;
};

type WeeklyMeeting = {
  id: string;
  meeting_date: string;
  notes: string;
  created_by: string | null;
  created_at: string;
};

type Restriction = {
  id: string;
  title: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

type DrugTest = {
  id: string;
  test_date: string;
  result: string;
  notes: string | null;
};

type Chore = {
  id: string;
  title: string;
  cadence: string;
  status: string;
  due_date: string | null;
};

type Note = {
  id: string;
  type: string;
  body: string;
  created_at: string;
};

type Medication = {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  prescriber: string | null;
};

// ─── Helper: Status badge colors ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active: "bg-sky-100 text-sky-700",
    "On Pass": "bg-yellow-100 text-yellow-700",
    Discharged: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

// ─── Helper: Flag color dot ───────────────────────────────────────────────────
function FlagDot({ flag }: { flag: string }) {
  const colors: Record<string, string> = {
    Green: "#16A34A",
    Yellow: "#D97706",
    Red: "#DC2626",
  };
  return (
    <span
      className="inline-block rounded-full w-3 h-3 flex-shrink-0"
      style={{ background: colors[flag] ?? "#94A3B8" }}
      title={`${flag} flag`}
    />
  );
}

// ─── Helper: Section label ───────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#94A3B8" }}>
      {children}
    </p>
  );
}

// ─── Helper: Info row (label + value) ────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs" style={{ color: "#94A3B8" }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: "#0B1F3A" }}>{value || "—"}</span>
    </div>
  );
}

// ─── Helper: Drug test result badge ──────────────────────────────────────────
function ResultBadge({ result }: { result: string }) {
  const styles: Record<string, string> = {
    Negative: "bg-green-100 text-green-700",
    Positive: "bg-red-100 text-red-700",
    Refused: "bg-yellow-100 text-yellow-700",
    Inconclusive: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles[result] ?? "bg-gray-100 text-gray-600"}`}>
      {result}
    </span>
  );
}

// ─── Helper: Note type badge ──────────────────────────────────────────────────
function NoteTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    Note: "bg-sky-100 text-sky-700",
    Incident: "bg-red-100 text-red-700",
    Relapse: "bg-orange-100 text-orange-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles[type] ?? "bg-gray-100 text-gray-600"}`}>
      {type}
    </span>
  );
}

// ─── Format date helper ───────────────────────────────────────────────────────
function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function ResidentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const homeId = params.id as string;
  const residentId = params.residentId as string;

  // ── State ──────────────────────────────────────────────────────────────────
  const [resident, setResident] = useState<Resident | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "drugtests" | "chores" | "notes" | "medications" | "meetings" | "restrictions">("overview");

  // Tab-specific data
  const [drugTests, setDrugTests] = useState<DrugTest[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [meetings, setMeetings] = useState<WeeklyMeeting[]>([]);
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);

  // Points updating state
  const [pointsLoading, setPointsLoading] = useState(false);

  // Drug test form state
  const [dtDate, setDtDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dtResult, setDtResult] = useState("Negative");
  const [dtNotes, setDtNotes] = useState("");
  const [dtSubmitting, setDtSubmitting] = useState(false);

  // Chore form state
  const [choreTitle, setChoreTitle] = useState("");
  const [choreCadence, setChoreCadence] = useState("Daily");
  const [choreSubmitting, setChoreSubmitting] = useState(false);

  // Note form state
  const [noteType, setNoteType] = useState("Note");
  const [noteBody, setNoteBody] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Medication form state
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medFrequency, setMedFrequency] = useState("");
  const [medPrescriber, setMedPrescriber] = useState("");
  const [medSubmitting, setMedSubmitting] = useState(false);

  // Weekly meeting form state
  const [meetingDate, setMeetingDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [meetingNotes, setMeetingNotes] = useState("");
  const [meetingSubmitting, setMeetingSubmitting] = useState(false);

  // Restriction form state
  const [restrictionTitle, setRestrictionTitle] = useState("");
  const [restrictionNotes, setRestrictionNotes] = useState("");
  const [restrictionSubmitting, setRestrictionSubmitting] = useState(false);

  // ── Load resident data ─────────────────────────────────────────────────────
  const loadResident = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("residents")
      .select("*")
      .eq("id", residentId)
      .single();

    if (!data) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setResident(data as Resident);
    setLoading(false);
  }, [residentId]);

  // ── Load drug tests ────────────────────────────────────────────────────────
  const loadDrugTests = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("drug_tests")
      .select("*")
      .eq("resident_id", residentId)
      .order("test_date", { ascending: false });
    setDrugTests((data as DrugTest[]) ?? []);
  }, [residentId]);

  // ── Load chores ────────────────────────────────────────────────────────────
  const loadChores = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("chores")
      .select("*")
      .eq("resident_id", residentId)
      .order("due_date", { ascending: true });
    setChores((data as Chore[]) ?? []);
  }, [residentId]);

  // ── Load notes ─────────────────────────────────────────────────────────────
  const loadNotes = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("resident_id", residentId)
      .order("created_at", { ascending: false });
    setNotes((data as Note[]) ?? []);
  }, [residentId]);

  // ── Load medications ───────────────────────────────────────────────────────
  const loadMedications = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("medications")
      .select("*")
      .eq("resident_id", residentId)
      .order("name", { ascending: true });
    setMedications((data as Medication[]) ?? []);
  }, [residentId]);

  // ── Load weekly meetings ───────────────────────────────────────────────────
  const loadMeetings = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("weekly_meetings")
      .select("*")
      .eq("resident_id", residentId)
      .order("meeting_date", { ascending: false });
    setMeetings((data as WeeklyMeeting[]) ?? []);
  }, [residentId]);

  // ── Load restrictions ──────────────────────────────────────────────────────
  const loadRestrictions = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("restrictions")
      .select("*")
      .eq("resident_id", residentId)
      .order("created_at", { ascending: false });
    setRestrictions((data as Restriction[]) ?? []);
  }, [residentId]);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    loadResident();
    loadDrugTests();
    loadChores();
    loadNotes();
    loadMedications();
    loadMeetings();
    loadRestrictions();
  }, [loadResident, loadDrugTests, loadChores, loadNotes, loadMedications, loadMeetings, loadRestrictions]);

  // ── Points update ──────────────────────────────────────────────────────────
  async function updatePoints(delta: number) {
    if (!resident || pointsLoading) return;
    setPointsLoading(true);
    const newPoints = (resident.points ?? 0) + delta;
    const supabase = createClient();
    const { error } = await supabase
      .from("residents")
      .update({ points: newPoints })
      .eq("id", residentId);
    if (!error) {
      setResident((prev) => prev ? { ...prev, points: newPoints } : prev);
    }
    setPointsLoading(false);
  }

  // ── Submit drug test ───────────────────────────────────────────────────────
  async function submitDrugTest(e: React.FormEvent) {
    e.preventDefault();
    setDtSubmitting(true);
    const supabase = createClient();
    await supabase.from("drug_tests").insert({
      resident_id: residentId,
      test_date: dtDate,
      result: dtResult,
      notes: dtNotes || null,
    });
    setDtDate(new Date().toISOString().split("T")[0]);
    setDtResult("Negative");
    setDtNotes("");
    setDtSubmitting(false);
    loadDrugTests();
  }

  // ── Toggle chore done/undone ───────────────────────────────────────────────
  async function toggleChore(chore: Chore) {
    const supabase = createClient();
    const newStatus = chore.status === "Done" ? "Pending" : "Done";
    await supabase
      .from("chores")
      .update({ status: newStatus, completed_at: newStatus === "Done" ? new Date().toISOString() : null })
      .eq("id", chore.id);
    loadChores();
  }

  // ── Submit new chore ───────────────────────────────────────────────────────
  async function submitChore(e: React.FormEvent) {
    e.preventDefault();
    if (!choreTitle.trim()) return;
    setChoreSubmitting(true);
    const supabase = createClient();
    await supabase.from("chores").insert({
      resident_id: residentId,
      title: choreTitle.trim(),
      cadence: choreCadence,
      status: "Pending",
    });
    setChoreTitle("");
    setChoreCadence("Daily");
    setChoreSubmitting(false);
    loadChores();
  }

  // ── Submit new note ────────────────────────────────────────────────────────
  async function submitNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteBody.trim()) return;
    setNoteSubmitting(true);
    const supabase = createClient();
    await supabase.from("notes").insert({
      resident_id: residentId,
      home_id: homeId,
      type: noteType,
      body: noteBody.trim(),
    });
    setNoteType("Note");
    setNoteBody("");
    setNoteSubmitting(false);
    loadNotes();
  }

  // ── Submit new medication ──────────────────────────────────────────────────
  async function submitMedication(e: React.FormEvent) {
    e.preventDefault();
    if (!medName.trim()) return;
    setMedSubmitting(true);
    const supabase = createClient();
    await supabase.from("medications").insert({
      resident_id: residentId,
      name: medName.trim(),
      dosage: medDosage || null,
      frequency: medFrequency || null,
      prescriber: medPrescriber || null,
    });
    setMedName("");
    setMedDosage("");
    setMedFrequency("");
    setMedPrescriber("");
    setMedSubmitting(false);
    loadMedications();
  }

  // ── Submit new weekly meeting note ────────────────────────────────────────
  async function submitMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (!meetingNotes.trim()) return;
    setMeetingSubmitting(true);
    const supabase = createClient();
    await supabase.from("weekly_meetings").insert({
      resident_id: residentId,
      meeting_date: meetingDate,
      notes: meetingNotes.trim(),
    });
    setMeetingDate(new Date().toISOString().split("T")[0]);
    setMeetingNotes("");
    setMeetingSubmitting(false);
    loadMeetings();
  }

  // ── Submit new restriction ────────────────────────────────────────────────
  async function submitRestriction(e: React.FormEvent) {
    e.preventDefault();
    if (!restrictionTitle.trim()) return;
    setRestrictionSubmitting(true);
    const supabase = createClient();
    await supabase.from("restrictions").insert({
      resident_id: residentId,
      title: restrictionTitle.trim(),
      notes: restrictionNotes.trim() || null,
      is_active: true,
    });
    setRestrictionTitle("");
    setRestrictionNotes("");
    setRestrictionSubmitting(false);
    loadRestrictions();
  }

  // ── Toggle restriction active/inactive ────────────────────────────────────
  async function toggleRestriction(r: Restriction) {
    const supabase = createClient();
    await supabase
      .from("restrictions")
      .update({ is_active: !r.is_active })
      .eq("id", r.id);
    loadRestrictions();
  }

  // ── Calculate days sober ───────────────────────────────────────────────────
  const daysSober = resident?.sobriety_date
    ? Math.floor((Date.now() - new Date(resident.sobriety_date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // ── Shared input/select/textarea styles ────────────────────────────────────
  const inputCls = "w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300 transition";
  const inputStyle = { borderColor: "#DDE4ED", color: "#0B1F3A" };
  const primaryBtn = "px-4 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50";
  const primaryBtnStyle = { background: "#0284C7" };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="h-4 w-24 bg-gray-200 rounded mb-6" />
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
          <div className="h-8 w-48 bg-gray-200 rounded mb-3" />
          <div className="flex gap-2 mb-4">
            <div className="h-6 w-16 bg-gray-100 rounded-full" />
            <div className="h-6 w-6 bg-gray-100 rounded-full" />
          </div>
          <div className="h-6 w-32 bg-sky-50 rounded-full mb-4" />
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 bg-gray-100 rounded-lg" />
            <div className="h-8 w-12 bg-gray-200 rounded" />
            <div className="h-8 w-8 bg-gray-100 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        </div>
        <div className="flex gap-1 mb-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-9 w-24 bg-gray-100 rounded-lg" />)}
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  // ── Not found state ────────────────────────────────────────────────────────
  if (notFound || !resident) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/homes/${homeId}`}
          className="flex items-center gap-2 text-gray-400 hover:text-slate-900 transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white border rounded-2xl" style={{ borderColor: "#DDE4ED" }}>
          <p className="text-lg font-bold mb-2" style={{ color: "#0B1F3A" }}>Resident not found</p>
          <p className="text-sm" style={{ color: "#64748B" }}>This resident may have been removed or the link is invalid.</p>
        </div>
      </div>
    );
  }

  // ── Tab definitions ────────────────────────────────────────────────────────
  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "drugtests", label: "Drug Tests" },
    { key: "chores", label: "Chores" },
    { key: "notes", label: "Notes" },
    { key: "medications", label: "Medications" },
    { key: "meetings", label: "Meetings" },
    { key: "restrictions", label: "Restrictions" },
  ] as const;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto pb-16">

      {/* ── Back button ─────────────────────────────────────────────────── */}
      <Link
        href={`/homes/${homeId}`}
        className="flex items-center gap-2 text-gray-400 hover:text-slate-900 transition-colors mb-6 text-sm"
      >
        <ArrowLeft size={16} />
        <span>Back to Home</span>
      </Link>

      {/* ── Profile Header Card ─────────────────────────────────────────── */}
      <div className="bg-white border rounded-2xl p-6 mb-4" style={{ borderColor: "#DDE4ED" }}>

        {/* Name + status row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="text-2xl font-bold leading-tight" style={{ color: "#0B1F3A" }}>
            {resident.full_name}
          </h1>
          <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
            <StatusBadge status={resident.status} />
            <FlagDot flag={resident.flag} />
          </div>
        </div>

        {/* Days sober pill */}
        {daysSober !== null && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border mb-4"
            style={{ background: "#F0F9FF", color: "#0369A1", borderColor: "#BAE6FD" }}>
            {daysSober} day{daysSober !== 1 ? "s" : ""} sober
          </div>
        )}

        {/* Points row — [−] count [+] */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Points</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updatePoints(-1)}
              disabled={pointsLoading}
              className="w-8 h-8 rounded-lg border flex items-center justify-center text-lg font-bold transition hover:bg-gray-50 disabled:opacity-50"
              style={{ borderColor: "#DDE4ED", color: "#0B1F3A" }}
              aria-label="Remove one point"
            >
              −
            </button>
            <span className="w-10 text-center text-lg font-bold" style={{ color: "#0B1F3A" }}>
              {resident.points ?? 0}
            </span>
            <button
              onClick={() => updatePoints(1)}
              disabled={pointsLoading}
              className="w-8 h-8 rounded-lg border flex items-center justify-center text-lg font-bold transition hover:bg-gray-50 disabled:opacity-50"
              style={{ borderColor: "#DDE4ED", color: "#0284C7" }}
              aria-label="Add one point"
            >
              +
            </button>
          </div>
        </div>

        {/* Quick info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex flex-col gap-0.5 bg-gray-50 rounded-xl p-3">
            <span className="text-xs" style={{ color: "#94A3B8" }}>Intake Date</span>
            <span className="text-sm font-medium" style={{ color: "#0B1F3A" }}>
              {fmtDate(resident.intake_date ?? resident.move_in_date)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 bg-gray-50 rounded-xl p-3">
            <span className="text-xs" style={{ color: "#94A3B8" }}>Drug of Choice</span>
            <span className="text-sm font-medium" style={{ color: "#0B1F3A" }}>{resident.drug_of_choice || "—"}</span>
          </div>
          <div className="flex flex-col gap-0.5 bg-gray-50 rounded-xl p-3">
            <span className="text-xs" style={{ color: "#94A3B8" }}>Risk Level</span>
            <span className="text-sm font-medium" style={{ color: "#0B1F3A" }}>{resident.risk_level || "—"}</span>
          </div>
          <div className="flex flex-col gap-0.5 bg-gray-50 rounded-xl p-3">
            <span className="text-xs" style={{ color: "#94A3B8" }}>Room</span>
            <span className="text-sm font-medium" style={{ color: "#0B1F3A" }}>{resident.room_number || "—"}</span>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto mb-4 bg-white border rounded-2xl p-1" style={{ borderColor: "#DDE4ED" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-3 py-2 text-sm rounded-xl transition-all font-medium ${
              activeTab === tab.key
                ? "border-b-2"
                : "text-gray-400 hover:text-gray-600"
            }`}
            style={activeTab === tab.key
              ? { color: "#0284C7", borderBottomColor: "#0284C7", fontWeight: 600 }
              : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content Card ─────────────────────────────────────────────── */}
      <div className="bg-white border rounded-2xl p-6" style={{ borderColor: "#DDE4ED" }}>

        {/* ══ OVERVIEW TAB ══════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-6">

            {/* Personal info */}
            <div>
              <SectionLabel>Personal</SectionLabel>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Date of Birth" value={fmtDate(resident.dob)} />
                <InfoRow label="Phone" value={resident.phone} />
              </div>
            </div>

            <hr style={{ borderColor: "#EEF2F7" }} />

            {/* Contacts */}
            <div>
              <SectionLabel>Contacts</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <InfoRow label="Emergency Contact" value={resident.emergency_contact_name} />
                  {resident.emergency_contact_phone && (
                    <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{resident.emergency_contact_phone}</p>
                  )}
                </div>
                <InfoRow label="Sponsor" value={resident.sponsor_name} />
                <InfoRow label="Case Manager" value={resident.case_manager_name} />
                <InfoRow label="Therapist" value={resident.therapist_name} />
              </div>
            </div>

            {/* General notes from the resident record */}
            {resident.notes && (
              <>
                <hr style={{ borderColor: "#EEF2F7" }} />
                <div>
                  <SectionLabel>General Notes</SectionLabel>
                  <p className="text-sm leading-relaxed" style={{ color: "#334155" }}>{resident.notes}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ DRUG TESTS TAB ════════════════════════════════════════════ */}
        {activeTab === "drugtests" && (
          <div>
            {/* Add new drug test form */}
            <SectionLabel>Log New Test</SectionLabel>
            <form onSubmit={submitDrugTest} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <input
                type="date"
                value={dtDate}
                onChange={(e) => setDtDate(e.target.value)}
                className={inputCls}
                style={inputStyle}
                required
              />
              <select
                value={dtResult}
                onChange={(e) => setDtResult(e.target.value)}
                className={inputCls}
                style={inputStyle}
              >
                {["Negative", "Positive", "Refused", "Inconclusive"].map(r => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Notes (optional)"
                value={dtNotes}
                onChange={(e) => setDtNotes(e.target.value)}
                className={inputCls}
                style={inputStyle}
              />
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={dtSubmitting}
                  className={primaryBtn}
                  style={primaryBtnStyle}
                >
                  {dtSubmitting ? "Saving..." : "Log Test"}
                </button>
              </div>
            </form>

            <hr className="mb-5" style={{ borderColor: "#EEF2F7" }} />
            <SectionLabel>Test History</SectionLabel>

            {/* Drug test list */}
            {drugTests.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "#94A3B8" }}>No drug tests logged yet.</p>
            ) : (
              <div className="space-y-2">
                {drugTests.map((dt) => (
                  <div key={dt.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border" style={{ borderColor: "#EEF2F7" }}>
                    <span className="text-sm font-medium" style={{ color: "#0B1F3A" }}>{fmtDate(dt.test_date)}</span>
                    <ResultBadge result={dt.result} />
                    {dt.notes && (
                      <span className="text-xs flex-1 text-right truncate" style={{ color: "#64748B" }}>{dt.notes}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ CHORES TAB ════════════════════════════════════════════════ */}
        {activeTab === "chores" && (
          <div>
            {/* Add new chore form */}
            <SectionLabel>Add Chore</SectionLabel>
            <form onSubmit={submitChore} className="flex gap-2 mb-6 flex-wrap">
              <input
                type="text"
                placeholder="Chore title"
                value={choreTitle}
                onChange={(e) => setChoreTitle(e.target.value)}
                className={`${inputCls} flex-1 min-w-[160px]`}
                style={inputStyle}
                required
              />
              <select
                value={choreCadence}
                onChange={(e) => setChoreCadence(e.target.value)}
                className={`${inputCls} w-36`}
                style={inputStyle}
              >
                {["Daily", "Weekly", "One-time"].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={choreSubmitting}
                className={primaryBtn}
                style={primaryBtnStyle}
              >
                {choreSubmitting ? "Adding..." : "Add"}
              </button>
            </form>

            <hr className="mb-5" style={{ borderColor: "#EEF2F7" }} />
            <SectionLabel>Chore List</SectionLabel>

            {/* Chores list */}
            {chores.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "#94A3B8" }}>No chores assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {chores.map((chore) => (
                  <div key={chore.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "#EEF2F7" }}>
                    <input
                      type="checkbox"
                      checked={chore.status === "Done"}
                      onChange={() => toggleChore(chore)}
                      className="w-4 h-4 rounded cursor-pointer accent-sky-600"
                    />
                    <span
                      className={`text-sm font-medium flex-1 ${chore.status === "Done" ? "line-through text-gray-400" : ""}`}
                      style={chore.status !== "Done" ? { color: "#0B1F3A" } : {}}
                    >
                      {chore.title}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100" style={{ color: "#64748B" }}>
                      {chore.cadence}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ NOTES TAB ════════════════════════════════════════════════ */}
        {activeTab === "notes" && (
          <div>
            {/* Add new note form */}
            <SectionLabel>Add Note</SectionLabel>
            <form onSubmit={submitNote} className="space-y-3 mb-6">
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                className={inputCls}
                style={inputStyle}
              >
                {["Note", "Incident", "Relapse"].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <textarea
                placeholder="Write your note here..."
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={3}
                className={`${inputCls} resize-none`}
                style={inputStyle}
                required
              />
              <button
                type="submit"
                disabled={noteSubmitting}
                className={primaryBtn}
                style={primaryBtnStyle}
              >
                {noteSubmitting ? "Saving..." : "Add Note"}
              </button>
            </form>

            <hr className="mb-5" style={{ borderColor: "#EEF2F7" }} />
            <SectionLabel>Timeline</SectionLabel>

            {/* Notes timeline list (newest first) */}
            {notes.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "#94A3B8" }}>No notes yet.</p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="p-4 rounded-xl border" style={{ borderColor: "#EEF2F7", background: "#FAFBFC" }}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <NoteTypeBadge type={note.type} />
                      <span className="text-xs" style={{ color: "#94A3B8" }}>
                        {new Date(note.created_at).toLocaleString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                          hour: "numeric", minute: "2-digit"
                        })}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "#334155" }}>{note.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ MEDICATIONS TAB ══════════════════════════════════════════ */}
        {activeTab === "medications" && (
          <div>
            {/* Add new medication form */}
            <SectionLabel>Add Medication</SectionLabel>
            <form onSubmit={submitMedication} className="space-y-3 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Medication name *"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                  required
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g. 10mg)"
                  value={medDosage}
                  onChange={(e) => setMedDosage(e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Frequency (e.g. Twice daily)"
                  value={medFrequency}
                  onChange={(e) => setMedFrequency(e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Prescriber"
                  value={medPrescriber}
                  onChange={(e) => setMedPrescriber(e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                disabled={medSubmitting}
                className={primaryBtn}
                style={primaryBtnStyle}
              >
                {medSubmitting ? "Saving..." : "Add Medication"}
              </button>
            </form>

            <hr className="mb-5" style={{ borderColor: "#EEF2F7" }} />
            <SectionLabel>Current Medications</SectionLabel>

            {/* Medications list */}
            {medications.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "#94A3B8" }}>No medications on file.</p>
            ) : (
              <div className="space-y-3">
                {medications.map((med) => (
                  <div key={med.id} className="p-4 rounded-xl border" style={{ borderColor: "#EEF2F7" }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: "#0B1F3A" }}>{med.name}</p>
                    <div className="flex flex-wrap gap-3">
                      {med.dosage && (
                        <span className="text-xs" style={{ color: "#64748B" }}>
                          <span className="font-medium">Dosage:</span> {med.dosage}
                        </span>
                      )}
                      {med.frequency && (
                        <span className="text-xs" style={{ color: "#64748B" }}>
                          <span className="font-medium">Frequency:</span> {med.frequency}
                        </span>
                      )}
                      {med.prescriber && (
                        <span className="text-xs" style={{ color: "#64748B" }}>
                          <span className="font-medium">Prescriber:</span> {med.prescriber}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ WEEKLY MEETINGS TAB ══════════════════════════════════════ */}
        {activeTab === "meetings" && (
          <div>
            {/* Log new meeting note form */}
            <SectionLabel>Log Meeting Notes</SectionLabel>
            <form onSubmit={submitMeeting} className="space-y-3 mb-6">
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className={inputCls}
                style={inputStyle}
                required
              />
              <textarea
                placeholder="What was discussed in this week's meeting? (progress, concerns, goals...)"
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                rows={4}
                className={`${inputCls} resize-none`}
                style={inputStyle}
                required
              />
              <button
                type="submit"
                disabled={meetingSubmitting}
                className={primaryBtn}
                style={primaryBtnStyle}
              >
                {meetingSubmitting ? "Saving..." : "Save Meeting Notes"}
              </button>
            </form>

            <hr className="mb-5" style={{ borderColor: "#EEF2F7" }} />
            <SectionLabel>Meeting History</SectionLabel>

            {/* Meeting history list */}
            {meetings.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "#94A3B8" }}>No meeting notes logged yet.</p>
            ) : (
              <div className="space-y-3">
                {meetings.map((m) => (
                  <div key={m.id} className="p-4 rounded-xl border" style={{ borderColor: "#EEF2F7", background: "#FAFBFC" }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: "#0284C7" }}>
                      {fmtDate(m.meeting_date)}
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#334155" }}>{m.notes}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ RESTRICTIONS TAB ══════════════════════════════════════════ */}
        {activeTab === "restrictions" && (
          <div>
            {/* Add new restriction form */}
            <SectionLabel>Add Restriction</SectionLabel>
            <form onSubmit={submitRestriction} className="space-y-3 mb-6">
              <input
                type="text"
                placeholder="Restriction title (e.g. No overnight passes)"
                value={restrictionTitle}
                onChange={(e) => setRestrictionTitle(e.target.value)}
                className={inputCls}
                style={inputStyle}
                required
              />
              <textarea
                placeholder="Details or reason (optional)"
                value={restrictionNotes}
                onChange={(e) => setRestrictionNotes(e.target.value)}
                rows={2}
                className={`${inputCls} resize-none`}
                style={inputStyle}
              />
              <button
                type="submit"
                disabled={restrictionSubmitting}
                className={primaryBtn}
                style={primaryBtnStyle}
              >
                {restrictionSubmitting ? "Adding..." : "Add Restriction"}
              </button>
            </form>

            <hr className="mb-5" style={{ borderColor: "#EEF2F7" }} />
            <SectionLabel>Active Restrictions</SectionLabel>

            {/* Restrictions list */}
            {restrictions.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "#94A3B8" }}>No restrictions on file.</p>
            ) : (
              <div className="space-y-2">
                {/* Active restrictions first */}
                {restrictions.filter(r => r.is_active).map((r) => (
                  <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl border" style={{ borderColor: "#EEF2F7" }}>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: "#0B1F3A" }}>{r.title}</p>
                      {r.notes && (
                        <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{r.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleRestriction(r)}
                      className="text-xs px-2 py-1 rounded-lg border font-medium transition hover:bg-gray-50 flex-shrink-0"
                      style={{ borderColor: "#DDE4ED", color: "#64748B" }}
                    >
                      Lift
                    </button>
                  </div>
                ))}

                {/* Lifted restrictions section */}
                {restrictions.some(r => !r.is_active) && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-widest mt-4 mb-2" style={{ color: "#CBD5E1" }}>
                      Lifted
                    </p>
                    {restrictions.filter(r => !r.is_active).map((r) => (
                      <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl border opacity-50" style={{ borderColor: "#EEF2F7" }}>
                        <div className="flex-1">
                          <p className="text-sm font-medium line-through" style={{ color: "#94A3B8" }}>{r.title}</p>
                          {r.notes && (
                            <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{r.notes}</p>
                          )}
                        </div>
                        <button
                          onClick={() => toggleRestriction(r)}
                          className="text-xs px-2 py-1 rounded-lg border font-medium transition hover:bg-gray-50 flex-shrink-0"
                          style={{ borderColor: "#DDE4ED", color: "#64748B" }}
                        >
                          Reinstate
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
