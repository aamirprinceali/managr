"use client";
// Bottom navigation bar — the main way house managers navigate on their phone
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors flex-1",
                isActive
                  ? "text-slate-900"
                  : "text-gray-400"
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={cn("text-xs font-medium", isActive ? "font-semibold" : "")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
