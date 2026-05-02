import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar.jsx";
import { TopBanner } from "./TopBanner.jsx";

const HEADER_H = 64;

export function Layout() {
  return (
    <div className="h-screen bg-[#F5F7FA]">
      <TopBanner />
      <div className="h-full pt-[64px] flex">
        <Sidebar topOffsetPx={HEADER_H} />
        <div className="flex-1 h-[calc(100vh-64px)] overflow-y-auto bg-white ml-[240px]">
          <main className="px-6 py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
