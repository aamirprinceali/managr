"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2, Users, FileText, Settings, BarChart3, ChevronRight,
  Shield, LayoutDashboard, CheckSquare, MessageCircle, Database,
  LogOut, UserCircle, Calendar, Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/components/auth/UserProvider";

type Home = { id: string; name: string };

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user, signOut } = useProfile();
  const [homes, setHomes] = useState<Home[]>([]);
  const onHomesSection = pathname.startsWith("/homes");

  const isOwner = profile?.role === "owner";
  const isManager = profile?.role === "manager";

  useEffect(() => {
    if (onHomesSection) {
      const supabase = createClient();
      let query = supabase.from("homes").select("id, name").order("name");
      if (isManager && profile?.home_id) {
        query = supabase.from("homes").select("id, name").eq("id", profile.home_id);
      }
      query.then(({ data }) => setHomes(data ?? []));
    }
  }, [onHomesSection, isManager, profile?.home_id]);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, ownerOnly: false },
    { href: "/homes", label: isManager ? "My Home" : "Homes", icon: Building2, expandable: true, ownerOnly: false },
    { href: "/residents", label: "All Residents", icon: Users, ownerOnly: true },
    { href: "/tasks", label: "Tasks", icon: CheckSquare, ownerOnly: false },
    { href: "/messages", label: "Messages", icon: MessageCircle, ownerOnly: false },
    { href: "/nightly", label: "Nightly", icon: Moon, ownerOnly: false },
    { href: "/reports", label: "Reports", icon: FileText, ownerOnly: false },
    { href: "/analytics", label: "Analytics", icon: BarChart3, ownerOnly: true },
    { href: "/calendar", label: "Calendar", icon: Calendar, ownerOnly: false },
    { href: "/settings", label: "Settings", icon: Settings, ownerOnly: false },
  ];

  const visibleNav = navItems.filter(item => isOwner || !item.ownerOnly);

  return (
    <aside className="w-56 min-h-screen flex flex-col"
      style={{ background: "#090B14", borderRight: "1px solid rgba(255,255,255,0.05)" }}>

      {/* Logo */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1D4ED8, #3B82F6)" }}>
            <Shield size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight leading-none" style={{ color: "#F1F5F9" }}>Managr</h1>
            <p className="text-[9px] font-medium uppercase tracking-widest mt-0.5" style={{ color: "#1E293B" }}>
              Recovery Housing
            </p>
          </div>
        </div>
      </div>

      {/* User info — like reference's avatar + greeting */}
      {user && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <UserCircle size={15} style={{ color: "#60A5FA" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: "#F1F5F9" }}>
                {profile?.full_name ?? user.email?.split("@")[0]}
              </p>
              <p className="text-[9px] font-medium capitalize" style={{ color: "#334155" }}>
                {profile?.role ?? "..."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="h-px mx-4 mb-2" style={{ background: "rgba(255,255,255,0.04)" }} />

      {/* Main nav */}
      <nav className="flex-1 px-2 py-1 overflow-y-auto">
        {visibleNav.map(({ href, label, icon: Icon, expandable }) => {
          const resolvedHref = (isManager && href === "/homes" && profile?.home_id)
            ? `/homes/${profile.home_id}`
            : href;

          const isActive = pathname === resolvedHref || pathname.startsWith(resolvedHref + "/")
            || (href === "/homes" && pathname.startsWith("/homes"));
          const showHomes = expandable && onHomesSection && homes.length > 0 && isOwner;

          return (
            <div key={href}>
              <Link
                href={resolvedHref}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 mb-0.5 text-sm font-medium"
                )}
                style={isActive
                  ? { background: "#0F1523", color: "#F1F5F9" }
                  : { color: "#334155" }
                }
                onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "#0F1523"; (e.currentTarget as HTMLElement).style.color = "#64748B"; } }}
                onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#334155"; } }}
              >
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2.5 : 2}
                  style={{ color: isActive ? "#3B82F6" : "inherit" }}
                />
                <span className="flex-1 text-sm">{label}</span>
                {expandable && homes.length > 0 && isOwner && (
                  <ChevronRight
                    size={12}
                    className={cn("transition-transform duration-200", onHomesSection && "rotate-90")}
                    style={{ color: "#1E293B" }}
                  />
                )}
              </Link>

              {/* Expandable homes sub-list — owner only */}
              {showHomes && (
                <div className="ml-4 mb-1 border-l pl-3" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  {homes.map(home => {
                    const homeActive = pathname === `/homes/${home.id}` || pathname.startsWith(`/homes/${home.id}/`);
                    return (
                      <Link
                        key={home.id}
                        href={`/homes/${home.id}`}
                        className="block px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 mb-0.5 truncate"
                        style={homeActive ? { background: "#0F1523", color: "#60A5FA" } : { color: "#1E293B" }}
                        onMouseEnter={e => { if (!homeActive) { (e.currentTarget as HTMLElement).style.color = "#475569"; (e.currentTarget as HTMLElement).style.background = "#0F1523"; } }}
                        onMouseLeave={e => { if (!homeActive) { (e.currentTarget as HTMLElement).style.color = "#1E293B"; (e.currentTarget as HTMLElement).style.background = "transparent"; } }}
                      >
                        {home.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom: setup + logout */}
      <div className="px-2 pb-3 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        {isOwner && (
          <Link
            href="/seed"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 text-xs font-medium mb-1"
            style={{ color: pathname === "/seed" ? "#3B82F6" : "#1E293B", background: pathname === "/seed" ? "#0F1523" : "transparent" }}
            onMouseEnter={e => { if (pathname !== "/seed") (e.currentTarget as HTMLElement).style.background = "#0F1523"; }}
            onMouseLeave={e => { if (pathname !== "/seed") (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <Database size={13} strokeWidth={2} />
            Setup & Seed
          </Link>
        )}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 text-xs font-medium"
          style={{ color: "#1E293B" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#0F1523"; (e.currentTarget as HTMLElement).style.color = "#EF4444"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#1E293B"; }}
        >
          <LogOut size={13} strokeWidth={2} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
