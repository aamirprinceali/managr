// AppShell wraps every page — handles sidebar on desktop and bottom nav on mobile
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
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
  );
}
