import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, downloadBlob } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function Timeline({ history }) {
  const labels = {
    CREATED: "Created (pending dispatch)",
    SENT: "Sent to receiving department",
    RECEIVED: "Received and acknowledged",
    REJECTED: "Rejected by receiver",
  };
  const rows = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  return (
    <div className="border-l border-line pl-4 space-y-6">
      {rows.map((h) => (
        <div key={h.id} className="relative">
          <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-accent" />
          <p className="text-xs uppercase tracking-wide text-ink-500">
            {labels[h.action] || h.action}
          </p>
          <p className="text-sm text-ink-900 mt-0.5">{new Date(h.timestamp).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

export function FileTrackingPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [history, setHistory] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [receiverId, setReceiverId] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function reload() {
    const f = await api(`/files/${id}`);
    setFile(f);
    const h = await api(`/files/${id}/history`);
    setHistory(h);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await api("/departments");
        if (!cancelled) setDepartments(d);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await reload();
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isSender = file && file.senderDeptId === user?.departmentId;
  const isReceiver = file && file.receiverDeptId === user?.departmentId;
  const canSend = file?.status === "PENDING" && isSender;
  const canReject = file?.status === "SENT" && (isReceiver || user?.role === "ADMIN");

  async function sendOut() {
    setError("");
    setMsg("");
    try {
      await api(`/files/${id}/send`, {
        method: "POST",
        body: JSON.stringify({ receiverDeptId: receiverId }),
      });
      setMsg("File marked as sent.");
      await reload();
    } catch (e) {
      setError(e.message);
    }
  }

  async function reject() {
    if (!window.confirm("Reject this file? The sender will be notified.")) return;
    setError("");
    setMsg("");
    try {
      await api(`/files/${id}/reject`, { method: "POST" });
      setMsg("File rejected.");
      await reload();
    } catch (e) {
      setError(e.message);
    }
  }

  if (!file) {
    return <p className="text-sm text-ink-500">{error || "Loading…"}</p>;
  }

  return (
    <div>
      <p className="text-xs text-ink-500 mb-2">
        <Link to="/dashboard" className="hover:text-accent">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span>Tracking</span>
      </p>
      <h1 className="font-display text-2xl text-ink-950 font-mono">{file.fileId}</h1>
      <p className="text-sm text-ink-500 mt-1 mb-6">{file.title}</p>
      {error && <p className="text-sm text-red-700 mb-2">{error}</p>}
      {msg && <p className="text-sm text-green-800 mb-4">{msg}</p>}

      <div className="grid md:grid-cols-3 gap-8 mb-10">
        <div className="md:col-span-2 space-y-4 text-sm border-t border-line pt-4">
          <div className="flex gap-4">
            <span className="w-28 text-ink-500">Status</span>
            <span className="font-medium uppercase tracking-wide">{file.status}</span>
          </div>
          <div className="flex gap-4">
            <span className="w-28 text-ink-500">From</span>
            <span>
              {file.senderDept?.prefix} — {file.senderDept?.name}
            </span>
          </div>
          <div className="flex gap-4">
            <span className="w-28 text-ink-500">To</span>
            <span>
              {file.receiverDept
                ? `${file.receiverDept.prefix} — ${file.receiverDept.name}`
                : "Not routed yet"}
            </span>
          </div>
          {file.description && (
            <div className="flex gap-4">
              <span className="w-28 text-ink-500 shrink-0">Notes</span>
              <span className="text-ink-700 whitespace-pre-wrap">{file.description}</span>
            </div>
          )}
        </div>
        <div className="border border-line p-4 text-sm space-y-3">
          <button
            type="button"
            onClick={() => downloadBlob(`/files/${file.id}/download`, file.originalName)}
            className="w-full text-center py-2 border border-accent text-accent hover:bg-accent hover:text-white transition-colors"
          >
            Download attachment
          </button>
          <p className="text-xs text-ink-500">
            Opens the stored PDF or Word document. Only authorized departments may download.
          </p>
        </div>
      </div>

      {canSend && (
        <section className="mb-10 border border-line p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500 mb-3">
            Send to department
          </h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-ink-500">Receiver</label>
              <select
                className="mt-1 block border border-line px-3 py-2 text-sm bg-white min-w-[200px]"
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
              >
                <option value="">Select…</option>
                {departments
                  .filter((d) => d.id !== file.senderDeptId)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.prefix} — {d.name}
                    </option>
                  ))}
              </select>
            </div>
            <button
              type="button"
              onClick={sendOut}
              disabled={!receiverId}
              className="px-4 py-2 text-sm bg-accent text-white disabled:opacity-40"
            >
              Mark as sent
            </button>
          </div>
        </section>
      )}

      {canReject && (
        <section className="mb-10">
          <button
            type="button"
            onClick={reject}
            className="text-sm text-accent2 border border-accent2 px-4 py-2 hover:bg-accent2 hover:text-white transition-colors"
          >
            Reject file
          </button>
        </section>
      )}

      <section>
        <h2 className="font-display text-lg text-ink-950 border-b border-line pb-2 mb-4">
          Status timeline
        </h2>
        <p className="text-xs text-ink-500 mb-4">
          Includes the pending registration step and every transition recorded in the audit log (pending →
          sent → received, or rejected).
        </p>
        <Timeline history={history} />
      </section>
    </div>
  );
}
