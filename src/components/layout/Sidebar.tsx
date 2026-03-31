"use client";
// Sidebar navigation — visible on desktop, hidden on mobile
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/homes", label: "Homes", icon: Building2 },
  { href: "/residents", label: "Residents", icon: Users },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-slate-900 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white tracking-tight">Managr</h1>
        <p className="text-xs text-slate-400 mt-1">Recovery Housing</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors mb-1 text-sm font-medium",
                isActive
                  ? "bg-amber-500 text-slate-900"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom version tag */}
      <div className="px-6 py-5 border-t border-slate-800">
        <p className="text-xs text-slate-600">Managr v1.0 · MVP</p>
      </div>
    </aside>
  );
}
