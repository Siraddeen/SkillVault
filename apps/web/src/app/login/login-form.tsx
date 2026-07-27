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
        // signInWithPassword redirects on success, so if we get here
        // with no error, something unexpected happened
      }

      if (result?.error) {
        setMessage({ type: "error", text: result.error });
      } else if (result?.success) {
        setMessage({ type: "success", text: result.success });
      }
    });
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="flex mb-6 rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("password");
            setMessage(null);
          }}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
            mode === "password" ? "bg-white shadow text-gray-900" : "text-gray-500"
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
          className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
            mode === "magic-link" ? "bg-white shadow text-gray-900" : "text-gray-500"
          }`}
        >
          Magic Link
        </button>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {mode === "password" && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {message && (
          <p
            className={`text-sm ${
              message.type === "error" ? "text-red-600" : "text-green-600"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {isPending
            ? "Please wait..."
            : mode === "magic-link"
              ? "Send magic link"
              : isSignUp
                ? "Sign up"
                : "Sign in"}
        </button>
      </form>

      {mode === "password" && (
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setMessage(null);
          }}
          className="mt-4 text-sm text-indigo-600 hover:underline w-full text-center"
        >
          {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
        </button>
      )}
    </div>
  );
}
