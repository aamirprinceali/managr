"use client";
// Sidebar — deep navy with sky blue accents, expandable homes list
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users, FileText, Settings, BarChart3, ChevronRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Home = { id: string; name: string };

const navItems = [
  { href: "/homes", label: "Homes", icon: Building2, expandable: true },
  { href: "/residents", label: "All Residents", icon: Users },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [homes, setHomes] = useState<Home[]>([]);
  const onHomesSection = pathname.startsWith("/homes");

  useEffect(() => {
    if (onHomesSection) {
      const supabase = createClient();
      supabase.from("homes").select("id, name").order("name").then(({ data }) => {
        setHomes(data ?? []);
      });
    }
  }, [onHomesSection]);

  return (
    <aside className="w-56 min-h-screen flex flex-col border-r" style={{ background: "#0B1F3A", borderColor: "#132D50" }}>
      {/* Logo */}
      <div className="px-4 py-6">
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

      <div className="h-px mx-4 mb-2" style={{ background: "#132D50" }} />

      {/* Nav */}
      <nav className="flex-1 px-2 py-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, expandable }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          const showHomes = expandable && onHomesSection && homes.length > 0;

          return (
            <div key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 mb-0.5 text-sm font-medium group",
                  isActive
                    ? "text-white"
                    : "hover:text-white"
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
                {expandable && homes.length > 0 && (
                  <ChevronRight
                    size={13}
                    className={cn("transition-transform duration-200", onHomesSection && "rotate-90")}
                    style={{ color: "#4A7FA8" }}
                  />
                )}
              </Link>

              {/* Expandable homes sub-list */}
              {showHomes && (
                <div className="ml-4 mb-1 border-l pl-3" style={{ borderColor: "#1E3D5C" }}>
                  {homes.map(home => {
                    const homeActive = pathname === `/homes/${home.id}` || pathname.startsWith(`/homes/${home.id}/`);
                    return (
                      <Link
                        key={home.id}
                        href={`/homes/${home.id}`}
                        className={cn(
                          "block px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 mb-0.5 truncate",
                          homeActive ? "text-white" : ""
                        )}
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

      {/* Footer */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "#132D50" }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <p className="text-[10px] font-medium" style={{ color: "#3A6080" }}>Managr · MVP v1.0</p>
        </div>
      </div>
    </aside>
  );
}
