"use client";

import { Plus, Trash2 } from "lucide-react";

export type AchievementLinkInput = {
  id: string;
  label: string;
  url: string;
};

type AchievementLinksEditorProps = {
  links: AchievementLinkInput[];
  onChange: (links: AchievementLinkInput[]) => void;
};

function createEmptyLink(): AchievementLinkInput {
  return {
    id: crypto.randomUUID(),
    label: "",
    url: "",
  };
}

export function AchievementLinksEditor({
  links,
  onChange,
}: AchievementLinksEditorProps) {
  function updateLink(
    id: string,
    field: keyof Omit<AchievementLinkInput, "id">,
    value: string,
  ) {
    onChange(
      links.map((link) =>
        link.id === id
          ? {
              ...link,
              [field]: value,
            }
          : link,
      ),
    );
  }

  function removeLink(id: string) {
    onChange(links.filter((link) => link.id !== id));
  }

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Achievement Links
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Add required proof, project, submission, or reference links.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...links, createEmptyLink()])}
          className="inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/15 px-3 py-2 text-sm font-semibold text-cyan-100 transition-colors duration-200 hover:bg-cyan-300/25"
        >
          <Plus size={15} />
          Add Link
        </button>
      </div>

      {links.length ? (
        <div className="space-y-3">
          {links.map((link) => (
            <div key={link.id} className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
              <input
                type="text"
                value={link.label}
                onChange={(event) =>
                  updateLink(link.id, "label", event.target.value)
                }
                placeholder="Label"
                className="rounded-md border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-white outline-none transition-colors duration-200 placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-white/10"
              />
              <input
                type="url"
                value={link.url}
                onChange={(event) => updateLink(link.id, "url", event.target.value)}
                placeholder="URL"
                className="rounded-md border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-white outline-none transition-colors duration-200 placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-white/10"
              />
              <button
                type="button"
                onClick={() => removeLink(link.id)}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-rose-400/20 bg-rose-400/10 px-3 py-3 text-sm font-semibold text-rose-100 transition-colors duration-200 hover:bg-rose-400/20"
              >
                <Trash2 size={15} />
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
          No links added.
        </p>
      )}
    </section>
  );
}
