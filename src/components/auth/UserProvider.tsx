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

export default function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    // Get the user on first load
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchOrCreateProfile(user.id, user.email ?? "");
      else setLoading(false);
    });

    // Listen for login/logout events
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
    // Try to get existing profile
    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (existing) {
      setProfile(existing as Profile);
      setLoading(false);
      return;
    }

    // No profile yet — first user gets 'owner', everyone else gets 'manager'
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const role: UserRole = (count === 0) ? "owner" : "manager";

    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({ id: userId, role, email })
      .select()
      .single();

    setProfile(newProfile as Profile ?? null);
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <UserContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </UserContext.Provider>
  );
}
