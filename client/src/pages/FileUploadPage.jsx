import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";

export function FileUploadPage() {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
      fd.append("title", title);
      fd.append("description", description);
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
        Upload a document and assign a title. The system will issue a file ID using your department
        prefix. You can route it to another department from the tracking page once it is ready.
      </p>
      <form onSubmit={onSubmit} className="space-y-6 border-t border-b border-line py-8">
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">
            Title
          </label>
          <input
            className="w-full border border-line px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">
            Description
          </label>
          <textarea
            className="w-full border border-line px-3 py-2 text-sm min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">
            Document (PDF or DOCX, max 10 MB)
          </label>
          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm"
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
