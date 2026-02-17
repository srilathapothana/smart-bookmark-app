import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginButton from "@/components/LoginButton";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/bookmarks");
  }

  return (
    <main className="min-h-screen bg-ink-950 flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(232,255,71,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,255,71,1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-xl mx-auto animate-fade-in">
        {/* Logo mark */}
        <div className="mb-8 inline-flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
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
          <span className="font-display font-700 text-xl text-white tracking-tight">
            Markd
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-6xl sm:text-7xl font-800 leading-[0.95] tracking-tight mb-6">
          <span className="text-white">Your links,</span>
          <br />
          <span className="text-gradient">always there.</span>
        </h1>

        <p className="text-muted text-lg mb-12 leading-relaxed max-w-sm mx-auto">
          A minimal bookmark manager that keeps your saved links private,
          organized, and synced in real-time.
        </p>

        {/* CTA */}
        <LoginButton />

        {/* Features row */}
        <div className="mt-16 flex items-center justify-center gap-8 text-xs text-muted/60 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-accent/60 inline-block" />
            Private by default
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-accent/60 inline-block" />
            Real-time sync
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-accent/60 inline-block" />
            Google OAuth
          </span>
        </div>
      </div>
    </main>
  );
}
