"use client";

import { Pencil, Trash2, Upload } from "lucide-react";
import { FormEvent, useState } from "react";
import {
  FileInput,
  Notice,
  TextInput,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/admin/FormFields";
import { GlassCard } from "@/components/shared/GlassCard";
import { isEmailPlatform } from "@/lib/social-links";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { SocialLink } from "@/lib/supabase/types";
import { useSupabaseQuery } from "@/lib/supabase/useSupabaseQuery";
import {
  acceptAttribute,
  uploadPublicFile,
  uploadRules,
  validateUpload,
} from "@/lib/uploads";
import { isEmailAddress, isHttpUrl, safeUrl } from "@/lib/url";
import { getErrorMessage } from "@/lib/utils";

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

const emptySettings = { socialLinks: [] as SocialLink[], resumeUrl: "" };

async function loadSettings() {
  const supabase = getSupabaseBrowserClient();
  const [links, resumeSetting] = await Promise.all([
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
  const resumeUrl = resumeSetting.data?.value;

  return {
    data: {
      socialLinks: (links.data ?? []) as SocialLink[],
      resumeUrl: typeof resumeUrl === "string" ? resumeUrl : "",
    },
    error: links.error,
  };
}

export default function AdminSettingsPage() {
  const [formState, setFormState] =
    useState<SocialLinkFormState>(initialSocialLinkForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const {
    data: { socialLinks, resumeUrl },
    error: loadError,
    isLoading,
    reload,
  } = useSupabaseQuery(loadSettings, emptySettings, "Unable to load settings.");

  function updateForm(field: keyof SocialLinkFormState, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

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

    if (isEmailPlatform(formState.platform)) {
      return isEmailAddress(formState.url.trim().replace(/^mailto:/i, ""))
        ? ""
        : "Email links must be an email address, like you@example.com.";
    }

    return isHttpUrl(formState.url)
      ? ""
      : "URL must be a full link starting with https:// or http://.";
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
      const socialLinksTable = getSupabaseBrowserClient().from("social_links");
      const payload = {
        platform: formState.platform.trim(),
        url: formState.url.trim(),
        display_order: Number(formState.display_order) || 0,
      };
      const { error: saveError } = editingId
        ? await socialLinksTable.update(payload).eq("id", editingId)
        : await socialLinksTable.insert(payload);

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
      reload();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to save social link."));
    } finally {
      setIsSavingLink(false);
    }
  }

  async function handleDeleteSocialLink(link: SocialLink) {
    if (!window.confirm(`Delete "${link.platform}" link?`)) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const { error: deleteError } = await getSupabaseBrowserClient()
        .from("social_links")
        .delete()
        .eq("id", link.id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      setMessage("Social link deleted successfully.");
      reload();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to delete social link."));
    }
  }

  async function handleResumeUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!resumeFile) {
      setError("Please select a resume PDF.");
      return;
    }

    const validationError = validateUpload(resumeFile, uploadRules.resume);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploadingResume(true);

    try {
      const { publicUrl } = await uploadPublicFile(resumeFile, uploadRules.resume);
      const { error: settingError } = await getSupabaseBrowserClient()
        .from("portfolio_settings")
        .upsert({ key: "resume_url", value: publicUrl }, { onConflict: "key" });

      if (settingError) {
        setError(settingError.message);
        return;
      }

      setResumeFile(null);
      setMessage("Resume uploaded successfully.");
      reload();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to upload resume."));
    } finally {
      setIsUploadingResume(false);
    }
  }

  const safeResumeUrl = safeUrl(resumeUrl);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mb-8">
        <p className="text-sm font-medium text-cyan-300">Admin Settings</p>
        <h1 className="mt-2 text-4xl font-semibold text-white">
          Social Links and Resume
        </h1>
      </div>

      <Notice tone="success" message={message} className="mb-5" />
      <Notice tone="error" message={error || loadError} className="mb-5" />

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
                  onChange={(value) => updateForm("platform", value)}
                  required
                />
                <TextInput
                  label="URL"
                  value={formState.url}
                  onChange={(value) => updateForm("url", value)}
                  required
                />
                <TextInput
                  label="Order"
                  type="number"
                  value={formState.display_order}
                  onChange={(value) => updateForm("display_order", value)}
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSavingLink}
                  className={primaryButtonClassName}
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
                    className={secondaryButtonClassName}
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
              <FileInput
                label="Resume PDF"
                accept={acceptAttribute(uploadRules.resume)}
                hint="PDF only. Max size 10MB."
                onFileChange={(file) => {
                  setResumeFile(file);
                  setError(validateUpload(file, uploadRules.resume));
                }}
              />

              <button
                type="submit"
                disabled={isUploadingResume}
                className={`${primaryButtonClassName} w-full`}
              >
                <Upload size={16} />
                {isUploadingResume ? "Uploading..." : "Upload Resume"}
              </button>
            </form>

            {safeResumeUrl ? (
              <a
                href={safeResumeUrl}
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
