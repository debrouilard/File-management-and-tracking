import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";

export function FileUploadPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("Attach a PDF or DOCX file.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", title || file.name);
      fd.append("description", description);
      fd.append("priority", priority);
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
        Upload a document. The system auto-generates a File ID using your department prefix, the file number, and today’s date.
      </p>
      <form onSubmit={onSubmit} className="space-y-6 border-t border-b border-line py-8">
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">
            Priority
          </label>
          <select
            className="w-full border border-line px-3 py-2 text-sm bg-white"
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
            Document (PDF or DOCX, max 10 MB)
          </label>
          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
              if (f && !title) setTitle(f.name);
            }}
            className="text-sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">
              File ID (auto)
            </label>
            <input
              className="w-full border border-line px-3 py-2 text-sm font-mono bg-surface"
              readOnly
              value={`${user?.department?.prefix || "UNK"}/XXXXXX/${new Date().toISOString().slice(0, 10)}`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">
              File Name
            </label>
            <input
              className="w-full border border-line px-3 py-2 text-sm bg-surface"
              readOnly
              value={file?.name || ""}
              placeholder="Choose a document to see filename"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">
            File Description
          </label>
          <textarea
            className="w-full border border-line px-3 py-2 text-sm min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 text-sm font-semibold bg-accent text-white disabled:opacity-50"
        >
          {loading ? "Uploading…" : "Create file record"}
        </button>
      </form>
    </div>
  );
}
