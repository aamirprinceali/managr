"use client";
// UserProvider — wraps the whole app and makes the current user + their role available everywhere
// Usage anywhere in the app: const { profile, user, signOut } = useProfile()
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export type UserRole = "owner" | "manager";

export type Profile = {
  id: string;
  role: UserRole;
  home_id: string | null;   // Which home this manager is responsible for (null = owner)
  full_name: string | null;
  email: string | null;
};

type UserContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const UserContext = createContext<UserContextValue>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

// Hook — use this anywhere to get current user and their role
export function useProfile() {
  return useContext(UserContext);
}

// ✅ DEV BYPASS — fake owner profile so all pages render without Supabase auth
// To restore real auth: comment out this component and uncomment the real one below
export default function UserProvider({ children }: { children: ReactNode }) {
  const fakeProfile: Profile = {
    id: "dev-user",
    role: "owner",
    home_id: null,
    full_name: "Mike (Dev Mode)",
    email: "mike@lighthouse.com",
  };

  const signOut = async () => { window.location.href = "/login"; };

  return (
    <UserContext.Provider value={{ user: null, profile: fakeProfile, loading: false, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

/* 🔒 REAL AUTH PROVIDER — uncomment when ready to go live
export default function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchOrCreateProfile(user.id, user.email ?? "");
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchOrCreateProfile(currentUser.id, currentUser.email ?? "");
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchOrCreateProfile(userId: string, email: string) {
    const { data: existing } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (existing) { setProfile(existing as Profile); setLoading(false); return; }
    const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    const role: UserRole = (count === 0) ? "owner" : "manager";
    const { data: newProfile } = await supabase.from("profiles").insert({ id: userId, role, email }).select().single();
    setProfile(newProfile as Profile ?? null);
    setLoading(false);
  }

  async function signOut() { await supabase.auth.signOut(); }

  return (
    <UserContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </UserContext.Provider>
  );
}
*/
