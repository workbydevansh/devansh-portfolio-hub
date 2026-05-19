"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import type { Project } from "@/lib/supabase/types";

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

const allowedProjectImageMimeTypes = ["image/png", "image/jpeg", "image/webp"];
const allowedProjectImageExtensions = [".png", ".jpg", ".jpeg", ".webp"];
const maxProjectImageSize = 10 * 1024 * 1024;

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

function validateProjectImage(file: File | null) {
  if (!file) {
    return "";
  }

  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = allowedProjectImageExtensions.some((extension) =>
    lowerName.endsWith(extension),
  );
  const hasAllowedMimeType = allowedProjectImageMimeTypes.includes(file.type);

  if (!hasAllowedExtension && !hasAllowedMimeType) {
    return "Only PNG, JPG, JPEG, and WEBP project images are allowed.";
  }

  if (file.size > maxProjectImageSize) {
    return "Project image size must be 10MB or less.";
  }

  return "";
}

function createProjectImagePath(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "image";
  const baseName =
    file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "project-image";

  return `uploads/${crypto.randomUUID()}-${baseName}.${extension}`;
}

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
        const supabase = createSupabaseBrowserClient();
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
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load project.",
        );
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

    return validateProjectImage(selectedImageFile);
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

    const supabase = createSupabaseBrowserClient();
    const filePath = createProjectImagePath(selectedImageFile);
    const { error: uploadError } = await supabase.storage
      .from("project-images")
      .upload(filePath, selectedImageFile, {
        cacheControl: "3600",
        contentType: selectedImageFile.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from("project-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
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
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save project.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <GlassCard className="p-6 text-center">
        <p className="text-sm text-slate-300">Loading project...</p>
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

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">
            Project Image
          </span>
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              const fileError = validateProjectImage(file);
              setSelectedImageFile(file);
              setError(fileError);
            }}
            className="w-full rounded-md border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-slate-200 file:mr-4 file:rounded-md file:border-0 file:bg-cyan-300/15 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-cyan-100 hover:file:bg-cyan-300/25"
          />
          <p className="mt-2 text-xs text-slate-400">
            Optional. PNG, JPG, JPEG, or WEBP. Max size 10MB.
          </p>
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Display Order
            </span>
            <input
              type="number"
              value={formState.display_order}
              onChange={(event) =>
                updateField("display_order", event.target.value)
              }
              className="w-full rounded-md border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-white outline-none transition-colors duration-200 placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-white/10"
            />
          </label>

          <label className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 py-3">
            <input
              type="checkbox"
              checked={formState.featured}
              onChange={(event) => updateField("featured", event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-slate-950"
            />
            <span className="text-sm font-medium text-slate-200">Featured</span>
          </label>
        </div>

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
            href="/admin/projects"
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
                ? "Create Project"
                : "Update Project"}
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
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
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
