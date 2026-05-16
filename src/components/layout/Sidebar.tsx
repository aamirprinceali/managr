"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2, Users, FileText, Settings, BarChart3, ChevronRight,
  Shield, LayoutDashboard, CheckSquare, MessageCircle, Database,
  LogOut, Calendar, Moon, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/components/auth/UserProvider";

type Home = { id: string; name: string };

const NAV = [
  { href: "/dashboard",  label: "Dashboard",     icon: LayoutDashboard, ownerOnly: false },
  { href: "/homes",      label: "Homes",          icon: Building2,       ownerOnly: false, expandable: true },
  { href: "/residents",  label: "All Residents",  icon: Users,           ownerOnly: true  },
  { href: "/tasks",      label: "Tasks",          icon: CheckSquare,     ownerOnly: false },
  { href: "/messages",   label: "Messages",       icon: MessageCircle,   ownerOnly: false },
  { href: "/nightly",    label: "Nightly",        icon: Moon,            ownerOnly: false },
  { href: "/reports",    label: "Reports",        icon: FileText,        ownerOnly: false },
  { href: "/analytics",  label: "Analytics",      icon: BarChart3,       ownerOnly: true  },
  { href: "/calendar",   label: "Calendar",       icon: Calendar,        ownerOnly: false },
  { href: "/settings",   label: "Settings",       icon: Settings,        ownerOnly: false },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { profile, user, signOut } = useProfile();
  const [homes, setHomes] = useState<Home[]>([]);
  const onHomesSection = pathname.startsWith("/homes");
  const isOwner   = profile?.role === "owner";
  const isManager = profile?.role === "manager";

  useEffect(() => {
    if (!onHomesSection) return;
    const sb = createClient();
    const q = isManager && profile?.home_id
      ? sb.from("homes").select("id, name").eq("id", profile.home_id)
      : sb.from("homes").select("id, name").order("name");
    q.then(({ data }) => setHomes(data ?? []));
  }, [onHomesSection, isManager, profile?.home_id]);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  const visibleNav = NAV.filter(item => isOwner || !item.ownerOnly);

  return (
    <aside
      className="w-[220px] min-h-screen flex flex-col flex-shrink-0"
      style={{ background: "#032D60", borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(27,110,243,0.9)", boxShadow: "0 2px 8px rgba(27,110,243,0.4)" }}
          >
            <Shield size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-white" style={{ fontFamily: "var(--font-manrope, Manrope)" }}>
              Managr
            </p>
            <p className="text-[9px] font-medium uppercase tracking-widest mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              Recovery Housing
            </p>
          </div>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div className="mx-3 mb-4 px-3 py-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(27,110,243,0.25)", border: "1px solid rgba(27,110,243,0.35)" }}
            >
              <User size={13} style={{ color: "#60A5FA" }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate text-white">
                {profile?.full_name ?? user.email?.split("@")[0] ?? "User"}
              </p>
              <p className="text-[10px] capitalize" style={{ color: "rgba(255,255,255,0.4)" }}>
                {profile?.role ?? "..."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nav group label */}
      <div className="px-5 mb-1">
        <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
          Navigation
        </p>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-2 pb-2 overflow-y-auto space-y-0.5">
        {visibleNav.map(({ href, label, icon: Icon, expandable, ownerOnly: _oo }) => {
          const resolvedHref =
            isManager && href === "/homes" && profile?.home_id
              ? `/homes/${profile.home_id}`
              : href;

          const isActive =
            pathname === resolvedHref ||
            pathname.startsWith(resolvedHref + "/") ||
            (href === "/homes" && pathname.startsWith("/homes"));

          const showSubs = expandable && onHomesSection && homes.length > 0 && isOwner;

          return (
            <div key={href}>
              <Link
                href={resolvedHref}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium rounded-lg transition-all duration-150",
                  isActive ? "sidebar-item-active" : ""
                )}
                style={isActive
                  ? { color: "#FFFFFF" }
                  : { color: "rgba(255,255,255,0.5)" }
                }
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
                  }
                }}
              >
                <Icon
                  size={15}
                  strokeWidth={isActive ? 2.5 : 2}
                  style={{ color: isActive ? "#60A5FA" : "inherit", flexShrink: 0 }}
                />
                <span className="flex-1 truncate">{label}</span>
                {expandable && isOwner && homes.length > 0 && (
                  <ChevronRight
                    size={11}
                    className={cn("transition-transform duration-200 flex-shrink-0", onHomesSection && "rotate-90")}
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  />
                )}
              </Link>

              {/* Homes sub-list */}
              {showSubs && (
                <div className="ml-3 mt-0.5 mb-1 pl-3 space-y-0.5" style={{ borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
                  {homes.map(home => {
                    const homeActive =
                      pathname === `/homes/${home.id}` ||
                      pathname.startsWith(`/homes/${home.id}/`);
                    return (
                      <Link
                        key={home.id}
                        href={`/homes/${home.id}`}
                        className="block px-2.5 py-1.5 rounded-md text-[12px] font-medium truncate transition-all duration-150"
                        style={
                          homeActive
                            ? { background: "rgba(255,255,255,0.08)", color: "#93C5FD" }
                            : { color: "rgba(255,255,255,0.4)" }
                        }
                        onMouseEnter={e => {
                          if (!homeActive) {
                            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)";
                            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                          }
                        }}
                        onMouseLeave={e => {
                          if (!homeActive) {
                            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)";
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                          }
                        }}
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

      {/* Bottom actions */}
      <div className="px-2 py-3 space-y-0.5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {isOwner && (
          <Link
            href="/seed"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-150"
            style={{
              color: pathname === "/seed" ? "#60A5FA" : "rgba(255,255,255,0.3)",
              background: pathname === "/seed" ? "rgba(96,165,250,0.1)" : "transparent",
            }}
            onMouseEnter={e => {
              if (pathname !== "/seed") {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
              }
            }}
            onMouseLeave={e => {
              if (pathname !== "/seed") {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)";
              }
            }}
          >
            <Database size={13} strokeWidth={2} style={{ flexShrink: 0 }} />
            Setup & Seed
          </Link>
        )}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-150"
          style={{ color: "rgba(255,255,255,0.3)" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.1)";
            (e.currentTarget as HTMLElement).style.color = "#FCA5A5";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)";
          }}
        >
          <LogOut size={13} strokeWidth={2} style={{ flexShrink: 0 }} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
