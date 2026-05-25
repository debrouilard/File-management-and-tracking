import { useEffect, useState } from "react";
import { fetchAuthorizedBlob } from "../services/api.js";

export function FileViewModal({ open, onClose, fileId, fileName, mimeType }) {
  const [url, setUrl] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !fileId) return undefined;
    let cancelled = false;
    let objectUrl = null;
    setErr("");
    setUrl(null);
    setLoading(true);
    (async () => {
      try {
        const { blob } = await fetchAuthorizedBlob(`/files/${fileId}/download?inline=true`);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Could not load preview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, fileId]);

  if (!open) return null;

  const isPdf =
    String(mimeType || "").includes("pdf") || String(fileName || "").toLowerCase().endsWith(".pdf");
  const isImage =
    String(mimeType || "").startsWith("image/") ||
    /\.(jpe?g)$/i.test(String(fileName || ""));

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink-950/50 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-view-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-lg border border-line shadow-2xl flex flex-col overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-3 bg-white shrink-0">
          <h2 id="file-view-title" className="text-sm font-semibold text-ink-950 truncate">
            View file{fileName ? `: ${fileName}` : ""}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-md border border-line hover:bg-surface text-ink-700"
          >
            Close
          </button>
        </div>
        <div className="flex-1 min-h-[200px] bg-surface overflow-auto">
          {loading && <p className="p-6 text-sm text-ink-500">Loading preview…</p>}
          {err && !loading && <p className="p-6 text-sm text-red-700">{err}</p>}
          {url && !loading && !err && (
            <div className="h-[min(70vh,640px)] w-full">
              {isPdf && (
                <iframe title="Document preview" src={url} className="w-full h-full border-0 bg-white" />
              )}
              {isImage && !isPdf && <img src={url} alt="" className="max-w-full max-h-full object-contain mx-auto block" />}
              {!isPdf && !isImage && (
                <p className="p-6 text-sm text-ink-600">
                  Preview is not available for this file type. Use Download instead.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
