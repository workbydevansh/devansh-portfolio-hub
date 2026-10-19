"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import type { Certificate } from "@/lib/supabase/types";
import { formatDate } from "@/lib/utils";

export function CertificateTable({
  onMutate,
}: {
  onMutate: () => Promise<void>;
}) {
  return (
    <AdminTable<Certificate>
      table="certificates"
      noun="certificate"
      minWidthClassName="min-w-[780px]"
      onMutate={onMutate}
      orderBy={[
        { column: "issue_date", ascending: false },
        { column: "created_at", ascending: false },
      ]}
      columns={[
        { header: "Title", cell: (certificate) => certificate.title },
        { header: "Issuer", cell: (certificate) => certificate.issuer ?? "Not added" },
        { header: "Category", cell: (certificate) => certificate.category ?? "Certificate" },
        { header: "Issue Date", cell: (certificate) => formatDate(certificate.issue_date) },
      ]}
    />
  );
}
