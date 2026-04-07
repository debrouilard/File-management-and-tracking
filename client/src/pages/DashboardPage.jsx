import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function FileTable({ title, rows, empty }) {
  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between border-b border-line pb-2 mb-3">
        <h2 className="font-display text-lg text-ink-950">{title}</h2>
        <span className="text-xs text-ink-500">{rows.length} total</span>
      </div>
      <div className="overflow-x-auto border border-line">
        <table className="w-full text-sm text-left">
          <thead className="bg-white border-b border-line text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-3 py-2 font-medium">File ID</th>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">From</th>
              <th className="px-3 py-2 font-medium">To</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-ink-500">
                  {empty}
                </td>
              </tr>
            )}
            {rows.map((f) => (
              <tr key={f.id} className="border-b border-line last:border-0 hover:bg-white/80">
                <td className="px-3 py-2 font-mono text-xs">{f.fileId}</td>
                <td className="px-3 py-2 max-w-[200px] truncate">{f.title}</td>
                <td className="px-3 py-2 text-ink-700">{f.senderDept?.prefix}</td>
                <td className="px-3 py-2 text-ink-700">{f.receiverDept?.prefix || "—"}</td>
                <td className="px-3 py-2">
                  <span className="text-xs font-medium uppercase tracking-wide">{f.status}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <Link to={`/files/${f.id}`} className="text-xs text-accent hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [pending, setPending] = useState([]);
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, all] = await Promise.all([
          api("/files/dashboard/summary"),
          api("/files"),
        ]);
        if (cancelled) return;
        setSummary(s);
        const dept = user?.departmentId;
        const isAdmin = user?.role === "ADMIN";
        setPending(
          all.filter((f) => f.status === "PENDING" && (isAdmin || f.senderDeptId === dept))
        );
        setSent(
          all.filter((f) => f.status === "SENT" && (isAdmin || f.senderDeptId === dept))
        );
        setReceived(
          all.filter((f) => f.status === "RECEIVED" && (isAdmin || f.receiverDeptId === dept))
        );
        setRejected(
          all.filter((f) => f.status === "REJECTED" && (isAdmin || f.senderDeptId === dept))
        );
      } catch (e) {
        if (!cancelled) setErr(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-950 mb-2">Dashboard</h1>
      <p className="text-sm text-ink-500 mb-8 max-w-2xl">
        Overview of inter-department files for{" "}
        <span className="text-ink-900 font-medium">{user?.department?.name}</span>. Counts reflect your
        access scope.
      </p>
      {err && <p className="text-sm text-red-700 mb-4">{err}</p>}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line mb-10">
          {[
            ["Pending", summary.pending],
            ["Sent", summary.sent],
            ["Received", summary.received],
            ["Rejected", summary.rejected],
          ].map(([label, n]) => (
            <div key={label} className="bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-ink-500">{label}</p>
              <p className="text-2xl font-display text-ink-950 mt-1">{n}</p>
            </div>
          ))}
        </div>
      )}
      <FileTable title="Pending" rows={pending} empty="No pending files." />
      <FileTable title="Sent (in transit)" rows={sent} empty="Nothing in transit." />
      <FileTable title="Received" rows={received} empty="No completed receipts yet." />
      <FileTable title="Rejected (outgoing)" rows={rejected} empty="No rejected files." />
    </div>
  );
}
