import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BookmarksClient from "@/components/BookmarksClient";

export default async function BookmarksPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch initial bookmarks server-side
  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <BookmarksClient
      user={user}
      initialBookmarks={bookmarks ?? []}
    />
  );
}
