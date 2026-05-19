"use client";

import { createClient } from "@supabase/supabase-js";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Certificate } from "@/lib/supabase/types";

type CertificateAttachSelectorProps = {
  selectedCertificateIds: string[];
  onChange: (certificateIds: string[]) => void;
};

function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export function CertificateAttachSelector({
  selectedCertificateIds,
  onChange,
}: CertificateAttachSelectorProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadCertificates() {
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

    void loadCertificates();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCertificates = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    if (!normalizedSearch) {
      return certificates;
    }

    return certificates.filter((certificate) =>
      [certificate.title, certificate.issuer, certificate.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [certificates, searchQuery]);

  function toggleCertificate(certificateId: string) {
    if (selectedCertificateIds.includes(certificateId)) {
      onChange(selectedCertificateIds.filter((id) => id !== certificateId));
      return;
    }

    onChange([...selectedCertificateIds, certificateId]);
  }

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">
          Attached Certificates
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Select certificates connected to this achievement.
        </p>
      </div>

      <label className="relative mb-4 block">
        <span className="sr-only">Search certificates</span>
        <Search
          size={17}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search certificates"
          className="w-full rounded-md border border-white/10 bg-white/[0.05] py-2.5 pl-10 pr-3 text-sm text-white outline-none transition-colors duration-200 placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-white/10"
        />
      </label>

      {error ? (
        <p className="rounded-md border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
          Loading certificates...
        </p>
      ) : filteredCertificates.length ? (
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {filteredCertificates.map((certificate) => (
            <label
              key={certificate.id}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-white/10 bg-white/[0.04] p-3 transition-colors duration-200 hover:bg-white/[0.07]"
            >
              <input
                type="checkbox"
                checked={selectedCertificateIds.includes(certificate.id)}
                onChange={() => toggleCertificate(certificate.id)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950"
              />
              <span>
                <span className="block text-sm font-semibold text-white">
                  {certificate.title}
                </span>
                <span className="mt-1 block text-xs text-slate-400">
                  {certificate.issuer ?? "Issuer not added"}
                </span>
              </span>
            </label>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
          No certificates available.
        </p>
      )}
    </section>
  );
}
