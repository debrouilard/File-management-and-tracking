import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { FileViewModal } from "../components/FileViewModal.jsx";

function statusBadge(status) {
  const s = String(status || "");
  const cls =
    s === "APPROVED"
      ? "bg-green-100 text-green-900"
      : s === "REJECTED"
        ? "bg-red-100 text-red-900"
        : s === "SENT"
          ? "bg-blue-100 text-blue-900"
          : s === "UNDER_REVIEW"
            ? "bg-blue-50 text-blue-900"
            : s === "RECEIVED"
              ? "bg-blue-50 text-blue-900"
              : s === "DRAFT"
                ? "bg-slate-100 text-slate-700"
                : s === "ARCHIVED"
                  ? "bg-slate-100 text-slate-700"
                  : "bg-yellow-100 text-yellow-900";
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${cls}`}>
      {s.replace(/_/g, " ")}
    </span>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 text-ink-700" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5A3.375 3.375 0 0010.125 2.25H8.25A2.25 2.25 0 006 4.5v15A2.25 2.25 0 008.25 21.75h7.5A2.25 2.25 0 0018 19.5v-.75"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5h3.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 13.5h6.75" />
    </svg>
  );
}

export function DocumentsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [sort, setSort] = useState("newest");
  const [departments, setDepartments] = useState([]);
  const [rows, setRows] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [error, setError] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);

  useEffect(() => {
    api("/departments")
      .then(setDepartments)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (departmentId) params.set("departmentId", departmentId);
      params.set("sortBy", "createdAt");
      params.set("sortOrder", sort === "oldest" ? "asc" : "desc");
      api(`/files?${params.toString()}`)
        .then(setRows)
        .catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [q, departmentId, sort]);

  const filtered = useMemo(() => {
    if (tab === "all") return rows;
    if (user?.role === "ADMIN") {
      if (tab === "sent") return rows.filter((r) => r.senderDeptId);
      if (tab === "received") return rows.filter((r) => r.receiverDeptId);
      return rows;
    }
    if (tab === "sent") return rows.filter((r) => r.senderDeptId === user?.departmentId);
    if (tab === "received") return rows.filter((r) => r.receiverDeptId === user?.departmentId);
    return rows;
  }, [rows, tab, user]);

  function openView(f) {
    setViewTarget({ id: f.id, name: f.originalName || f.title, mimeType: f.mimeType });
    setViewOpen(true);
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      <FileViewModal
        open={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewTarget(null);
        }}
        fileId={viewTarget?.id}
        fileName={viewTarget?.name}
        mimeType={viewTarget?.mimeType}
      />

      <div className="col-span-12 lg:col-span-10 bg-white border border-line p-4 rounded-md shadow-sm">
        <div className="mb-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by Document ID or file name"
            className="w-full border border-line px-4 py-2 text-sm bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div className="grid grid-cols-12 gap-4 mb-4">
          <div className="col-span-12 md:col-span-4">
            <label className="block text-xs text-ink-500 mb-1">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full border border-line px-3 py-2 text-sm bg-white rounded-md"
            >
              <option value="">All</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="block text-xs text-ink-500 mb-1">Sort by date</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full border border-line px-3 py-2 text-sm bg-white rounded-md"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {[
            ["all", "All Files"],
            ["sent", "Sent Files"],
            ["received", "Received Files"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                setOpenId(null);
              }}
              className={[
                "px-4 py-2 text-sm border rounded-md transition-colors",
                tab === id ? "bg-brand-hover border-brand-sidebar text-ink-900" : "bg-white border-line hover:bg-surface",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-700 mb-3">{error}</p>}

        <div className="border border-line rounded-md overflow-hidden">
          <div className="grid grid-cols-12 bg-brand-sidebar text-white border-b border-line text-xs uppercase tracking-wide">
            <div className="col-span-3 px-3 py-2 font-semibold">Document ID</div>
            <div className="col-span-4 px-3 py-2 font-semibold">File Name</div>
            <div className="col-span-2 px-3 py-2 font-semibold">Timestamp</div>
            <div className="col-span-2 px-3 py-2 font-semibold">Sender</div>
            <div className="col-span-1 px-3 py-2 font-semibold">Status</div>
          </div>
          {filtered.map((f) => {
            const open = openId === f.id;
            return (
              <div key={f.id} className="border-b border-line last:border-0">
                <button
                  type="button"
                  className="w-full text-left grid grid-cols-12 items-center hover:bg-surface/90 transition-colors"
                  onClick={() => setOpenId(open ? null : f.id)}
                >
                  <div className="col-span-3 px-3 py-3 font-mono text-xs">{f.displayId}</div>
                  <div className="col-span-4 px-3 py-3 flex items-center gap-2 min-w-0">
                    <FileIcon />
                    <span className="font-medium text-ink-900 truncate">{f.title}</span>
                  </div>
                  <div className="col-span-2 px-3 py-3 text-sm text-ink-700">
                    {new Date(f.createdAt).toLocaleString()}
                  </div>
                  <div className="col-span-2 px-3 py-3 text-sm text-ink-700 truncate">{f.senderDept?.name}</div>
                  <div className="col-span-1 px-3 py-3">{statusBadge(f.status)}</div>
                </button>
                {open && (
                  <div className="px-4 py-4 bg-surface border-t border-line text-sm space-y-3">
                    <div>
                      <span className="text-ink-500">Full Description: </span>
                      <span className="text-ink-900">{f.description || "—"}</span>
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-12 md:col-span-4">
                        <span className="text-ink-500">Department: </span>
                        <span className="text-ink-900">{f.senderDept?.name}</span>
                      </div>
                      <div className="col-span-12 md:col-span-4">
                        <span className="text-ink-500">Timestamp: </span>
                        <span className="text-ink-900">{new Date(f.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="col-span-12 md:col-span-4">
                        <span className="text-ink-500">Status: </span>
                        <span className="text-ink-900 font-medium">{f.status.replace(/_/g, " ")}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openView(f);
                        }}
                        className="px-4 py-2 text-sm font-semibold rounded-md bg-white border-2 border-accent text-accent hover:bg-accent/5 shadow-sm"
                      >
                        View File
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <p className="px-4 py-10 text-sm text-ink-500">No files found.</p>}
        </div>
      </div>
    </div>
  );
}
