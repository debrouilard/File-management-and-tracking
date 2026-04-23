import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar.jsx";
import { Sidebar } from "./Sidebar.jsx";
import { TopBanner } from "./TopBanner.jsx";

export function Layout() {
  return (
    <div className="min-h-screen bg-surface">
      <TopBanner />
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-2">
            <Sidebar />
          </div>
          <main className="col-span-12 lg:col-span-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
