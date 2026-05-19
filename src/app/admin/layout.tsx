"use client";

import { createClient } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DVLogo } from "@/components/shared/DVLogo";
import { GlassCard } from "@/components/shared/GlassCard";

type AdminLayoutProps = {
  children: ReactNode;
};

type AuthStatus = "checking" | "authorized" | "denied";

function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function hasSupabaseBrowserConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoginPage) {
      return;
    }

    async function protectAdminRoute() {
      if (!hasSupabaseBrowserConfig()) {
        router.replace("/admin/login");
        return;
      }

      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/admin/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError || profile?.role !== "admin") {
          setStatus("denied");
          return;
        }

        setStatus("authorized");
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to verify admin access.",
        );
        setStatus("denied");
      }
    }

    void protectAdminRoute();
  }, [isLoginPage, router]);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  if (isLoginPage) {
    return children;
  }

  if (status === "checking") {
    return (
      <main className="gradient-aurora flex min-h-screen items-center justify-center px-5">
        <GlassCard className="p-6 text-center">
          <p className="text-sm text-slate-300">Checking admin access...</p>
        </GlassCard>
      </main>
    );
  }

  if (status === "denied") {
    return (
      <main className="gradient-aurora flex min-h-screen items-center justify-center px-5">
        <GlassCard className="max-w-md p-6 text-center">
          <h1 className="text-2xl font-semibold text-white">Access denied</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {error || "You do not have admin access for this portfolio."}
          </p>
        </GlassCard>
      </main>
    );
  }

  return (
    <div className="gradient-aurora min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <Link
            href="/admin"
            className="flex items-center gap-3 text-sm font-semibold text-white transition-colors duration-200 hover:text-cyan-200"
          >
            <DVLogo />
            <span>Admin Dashboard</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 transition-colors duration-200 hover:bg-white/10"
          >
            <LogOut size={16} />
            Logout
          </button>
        </nav>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
}
