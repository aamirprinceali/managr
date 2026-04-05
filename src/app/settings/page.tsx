"use client";
// Settings — Team management, invite managers, assign them to homes
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/components/auth/UserProvider";
import { Users, Plus, Trash2, Building2, UserCircle, AlertTriangle, CheckCircle, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Manager = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  home_id: string | null;
  home_name: string | null;
};

type Home = { id: string; name: string };

export default function SettingsPage() {
  const { profile } = useProfile();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [serviceKeyMissing, setServiceKeyMissing] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", home_id: "" });

  const supabase = createClient();
  const isOwner = profile?.role === "owner";
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [{ data: profiles }, { data: homesData }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at"),
      supabase.from("homes").select("id, name").order("name"),
    ]);

    const homeMap: Record<string, string> = {};
    (homesData ?? []).forEach((h: Home) => { homeMap[h.id] = h.name; });
    setHomes(homesData ?? []);

    setManagers(
      (profiles ?? []).map((p: { id: string; full_name: string | null; email: string | null; role: string; home_id: string | null }) => ({
        ...p,
        home_name: p.home_id ? (homeMap[p.home_id] ?? null) : null,
      }))
    );
    setLoading(false);
  }

  async function inviteManager(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteResult(null);

    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        home_id: form.home_id || null,
      }),
    });

    const data = await res.json();

    if (data.error) {
      if (data.error.includes("SUPABASE_SERVICE_ROLE_KEY")) setServiceKeyMissing(true);
      setInviteResult({ error: data.error });
    } else {
      setInviteResult({ success: true });
      setForm({ full_name: "", email: "", password: "", home_id: "" });
      loadData();
    }
    setInviteLoading(false);
  }

  async function removeManager(id: string) {
    // Remove profile (auth user stays, just loses their profile)
    await supabase.from("profiles").delete().eq("id", id);
    setRemoveId(null);
    loadData();
  }

  if (!isOwner) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2" style={{ color: "#0B1F3A" }}>Settings</h1>
        <div className="bg-white border rounded-2xl p-8 text-center" style={{ borderColor: "#DDE4ED" }}>
          <p className="text-sm" style={{ color: "#64748B" }}>Settings are only accessible to the owner account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0B1F3A" }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Manage team members and house manager access</p>
      </div>

      {/* Service role key notice */}
      {serviceKeyMissing && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <Key size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800 mb-1">One-time setup needed to invite managers</p>
            <p className="text-xs text-amber-700">
              Add <code className="bg-amber-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> to your <code className="bg-amber-100 px-1 rounded">.env.local</code> file.
              Find it in Supabase → Settings → API → <strong>service_role</strong> (secret key). Then restart the dev server.
            </p>
          </div>
        </div>
      )}

      {/* Team section */}
      <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "#DDE4ED" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
          <div className="flex items-center gap-2">
            <Users size={16} style={{ color: "#0284C7" }} />
            <h2 className="font-bold text-sm" style={{ color: "#0B1F3A" }}>Team Members</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#EEF2F7", color: "#64748B" }}>
              {managers.length}
            </span>
          </div>
          <Button
            onClick={() => { setInviteOpen(true); setInviteResult(null); }}
            className="gap-2 font-semibold h-8 px-3 text-xs"
            style={{ background: "#0284C7", color: "white" }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Invite Manager
          </Button>
        </div>

        {loading ? (
          <div className="p-5 space-y-2">
            {[1,2].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : managers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm" style={{ color: "#94A3B8" }}>No team members yet. Invite your first house manager.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
            {managers.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#EEF2F7" }}>
                  <UserCircle size={16} style={{ color: "#0284C7" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#0B1F3A" }}>
                    {m.full_name ?? m.email ?? "Unknown"}
                    {m.id === profile?.id && (
                      <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#DBEAFE", color: "#1D4ED8" }}>You</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize" style={{
                      background: m.role === "owner" ? "#FEF3C7" : "#DCFCE7",
                      color: m.role === "owner" ? "#D97706" : "#16A34A",
                    }}>
                      {m.role}
                    </span>
                    {m.home_name && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#94A3B8" }}>
                        <Building2 size={10} />
                        {m.home_name}
                      </span>
                    )}
                    {m.email && <span className="text-xs truncate" style={{ color: "#94A3B8" }}>{m.email}</span>}
                  </div>
                </div>
                {m.id !== profile?.id && (
                  <button
                    onClick={() => setRemoveId(m.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50 flex-shrink-0"
                    style={{ color: "#CBD5E1" }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ color: "#0B1F3A" }}>Invite House Manager</DialogTitle>
          </DialogHeader>
          <form onSubmit={inviteManager} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Sarah Johnson" />
            </div>
            <div className="space-y-1.5">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="manager@email.com" required />
            </div>
            <div className="space-y-1.5">
              <Label>Temporary Password <span className="text-red-500">*</span></Label>
              <Input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Set a password they can change later" required minLength={6} />
            </div>
            <div className="space-y-1.5">
              <Label>Assign to Home</Label>
              <select
                value={form.home_id}
                onChange={e => set("home_id", e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm outline-none"
                style={{ borderColor: "#DDE4ED" }}
              >
                <option value="">Not assigned yet</option>
                {homes.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>

            {inviteResult?.error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                {inviteResult.error}
              </div>
            )}
            {inviteResult?.success && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700">
                <CheckCircle size={14} />
                Manager account created! Share the email and password with them.
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setInviteOpen(false)}>Close</Button>
              {!inviteResult?.success && (
                <Button type="submit" disabled={inviteLoading} className="flex-1 font-semibold" style={{ background: "#0284C7", color: "white" }}>
                  {inviteLoading ? "Creating..." : "Create Account"}
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove confirm dialog */}
      <Dialog open={!!removeId} onOpenChange={() => setRemoveId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600">Remove Team Member?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            <p className="text-sm" style={{ color: "#64748B" }}>
              This removes their access to Managr. Their login credentials will stop working.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setRemoveId(null)}>Cancel</Button>
              <Button className="flex-1 font-semibold text-white" style={{ background: "#DC2626" }} onClick={() => removeId && removeManager(removeId)}>
                Remove
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
