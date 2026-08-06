import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import MobileNav from "@/components/layout/MobileNav";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-ink-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main key={location.pathname} className="flex-1 overflow-y-auto">
          <ErrorBoundary>
            <div className="animate-fade-up">
              <Outlet />
            </div>
          </ErrorBoundary>
        </main>
      </div>
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </div>
  );
}
