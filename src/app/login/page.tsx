"use client";
// Login page — shown to anyone who isn't logged in
// Toggle between Sign In and Create Account (first account = owner)
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); setLoading(false); return; }
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) { setError(error.message); setLoading(false); return; }
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Can't reach the server. Your Supabase project may be paused — check app.supabase.com and click Resume.");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#F0F2F5" }}
    >
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, #1B6EF3, #1452C8)" }}
          >
            <Shield size={26} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F172A" }}>Managr</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>Recovery Housing Operations</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-sm">
          {/* Mode toggle */}
          <div className="flex rounded-xl p-1 mb-6 bg-slate-100 border border-slate-200">
            {(["signin", "signup"] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
                style={mode === m
                  ? { background: "#FFFFFF", color: "#0F172A", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                  : { color: "#94A3B8" }
                }
              >
                {m === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#94A3B8" }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm rounded-lg px-3 py-2"
                style={{ color: "#DC2626", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-3"
              style={{ background: "#1B6EF3", color: "white" }}
            >
              {loading
                ? "Please wait..."
                : mode === "signin" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          {mode === "signup" && (
            <p className="text-xs text-center mt-4" style={{ color: "#64748B" }}>
              The first account created becomes the owner account.
            </p>
          )}
        </div>

        <p className="text-center text-xs mt-4" style={{ color: "#CBD5E1" }}>
          Managr · Recovery Housing Management
        </p>
      </div>
    </div>
  );
}
