import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { FileViewModal } from "../components/FileViewModal.jsx";

function HeaderStrip({ title }) {
  return (
    <div className="px-4 h-[44px] flex items-center bg-brand-sidebar text-white">
      <p className="text-sm font-semibold">{title}</p>
    </div>
  );
}

function actionSoftClass(id, active) {
  const ring = active ? "ring-2 ring-accent/30 ring-offset-1" : "";
  const base = "px-3 py-2 text-sm font-medium border rounded-md transition-colors " + ring;
  if (id === "accepted") return base + " bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100/90";
  if (id === "review") return base + " bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100/90";
  if (id === "rejected") return base + " bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100/90";
  if (id === "pending") return base + " bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100/90";
  return base + " bg-slate-50 text-slate-700 border-line";
}

const ACCEPT_UPLOAD = ".pdf,.jpg,.jpeg,application/pdf,image/jpeg";

export function DashboardPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [doc, setDoc] = useState(null);
  const [uploadErr, setUploadErr] = useState("");
  const [fileName, setFileName] = useState("");
  const [documentCode, setDocumentCode] = useState("");
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

  const [viewOpen, setViewOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);

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

  const docCodeOk = /^\d{1,20}$/.test(documentCode.trim());
  const canSubmitTransmission = Boolean(doc && receiverDeptId && fileName.trim().length > 0 && description.trim().length > 0 && docCodeOk);

  function openView(f) {
    if (!f?.id) return;
    setViewTarget({ id: f.id, name: f.originalName || f.title, mimeType: f.mimeType });
    setViewOpen(true);
  }

  async function sendDocument() {
    setErr("");
    if (!doc) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("title", fileName.trim());
      fd.append("description", description);
      fd.append("priority", "MEDIUM");
      fd.append("documentCode", documentCode.trim());
      fd.append("document", doc);
      const created = await api("/files", { method: "POST", body: fd });
      await api(`/files/${created.id}/send`, {
        method: "POST",
        body: JSON.stringify({ receiverDeptId }),
      });
      setDescription("");
      setFileName("");
      setDocumentCode("");
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

      <div className="col-span-12 lg:col-span-7 space-y-4">
        <div className="bg-white border border-[#C5C5C5] rounded-md shadow-sm overflow-hidden">
          <HeaderStrip title="New Transmission" />
          <div className="p-4 space-y-4">
            {err && <p className="text-sm text-red-700">{err}</p>}

            <div
              className="border border-dashed border-line bg-surface p-6 text-center rounded-md"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (!f) return;
                const ok = /\.(pdf|jpe?g)$/i.test(f.name) || f.type === "application/pdf" || f.type === "image/jpeg";
                if (!ok) {
                  setUploadErr("Only PDF and JPG/JPEG files are allowed.");
                  return;
                }
                setUploadErr("");
                setDoc(f);
              }}
            >
              <p className="text-sm font-semibold text-ink-900">Upload Document</p>
              <p className="text-xs text-ink-500 mt-1">PDF or JPG/JPEG only (max 10 MB).</p>
              {uploadErr && <p className="text-xs text-red-700 mt-2">{uploadErr}</p>}
              <input
                type="file"
                accept={ACCEPT_UPLOAD}
                className="mt-3 text-sm"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setUploadErr("");
                  if (f) {
                    const ok = /\.(pdf|jpe?g)$/i.test(f.name) || f.type === "application/pdf" || f.type === "image/jpeg";
                    if (!ok) {
                      setUploadErr("Only PDF and JPG/JPEG files are allowed.");
                      e.target.value = "";
                      return;
                    }
                    setDoc(f);
                    setFileName((n) => (n ? n : f.name));
                  } else setDoc(null);
                }}
              />
              {doc && <p className="text-xs text-ink-700 mt-2">Selected: <span className="font-medium">{doc.name}</span></p>}
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 md:col-span-7">
                <label className="block text-xs text-ink-500 mb-1">File Name</label>
                <input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full border border-line px-3 py-2 text-sm bg-white rounded-md"
                  placeholder="Enter file name"
                />
              </div>
              <div className="col-span-12 md:col-span-5">
                <label className="block text-xs text-ink-500 mb-1">Document ID (numbers only)</label>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={documentCode}
                  onChange={(e) => setDocumentCode(e.target.value.replace(/\D/g, "").slice(0, 20))}
                  className="w-full border border-line px-3 py-2 text-sm bg-white rounded-md font-mono"
                  placeholder="e.g. 10042"
                />
                {!docCodeOk && documentCode.length > 0 && (
                  <p className="text-[11px] text-red-600 mt-1">Use 1–20 digits only.</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs text-ink-500 mb-1">File Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-line px-3 py-2 text-sm min-h-[90px] rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs text-ink-500 mb-1">Department</label>
              <select
                value={receiverDeptId}
                onChange={(e) => setReceiverDeptId(e.target.value)}
                className="w-full border border-line px-3 py-2 text-sm bg-white rounded-md"
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
              className="px-4 py-2.5 text-sm font-semibold bg-brand-sidebar text-white rounded-md disabled:opacity-50 hover:brightness-95"
            >
              Send Document
            </button>
            {file?.id && (
              <p className="text-xs text-ink-500">
                Last sent record:{" "}
                <button type="button" className="text-accent underline font-medium" onClick={() => openView(file)}>
                  View
                </button>{" "}
                ·{" "}
                <Link to={`/files/${file.id}`} className="text-ink-900 underline">
                  Details
                </Link>
              </p>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#C5C5C5] rounded-md shadow-sm overflow-hidden">
          <HeaderStrip title="Active Received Document" />
          <div className="p-4">
            {!activeReceived ? (
              <p className="text-sm text-ink-500">No active received documents.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-ink-950">{activeReceived.title}</p>
                  <p className="text-xs font-mono text-ink-600 mt-0.5">ID {activeReceived.displayId}</p>
                  <p className="text-sm text-ink-700 mt-1">{activeReceived.description || "—"}</p>
                  <p className="text-xs text-ink-500 mt-2">{new Date(activeReceived.createdAt).toLocaleString()}</p>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => openView(activeReceived)}
                    className="px-3 py-2 text-sm font-medium rounded-md border border-accent text-accent bg-white hover:bg-accent/5"
                  >
                    View File
                  </button>
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
                      className={actionSoftClass(id, activeAction === id)}
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
                      className="w-full border border-line px-3 py-2 text-sm min-h-[90px] rounded-md"
                    />
                  </div>
                )}

                <button
                  type="button"
                  disabled={!canSubmitAction || busy}
                  onClick={submitAction}
                  className="px-4 py-2 text-sm font-semibold bg-brand-sidebar text-white rounded-md disabled:opacity-50"
                >
                  Submit Action
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-3 space-y-4">
        <div className="bg-white border border-line rounded-md shadow-sm overflow-hidden">
          <HeaderStrip title="Sent Activity Feed" />
          <div className="p-3 max-h-[360px] overflow-y-auto space-y-3">
            {sent.map((f) => (
              <div key={f.id} className="text-sm border border-line rounded-md bg-surface/80 px-3 py-2 space-y-2">
                <p className="font-mono text-xs text-ink-900">{f.displayId}</p>
                <p className="text-xs text-ink-500">{new Date(f.createdAt).toLocaleString()}</p>
                <button
                  type="button"
                  onClick={() => openView(f)}
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  View File
                </button>
              </div>
            ))}
            {sent.length === 0 && <p className="text-sm text-ink-500">No sent activity.</p>}
          </div>
        </div>

        <div className="bg-white border border-line rounded-md shadow-sm overflow-hidden">
          <HeaderStrip title="Received Activity Feed" />
          <div className="p-3 max-h-[360px] overflow-y-auto space-y-3">
            {incoming.map((f) => (
              <div key={f.id} className="text-sm border border-line rounded-md bg-surface/80 px-3 py-2 space-y-2">
                <p className="font-semibold text-ink-900 truncate">{f.title}</p>
                <p className="text-xs text-ink-700">Sender: {f.senderDept?.prefix}</p>
                <p className="text-xs text-ink-500">{new Date(f.createdAt).toLocaleString()}</p>
                <button
                  type="button"
                  onClick={() => openView(f)}
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  View File
                </button>
              </div>
            ))}
            {incoming.length === 0 && <p className="text-sm text-ink-500">No received activity.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
