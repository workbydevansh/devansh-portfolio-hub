const allowedProtocols = new Set(["http:", "https:", "mailto:"]);

// Returns a normalized URL only when it uses a safe protocol, so stored values
// such as `javascript:` links can never end up in an href or src.
export function safeUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value.trim());
    return allowedProtocols.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function isHttpUrl(value: string) {
  try {
    const { protocol } = new URL(value.trim());
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function isEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// Checks optional URL form fields; empty fields are allowed.
export function getUrlFieldsError(fields: Record<string, string>) {
  for (const [label, value] of Object.entries(fields)) {
    if (value.trim() && !isHttpUrl(value)) {
      return `${label} must be a full link starting with https:// or http://.`;
    }
  }

  return "";
}
