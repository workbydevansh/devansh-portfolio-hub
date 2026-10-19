"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  FileInput,
  Notice,
  TextArea,
  TextInput,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/admin/FormFields";
import { GlassCard } from "@/components/shared/GlassCard";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Certificate } from "@/lib/supabase/types";
import {
  acceptAttribute,
  uploadPublicFile,
  uploadRules,
  validateUpload,
} from "@/lib/uploads";
import { getUrlFieldsError } from "@/lib/url";
import { getErrorMessage, nullableValue } from "@/lib/utils";

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
        const supabase = getSupabaseBrowserClient();
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

        setError(getErrorMessage(caughtError, "Unable to load certificate."));
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

    const urlError = getUrlFieldsError({
      "Credential URL": formState.credential_url,
      "Certificate URL": formState.certificate_url,
    });

    if (urlError) {
      return urlError;
    }

    return validateUpload(selectedFile, uploadRules.certificate);
  }

  async function uploadCertificateFile() {
    if (!selectedFile) {
      return {
        certificateUrl: formState.certificate_url,
        filePath: formState.file_path,
      };
    }

    const { path, publicUrl } = await uploadPublicFile(
      selectedFile,
      uploadRules.certificate,
    );

    return { certificateUrl: publicUrl, filePath: path };
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
      const supabase = getSupabaseBrowserClient();
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
      setError(getErrorMessage(caughtError, "Unable to save certificate."));
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

        <FileInput
          label="Certificate File"
          accept={acceptAttribute(uploadRules.certificate)}
          hint="PDF, PNG, JPG, JPEG, or WEBP. Max size 10MB."
          onFileChange={(file) => {
            setSelectedFile(file);
            setError(validateUpload(file, uploadRules.certificate));
          }}
        >
          {formState.file_path ? (
            <p className="mt-2 text-xs text-slate-400">
              Current storage path: {formState.file_path}
            </p>
          ) : null}
        </FileInput>

        <Notice tone="error" message={error} />

        <Notice tone="success" message={success} />

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/admin/certificates"
            className={secondaryButtonClassName}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className={primaryButtonClassName}
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
