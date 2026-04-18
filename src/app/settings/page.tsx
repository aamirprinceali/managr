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
  id: string; full_name: string | null; email: string | null;
  role: string; home_id: string | null; home_name: string | null;
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
        ...p, home_name: p.home_id ? (homeMap[p.home_id] ?? null) : null,
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
      body: JSON.stringify({ email: form.email, password: form.password, full_name: form.full_name, home_id: form.home_id || null }),
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
    await supabase.from("profiles").delete().eq("id", id);
    setRemoveId(null);
    loadData();
  }

  if (!isOwner) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-semibold mb-2" style={{ color: "#F1F5F9" }}>Settings</h1>
        <div className="dash-card p-8 text-center">
          <p className="text-sm" style={{ color: "#475569" }}>Settings are only accessible to the owner account.</p>
        </div>
      </div>
    );
  }

  const inputStyle = { background: "#131929", border: "1px solid rgba(255,255,255,0.08)", color: "#F1F5F9" };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "#F1F5F9" }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: "#475569" }}>Manage team members and house manager access</p>
      </div>

      {/* Service role key notice */}
      {serviceKeyMissing && (
        <div className="rounded-2xl p-4 mb-6 flex items-start gap-3" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <Key size={15} style={{ color: "#FCD34D", flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: "#FCD34D" }}>One-time setup needed to invite managers</p>
            <p className="text-xs" style={{ color: "#94A3B8" }}>
              Add <code className="px-1 rounded" style={{ background: "#131929", color: "#FCD34D" }}>SUPABASE_SERVICE_ROLE_KEY</code> to your{" "}
              <code className="px-1 rounded" style={{ background: "#131929", color: "#FCD34D" }}>.env.local</code> file.
              Find it in Supabase → Settings → API → <strong>service_role</strong> (secret key). Then restart the dev server.
            </p>
          </div>
        </div>
      )}

      {/* Team section */}
      <div className="dash-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-2">
            <Users size={15} style={{ color: "#3B82F6" }} />
            <h2 className="font-semibold text-sm" style={{ color: "#F1F5F9" }}>Team Members</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#131929", color: "#475569" }}>
              {managers.length}
            </span>
          </div>
          <Button
            onClick={() => { setInviteOpen(true); setInviteResult(null); }}
            className="gap-2 font-medium h-8 px-3 text-xs"
            style={{ background: "#3B82F6", color: "white" }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Invite Manager
          </Button>
        </div>

        {loading ? (
          <div className="p-5 space-y-2">
            {[1,2].map(i => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "#131929" }} />)}
          </div>
        ) : managers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm" style={{ color: "#334155" }}>No team members yet. Invite your first house manager.</p>
          </div>
        ) : (
          <div>
            {managers.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3.5 row-hover" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <UserCircle size={15} style={{ color: "#60A5FA" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#F1F5F9" }}>
                    {m.full_name ?? m.email ?? "Unknown"}
                    {m.id === profile?.id && (
                      <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.15)", color: "#60A5FA" }}>You</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize"
                      style={m.role === "owner"
                        ? { background: "rgba(245,158,11,0.15)", color: "#FCD34D" }
                        : { background: "rgba(34,197,94,0.15)", color: "#4ADE80" }}>
                      {m.role}
                    </span>
                    {m.home_name && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#334155" }}>
                        <Building2 size={10} />
                        {m.home_name}
                      </span>
                    )}
                    {m.email && <span className="text-xs truncate" style={{ color: "#334155" }}>{m.email}</span>}
                  </div>
                </div>
                {m.id !== profile?.id && (
                  <button
                    onClick={() => setRemoveId(m.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                    style={{ color: "#1E293B" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#F87171"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#1E293B"}
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
        <DialogContent className="sm:max-w-md" style={{ background: "#0F1523", border: "1px solid rgba(255,255,255,0.08)" }}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={{ color: "#F1F5F9" }}>Invite House Manager</DialogTitle>
          </DialogHeader>
          <form onSubmit={inviteManager} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <Label style={{ color: "#94A3B8" }}>Full Name</Label>
              <Input value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Sarah Johnson" style={inputStyle} />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: "#94A3B8" }}>Email <span className="text-red-400">*</span></Label>
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="manager@email.com" required style={inputStyle} />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: "#94A3B8" }}>Temporary Password <span className="text-red-400">*</span></Label>
              <Input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Set a password they can change later" required minLength={6} style={inputStyle} />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: "#94A3B8" }}>Assign to Home</Label>
              <select
                value={form.home_id} onChange={e => set("home_id", e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm outline-none"
                style={{ background: "#131929", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}
              >
                <option value="">Not assigned yet</option>
                {homes.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>

            {inviteResult?.error && (
              <div className="flex items-start gap-2 rounded-xl p-3 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                {inviteResult.error}
              </div>
            )}
            {inviteResult?.success && (
              <div className="flex items-center gap-2 rounded-xl p-3 text-xs" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ADE80" }}>
                <CheckCircle size={14} />
                Manager account created! Share the email and password with them.
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setInviteOpen(false)}
                style={{ borderColor: "rgba(255,255,255,0.08)", color: "#94A3B8", background: "transparent" }}>
                Close
              </Button>
              {!inviteResult?.success && (
                <Button type="submit" disabled={inviteLoading} className="flex-1 font-semibold" style={{ background: "#3B82F6", color: "white" }}>
                  {inviteLoading ? "Creating..." : "Create Account"}
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove confirm dialog */}
      <Dialog open={!!removeId} onOpenChange={() => setRemoveId(null)}>
        <DialogContent className="sm:max-w-sm" style={{ background: "#0F1523", border: "1px solid rgba(255,255,255,0.08)" }}>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold" style={{ color: "#F87171" }}>Remove Team Member?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            <p className="text-sm" style={{ color: "#94A3B8" }}>
              This removes their access to Managr. Their login credentials will stop working.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setRemoveId(null)}
                style={{ borderColor: "rgba(255,255,255,0.08)", color: "#94A3B8", background: "transparent" }}>
                Cancel
              </Button>
              <Button className="flex-1 font-semibold" style={{ background: "#EF4444", color: "white" }}
                onClick={() => removeId && removeManager(removeId)}>
                Remove
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
