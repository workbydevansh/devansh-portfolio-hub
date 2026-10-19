"use client";

import { motion } from "motion/react";
import { Loader2, LogIn } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { DVLogo } from "@/components/shared/DVLogo";
import { GlassCard } from "@/components/shared/GlassCard";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getErrorMessage } from "@/lib/utils";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.replace("/admin");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to sign in."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="gradient-aurora flex min-h-screen items-center justify-center px-5 py-12">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <GlassCard className="p-6 sm:p-8">
          <div className="mb-8 text-center">
            <DVLogo className="mx-auto mb-5 h-12 w-12" />
            <h1 className="text-3xl font-semibold text-white">Admin Login</h1>
            <p className="mt-3 text-sm text-zinc-300">
              Sign in to manage Devansh Portfolio Hub.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-200">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-md border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-white outline-none transition-colors duration-200 placeholder:text-zinc-500 focus:border-cyan-300/40 focus:bg-white/10"
                placeholder="admin@example.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-200">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-md border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-white outline-none transition-colors duration-200 placeholder:text-zinc-500 focus:border-cyan-300/40 focus:bg-white/10"
                placeholder="Password"
              />
            </label>

            {error ? (
              <p className="rounded-md border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/15 px-4 py-3 text-sm font-semibold text-cyan-100 transition-colors duration-200 hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <LogIn size={16} />
              )}
              Login
            </button>
          </form>
        </GlassCard>
      </motion.div>
    </main>
  );
}
