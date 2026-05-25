import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function Navbar() {
  const nav = useNavigate();
  const loc = useLocation();
  const [q, setQ] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    setQ(params.get("q") || "");
  }, [loc.pathname, loc.search]);

  function onSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    nav(`/documents?${params.toString()}`);
  }

  return (
    <div className="bg-brand-sidebar text-white">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center">
        <form onSubmit={onSubmit} className="w-full max-w-2xl">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search documents…"
            className="w-full px-4 py-2 text-sm text-ink-950 bg-white focus:outline-none"
          />
        </form>
      </div>
    </div>
  );
}

