"use client";

import { createClient } from "@supabase/supabase-js";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import type { Project } from "@/lib/supabase/types";

function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function formatDate(date: string | null) {
  if (!date) {
    return "Not added";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

export function ProjectTable() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadProjects() {
    setError("");
    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: loadError } = await supabase
        .from("projects")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (loadError) {
        setError(loadError.message);
        return;
      }

      setProjects((data ?? []) as Project[]);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load projects.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialProjects() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error: loadError } = await supabase
          .from("projects")
          .select("*")
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: false });

        if (!isMounted) {
          return;
        }

        if (loadError) {
          setError(loadError.message);
          return;
        }

        setProjects((data ?? []) as Project[]);
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load projects.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleDelete(project: Project) {
    const confirmed = window.confirm(
      `Delete "${project.title}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");
    setDeletingId(project.id);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: deleteError } = await supabase
        .from("projects")
        .delete()
        .eq("id", project.id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      setMessage("Project deleted successfully.");
      await loadProjects();
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete project.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <GlassCard className="overflow-hidden">
      <div className="border-b border-white/10 p-5">
        <h2 className="text-xl font-semibold text-white">All Projects</h2>
      </div>

      {message ? (
        <p className="mx-5 mt-5 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mx-5 mt-5 rounded-md border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <div className="p-5">
          <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
            Loading projects...
          </p>
        </div>
      ) : projects.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 text-sm text-slate-400">
                <th className="px-5 py-4 font-medium">Title</th>
                <th className="px-5 py-4 font-medium">Category</th>
                <th className="px-5 py-4 font-medium">Featured</th>
                <th className="px-5 py-4 font-medium">Display Order</th>
                <th className="px-5 py-4 font-medium">Created At</th>
                <th className="px-5 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-white/10">
                  <td className="px-5 py-4 text-sm font-semibold text-white">
                    {project.title}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {project.category ?? "Project"}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {project.featured ? "Yes" : "No"}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {project.display_order ?? 0}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {formatDate(project.created_at)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/projects/${project.id}/edit`}
                        className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-100 transition-colors duration-200 hover:bg-white/10"
                      >
                        <Pencil size={14} />
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={deletingId === project.id}
                        onClick={() => void handleDelete(project)}
                        className="inline-flex items-center gap-2 rounded-md border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm font-semibold text-rose-100 transition-colors duration-200 hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <Trash2 size={14} />
                        {deletingId === project.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-5">
          <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
            No projects added yet.
          </p>
        </div>
      )}
    </GlassCard>
  );
}
