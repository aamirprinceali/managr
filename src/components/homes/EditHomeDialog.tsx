"use client";
// EditHomeDialog — edit all home fields OR delete the home
// Fetches full home record when the dialog opens so it always has fresh data
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  homeId: string;
  homeName: string;
  onUpdated?: () => void;
  onDeleted?: () => void;
};

type HomeData = {
  name: string;
  address: string | null;
  bed_count: number;
  house_manager_name: string | null;
  assistant_manager_name: string | null;
  house_manager_email: string | null;
  manager_phone: string | null;
  notes: string | null;
};

export default function EditHomeDialog({ homeId, homeName, onUpdated, onDeleted }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", address: "", notes: "", bed_count: "0",
    house_manager_name: "", assistant_manager_name: "",
    house_manager_email: "", manager_phone: "",
  });

  const supabase = createClient();
  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  // Fetch full home record when dialog opens
  async function openEdit(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setFetchLoading(true);
    const { data } = await supabase.from("homes").select("*").eq("id", homeId).single();
    if (data) {
      const h = data as HomeData;
      setForm({
        name: h.name ?? "",
        address: h.address ?? "",
        notes: h.notes ?? "",
        bed_count: h.bed_count?.toString() ?? "0",
        house_manager_name: h.house_manager_name ?? "",
        assistant_manager_name: h.assistant_manager_name ?? "",
        house_manager_email: h.house_manager_email ?? "",
        manager_phone: h.manager_phone ?? "",
      });
    }
    setFetchLoading(false);
    setEditOpen(true);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.from("homes").update({
      name: form.name,
      address: form.address || null,
      notes: form.notes || null,
      bed_count: form.bed_count ? parseInt(form.bed_count) : 0,
      house_manager_name: form.house_manager_name || null,
      assistant_manager_name: form.assistant_manager_name || null,
      house_manager_email: form.house_manager_email || null,
      manager_phone: form.manager_phone || null,
    }).eq("id", homeId);
    setEditOpen(false);
    setLoading(false);
    onUpdated?.();
  }

  async function handleDelete() {
    setLoading(true);
    await supabase.from("homes").delete().eq("id", homeId);
    setDeleteOpen(false);
    setLoading(false);
    onDeleted?.();
  }

  return (
    <>
      {/* Pencil button — placed inline wherever this component is used */}
      <button
        onClick={openEdit}
        disabled={fetchLoading}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 hover:bg-slate-100 flex-shrink-0"
        title="Edit home"
        style={{ color: "#94A3B8" }}
      >
        <Pencil size={13} strokeWidth={2} />
      </button>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ color: "#0B1F3A" }}>
              Edit Home
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-1">

            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Home Name <span className="text-red-500">*</span></Label>
              <Input id="edit-name" value={form.name} onChange={e => set("name", e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-address">Address</Label>
              <Input id="edit-address" value={form.address} onChange={e => set("address", e.target.value)} placeholder="123 Main St, Plano TX" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-beds">Total Beds / Spots</Label>
              <Input id="edit-beds" type="number" min="0" value={form.bed_count} onChange={e => set("bed_count", e.target.value)} />
            </div>

            {/* Managers side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-manager">House Manager</Label>
                <Input id="edit-manager" value={form.house_manager_name} onChange={e => set("house_manager_name", e.target.value)} placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-asst">Assistant Manager</Label>
                <Input id="edit-asst" value={form.assistant_manager_name} onChange={e => set("assistant_manager_name", e.target.value)} placeholder="Full name (optional)" />
              </div>
            </div>

            {/* Contact info for messaging */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-email">Manager Email</Label>
                <Input id="edit-email" type="email" value={form.house_manager_email} onChange={e => set("house_manager_email", e.target.value)} placeholder="manager@email.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-phone">Manager Phone</Label>
                <Input id="edit-phone" type="tel" value={form.manager_phone} onChange={e => set("manager_phone", e.target.value)} placeholder="555-555-5555" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea id="edit-notes" value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} placeholder="Any notes about this home..." />
            </div>

            {/* Footer: delete on left, cancel + save on right */}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => { setEditOpen(false); setDeleteOpen(true); }}
              >
                <Trash2 size={14} />
                Delete Home
              </Button>
              <div className="flex-1" />
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="font-semibold" style={{ background: "#0284C7", color: "white" }}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">Delete Home?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800 mb-1">This cannot be undone</p>
                <p className="text-xs text-red-600">
                  Deleting <strong>{homeName}</strong> will permanently remove this home and all its residents, drug tests, chores, notes, and records.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={loading}
                onClick={handleDelete}
                className="flex-1 font-semibold text-white"
                style={{ background: "#DC2626" }}
              >
                {loading ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
