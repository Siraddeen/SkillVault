"use client";

import { useState, useTransition } from "react";
import {
  signInWithPassword,
  signUpWithPassword,
  signInWithMagicLink,
} from "./actions";

type Mode = "password" | "magic-link";

export default function LoginForm() {
  const [mode, setMode] = useState<Mode>("password");
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setMessage(null);

    startTransition(async () => {
      let result;

      if (mode === "magic-link") {
        result = await signInWithMagicLink(formData);
      } else if (isSignUp) {
        result = await signUpWithPassword(formData);
      } else {
        result = await signInWithPassword(formData);
      }

      if (result && "error" in result && result.error) {
        setMessage({ type: "error", text: result.error });
      } else if (result && "success" in result && result.success) {
        setMessage({ type: "success", text: result.success });
      }
    });
  }

  return (
    <div className="w-full">
      {/* Segmented Mode Switcher */}
      <div className="flex mb-6 rounded-xl bg-zinc-950 p-1 border border-zinc-800/80">
        <button
          type="button"
          onClick={() => {
            setMode("password");
            setMessage(null);
          }}
          aria-pressed={mode === "password"}
          className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all duration-150 ${
            mode === "password"
              ? "bg-zinc-800 text-white shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("magic-link");
            setMessage(null);
          }}
          aria-pressed={mode === "magic-link"}
          className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all duration-150 ${
            mode === "magic-link"
              ? "bg-zinc-800 text-white shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Magic Link
        </button>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-zinc-300 mb-1.5">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-xl bg-zinc-950/80 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
          />
        </div>

        {mode === "password" && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-xs font-medium text-zinc-300">
                Password
              </label>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              placeholder="••••••••"
              className="w-full rounded-xl bg-zinc-950/80 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
            />
          </div>
        )}

        {/* Message Alert Banner */}
        {message && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}
          >
            {message.type === "error" ? (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{message.text}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 text-sm font-semibold shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {isPending
            ? "Authenticating..."
            : mode === "magic-link"
              ? "Send Magic Link"
              : isSignUp
                ? "Create Account"
                : "Sign In"}
        </button>
      </form>

      {mode === "password" && (
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setMessage(null);
          }}
          className="mt-5 text-xs text-zinc-400 hover:text-indigo-400 transition-colors w-full text-center font-medium"
        >
          {isSignUp ? "Already have an account? Sign in" : "Need an account? Create one"}
        </button>
      )}
    </div>
  );
}

