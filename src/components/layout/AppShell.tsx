"use client";
// AppShell wraps every page — hides sidebar/nav on the login page
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import UserProvider from "@/components/auth/UserProvider";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  // Login page gets no chrome — just a clean full-screen layout
  if (isLoginPage) {
    return <UserProvider>{children}</UserProvider>;
  }

  return (
    <UserProvider>
      <div className="min-h-screen flex" style={{ background: "#090B14" }}>
        {/* Sidebar — only shows on md screens and up (desktop/tablet) */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Main content area */}
        <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
            {children}
          </div>
        </main>

        {/* Bottom nav — only shows on mobile */}
        <MobileNav />
      </div>
    </UserProvider>
  );
}
