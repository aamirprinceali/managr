"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = { onAdded?: () => void };

export default function AddHomeDialog({ onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", address: "", notes: "",
    bed_count: "", house_manager_name: "", assistant_manager_name: ""
  });
  const supabase = createClient();

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("homes").insert({
      name: form.name,
      address: form.address || null,
      notes: form.notes || null,
      bed_count: form.bed_count ? parseInt(form.bed_count) : 0,
      house_manager_name: form.house_manager_name || null,
      assistant_manager_name: form.assistant_manager_name || null,
    });
    if (!error) {
      setOpen(false);
      setForm({ name: "", address: "", notes: "", bed_count: "", house_manager_name: "", assistant_manager_name: "" });
      onAdded?.();
    }
    setLoading(false);
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 font-semibold shadow-sm"
        style={{ background: "#0284C7", color: "white" }}
      >
        <Plus size={16} strokeWidth={2.5} />
        Add Home
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ color: "#0B1F3A" }}>Add a New Home</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-1">

            {/* Home name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Home Name <span className="text-red-500">*</span></Label>
              <Input id="name" placeholder="e.g. Oak House" value={form.name}
                onChange={e => set("name", e.target.value)} required />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="123 Main St, Plano TX" value={form.address}
                onChange={e => set("address", e.target.value)} />
            </div>

            {/* Beds */}
            <div className="space-y-1.5">
              <Label htmlFor="bed_count">Total Beds / Spots</Label>
              <Input id="bed_count" type="number" min="0" placeholder="6" value={form.bed_count}
                onChange={e => set("bed_count", e.target.value)} />
            </div>

            {/* House manager + assistant — side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="house_manager_name">House Manager</Label>
                <Input id="house_manager_name" placeholder="Full name" value={form.house_manager_name}
                  onChange={e => set("house_manager_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="assistant_manager_name">Assistant Manager</Label>
                <Input id="assistant_manager_name" placeholder="Full name (optional)" value={form.assistant_manager_name}
                  onChange={e => set("assistant_manager_name", e.target.value)} />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Any notes about this home..." value={form.notes}
                onChange={e => set("notes", e.target.value)} rows={2} />
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={loading} className="flex-1 font-semibold"
                style={{ background: "#0284C7", color: "white" }}>
                {loading ? "Adding..." : "Add Home"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
