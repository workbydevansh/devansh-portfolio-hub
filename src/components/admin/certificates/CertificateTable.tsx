"use client";

import { createClient } from "@supabase/supabase-js";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import type { Certificate } from "@/lib/supabase/types";

type CertificateTableProps = {
  onMutate: () => Promise<void>;
};

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

export function CertificateTable({ onMutate }: CertificateTableProps) {
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadCertificates() {
    setError("");
    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: loadError } = await supabase
        .from("certificates")
        .select("*")
        .order("issue_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (loadError) {
        setError(loadError.message);
        return;
      }

      setCertificates((data ?? []) as Certificate[]);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load certificates.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialCertificates() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error: loadError } = await supabase
          .from("certificates")
          .select("*")
          .order("issue_date", { ascending: false })
          .order("created_at", { ascending: false });

        if (!isMounted) {
          return;
        }

        if (loadError) {
          setError(loadError.message);
          return;
        }

        setCertificates((data ?? []) as Certificate[]);
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load certificates.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialCertificates();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleDelete(certificate: Certificate) {
    const confirmed = window.confirm(
      `Delete "${certificate.title}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");
    setDeletingId(certificate.id);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: deleteError } = await supabase
        .from("certificates")
        .delete()
        .eq("id", certificate.id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      setMessage("Certificate deleted successfully.");
      await onMutate();
      await loadCertificates();
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete certificate.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <GlassCard className="overflow-hidden">
      <div className="border-b border-white/10 p-5">
        <h2 className="text-xl font-semibold text-white">All Certificates</h2>
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
            Loading certificates...
          </p>
        </div>
      ) : certificates.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 text-sm text-slate-400">
                <th className="px-5 py-4 font-medium">Title</th>
                <th className="px-5 py-4 font-medium">Issuer</th>
                <th className="px-5 py-4 font-medium">Category</th>
                <th className="px-5 py-4 font-medium">Issue Date</th>
                <th className="px-5 py-4 font-medium">Created At</th>
                <th className="px-5 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((certificate) => (
                <tr key={certificate.id} className="border-b border-white/10">
                  <td className="px-5 py-4 text-sm font-semibold text-white">
                    {certificate.title}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {certificate.issuer ?? "Not added"}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {certificate.category ?? "Certificate"}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {formatDate(certificate.issue_date)}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {formatDate(certificate.created_at)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/certificates/${certificate.id}/edit`}
                        className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-100 transition-colors duration-200 hover:bg-white/10"
                      >
                        <Pencil size={14} />
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={deletingId === certificate.id}
                        onClick={() => void handleDelete(certificate)}
                        className="inline-flex items-center gap-2 rounded-md border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm font-semibold text-rose-100 transition-colors duration-200 hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <Trash2 size={14} />
                        {deletingId === certificate.id
                          ? "Deleting..."
                          : "Delete"}
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
            No certificates added yet.
          </p>
        </div>
      )}
    </GlassCard>
  );
}
