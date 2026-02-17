"use client";

import { useState } from "react";
import type { Bookmark } from "@/types";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function BookmarkCard({
  bookmark,
  onDelete,
  isDeleting,
}: BookmarkCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const domain = getDomain(bookmark.url);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(bookmark.id);
    } else {
      setConfirmDelete(true);
      // Auto-reset confirmation after 3s
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div
      className={`
        group relative flex items-center gap-4
        bg-ink-900 border border-border rounded-xl
        p-4 card-hover
        ${isDeleting ? "opacity-40 pointer-events-none" : ""}
      `}
    >
      {/* Favicon */}
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-ink-800 border border-border flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={faviconUrl}
          alt=""
          className="w-5 h-5 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group/link"
        >
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-500 text-white text-sm truncate group-hover/link:text-accent transition-colors">
              {bookmark.title}
            </span>
            <svg
              className="w-3 h-3 text-muted/0 group-hover/link:text-muted transition-colors flex-shrink-0"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M2.5 9.5l7-7M4 2.5h5.5v5.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted truncate font-mono">
              {domain}
            </span>
            <span className="text-muted/30 text-xs">·</span>
            <span className="text-xs text-muted/50 flex-shrink-0">
              {getTimeAgo(bookmark.created_at)}
            </span>
          </div>
        </a>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-muted opacity-0 group-hover:opacity-100 hover:text-white hover:bg-ink-700 transition-all"
          title="Open link"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2.5 11.5l9-9M6 2.5h5.5v5.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>

        <button
          onClick={handleDeleteClick}
          className={`
            p-2 rounded-lg transition-all
            ${
              confirmDelete
                ? "text-red-400 bg-red-500/10 opacity-100"
                : "text-muted opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10"
            }
          `}
          title={confirmDelete ? "Click again to confirm" : "Delete bookmark"}
        >
          {isDeleting ? (
            <svg
              className="animate-spin"
              width="14"
              height="14"
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
          ) : confirmDelete ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 2l10 10M12 2L2 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1.75 3.5h10.5M5.25 3.5V2.5a.75.75 0 01.75-.75h2a.75.75 0 01.75.75v1M11.5 3.5l-.583 7.583A1 1 0 0110.92 12H3.08a1 1 0 01-.997-.917L1.5 3.5"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Confirm tooltip */}
      {confirmDelete && (
        <div className="absolute right-14 top-1/2 -translate-y-1/2 text-xs text-red-400 bg-ink-800 border border-red-500/20 rounded-lg px-2 py-1 whitespace-nowrap pointer-events-none animate-scale-in">
          Click again to delete
        </div>
      )}
    </div>
  );
}
