"use client";
// Dialog for adding a new home
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  onAdded?: () => void; // optional callback to refresh the parent after adding
};

export default function AddHomeDialog({ onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", notes: "", bed_count: "" });
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("homes").insert({
      name: form.name,
      address: form.address || null,
      notes: form.notes || null,
      bed_count: form.bed_count ? parseInt(form.bed_count) : 0,
    });

    if (!error) {
      setOpen(false);
      setForm({ name: "", address: "", notes: "", bed_count: "" });
      onAdded?.(); // notify parent to reload data
    }

    setLoading(false);
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold shadow-sm"
      >
        <Plus size={16} strokeWidth={2.5} />
        Add Home
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add a New Home</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <Label htmlFor="name">Home Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                placeholder="e.g. Oak House"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Main St, Plano TX"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bed_count">Total Beds / Spots</Label>
              <Input
                id="bed_count"
                type="number"
                min="0"
                placeholder="6"
                value={form.bed_count}
                onChange={e => setForm({ ...form, bed_count: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any notes about this home..."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
              >
                {loading ? "Adding..." : "Add Home"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
