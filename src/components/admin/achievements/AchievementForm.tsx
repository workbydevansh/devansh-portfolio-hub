"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import type {
  Achievement,
  AchievementCertificate,
  AchievementLink,
} from "@/lib/supabase/types";
import {
  AchievementLinkInput,
  AchievementLinksEditor,
} from "./AchievementLinksEditor";
import { CertificateAttachSelector } from "./CertificateAttachSelector";

type AchievementFormProps = {
  mode: "create" | "edit";
  achievementId?: string;
  onMutate: () => Promise<void>;
};

type AchievementFormState = {
  title: string;
  description: string;
  achievement_date: string;
  category: string;
  organization: string;
  rank_or_result: string;
  proof_url: string;
  display_order: string;
};

const initialFormState: AchievementFormState = {
  title: "",
  description: "",
  achievement_date: "",
  category: "General",
  organization: "",
  rank_or_result: "",
  proof_url: "",
  display_order: "0",
};

function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function nullableValue(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue.length ? trimmedValue : null;
}

function achievementToFormState(
  achievement: Achievement,
): AchievementFormState {
  return {
    title: achievement.title,
    description: achievement.description,
    achievement_date: achievement.achievement_date ?? "",
    category: achievement.category ?? "General",
    organization: achievement.organization ?? "",
    rank_or_result: achievement.rank_or_result ?? "",
    proof_url: achievement.proof_url ?? "",
    display_order: String(achievement.display_order ?? 0),
  };
}

function linkToInput(link: AchievementLink): AchievementLinkInput {
  return {
    id: link.id,
    label: link.label,
    url: link.url,
  };
}

function validLinks(links: AchievementLinkInput[]) {
  return links
    .map((link) => ({
      label: link.label.trim(),
      url: link.url.trim(),
    }))
    .filter((link) => link.label && link.url);
}

