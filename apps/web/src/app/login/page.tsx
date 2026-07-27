import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./login-form";
import Link from "next/link";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 px-4 selection:bg-indigo-500/30 selection:text-indigo-200 overflow-hidden">
      {/* Background Gradients & Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.15] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-violet-600/20 to-transparent blur-3xl pointer-events-none rounded-full opacity-60" />

      {/* Header Brand Link */}
      <Link href="/" className="flex items-center gap-3 mb-8 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          SkillVault
        </span>
      </Link>

      {/* Auth Card Container */}
      <div className="w-full max-w-md p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl shadow-2xl shadow-black/50 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            Welcome to SkillVault
          </h1>
          <p className="text-sm text-zinc-400">
            Sign in to access your course roadmap & tiered permissions
          </p>
        </div>

        <LoginForm />
      </div>

      {/* Case Study Footer Note */}
      <p className="mt-8 text-xs text-zinc-500 text-center relative z-10">
        Backend Engineering Portfolio Project • Supabase Auth & RLS
      </p>
    </main>
  );
}

