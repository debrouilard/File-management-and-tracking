import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function HeaderStrip({ title }) {
  return (
    <div className="px-4 py-3 bg-gradient-to-r from-brand-headerFrom to-brand-headerTo text-white">
      <p className="text-sm font-semibold">{title}</p>
    </div>
  );
}

function statusColor(action) {
  if (action === "accepted") return "bg-green-600";
  if (action === "review") return "bg-blue-600";
  if (action === "rejected") return "bg-red-600";
  if (action === "pending") return "bg-yellow-500";
  return "bg-slate-400";
}

export function DashboardPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [doc, setDoc] = useState(null);
  const [description, setDescription] = useState("");
  const [receiverDeptId, setReceiverDeptId] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);

  const [activeAction, setActiveAction] = useState("");
  const [note, setNote] = useState("");
  const [activeReceived, setActiveReceived] = useState(null);

  useEffect(() => {
    api("/departments").then(setDepartments).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [all] = await Promise.all([api("/files")]);
        if (cancelled) return;
        const deptId = user?.departmentId;
        setSent(all.filter((f) => f.status === "SENT").slice(0, 20));
        setIncoming(
          all.filter((f) => f.receiverDeptId === deptId && ["SENT", "RECEIVED", "UNDER_REVIEW"].includes(f.status)).slice(0, 20)
        );
        const active = all.find(
          (f) => f.receiverDeptId === deptId && ["SENT", "RECEIVED", "UNDER_REVIEW"].includes(f.status)
        );
        setActiveReceived(active || null);
      } catch (e) {
        if (!cancelled) setErr(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const canSubmitTransmission = Boolean(doc && receiverDeptId && description.trim().length > 0);

  async function sendDocument() {
    setErr("");
    if (!doc) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("title", doc.name);
      fd.append("description", description);
      fd.append("priority", "MEDIUM");
      fd.append("document", doc);
      const created = await api("/files", { method: "POST", body: fd });
      await api(`/files/${created.id}/send`, {
        method: "POST",
        body: JSON.stringify({ receiverDeptId }),
      });
      setDescription("");
      setReceiverDeptId("");
      setDoc(null);
      setFile(created);
      const refreshed = await api("/files");
      const deptId = user?.departmentId;
      setSent(refreshed.filter((f) => f.status === "SENT").slice(0, 20));
      setIncoming(
        refreshed.filter((f) => f.receiverDeptId === deptId && ["SENT", "RECEIVED", "UNDER_REVIEW"].includes(f.status)).slice(0, 20)
      );
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const actionRequiresNote = activeAction === "rejected" || activeAction === "pending";
  const canSubmitAction = Boolean(activeAction && (!actionRequiresNote || note.trim().length > 0));

  async function submitAction() {
    if (!activeReceived) return;
    setErr("");
    setBusy(true);
    try {
      if (activeAction === "accepted") {
        await api(`/files/${activeReceived.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "APPROVED" }) });
      } else if (activeAction === "review") {
        await api(`/files/${activeReceived.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "UNDER_REVIEW" }) });
      } else if (activeAction === "rejected") {
        await api(`/files/${activeReceived.id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: "REJECTED", note }),
        });
      } else if (activeAction === "pending") {
        await api(`/files/${activeReceived.id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: "UNDER_REVIEW", note }),
        });
      }

      setActiveAction("");
      setNote("");
      const refreshed = await api("/files");
      const deptId = user?.departmentId;
      const active = refreshed.find(
        (f) => f.receiverDeptId === deptId && ["SENT", "RECEIVED", "UNDER_REVIEW"].includes(f.status)
      );
      setActiveReceived(active || null);
      setSent(refreshed.filter((f) => f.status === "SENT").slice(0, 20));
      setIncoming(
        refreshed.filter((f) => f.receiverDeptId === deptId && ["SENT", "RECEIVED", "UNDER_REVIEW"].includes(f.status)).slice(0, 20)
      );
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const deptOptions = useMemo(
    () => departments.filter((d) => d.id !== user?.departmentId),
    [departments, user]
  );

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-7 space-y-4">
        <div className="bg-white border border-[#C5C5C5]">
          <HeaderStrip title="New Transmission" />
          <div className="p-4 space-y-4">
            {err && <p className="text-sm text-red-700">{err}</p>}

            <div
              className="border border-dashed border-line bg-surface p-6 text-center"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) setDoc(f);
              }}
            >
              <p className="text-sm font-semibold text-ink-900">Upload Document</p>
              <p className="text-xs text-ink-500 mt-1">Drag & drop a PDF/DOCX here, or choose a file.</p>
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="mt-3 text-sm"
                onChange={(e) => setDoc(e.target.files?.[0] || null)}
              />
              {doc && <p className="text-xs text-ink-700 mt-2">Selected: <span className="font-medium">{doc.name}</span></p>}
            </div>

            <div>
              <label className="block text-xs text-ink-500 mb-1">File Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-line px-3 py-2 text-sm min-h-[90px]"
              />
            </div>

            <div>
              <label className="block text-xs text-ink-500 mb-1">Department</label>
              <select
                value={receiverDeptId}
                onChange={(e) => setReceiverDeptId(e.target.value)}
                className="w-full border border-line px-3 py-2 text-sm bg-white"
              >
                <option value="">Select department…</option>
                {deptOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={sendDocument}
              disabled={!canSubmitTransmission || busy}
              className="px-4 py-2 text-sm font-semibold bg-brand-sidebar text-white disabled:opacity-50"
            >
              Send Document
            </button>
            {file?.id && (
              <p className="text-xs text-ink-500">
                Last sent record: <Link to={`/files/${file.id}`} className="text-ink-900 underline">Open</Link>
              </p>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#C5C5C5]">
          <HeaderStrip title="Active Received Document" />
          <div className="p-4">
            {!activeReceived ? (
              <p className="text-sm text-ink-500">No active received documents.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-ink-950">{activeReceived.title}</p>
                  <p className="text-sm text-ink-700 mt-1">{activeReceived.description || "—"}</p>
                  <p className="text-xs text-ink-500 mt-2">{new Date(activeReceived.createdAt).toLocaleString()}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    ["accepted", "Accept"],
                    ["review", "Review"],
                    ["rejected", "Reject"],
                    ["pending", "Pending"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setActiveAction(id);
                        setNote("");
                      }}
                      className={[
                        "px-3 py-2 text-sm text-white",
                        statusColor(id),
                        activeAction === id ? "ring-2 ring-offset-2 ring-line" : "",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {(activeAction === "rejected" || activeAction === "pending") && (
                  <div>
                    <label className="block text-xs text-ink-500 mb-1">
                      {activeAction === "rejected" ? "Reason for Rejection" : "Reason for Pending"} (required)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full border border-line px-3 py-2 text-sm min-h-[90px]"
                    />
                  </div>
                )}

                <button
                  type="button"
                  disabled={!canSubmitAction || busy}
                  onClick={submitAction}
                  className="px-4 py-2 text-sm font-semibold bg-brand-sidebar text-white disabled:opacity-50"
                >
                  Submit Action
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-3 space-y-4">
        <div className="bg-white border border-line">
          <HeaderStrip title="Sent Activity Feed" />
          <div className="p-3 max-h-[360px] overflow-y-auto space-y-3">
            {sent.map((f) => (
              <div key={f.id} className="text-sm border-b border-line pb-2 last:border-0">
                <p className="font-mono text-xs text-ink-900">{f.displayId}</p>
                <p className="text-xs text-ink-500 mt-1">{new Date(f.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {sent.length === 0 && <p className="text-sm text-ink-500">No sent activity.</p>}
          </div>
        </div>

        <div className="bg-white border border-line">
          <HeaderStrip title="Received Activity Feed" />
          <div className="p-3 max-h-[360px] overflow-y-auto space-y-3">
            {incoming.map((f) => (
              <div key={f.id} className="text-sm border-b border-line pb-2 last:border-0">
                <p className="font-semibold text-ink-900 truncate">{f.title}</p>
                <p className="text-xs text-ink-700 mt-1">Sender: {f.senderDept?.prefix}</p>
                <p className="text-xs text-ink-500 mt-1">{new Date(f.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {incoming.length === 0 && <p className="text-sm text-ink-500">No received activity.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
