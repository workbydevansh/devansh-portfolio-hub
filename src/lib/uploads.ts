import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type UploadRule = {
  bucket: string;
  extensions: string[];
  mimeTypes: string[];
  fallbackName: string;
  typeError: string;
  sizeError: string;
};

const maxUploadSize = 10 * 1024 * 1024;

export const uploadRules = {
  projectImage: {
    bucket: "project-images",
    extensions: [".png", ".jpg", ".jpeg", ".webp"],
    mimeTypes: ["image/png", "image/jpeg", "image/webp"],
    fallbackName: "project-image",
    typeError: "Only PNG, JPG, JPEG, and WEBP project images are allowed.",
    sizeError: "Project image size must be 10MB or less.",
  },
  certificate: {
    bucket: "certificates",
    extensions: [".pdf", ".png", ".jpg", ".jpeg", ".webp"],
    mimeTypes: ["application/pdf", "image/png", "image/jpeg", "image/webp"],
    fallbackName: "certificate",
    typeError: "Only PDF, PNG, JPG, JPEG, and WEBP files are allowed.",
    sizeError: "File size must be 10MB or less.",
  },
  resume: {
    bucket: "resume",
    extensions: [".pdf"],
    mimeTypes: ["application/pdf"],
    fallbackName: "resume",
    typeError: "Resume file must be a PDF.",
    sizeError: "Resume file size must be 10MB or less.",
  },
} satisfies Record<string, UploadRule>;

export function acceptAttribute(rule: UploadRule) {
  return [...rule.extensions, ...rule.mimeTypes].join(",");
}

export function validateUpload(file: File | null, rule: UploadRule) {
  if (!file) {
    return "";
  }

  const name = file.name.toLowerCase();
  const hasAllowedType =
    rule.extensions.some((extension) => name.endsWith(extension)) ||
    rule.mimeTypes.includes(file.type);

  if (!hasAllowedType) {
    return rule.typeError;
  }

  return file.size > maxUploadSize ? rule.sizeError : "";
}

// uploads/<uuid>-<safe-name>.<ext>; the uuid keeps every upload unique.
function createUploadPath(file: File, rule: UploadRule) {
  const dotIndex = file.name.lastIndexOf(".");
  const extension =
    dotIndex > 0
      ? file.name.slice(dotIndex + 1).toLowerCase()
      : rule.extensions[0].slice(1);
  const baseName =
    (dotIndex > 0 ? file.name.slice(0, dotIndex) : file.name)
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || rule.fallbackName;

  return `uploads/${crypto.randomUUID()}-${baseName}.${extension}`;
}

export async function uploadPublicFile(file: File, rule: UploadRule) {
  const storage = getSupabaseBrowserClient().storage.from(rule.bucket);
  const path = createUploadPath(file, rule);
  const { error } = await storage.upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || rule.mimeTypes[0],
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { path, publicUrl: storage.getPublicUrl(path).data.publicUrl };
}
