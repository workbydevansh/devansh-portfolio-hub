"use client";

import { FilteredCardGrid } from "@/components/shared/FilteredCardGrid";
import type { Certificate } from "@/lib/supabase/types";
import { CertificateCard } from "./CertificateCard";

const categoryAliases = {
  Hackathon: ["hackathon", "hackathons"],
  Course: ["course", "courses"],
  Internship: ["internship", "internships"],
  Coding: ["coding"],
  Academic: ["academic", "academics"],
};

export function CertificateFilters({
  certificates,
}: {
  certificates: Certificate[];
}) {
  return (
    <FilteredCardGrid
      items={certificates}
      noun="certificates"
      categoryAliases={categoryAliases}
      getCategory={(certificate) => certificate.category}
      getSearchText={(certificate) => [
        certificate.title,
        certificate.issuer,
        certificate.category,
      ]}
      searchPlaceholder="Search title, issuer, or category"
      renderCard={(certificate) => <CertificateCard certificate={certificate} />}
    />
  );
}
