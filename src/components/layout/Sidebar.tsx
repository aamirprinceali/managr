"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2, Users, FileText, Settings, BarChart3, ChevronRight,
  Shield, LayoutDashboard, CheckSquare, MessageCircle, Database,
  LogOut, UserCircle, Calendar,
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
      // Managers only see their own home in the sub-list
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

  // Nav items — some are owner-only
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, ownerOnly: false },
    { href: "/homes", label: isManager ? "My Home" : "Homes", icon: Building2, expandable: true, ownerOnly: false },
    { href: "/residents", label: "All Residents", icon: Users, ownerOnly: true },
    { href: "/tasks", label: "Tasks", icon: CheckSquare, ownerOnly: false },
    { href: "/messages", label: "Messages", icon: MessageCircle, ownerOnly: false },
    { href: "/reports", label: "Reports", icon: FileText, ownerOnly: false },
    { href: "/analytics", label: "Analytics", icon: BarChart3, ownerOnly: true },
    { href: "/calendar", label: "Calendar", icon: Calendar, ownerOnly: false },
    { href: "/settings", label: "Settings", icon: Settings, ownerOnly: false },
  ];

  const visibleNav = navItems.filter(item => isOwner || !item.ownerOnly);

  return (
    <aside className="w-56 min-h-screen flex flex-col border-r" style={{ background: "#0B1F3A", borderColor: "#132D50" }}>
      {/* Logo */}
      <div className="px-4 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#0284C7" }}>
            <Shield size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-white font-bold text-base tracking-tight leading-none">Managr</h1>
            <p className="text-[10px] font-medium uppercase tracking-widest mt-0.5" style={{ color: "#4A7FA8" }}>Recovery Housing</p>
          </div>
        </div>
      </div>

      {/* User info bar */}
      {user && (
        <div className="mx-3 mb-2 rounded-xl px-3 py-2.5" style={{ background: "#132D50" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#0284C7" }}>
              <UserCircle size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {profile?.full_name ?? user.email?.split("@")[0]}
              </p>
              <p className="text-[10px] font-medium capitalize" style={{ color: "#4A7FA8" }}>
                {profile?.role ?? "Loading..."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="h-px mx-4 mb-1" style={{ background: "#132D50" }} />

      {/* Main nav */}
      <nav className="flex-1 px-2 py-1 overflow-y-auto">
        {visibleNav.map(({ href, label, icon: Icon, expandable }) => {
          // For managers, "My Home" link goes directly to their home
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
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 mb-0.5 text-sm font-medium",
                  isActive ? "text-white" : "hover:text-white"
                )}
                style={isActive
                  ? { background: "#0284C7", color: "white" }
                  : { color: "#7AA5C8" }
                }
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#132D50"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                <span className="flex-1">{label}</span>
                {expandable && homes.length > 0 && isOwner && (
                  <ChevronRight
                    size={13}
                    className={cn("transition-transform duration-200", onHomesSection && "rotate-90")}
                    style={{ color: "#4A7FA8" }}
                  />
                )}
              </Link>

              {/* Expandable homes list — owner only */}
              {showHomes && (
                <div className="ml-4 mb-1 border-l pl-3" style={{ borderColor: "#1E3D5C" }}>
                  {homes.map(home => {
                    const homeActive = pathname === `/homes/${home.id}` || pathname.startsWith(`/homes/${home.id}/`);
                    return (
                      <Link
                        key={home.id}
                        href={`/homes/${home.id}`}
                        className="block px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 mb-0.5 truncate"
                        style={homeActive
                          ? { background: "#132D50", color: "#38BDF8" }
                          : { color: "#4A7FA8" }
                        }
                        onMouseEnter={e => { if (!homeActive) { (e.currentTarget as HTMLElement).style.color = "#CBD5E1"; (e.currentTarget as HTMLElement).style.background = "#132D50"; } }}
                        onMouseLeave={e => { if (!homeActive) { (e.currentTarget as HTMLElement).style.color = "#4A7FA8"; (e.currentTarget as HTMLElement).style.background = "transparent"; } }}
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
      <div className="px-2 pb-2 border-t pt-2" style={{ borderColor: "#132D50" }}>
        {isOwner && (
          <Link
            href="/seed"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150 text-xs font-medium mb-1"
            style={{ color: pathname === "/seed" ? "white" : "#3A6080", background: pathname === "/seed" ? "#0284C7" : "transparent" }}
            onMouseEnter={e => { if (pathname !== "/seed") (e.currentTarget as HTMLElement).style.background = "#132D50"; }}
            onMouseLeave={e => { if (pathname !== "/seed") (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <Database size={14} strokeWidth={2} />
            Setup & Seed
          </Link>
        )}

        {/* Logout */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150 text-xs font-medium"
          style={{ color: "#3A6080" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#132D50"; (e.currentTarget as HTMLElement).style.color = "#EF4444"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#3A6080"; }}
        >
          <LogOut size={14} strokeWidth={2} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
