"use client";
// Bottom navigation bar — mobile only, tap-first design
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

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 z-50 md:hidden safe-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-150 flex-1 min-w-0",
                isActive ? "text-slate-900" : "text-gray-400 active:text-slate-700"
              )}
            >
              {/* Active indicator dot */}
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-amber-500 mb-0.5" />
              )}
              {!isActive && <div className="w-1 h-1 mb-0.5" />}
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
