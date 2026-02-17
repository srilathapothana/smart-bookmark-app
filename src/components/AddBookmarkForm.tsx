"use client";

import { useState, useEffect, useRef } from "react";

interface AddBookmarkFormProps {
  onAdd: (url: string, title: string) => Promise<void>;
  onClose: () => void;
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function AddBookmarkForm({ onAdd, onClose }: AddBookmarkFormProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState("");
  const urlInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    urlInputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Auto-fill title from URL domain
  const handleUrlChange = (val: string) => {
    setUrl(val);
    setUrlError("");
    if (!title && isValidUrl(val)) {
      try {
        const domain = new URL(val).hostname.replace("www.", "");
        setTitle(domain);
      } catch {}
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalUrl = url.trim();
    if (!finalUrl) return;

    // Auto-prepend https if missing
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }

    if (!isValidUrl(finalUrl)) {
      setUrlError("Please enter a valid URL");
      return;
    }

    const finalTitle = title.trim() || new URL(finalUrl).hostname.replace("www.", "");

    setLoading(true);
    await onAdd(finalUrl, finalTitle);
    setLoading(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 backdrop-blur-sm px-4 animate-fade-in"
    >
      <div className="w-full max-w-md bg-ink-900 border border-border rounded-2xl shadow-2xl animate-slide-up p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-600 text-white text-lg">
            Add bookmark
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-ink-800 hover:bg-ink-700 flex items-center justify-center text-muted hover:text-white transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M1 1l10 10M11 1L1 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL field */}
          <div>
            <label className="block text-xs text-muted font-500 mb-1.5 tracking-wide uppercase">
              URL *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M5.833 8.167a3.5 3.5 0 005.25.583l1.167-1.167a3.5 3.5 0 00-4.95-4.95L6.126 3.8"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.167 5.833a3.5 3.5 0 00-5.25-.583L1.75 6.417a3.5 3.5 0 004.95 4.95l1.167-1.167"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <input
                ref={urlInputRef}
                type="text"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com"
                className={`
                  w-full bg-ink-800 border rounded-xl
                  pl-9 pr-4 py-3 text-sm text-white placeholder-muted
                  focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20
                  transition-colors
                  ${urlError ? "border-red-500/50" : "border-border"}
                `}
              />
            </div>
            {urlError && (
              <p className="text-red-400 text-xs mt-1">{urlError}</p>
            )}
          </div>

          {/* Title field */}
          <div>
            <label className="block text-xs text-muted font-500 mb-1.5 tracking-wide uppercase">
              Title{" "}
              <span className="normal-case text-muted/50">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give it a memorable name..."
              maxLength={120}
              className="
                w-full bg-ink-800 border border-border rounded-xl
                px-4 py-3 text-sm text-white placeholder-muted
                focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20
                transition-colors
              "
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-border text-sm text-muted hover:text-white hover:border-ink-600 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url.trim() || loading}
              className="
                flex-1 flex items-center justify-center gap-2
                bg-accent hover:bg-accent-dim
                text-ink-950 font-display font-600 text-sm
                py-3 rounded-xl
                transition-all duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:scale-[1.01] active:scale-[0.99]
              "
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      opacity="0.25"
                    />
                    <path
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      opacity="0.75"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                "Save bookmark"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
