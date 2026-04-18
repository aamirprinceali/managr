"use client";
// Messages page — owner sends messages to house managers, views history
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, Phone, MessageCircle, Send, Building2, UserCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

type Manager = {
  homeId: string; homeName: string; managerName: string | null;
  email: string | null; phone: string | null;
};

type Message = {
  id: string; from_name: string; to_home_id: string; home_name?: string;
  subject: string | null; body: string; is_read: boolean; created_at: string;
};

export default function MessagesPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesAvailable, setMessagesAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ subject: "", body: "", from_name: "Mike" });

  const supabase = createClient();
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: homes } = await supabase
      .from("homes").select("id, name, house_manager_name, house_manager_email, manager_phone").order("name");

    if (homes) {
      setManagers((homes as {
        id: string; name: string; house_manager_name: string | null;
        house_manager_email: string | null; manager_phone: string | null;
      }[]).map(h => ({
        homeId: h.id, homeName: h.name, managerName: h.house_manager_name,
        email: h.house_manager_email, phone: h.manager_phone,
      })));
    }

    const { data: msgData, error } = await supabase
      .from("messages").select("*").order("created_at", { ascending: false }).limit(20);

    if (error) {
      setMessagesAvailable(false);
    } else if (msgData && homes) {
      const nameMap: Record<string, string> = {};
      (homes as { id: string; name: string }[]).forEach(h => { nameMap[h.id] = h.name; });
      setMessages(
        (msgData as Message[]).map(m => ({
          ...m, home_name: m.to_home_id ? (nameMap[m.to_home_id] ?? "Unknown") : "All Homes",
        }))
      );
    }
    setLoading(false);
  }

  function openCompose(manager: Manager) {
    setSelectedManager(manager);
    setForm({ subject: "", body: "", from_name: "Mike" });
    setSent(false);
    setComposeOpen(true);
  }

  async function sendInternal(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedManager) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      from_name: form.from_name, to_home_id: selectedManager.homeId,
      subject: form.subject || null, body: form.body, is_read: false,
    });
    if (!error) { setSent(true); loadData(); }
    setSending(false);
  }

  async function markRead(id: string) {
    await supabase.from("messages").update({ is_read: true }).eq("id", id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
  }

  const unreadCount = messages.filter(m => !m.is_read).length;

  const inputStyle = { background: "#131929", border: "1px solid rgba(255,255,255,0.08)", color: "#F1F5F9" };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "#F1F5F9" }}>Messages</h1>
        <p className="text-sm mt-0.5" style={{ color: "#475569" }}>Contact house managers by email, phone, or internal message</p>
      </div>

      {/* Setup notice */}
      <div className="rounded-xl p-3.5 mb-5 flex items-start gap-2.5" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>
        <AlertTriangle size={14} style={{ color: "#60A5FA", flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="text-xs font-semibold" style={{ color: "#60A5FA" }}>To add email/phone to managers</p>
          <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
            Go to any home → edit → fill in Manager Email and Manager Phone.
            Requires the new columns in Supabase —{" "}
            <Link href="/seed" className="underline" style={{ color: "#60A5FA" }}>see Setup page</Link>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* House Managers Directory */}
        <div className="space-y-3">
          <p className="card-label">House Managers</p>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="rounded-xl h-24 animate-pulse" style={{ background: "#0F1523" }} />)}
            </div>
          ) : managers.length === 0 ? (
            <div className="dash-card p-8 text-center">
              <p className="text-sm" style={{ color: "#334155" }}>No homes added yet</p>
              <Link href="/homes" className="text-xs mt-1 block" style={{ color: "#3B82F6" }}>Add a home →</Link>
            </div>
          ) : (
            managers.map(m => (
              <div key={m.homeId} className="dash-card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Building2 size={12} style={{ color: "#3B82F6" }} />
                      <p className="text-sm font-medium" style={{ color: "#F1F5F9" }}>{m.homeName}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserCircle size={11} style={{ color: "#334155" }} />
                      <p className="text-xs" style={{ color: m.managerName ? "#94A3B8" : "#334155" }}>
                        {m.managerName ?? "No manager assigned"}
                      </p>
                    </div>
                  </div>
                  {messagesAvailable && (
                    <button
                      onClick={() => openCompose(m)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: "#131929", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.06)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#F1F5F9"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}
                    >
                      <MessageCircle size={12} />
                      Message
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {m.email ? (
                    <a
                      href={`mailto:${m.email}?subject=Re: ${m.homeName}`}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                      style={{ color: "#60A5FA", border: "1px solid rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.06)" }}
                    >
                      <Mail size={11} />
                      {m.email}
                    </a>
                  ) : (
                    <span className="text-xs px-3 py-1.5 rounded-lg" style={{ color: "#1E293B", background: "#131929", border: "1px solid rgba(255,255,255,0.04)" }}>
                      No email on file
                    </span>
                  )}
                  {m.phone && (
                    <a
                      href={`tel:${m.phone}`}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                      style={{ color: "#4ADE80", border: "1px solid rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.06)" }}
                    >
                      <Phone size={11} />
                      {m.phone}
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Compose + Message history */}
        <div className="space-y-3">
          {/* Compose panel */}
          {composeOpen && selectedManager && (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(59,130,246,0.3)", background: "#0F1523" }}>
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(59,130,246,0.06)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#F1F5F9" }}>
                    Message to {selectedManager.managerName ?? selectedManager.homeName}
                  </p>
                  <p className="text-xs" style={{ color: "#334155" }}>{selectedManager.homeName}</p>
                </div>
                <button onClick={() => setComposeOpen(false)} className="text-xs" style={{ color: "#334155" }}>✕</button>
              </div>
              {sent ? (
                <div className="px-5 py-6 text-center">
                  <p className="font-medium text-sm" style={{ color: "#4ADE80" }}>Message sent!</p>
                  <button onClick={() => setComposeOpen(false)} className="text-xs mt-2 underline" style={{ color: "#3B82F6" }}>Close</button>
                </div>
              ) : (
                <form onSubmit={sendInternal} className="p-5 space-y-3">
                  <div className="space-y-1.5">
                    <Label style={{ color: "#94A3B8" }}>From</Label>
                    <Input value={form.from_name} onChange={e => set("from_name", e.target.value)} placeholder="Your name" required style={inputStyle} />
                  </div>
                  <div className="space-y-1.5">
                    <Label style={{ color: "#94A3B8" }}>Subject</Label>
                    <Input value={form.subject} onChange={e => set("subject", e.target.value)} placeholder="Subject (optional)" style={inputStyle} />
                  </div>
                  <div className="space-y-1.5">
                    <Label style={{ color: "#94A3B8" }}>Message <span className="text-red-400">*</span></Label>
                    <Textarea value={form.body} onChange={e => set("body", e.target.value)} rows={4} placeholder="Write your message..." required style={inputStyle} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1 text-xs" onClick={() => setComposeOpen(false)}
                      style={{ borderColor: "rgba(255,255,255,0.08)", color: "#94A3B8", background: "transparent" }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={sending} className="flex-1 text-xs font-semibold gap-1.5"
                      style={{ background: "#3B82F6", color: "white" }}>
                      <Send size={13} />
                      {sending ? "Sending..." : "Send"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Message history */}
          <div className="flex items-center gap-2 mt-1">
            <p className="card-label">Message History</p>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#3B82F6", color: "white" }}>
                {unreadCount} new
              </span>
            )}
          </div>

          {!messagesAvailable ? (
            <div className="dash-card p-6 text-center">
              <p className="text-sm font-medium mb-1" style={{ color: "#FCD34D" }}>Messages table not set up</p>
              <p className="text-xs mb-3" style={{ color: "#334155" }}>
                Internal messaging requires the <code className="px-1 rounded" style={{ background: "#131929", color: "#94A3B8" }}>messages</code> table.
              </p>
              <Link href="/seed">
                <Button variant="outline" className="text-xs" style={{ borderColor: "rgba(255,255,255,0.08)", color: "#94A3B8" }}>
                  Go to Setup Page
                </Button>
              </Link>
            </div>
          ) : messages.length === 0 ? (
            <div className="dash-card p-8 text-center">
              <p className="text-sm font-medium" style={{ color: "#334155" }}>No messages yet</p>
              <p className="text-xs mt-0.5" style={{ color: "#1E293B" }}>Send a message to a house manager to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map(m => (
                <div
                  key={m.id}
                  onClick={() => markRead(m.id)}
                  className="rounded-xl px-4 py-3 cursor-pointer row-hover transition-colors"
                  style={{
                    background: m.is_read ? "#0F1523" : "rgba(59,130,246,0.06)",
                    border: `1px solid ${m.is_read ? "rgba(255,255,255,0.06)" : "rgba(59,130,246,0.2)"}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium" style={{ color: "#F1F5F9" }}>
                      {!m.is_read && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 mb-0.5" style={{ background: "#3B82F6" }} />}
                      {m.home_name}
                    </p>
                    <span className="text-[10px]" style={{ color: "#334155" }}>
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {m.subject && <p className="text-xs font-medium mb-0.5" style={{ color: "#94A3B8" }}>{m.subject}</p>}
                  <p className="text-xs line-clamp-2" style={{ color: "#475569" }}>{m.body}</p>
                  <p className="text-[10px] mt-1" style={{ color: "#334155" }}>From: {m.from_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
