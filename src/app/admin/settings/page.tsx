"use client";

import { createClient } from "@supabase/supabase-js";
import { Pencil, Trash2, Upload } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import type { SocialLink } from "@/lib/supabase/types";

type SocialLinkFormState = {
  platform: string;
  url: string;
  display_order: string;
};

const initialSocialLinkForm: SocialLinkFormState = {
  platform: "",
  url: "",
  display_order: "0",
};

const maxResumeFileSize = 10 * 1024 * 1024;

function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function createResumePath(file: File) {
  const baseName =
    file.name
      .replace(/\.pdf$/i, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "resume";

  return `uploads/${crypto.randomUUID()}-${baseName}.pdf`;
}

function validateResumeFile(file: File | null) {
  if (!file) {
    return "Please select a resume PDF.";
  }

  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    return "Resume file must be a PDF.";
  }

  if (file.size > maxResumeFileSize) {
    return "Resume file size must be 10MB or less.";
  }

  return "";
}

export default function AdminSettingsPage() {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [formState, setFormState] =
    useState<SocialLinkFormState>(initialSocialLinkForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSettings() {
    setError("");

    try {
      const supabase = createSupabaseBrowserClient();
      const [{ data: links, error: linksError }, { data: resumeSetting }] =
        await Promise.all([
          supabase
            .from("social_links")
            .select("*")
            .order("display_order", { ascending: true })
            .order("created_at", { ascending: true }),
          supabase
            .from("portfolio_settings")
            .select("value")
            .eq("key", "resume_url")
            .maybeSingle(),
        ]);

      if (linksError) {
        setError(linksError.message);
        return;
      }

      setSocialLinks((links ?? []) as SocialLink[]);
      setResumeUrl(
        typeof resumeSetting?.value === "string" ? resumeSetting.value : "",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load settings.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialSettings() {
      try {
        const supabase = createSupabaseBrowserClient();
        const [{ data: links, error: linksError }, { data: resumeSetting }] =
          await Promise.all([
            supabase
              .from("social_links")
              .select("*")
              .order("display_order", { ascending: true })
              .order("created_at", { ascending: true }),
            supabase
              .from("portfolio_settings")
              .select("value")
              .eq("key", "resume_url")
              .maybeSingle(),
          ]);

        if (!isMounted) {
          return;
        }

        if (linksError) {
          setError(linksError.message);
          return;
        }

        setSocialLinks((links ?? []) as SocialLink[]);
        setResumeUrl(
          typeof resumeSetting?.value === "string" ? resumeSetting.value : "",
        );
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load settings.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  function startEdit(link: SocialLink) {
    setEditingId(link.id);
    setFormState({
      platform: link.platform,
      url: link.url,
      display_order: String(link.display_order ?? 0),
    });
    setMessage("");
    setError("");
  }

  function resetSocialLinkForm() {
    setEditingId(null);
    setFormState(initialSocialLinkForm);
  }

  function validateSocialLink() {
    if (!formState.platform.trim()) {
      return "Platform is required.";
    }

    if (!formState.url.trim()) {
      return "URL is required.";
    }

    return "";
  }

  async function handleSocialLinkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const validationError = validateSocialLink();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSavingLink(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const payload = {
        platform: formState.platform.trim(),
        url: formState.url.trim(),
        display_order: Number(formState.display_order) || 0,
      };
      const { error: saveError } = editingId
        ? await supabase.from("social_links").update(payload).eq("id", editingId)
        : await supabase.from("social_links").insert(payload);

      if (saveError) {
        setError(saveError.message);
        return;
      }

      setMessage(
        editingId
          ? "Social link updated successfully."
          : "Social link added successfully.",
      );
      resetSocialLinkForm();
      await loadSettings();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save social link.",
      );
    } finally {
      setIsSavingLink(false);
    }
  }

  async function handleDeleteSocialLink(link: SocialLink) {
    const confirmed = window.confirm(`Delete "${link.platform}" link?`);

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: deleteError } = await supabase
        .from("social_links")
        .delete()
        .eq("id", link.id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      setMessage("Social link deleted successfully.");
      await loadSettings();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete social link.",
      );
    }
  }

  async function handleResumeUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const validationError = validateResumeFile(resumeFile);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploadingResume(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const file = resumeFile as File;
      const filePath = createResumePath(file);
      const { error: uploadError } = await supabase.storage
        .from("resume")
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from("resume").getPublicUrl(filePath);
      const { error: settingError } = await supabase
        .from("portfolio_settings")
        .upsert(
          {
            key: "resume_url",
            value: data.publicUrl,
          },
          { onConflict: "key" },
        );

      if (settingError) {
        setError(settingError.message);
        return;
      }

      setResumeFile(null);
      setResumeUrl(data.publicUrl);
      setMessage("Resume uploaded successfully.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to upload resume.",
      );
    } finally {
      setIsUploadingResume(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mb-8">
        <p className="text-sm font-medium text-cyan-300">Admin Settings</p>
        <h1 className="mt-2 text-4xl font-semibold text-white">
          Social Links and Resume
        </h1>
      </div>

      {message ? (
        <p className="mb-5 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mb-5 rounded-md border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <GlassCard className="p-6 text-center">
          <p className="text-sm text-slate-300">Loading settings...</p>
        </GlassCard>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <GlassCard className="p-5 sm:p-6">
            <h2 className="text-2xl font-semibold text-white">Social Links</h2>
            <form className="mt-5 space-y-4" onSubmit={handleSocialLinkSubmit}>
              <div className="grid gap-4 sm:grid-cols-[1fr_1fr_140px]">
                <TextInput
                  label="Platform"
                  value={formState.platform}
                  onChange={(value) =>
                    setFormState((current) => ({
                      ...current,
                      platform: value,
                    }))
                  }
                  required
                />
                <TextInput
                  label="URL"
                  value={formState.url}
                  onChange={(value) =>
                    setFormState((current) => ({
                      ...current,
                      url: value,
                    }))
                  }
                  required
                />
                <TextInput
                  label="Order"
                  type="number"
                  value={formState.display_order}
                  onChange={(value) =>
                    setFormState((current) => ({
                      ...current,
                      display_order: value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSavingLink}
                  className="inline-flex items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-300/15 px-4 py-3 text-sm font-semibold text-cyan-100 transition-colors duration-200 hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSavingLink
                    ? "Saving..."
                    : editingId
                      ? "Update Link"
                      : "Add Link"}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={resetSocialLinkForm}
                    className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition-colors duration-200 hover:bg-white/10"
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className="mt-6 overflow-x-auto">
              {socialLinks.length ? (
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-sm text-slate-400">
                      <th className="py-3 pr-4 font-medium">Platform</th>
                      <th className="py-3 pr-4 font-medium">URL</th>
                      <th className="py-3 pr-4 font-medium">Order</th>
                      <th className="py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {socialLinks.map((link) => (
                      <tr key={link.id} className="border-b border-white/10">
                        <td className="py-3 pr-4 text-sm font-semibold text-white">
                          {link.platform}
                        </td>
                        <td className="py-3 pr-4 text-sm text-slate-300">
                          {link.url}
                        </td>
                        <td className="py-3 pr-4 text-sm text-slate-300">
                          {link.display_order ?? 0}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(link)}
                              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-100 transition-colors duration-200 hover:bg-white/10"
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteSocialLink(link)}
                              className="inline-flex items-center gap-2 rounded-md border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm font-semibold text-rose-100 transition-colors duration-200 hover:bg-rose-400/20"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="rounded-md border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
                  No social links added yet.
                </p>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <h2 className="text-2xl font-semibold text-white">Resume</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Upload a PDF resume to the resume storage bucket.
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleResumeUpload}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Resume PDF
                </span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setResumeFile(file);
                    setError(file ? validateResumeFile(file) : "");
                  }}
                  className="w-full rounded-md border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-slate-200 file:mr-4 file:rounded-md file:border-0 file:bg-cyan-300/15 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-cyan-100 hover:file:bg-cyan-300/25"
                />
                <p className="mt-2 text-xs text-slate-400">
                  PDF only. Max size 10MB.
                </p>
              </label>

              <button
                type="submit"
                disabled={isUploadingResume}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/15 px-4 py-3 text-sm font-semibold text-cyan-100 transition-colors duration-200 hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Upload size={16} />
                {isUploadingResume ? "Uploading..." : "Upload Resume"}
              </button>
            </form>

            {resumeUrl ? (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex text-sm font-semibold text-cyan-200 transition-colors duration-200 hover:text-white"
              >
                Current resume URL
              </a>
            ) : (
              <p className="mt-5 rounded-md border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
                No resume uploaded yet.
              </p>
            )}
          </GlassCard>
        </div>
      )}
    </main>
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
