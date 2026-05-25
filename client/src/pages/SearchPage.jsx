import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";

function priorityBadge(p) {
  const cls =
    p === "HIGH"
      ? "bg-red-100 text-red-900 border-red-200"
      : p === "MEDIUM"
        ? "bg-amber-50 text-amber-900 border-amber-200"
        : "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${cls}`}>{p}</span>
  );
}

export function SearchPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [departments, setDepartments] = useState([]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/departments")
      .then(setDepartments)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      if (departmentId) params.set("departmentId", departmentId);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      const qs = params.toString();
      api(`/search${qs ? `?${qs}` : ""}`)
        .then(setRows)
        .catch((e) => setError(e.message));
    }, 300);
    return () => clearTimeout(t);
  }, [q, status, priority, departmentId, sortBy, sortOrder]);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-950 mb-2">Search & filter</h1>
      <p className="text-sm text-ink-500 mb-6">
        Search by combined ID (e.g. REG-12), numeric ID, title, or department prefix.
      </p>
      {error && <p className="text-sm text-red-700 mb-4">{error}</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 border-b border-line pb-6">
        <div>
          <label className="text-xs uppercase tracking-wide text-ink-500">Keyword</label>
          <input
            className="mt-1 w-full border border-line px-3 py-2 text-sm"
            placeholder="REG-12004 or title"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-ink-500">Status</label>
          <select
            className="mt-1 w-full border border-line px-3 py-2 text-sm bg-white"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Any</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="RECEIVED">Received</option>
            <option value="UNDER_REVIEW">Under review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-ink-500">Priority</label>
          <select
            className="mt-1 w-full border border-line px-3 py-2 text-sm bg-white"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">Any</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-ink-500">Department</label>
          <select
            className="mt-1 w-full border border-line px-3 py-2 text-sm bg-white"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            <option value="">Any</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.prefix}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-ink-500">Sort by</label>
          <select
            className="mt-1 w-full border border-line px-3 py-2 text-sm bg-white"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="createdAt">Date</option>
            <option value="fileNumber">File ID</option>
            <option value="priority">Priority</option>
            <option value="department">Department</option>
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-ink-500">Order</label>
          <select
            className="mt-1 w-full border border-line px-3 py-2 text-sm bg-white"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto border border-line">
        <table className="w-full text-sm">
          <thead className="bg-white border-b border-line text-xs uppercase text-ink-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium">File ID</th>
              <th className="px-3 py-2 text-left font-medium">Priority</th>
              <th className="px-3 py-2 text-left font-medium">Title</th>
              <th className="px-3 py-2 text-left font-medium">From</th>
              <th className="px-3 py-2 text-left font-medium">To</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-left font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => (
              <tr key={f.id} className="border-b border-line last:border-0">
                <td className="px-3 py-2 font-mono text-xs">{f.displayId}</td>
                <td className="px-3 py-2">{priorityBadge(f.priority)}</td>
                <td className="px-3 py-2">{f.title}</td>
                <td className="px-3 py-2">{f.senderDept?.prefix}</td>
                <td className="px-3 py-2">{f.receiverDept?.prefix || "—"}</td>
                <td className="px-3 py-2 uppercase text-xs">{f.status.replace(/_/g, " ")}</td>
                <td className="px-3 py-2 text-right">
                  <Link to={`/files/${f.id}`} className="text-accent text-xs">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-ink-500">
                  No matches.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
