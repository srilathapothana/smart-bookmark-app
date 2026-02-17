"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Bookmark } from "@/types";
import BookmarkCard from "./BookmarkCard";
import AddBookmarkForm from "./AddBookmarkForm";

interface BookmarksClientProps {
  user: User;
  initialBookmarks: Bookmark[];
}

export default function BookmarksClient({
  user,
  initialBookmarks,
}: BookmarksClientProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // Set up Supabase Realtime subscription
    const channel = supabase
      .channel("bookmarks-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newBookmark = payload.new as Bookmark;
          setBookmarks((prev) => {
            // Avoid duplicate if optimistic update already added it
            if (prev.find((b) => b.id === newBookmark.id)) return prev;
            return [newBookmark, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setBookmarks((prev) =>
            prev.filter((b) => b.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, supabase]);

  const handleAddBookmark = async (url: string, title: string) => {
    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const optimistic: Bookmark = {
      id: tempId,
      user_id: user.id,
      url,
      title,
      created_at: new Date().toISOString(),
    };
    setBookmarks((prev) => [optimistic, ...prev]);
    setIsFormOpen(false);

    const { data, error } = await supabase
      .from("bookmarks")
      .insert({ url, title, user_id: user.id })
      .select()
      .single();

    if (error) {
      // Rollback optimistic update
      setBookmarks((prev) => prev.filter((b) => b.id !== tempId));
      console.error("Error adding bookmark:", error);
      return;
    }

    // Replace temp with real
    setBookmarks((prev) =>
      prev.map((b) => (b.id === tempId ? data : b))
    );
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    // Optimistic delete
    setBookmarks((prev) => prev.filter((b) => b.id !== id));

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      // Rollback
      const restored = initialBookmarks.find((b) => b.id === id);
      if (restored) {
        setBookmarks((prev) => [restored, ...prev].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      }
      console.error("Error deleting bookmark:", error);
    }
    setDeletingId(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const avatarUrl = user.user_metadata?.avatar_url;
  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center flex-shrink-0">
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M5 3h10a1 1 0 011 1v13l-6-3-6 3V4a1 1 0 011-1z"
                  fill="#0a0a0f"
                  stroke="#0a0a0f"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="font-display font-700 text-white">Markd</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-border"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-ink-700 flex items-center justify-center text-xs text-muted uppercase">
                  {displayName[0]}
                </div>
              )}
              <span className="text-white/70">{displayName}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm text-muted hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-ink-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Page title + count */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-700 text-white leading-tight">
              Your Bookmarks
            </h1>
            <p className="text-muted text-sm mt-1">
              {bookmarks.length === 0
                ? "No bookmarks yet — add your first"
                : `${bookmarks.length} saved link${bookmarks.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          <button
            onClick={() => setIsFormOpen(true)}
            className="
              flex items-center gap-2 
              bg-accent hover:bg-accent-dim 
              text-ink-950 font-display font-600 text-sm
              px-4 py-2.5 rounded-xl
              transition-all duration-150
              hover:scale-[1.02] active:scale-[0.98]
              shadow-[0_0_20px_rgba(232,255,71,0.1)]
            "
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M8 3v10M3 8h10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Add bookmark
          </button>
        </div>

        {/* Add form overlay */}
        {isFormOpen && (
          <AddBookmarkForm
            onAdd={handleAddBookmark}
            onClose={() => setIsFormOpen(false)}
          />
        )}

        {/* Bookmark grid */}
        {bookmarks.length === 0 ? (
          <EmptyState onAdd={() => setIsFormOpen(true)} />
        ) : (
          <div className="grid gap-3">
            {bookmarks.map((bookmark, i) => (
              <div
                key={bookmark.id}
                style={{ animationDelay: `${i * 30}ms` }}
                className="animate-slide-up"
              >
                <BookmarkCard
                  bookmark={bookmark}
                  onDelete={handleDelete}
                  isDeleting={deletingId === bookmark.id}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-ink-800 border border-border flex items-center justify-center mb-5">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(107,107,133,0.8)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21l-7-4-7 4V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
        </svg>
      </div>
      <h3 className="font-display font-600 text-white text-xl mb-2">
        Nothing saved yet
      </h3>
      <p className="text-muted text-sm max-w-xs mb-6">
        Start building your personal library of links. Add your first bookmark
        to get going.
      </p>
      <button
        onClick={onAdd}
        className="text-accent hover:text-accent-dim text-sm font-500 transition-colors underline underline-offset-2"
      >
        Add your first bookmark →
      </button>
    </div>
  );
}
