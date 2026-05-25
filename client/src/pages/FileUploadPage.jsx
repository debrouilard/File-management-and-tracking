import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";

const ACCEPT = ".pdf,.jpg,.jpeg,application/pdf,image/jpeg";

export function FileUploadPage() {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [documentCode, setDocumentCode] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const docOk = /^\d{1,20}$/.test(documentCode.trim());

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("Attach a PDF or JPG/JPEG file.");
      return;
    }
    if (!docOk) {
      setError("Document ID must be numbers only (1–20 digits).");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", title || file.name);
      fd.append("description", description);
      fd.append("priority", priority);
      fd.append("documentCode", documentCode.trim());
      fd.append("document", file);
      const created = await api("/files", { method: "POST", body: fd });
      nav(`/files/${created.id}`);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl text-ink-950 mb-2">Register a new file</h1>
      <p className="text-sm text-ink-500 mb-8">
        Upload a PDF or JPEG. Enter a numeric Document ID (no prefixes or dates are added automatically).
      </p>
      <form onSubmit={onSubmit} className="space-y-6 border-t border-b border-line py-8">
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">
            Priority
          </label>
          <select
            className="w-full border border-line px-3 py-2 text-sm bg-white rounded-md"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">
            Document (PDF or JPG/JPEG, max 10 MB)
          </label>
          <input
            type="file"
            accept={ACCEPT}
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
              if (f) {
                const ok = /\.(pdf|jpe?g)$/i.test(f.name) || f.type === "application/pdf" || f.type === "image/jpeg";
                if (!ok) {
                  setError("Only PDF and JPG/JPEG files are allowed.");
                  e.target.value = "";
                  setFile(null);
                  return;
                }
                setError("");
                if (!title) setTitle(f.name);
              }
            }}
            className="text-sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">
              Document ID (numbers only)
            </label>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full border border-line px-3 py-2 text-sm bg-white rounded-md font-mono"
              value={documentCode}
              onChange={(e) => setDocumentCode(e.target.value.replace(/\D/g, "").slice(0, 20))}
              placeholder="e.g. 10042"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">
              File Name
            </label>
            <input
              className="w-full border border-line px-3 py-2 text-sm bg-white rounded-md"
              readOnly
              value={file?.name || ""}
              placeholder="Choose a document"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">
            File Description
          </label>
          <textarea
            className="w-full border border-line px-3 py-2 text-sm min-h-[100px] rounded-md"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !docOk}
          className="px-5 py-2.5 text-sm font-semibold bg-accent text-white rounded-md disabled:opacity-50 hover:brightness-95"
        >
          {loading ? "Uploading…" : "Create file record"}
        </button>
      </form>
    </div>
  );
}
