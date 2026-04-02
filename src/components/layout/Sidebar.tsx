"use client";
// Sidebar navigation — desktop only, deep slate with amber accents
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users, FileText, Settings, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/homes", label: "Homes", icon: Building2 },
  { href: "/residents", label: "All Residents", icon: Users },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-slate-900 flex flex-col border-r border-slate-800">
      {/* Logo area */}
      <div className="px-5 py-7">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <Building2 size={16} className="text-slate-900" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight leading-none">Managr</h1>
            <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider mt-0.5">Recovery Housing</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-800 mx-4 mb-3" />

      {/* Nav links */}
      <nav className="flex-1 px-2 py-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 mb-0.5 text-sm font-medium group",
                isActive
                  ? "bg-amber-500 text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.5 : 2}
                className={isActive ? "text-slate-900" : "text-slate-400 group-hover:text-white transition-colors"}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom — version */}
      <div className="px-5 py-5 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-xs text-slate-600 font-medium">Managr MVP · v1.0</p>
        </div>
      </div>
    </aside>
  );
}
