"use client";
// Messages page — owner messaging hub
// Email integration works now (mailto links). Internal messaging requires messages table setup.
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, Phone, MessageCircle, Send, Building2, UserCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

type Manager = {
  homeId: string;
  homeName: string;
  managerName: string | null;
  email: string | null;
  phone: string | null;
};

type Message = {
  id: string;
  from_name: string;
  to_home_id: string;
  home_name?: string;
  subject: string | null;
  body: string;
  is_read: boolean;
  created_at: string;
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
    // Load homes with manager contact info
    const { data: homes } = await supabase
      .from("homes")
      .select("id, name, house_manager_name, house_manager_email, manager_phone")
      .order("name");

    if (homes) {
      setManagers((homes as {
        id: string; name: string; house_manager_name: string | null;
        house_manager_email: string | null; manager_phone: string | null;
      }[]).map(h => ({
        homeId: h.id,
        homeName: h.name,
        managerName: h.house_manager_name,
        email: h.house_manager_email,
        phone: h.manager_phone,
      })));
    }

    // Load messages — graceful if table doesn't exist
    const { data: msgData, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      setMessagesAvailable(false);
    } else if (msgData && homes) {
      const nameMap: Record<string, string> = {};
      (homes as { id: string; name: string }[]).forEach(h => { nameMap[h.id] = h.name; });
      setMessages(
        (msgData as Message[]).map(m => ({
          ...m,
          home_name: m.to_home_id ? (nameMap[m.to_home_id] ?? "Unknown") : "All Homes",
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
      from_name: form.from_name,
      to_home_id: selectedManager.homeId,
      subject: form.subject || null,
      body: form.body,
      is_read: false,
    });

    if (!error) {
      setSent(true);
      loadData();
    }
    setSending(false);
  }

  async function markRead(id: string) {
    await supabase.from("messages").update({ is_read: true }).eq("id", id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
  }

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0B1F3A" }}>Messages</h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
          Contact house managers by email, phone, or internal message
        </p>
      </div>

      {/* Setup notice if columns not yet added */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1D4ED8" }}>To add email/phone to managers</p>
            <p className="text-xs mt-0.5" style={{ color: "#3B82F6" }}>
              Go to any home → click the pencil (edit) icon → fill in Manager Email and Manager Phone.
              This requires the new columns to be added in Supabase —{" "}
              <Link href="/seed" className="underline font-semibold">see Setup page</Link>.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* House Managers Directory */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>
            House Managers
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="bg-white border border-gray-100 rounded-xl h-24 animate-pulse" />)}
            </div>
          ) : managers.length === 0 ? (
            <div className="bg-white border rounded-2xl p-8 text-center" style={{ borderColor: "#DDE4ED" }}>
              <p className="text-sm" style={{ color: "#94A3B8" }}>No homes added yet</p>
              <Link href="/homes" className="text-xs mt-1 block" style={{ color: "#0284C7" }}>Add a home →</Link>
            </div>
          ) : (
            managers.map(m => (
              <div key={m.homeId} className="bg-white border rounded-xl p-4" style={{ borderColor: "#DDE4ED" }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Building2 size={13} style={{ color: "#0284C7" }} />
                      <p className="text-sm font-bold" style={{ color: "#0B1F3A" }}>{m.homeName}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserCircle size={12} style={{ color: "#94A3B8" }} />
                      <p className="text-xs" style={{ color: m.managerName ? "#475569" : "#CBD5E1" }}>
                        {m.managerName ?? "No manager assigned"}
                      </p>
                    </div>
                  </div>
                  {/* Internal message button */}
                  {messagesAvailable && (
                    <button
                      onClick={() => openCompose(m)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: "#EEF2F7", color: "#0B1F3A" }}
                    >
                      <MessageCircle size={12} />
                      Message
                    </button>
                  )}
                </div>

                {/* Contact actions */}
                <div className="flex items-center gap-2">
                  {m.email ? (
                    <a
                      href={`mailto:${m.email}?subject=Re: ${m.homeName}`}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-blue-50"
                      style={{ color: "#0284C7", border: "1px solid #BFDBFE" }}
                    >
                      <Mail size={12} />
                      {m.email}
                    </a>
                  ) : (
                    <span className="text-xs px-3 py-1.5 rounded-lg" style={{ color: "#CBD5E1", background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                      No email on file
                    </span>
                  )}
                  {m.phone && (
                    <a
                      href={`tel:${m.phone}`}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-green-50"
                      style={{ color: "#16A34A", border: "1px solid #BBF7D0" }}
                    >
                      <Phone size={12} />
                      {m.phone}
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message inbox / compose */}
        <div className="space-y-3">
          {/* Compose panel */}
          {composeOpen && selectedManager && (
            <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "#0284C7" }}>
              <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#BFDBFE", background: "#EFF6FF" }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: "#0B1F3A" }}>
                    Message to {selectedManager.managerName ?? selectedManager.homeName}
                  </p>
                  <p className="text-xs" style={{ color: "#94A3B8" }}>{selectedManager.homeName}</p>
                </div>
                <button onClick={() => setComposeOpen(false)} className="text-xs" style={{ color: "#94A3B8" }}>✕</button>
              </div>
              {sent ? (
                <div className="px-5 py-6 text-center">
                  <p className="font-semibold text-green-600">Message sent!</p>
                  <button onClick={() => setComposeOpen(false)} className="text-xs mt-2 underline" style={{ color: "#0284C7" }}>Close</button>
                </div>
              ) : (
                <form onSubmit={sendInternal} className="p-5 space-y-3">
                  <div className="space-y-1.5">
                    <Label>From</Label>
                    <Input value={form.from_name} onChange={e => set("from_name", e.target.value)} placeholder="Your name" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Subject</Label>
                    <Input value={form.subject} onChange={e => set("subject", e.target.value)} placeholder="Subject (optional)" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Message <span className="text-red-500">*</span></Label>
                    <Textarea value={form.body} onChange={e => set("body", e.target.value)} rows={4} placeholder="Write your message..." required />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1 text-xs" onClick={() => setComposeOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={sending} className="flex-1 text-xs font-semibold gap-1.5" style={{ background: "#0284C7", color: "white" }}>
                      <Send size={13} />
                      {sending ? "Sending..." : "Send"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Message history */}
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>
            Message History
            {unreadCount > 0 && (
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#0284C7", color: "white" }}>
                {unreadCount} new
              </span>
            )}
          </h2>

          {!messagesAvailable ? (
            <div className="bg-white border border-amber-200 rounded-2xl p-6 text-center">
              <p className="text-sm font-semibold mb-1" style={{ color: "#D97706" }}>Messages table not set up</p>
              <p className="text-xs mb-3" style={{ color: "#94A3B8" }}>
                Internal messaging requires the <code className="bg-gray-100 px-1 rounded">messages</code> table.
              </p>
              <Link href="/seed">
                <Button variant="outline" className="text-xs">Go to Setup Page</Button>
              </Link>
            </div>
          ) : messages.length === 0 ? (
            <div className="bg-white border rounded-2xl p-8 text-center" style={{ borderColor: "#DDE4ED" }}>
              <p className="text-sm font-semibold" style={{ color: "#94A3B8" }}>No messages yet</p>
              <p className="text-xs mt-0.5" style={{ color: "#CBD5E1" }}>Send a message to a house manager to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map(m => (
                <div
                  key={m.id}
                  onClick={() => markRead(m.id)}
                  className="bg-white border rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: m.is_read ? "#DDE4ED" : "#BFDBFE", background: m.is_read ? "white" : "#EFF6FF" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold" style={{ color: "#0B1F3A" }}>
                      {!m.is_read && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 mb-0.5" />}
                      {m.home_name}
                    </p>
                    <span className="text-[10px]" style={{ color: "#94A3B8" }}>
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {m.subject && <p className="text-xs font-semibold mb-0.5" style={{ color: "#475569" }}>{m.subject}</p>}
                  <p className="text-xs line-clamp-2" style={{ color: "#64748B" }}>{m.body}</p>
                  <p className="text-[10px] mt-1" style={{ color: "#94A3B8" }}>From: {m.from_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
