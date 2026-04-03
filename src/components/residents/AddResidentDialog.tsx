"use client";
// AddResidentDialog — full form to add a new resident to a specific home
// Opens as a scrollable dialog with fields grouped into logical sections

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Props — homeId tells us which home to add the resident to
// onAdded is called after a successful insert so the parent can refresh
type Props = {
  homeId: string;
  onAdded?: () => void;
};

// Today's date formatted as YYYY-MM-DD for the intake date default
function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function AddResidentDialog({ homeId, onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // All form fields — grouped by section for readability
  const [form, setForm] = useState({
    // Basic Info
    full_name: "",
    phone: "",
    dob: "",
    // Intake
    move_in_date: todayISO(),
    sobriety_date: "",
    drug_of_choice: "",
    status: "Active",
    flag: "Green",
    risk_level: "Low",
    room_number: "",
    // Contacts
    emergency_contact_name: "",
    emergency_contact_phone: "",
    sponsor_name: "",
    case_manager_name: "",
    // Notes
    notes: "",
  });

  const supabase = createClient();

  // Helper to update a single form field
  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  // Helper for Select fields — Base UI Select returns string | null, so we guard against null
  const setSelect = (field: string, value: string | null) => {
    if (value !== null) setForm((f) => ({ ...f, [field]: value }));
  };

  // Reset form back to defaults
  function resetForm() {
    setForm({
      full_name: "",
      phone: "",
      dob: "",
      move_in_date: todayISO(),
      sobriety_date: "",
      drug_of_choice: "",
      status: "Active",
      flag: "Green",
      risk_level: "Low",
      room_number: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      sponsor_name: "",
      case_manager_name: "",
      notes: "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Insert the new resident into Supabase
    const { error } = await supabase.from("residents").insert({
      home_id: homeId,
      full_name: form.full_name,
      phone: form.phone || null,
      dob: form.dob || null,
      move_in_date: form.move_in_date || null,
      sobriety_date: form.sobriety_date || null,
      drug_of_choice: form.drug_of_choice || null,
      status: form.status,
      flag: form.flag,
      risk_level: form.risk_level,
      room_number: form.room_number || null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      sponsor_name: form.sponsor_name || null,
      case_manager_name: form.case_manager_name || null,
      notes: form.notes || null,
      is_archived: false,
      points: 0,
    });

    if (!error) {
      setOpen(false);
      resetForm();
      onAdded?.();
    } else {
      setError(error.message);
    }

    setLoading(false);
  }

  // Small section label used above each group of fields
  function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
      <p className="text-xs font-bold uppercase tracking-widest mt-5 mb-3" style={{ color: "#94A3B8" }}>
        {children}
      </p>
    );
  }

  return (
    <>
      {/* Trigger button — sky blue to match app accent */}
      <Button
        onClick={() => setOpen(true)}
        style={{ background: "#0284C7", color: "white" }}
        className="gap-2 font-semibold text-sm"
      >
        <UserPlus size={16} strokeWidth={2.5} />
        Add Resident
      </Button>

      {/* Dialog — max height with scroll so long forms don't overflow the screen */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ color: "#0B1F3A" }}>
              Add New Resident
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-1 pb-2">

            {/* ── BASIC INFO ──────────────────────────── */}
            <SectionLabel>Basic Info</SectionLabel>

            {/* Full name — required */}
            <div className="space-y-1.5 mb-3">
              <Label htmlFor="full_name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                placeholder="e.g. John Smith"
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                required
              />
            </div>

            {/* Phone + DOB side by side */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={form.dob}
                  onChange={(e) => set("dob", e.target.value)}
                />
              </div>
            </div>

            {/* ── INTAKE ──────────────────────────────── */}
            <SectionLabel>Intake</SectionLabel>

            {/* Intake date + Sobriety date side by side */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1.5">
                <Label htmlFor="move_in_date">Intake Date</Label>
                <Input
                  id="move_in_date"
                  type="date"
                  value={form.move_in_date}
                  onChange={(e) => set("move_in_date", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sobriety_date">Sobriety Date</Label>
                <Input
                  id="sobriety_date"
                  type="date"
                  value={form.sobriety_date}
                  onChange={(e) => set("sobriety_date", e.target.value)}
                />
              </div>
            </div>

            {/* Drug of choice + Room number side by side */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1.5">
                <Label htmlFor="drug_of_choice">Drug of Choice</Label>
                <Input
                  id="drug_of_choice"
                  placeholder="e.g. Alcohol, Opioids"
                  value={form.drug_of_choice}
                  onChange={(e) => set("drug_of_choice", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="room_number">Room Number</Label>
                <Input
                  id="room_number"
                  placeholder="e.g. Room 1, Room B"
                  value={form.room_number}
                  onChange={(e) => set("room_number", e.target.value)}
                />
              </div>
            </div>

            {/* Status, Flag, Risk Level — three dropdowns in a row */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              {/* Status */}
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setSelect("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Pass">On Pass</SelectItem>
                    <SelectItem value="Discharged">Discharged</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Flag */}
              <div className="space-y-1.5">
                <Label>Flag</Label>
                <Select value={form.flag} onValueChange={(v) => setSelect("flag", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Green">Green</SelectItem>
                    <SelectItem value="Yellow">Yellow</SelectItem>
                    <SelectItem value="Red">Red</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Risk Level */}
              <div className="space-y-1.5">
                <Label>Risk Level</Label>
                <Select value={form.risk_level} onValueChange={(v) => setSelect("risk_level", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── CONTACTS ────────────────────────────── */}
            <SectionLabel>Contacts</SectionLabel>

            {/* Emergency contact name + phone */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1.5">
                <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  placeholder="Full name"
                  value={form.emergency_contact_name}
                  onChange={(e) => set("emergency_contact_name", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={form.emergency_contact_phone}
                  onChange={(e) => set("emergency_contact_phone", e.target.value)}
                />
              </div>
            </div>

            {/* Sponsor + Case manager side by side */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1.5">
                <Label htmlFor="sponsor_name">Sponsor Name</Label>
                <Input
                  id="sponsor_name"
                  placeholder="Full name"
                  value={form.sponsor_name}
                  onChange={(e) => set("sponsor_name", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="case_manager_name">Case Manager Name</Label>
                <Input
                  id="case_manager_name"
                  placeholder="Full name"
                  value={form.case_manager_name}
                  onChange={(e) => set("case_manager_name", e.target.value)}
                />
              </div>
            </div>

            {/* ── NOTES ───────────────────────────────── */}
            <SectionLabel>Notes</SectionLabel>

            <div className="space-y-1.5 mb-5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any notes about this resident..."
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={3}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                <p className="text-sm text-red-700 font-medium">Could not add resident</p>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 font-semibold"
                style={{ background: "#0284C7", color: "white" }}
              >
                {loading ? "Adding..." : "Add Resident"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
