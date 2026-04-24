import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar.jsx";
import { Sidebar } from "./Sidebar.jsx";
import { TopBanner } from "./TopBanner.jsx";

export function Layout() {
  return (
    <div className="h-screen bg-[#F5F7FA] flex">
      <Sidebar />
      <div className="flex-1 h-screen overflow-y-auto bg-white ml-[240px]">
        <TopBanner />
        <Navbar />
        <main className="px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
