"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, CheckSquare, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/homes", label: "Homes", icon: Building2 },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ background: "#0D1117", borderTop: "1px solid #1E2535" }}>
      <div className="flex items-center h-16 px-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 py-2 flex-1 rounded-xl transition-all duration-150"
            >
              <div className={cn(
                "w-10 h-6 flex items-center justify-center rounded-lg transition-all duration-150"
              )}
                style={isActive ? { background: "rgba(59,130,246,0.15)" } : {}}>
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={{ color: isActive ? "#60A5FA" : "#2A3448" }}
                />
              </div>
              <span className="text-[10px] font-semibold"
                style={{ color: isActive ? "#60A5FA" : "#2A3448" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
