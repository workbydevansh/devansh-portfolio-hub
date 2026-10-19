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
import type { Project } from "@/lib/supabase/types";
import {
  acceptAttribute,
  uploadPublicFile,
  uploadRules,
  validateUpload,
} from "@/lib/uploads";
import { getUrlFieldsError } from "@/lib/url";
import { getErrorMessage, nullableValue } from "@/lib/utils";

type ProjectFormProps = {
  mode: "create" | "edit";
  projectId?: string;
};

type ProjectFormState = {
  title: string;
  short_description: string;
  long_description: string;
  tech_stack: string;
  github_url: string;
  live_url: string;
  demo_url: string;
  case_study_url: string;
  image_url: string;
  category: string;
  featured: boolean;
  display_order: string;
};

const initialFormState: ProjectFormState = {
  title: "",
  short_description: "",
  long_description: "",
  tech_stack: "",
  github_url: "",
  live_url: "",
  demo_url: "",
  case_study_url: "",
  image_url: "",
  category: "Project",
  featured: false,
  display_order: "0",
};






function projectToFormState(project: Project): ProjectFormState {
  return {
    title: project.title,
    short_description: project.short_description,
    long_description: project.long_description ?? "",
    tech_stack: project.tech_stack?.join(", ") ?? "",
    github_url: project.github_url ?? "",
    live_url: project.live_url ?? "",
    demo_url: project.demo_url ?? "",
    case_study_url: project.case_study_url ?? "",
    image_url: project.image_url ?? "",
    category: project.category ?? "Project",
    featured: Boolean(project.featured),
    display_order: String(project.display_order ?? 0),
  };
}

export function ProjectForm({ mode, projectId }: ProjectFormProps) {
  const router = useRouter();
  const [formState, setFormState] =
    useState<ProjectFormState>(initialFormState);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !projectId) {
      return;
    }

    async function loadProject() {
      setError("");
      setIsLoading(true);

      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error: loadError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (loadError) {
          setError(loadError.message);
          return;
        }

        setFormState(projectToFormState(data as Project));
      } catch (caughtError) {
        setError(getErrorMessage(caughtError, "Unable to load project."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadProject();
  }, [mode, projectId]);

  function updateField<T extends keyof ProjectFormState>(
    field: T,
    value: ProjectFormState[T],
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

    if (!formState.short_description.trim()) {
      return "Short description is required.";
    }

    const urlError = getUrlFieldsError({
      "GitHub URL": formState.github_url,
      "Live URL": formState.live_url,
      "Demo URL": formState.demo_url,
      "Case Study URL": formState.case_study_url,
      "Image URL": formState.image_url,
    });

    if (urlError) {
      return urlError;
    }

    return validateUpload(selectedImageFile, uploadRules.projectImage);
  }

  function getPayload(imageUrl = formState.image_url) {
    return {
      title: formState.title.trim(),
      short_description: formState.short_description.trim(),
      long_description: nullableValue(formState.long_description),
      tech_stack: formState.tech_stack
        .split(",")
        .map((tech) => tech.trim())
        .filter(Boolean),
      github_url: nullableValue(formState.github_url),
      live_url: nullableValue(formState.live_url),
      demo_url: nullableValue(formState.demo_url),
      case_study_url: nullableValue(formState.case_study_url),
      image_url: nullableValue(imageUrl),
      category: formState.category.trim() || "Project",
      featured: formState.featured,
      display_order: Number(formState.display_order) || 0,
    };
  }

  async function uploadProjectImage() {
    if (!selectedImageFile) {
      return formState.image_url;
    }

    const { publicUrl } = await uploadPublicFile(
      selectedImageFile,
      uploadRules.projectImage,
    );

    return publicUrl;
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
      const supabase = getSupabaseBrowserClient();
      const imageUrl = await uploadProjectImage();
      const payload = getPayload(imageUrl);

      if (mode === "create") {
        const { error: createError } = await supabase
          .from("projects")
          .insert(payload);

        if (createError) {
          setError(createError.message);
          return;
        }

        setSuccess("Project created successfully.");
      } else {
        const { error: updateError } = await supabase
          .from("projects")
          .update(payload)
          .eq("id", projectId);

        if (updateError) {
          setError(updateError.message);
          return;
        }

        setSuccess("Project updated successfully.");
      }

      router.push("/admin/projects");
      router.refresh();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to save project."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <GlassCard className="p-6 text-center">
        <p className="text-sm text-zinc-300">Loading project...</p>
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
          label="Short Description"
          value={formState.short_description}
          onChange={(value) => updateField("short_description", value)}
          required
        />

        <TextArea
          label="Long Description"
          value={formState.long_description}
          onChange={(value) => updateField("long_description", value)}
          rows={5}
        />

        <TextInput
          label="Tech Stack"
          value={formState.tech_stack}
          onChange={(value) => updateField("tech_stack", value)}
          placeholder="Next.js, TypeScript, Supabase"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            label="GitHub URL"
            value={formState.github_url}
            onChange={(value) => updateField("github_url", value)}
          />
          <TextInput
            label="Live URL"
            value={formState.live_url}
            onChange={(value) => updateField("live_url", value)}
          />
          <TextInput
            label="Demo URL"
            value={formState.demo_url}
            onChange={(value) => updateField("demo_url", value)}
          />
          <TextInput
            label="Case Study URL"
            value={formState.case_study_url}
            onChange={(value) => updateField("case_study_url", value)}
          />
        </div>

        <TextInput
          label="Image URL"
          value={formState.image_url}
          onChange={(value) => updateField("image_url", value)}
        />

        <FileInput
          label="Project Image"
          accept={acceptAttribute(uploadRules.projectImage)}
          hint="Optional. PNG, JPG, JPEG, or WEBP. Max size 10MB."
          onFileChange={(file) => {
            setSelectedImageFile(file);
            setError(validateUpload(file, uploadRules.projectImage));
          }}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            label="Display Order"
            type="number"
            value={formState.display_order}
            onChange={(value) => updateField("display_order", value)}
          />

          <label className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 py-3">
            <input
              type="checkbox"
              checked={formState.featured}
              onChange={(event) => updateField("featured", event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-zinc-950"
            />
            <span className="text-sm font-medium text-zinc-200">Featured</span>
          </label>
        </div>

        <Notice tone="error" message={error} />

        <Notice tone="success" message={success} />

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/admin/projects"
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
                ? "Create Project"
                : "Update Project"}
          </button>
        </div>
      </form>
    </GlassCard>
  );
}
