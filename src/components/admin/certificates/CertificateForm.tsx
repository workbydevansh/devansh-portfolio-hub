"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import type { Certificate } from "@/lib/supabase/types";

type CertificateFormProps = {
  mode: "create" | "edit";
  certificateId?: string;
  onMutate: () => Promise<void>;
};

type CertificateFormState = {
  title: string;
  issuer: string;
  issue_date: string;
  expiry_date: string;
  category: string;
  description: string;
  credential_url: string;
  certificate_url: string;
  file_path: string;
};

const initialFormState: CertificateFormState = {
  title: "",
  issuer: "",
  issue_date: "",
  expiry_date: "",
  category: "Certificate",
  description: "",
  credential_url: "",
  certificate_url: "",
  file_path: "",
};

const allowedMimeTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];
const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
const maxFileSize = 10 * 1024 * 1024;

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

function certificateToFormState(
  certificate: Certificate,
): CertificateFormState {
  return {
    title: certificate.title,
    issuer: certificate.issuer ?? "",
    issue_date: certificate.issue_date ?? "",
    expiry_date: certificate.expiry_date ?? "",
    category: certificate.category ?? "Certificate",
    description: certificate.description ?? "",
    credential_url: certificate.credential_url ?? "",
    certificate_url: certificate.certificate_url ?? "",
    file_path: certificate.file_path ?? "",
  };
}

function validateFile(file: File | null) {
  if (!file) {
    return "";
  }

  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = allowedExtensions.some((extension) =>
    lowerName.endsWith(extension),
  );
  const hasAllowedMimeType = allowedMimeTypes.includes(file.type);

  if (!hasAllowedExtension && !hasAllowedMimeType) {
    return "Only PDF, PNG, JPG, JPEG, and WEBP files are allowed.";
  }

  if (file.size > maxFileSize) {
    return "File size must be 10MB or less.";
  }

  return "";
}

function createStoragePath(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "file";
  const baseName =
    file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "certificate";

  return `uploads/${crypto.randomUUID()}-${baseName}.${extension}`;
}

export function CertificateForm({
  mode,
  certificateId,
  onMutate,
}: CertificateFormProps) {
  const router = useRouter();
  const [formState, setFormState] =
    useState<CertificateFormState>(initialFormState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !certificateId) {
      return;
    }

    let isMounted = true;

    async function loadCertificate() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error: loadError } = await supabase
          .from("certificates")
          .select("*")
          .eq("id", certificateId)
          .single();

        if (!isMounted) {
          return;
        }

        if (loadError) {
          setError(loadError.message);
          return;
        }

        setFormState(certificateToFormState(data as Certificate));
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load certificate.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadCertificate();

    return () => {
      isMounted = false;
    };
  }, [mode, certificateId]);

  function updateField<T extends keyof CertificateFormState>(
    field: T,
    value: CertificateFormState[T],
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

    return validateFile(selectedFile);
  }

  async function uploadCertificateFile() {
    if (!selectedFile) {
      return {
        certificateUrl: formState.certificate_url,
        filePath: formState.file_path,
      };
    }

    const supabase = createSupabaseBrowserClient();
    const filePath = createStoragePath(selectedFile);
    const { error: uploadError } = await supabase.storage
      .from("certificates")
      .upload(filePath, selectedFile, {
        cacheControl: "3600",
        contentType: selectedFile.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from("certificates")
      .getPublicUrl(filePath);

    return {
      certificateUrl: data.publicUrl,
      filePath,
    };
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
      const uploadedFile = await uploadCertificateFile();
      const supabase = createSupabaseBrowserClient();
      const payload = {
        title: formState.title.trim(),
        issuer: nullableValue(formState.issuer),
        issue_date: nullableValue(formState.issue_date),
        expiry_date: nullableValue(formState.expiry_date),
        category: formState.category.trim() || "Certificate",
        description: nullableValue(formState.description),
        credential_url: nullableValue(formState.credential_url),
        certificate_url: nullableValue(uploadedFile.certificateUrl),
        file_path: nullableValue(uploadedFile.filePath),
      };

      if (mode === "create") {
        const { error: createError } = await supabase
          .from("certificates")
          .insert(payload);

        if (createError) {
          setError(createError.message);
          return;
        }

        setSuccess("Certificate created successfully.");
      } else {
        const { error: updateError } = await supabase
          .from("certificates")
          .update(payload)
          .eq("id", certificateId);

        if (updateError) {
          setError(updateError.message);
          return;
        }

        setSuccess("Certificate updated successfully.");
      }

      await onMutate();
      router.push("/admin/certificates");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save certificate.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <GlassCard className="p-6 text-center">
        <p className="text-sm text-slate-300">Loading certificate...</p>
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
            label="Issuer"
            value={formState.issuer}
            onChange={(value) => updateField("issuer", value)}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            label="Issue Date"
            type="date"
            value={formState.issue_date}
            onChange={(value) => updateField("issue_date", value)}
          />
          <TextInput
            label="Expiry Date"
            type="date"
            value={formState.expiry_date}
            onChange={(value) => updateField("expiry_date", value)}
          />
        </div>

        <TextInput
          label="Category"
          value={formState.category}
          onChange={(value) => updateField("category", value)}
        />

        <TextArea
          label="Description"
          value={formState.description}
          onChange={(value) => updateField("description", value)}
          rows={4}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            label="Credential URL"
            value={formState.credential_url}
            onChange={(value) => updateField("credential_url", value)}
          />
          <TextInput
            label="Certificate URL"
            value={formState.certificate_url}
            onChange={(value) => updateField("certificate_url", value)}
          />
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">
            Certificate File
          </span>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              const fileError = validateFile(file);
              setSelectedFile(file);
              setError(fileError);
            }}
            className="w-full rounded-md border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-slate-200 file:mr-4 file:rounded-md file:border-0 file:bg-cyan-300/15 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-cyan-100 hover:file:bg-cyan-300/25"
          />
          <p className="mt-2 text-xs text-slate-400">
            PDF, PNG, JPG, JPEG, or WEBP. Max size 10MB.
          </p>
          {formState.file_path ? (
            <p className="mt-2 text-xs text-slate-400">
              Current storage path: {formState.file_path}
            </p>
          ) : null}
        </label>

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
            href="/admin/certificates"
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
                ? "Create Certificate"
                : "Update Certificate"}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
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
        className="w-full resize-y rounded-md border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-white outline-none transition-colors duration-200 placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-white/10"
      />
    </label>
  );
}