export function AchievementForm({
  mode,
  achievementId,
  onMutate,
}: AchievementFormProps) {
  const router = useRouter();
  const [formState, setFormState] =
    useState<AchievementFormState>(initialFormState);
  const [links, setLinks] = useState<AchievementLinkInput[]>([]);
  const [selectedCertificateIds, setSelectedCertificateIds] = useState<string[]>(
    [],
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !achievementId) {
      return;
    }

    let isMounted = true;

    async function loadAchievement() {
      try {
        const supabase = createSupabaseBrowserClient();
        const [
          { data: achievement, error: achievementError },
          { data: achievementLinks, error: linksError },
          { data: certificateRelations, error: certificatesError },
        ] = await Promise.all([
          supabase
            .from("achievements")
            .select("*")
            .eq("id", achievementId)
            .single(),
          supabase
            .from("achievement_links")
            .select("*")
            .eq("achievement_id", achievementId)
            .order("created_at", { ascending: true }),
          supabase
            .from("achievement_certificates")
            .select("*")
            .eq("achievement_id", achievementId),
        ]);

        if (!isMounted) {
          return;
        }

        if (achievementError || linksError || certificatesError) {
          setError(
            achievementError?.message ??
              linksError?.message ??
              certificatesError?.message ??
              "Unable to load achievement.",
          );
          return;
        }

        setFormState(achievementToFormState(achievement as Achievement));
        setLinks(((achievementLinks ?? []) as AchievementLink[]).map(linkToInput));
        setSelectedCertificateIds(
          ((certificateRelations ?? []) as AchievementCertificate[])
            .map((relation) => relation.certificate_id)
            .filter((id): id is string => Boolean(id)),
        );
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load achievement.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadAchievement();

    return () => {
      isMounted = false;
    };
  }, [mode, achievementId]);

  function updateField<T extends keyof AchievementFormState>(
    field: T,
    value: AchievementFormState[T],
  ) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validateForm() {
    if (!formState.title.trim()) {
      return "Title is required.";
    }

    if (!formState.description.trim()) {
      return "Description is required.";
    }

    const hasIncompleteLink = links.some((link) => {
      const hasLabel = Boolean(link.label.trim());
      const hasUrl = Boolean(link.url.trim());
      return hasLabel !== hasUrl;
    });

    if (hasIncompleteLink) {
      return "Each achievement link needs both a label and URL.";
    }

    return "";
  }

  async function saveLinksAndCertificates(savedAchievementId: string) {
    const supabase = createSupabaseBrowserClient();

    if (mode === "edit") {
      const [{ error: deleteLinksError }, { error: deleteCertificatesError }] =
        await Promise.all([
          supabase
            .from("achievement_links")
            .delete()
            .eq("achievement_id", savedAchievementId),
          supabase
            .from("achievement_certificates")
            .delete()
            .eq("achievement_id", savedAchievementId),
        ]);

      if (deleteLinksError || deleteCertificatesError) {
        throw new Error(
          deleteLinksError?.message ??
            deleteCertificatesError?.message ??
            "Unable to replace achievement details.",
        );
      }
    }

    const linksToSave = validLinks(links).map((link) => ({
      achievement_id: savedAchievementId,
      label: link.label,
      url: link.url,
    }));

    if (linksToSave.length) {
      const { error: linksError } = await supabase
        .from("achievement_links")
        .insert(linksToSave);

      if (linksError) {
        throw new Error(linksError.message);
      }
    }

    const certificateRelations = selectedCertificateIds.map((certificateId) => ({
      achievement_id: savedAchievementId,
      certificate_id: certificateId,
    }));

    if (certificateRelations.length) {
      const { error: certificatesError } = await supabase
        .from("achievement_certificates")
        .insert(certificateRelations);

      if (certificatesError) {
        throw new Error(certificatesError.message);
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const payload = {
        title: formState.title.trim(),
        description: formState.description.trim(),
        achievement_date: nullableValue(formState.achievement_date),
        category: formState.category.trim() || "General",
        organization: nullableValue(formState.organization),
        rank_or_result: nullableValue(formState.rank_or_result),
        proof_url: nullableValue(formState.proof_url),
        display_order: Number(formState.display_order) || 0,
      };

      let savedAchievementId = achievementId;

      if (mode === "create") {
        const { data, error: createError } = await supabase
          .from("achievements")
          .insert(payload)
          .select("id")
          .single();

        if (createError) {
          setError(createError.message);
          return;
        }

        savedAchievementId = (data as { id: string }).id;
        setSuccess("Achievement created successfully.");
      } else {
        const { error: updateError } = await supabase
          .from("achievements")
          .update(payload)
          .eq("id", achievementId);

        if (updateError) {
          setError(updateError.message);
          return;
        }

        setSuccess("Achievement updated successfully.");
      }

      if (!savedAchievementId) {
        throw new Error("Achievement id was not returned.");
      }

      await saveLinksAndCertificates(savedAchievementId);
      await onMutate();
      router.push("/admin/achievements");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save achievement.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <GlassCard className="p-6 text-center">
        <p className="text-sm text-slate-300">Loading achievement...</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-5 sm:p-6">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            label="Title"
            value={formState.title}
            onChange={(value) => updateField("title", value)}
            required
          />
          <TextInput
            label="Category"
            value={formState.category}
            onChange={(value) => updateField("category", value)}
          />
        </div>

        <TextArea
          label="Description"
          value={formState.description}
          onChange={(value) => updateField("description", value)}
          required
          rows={4}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            label="Achievement Date"
            type="date"
            value={formState.achievement_date}
            onChange={(value) => updateField("achievement_date", value)}
          />
          <TextInput
            label="Organization"
            value={formState.organization}
            onChange={(value) => updateField("organization", value)}
          />
          <TextInput
            label="Rank / Result"
            value={formState.rank_or_result}
            onChange={(value) => updateField("rank_or_result", value)}
          />
          <TextInput
            label="Display Order"
            type="number"
            value={formState.display_order}
            onChange={(value) => updateField("display_order", value)}
          />
        </div>

        <TextInput
          label="Proof URL"
          value={formState.proof_url}
          onChange={(value) => updateField("proof_url", value)}
        />

        <AchievementLinksEditor links={links} onChange={setLinks} />

        <CertificateAttachSelector
          selectedCertificateIds={selectedCertificateIds}
          onChange={setSelectedCertificateIds}
        />

        {error ? (
          <p className="rounded-md border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-md border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
            {success}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/admin/achievements"
            className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition-colors duration-200 hover:bg-white/10"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-300/15 px-4 py-3 text-sm font-semibold text-cyan-100 transition-colors duration-200 hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting
              ? "Saving..."
              : mode === "create"
                ? "Create Achievement"
                : "Update Achievement"}
          </button>
        </div>
      </form>
    </GlassCard>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-md border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-white outline-none transition-colors duration-200 placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-white/10"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        required={required}
        className="w-full resize-y rounded-md border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-white outline-none transition-colors duration-200 placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-white/10"
      />
    </label>
  );
}
