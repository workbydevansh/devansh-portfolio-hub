"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  Braces,
  BriefcaseBusiness,
  Check,
  Code2,
  Link2,
  Mail,
  Share2,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AnimatedPage } from "@/components/shared/AnimatedPage";
import { GlassCard } from "@/components/shared/GlassCard";
import { SectionHeading } from "@/components/shared/SectionHeading";
import {
  findSocialLink,
  getContactHref,
  isEmailPlatform,
  useSocialLinks,
} from "@/lib/social-links";
import type { SocialLink } from "@/lib/supabase/types";
import { safeUrl } from "@/lib/url";

const defaultEmailAddress = "work.devanshverma@gmail.com";

type CopyState = "idle" | "copied" | "failed";

const copyLabels: Record<CopyState, string> = {
  idle: "Copy Website URL",
  copied: "Copied",
  failed: "Couldn't copy, try again",
};

type ContactCardConfig = {
  label: string;
  platformKeys: string[];
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const defaultEmailLink: SocialLink = {
  id: "default-email",
  platform: "Email",
  url: defaultEmailAddress,
  display_order: -1,
  created_at: null,
};

const contactCards: ContactCardConfig[] = [
  {
    label: "Email",
    platformKeys: ["email", "mail"],
    icon: Mail,
  },
  {
    label: "GitHub",
    platformKeys: ["github", "git hub"],
    icon: Code2,
  },
  {
    label: "LinkedIn",
    platformKeys: ["linkedin", "linked in"],
    icon: BriefcaseBusiness,
  },
  {
    label: "Codeforces",
    platformKeys: ["codeforces", "code forces"],
    icon: Code2,
  },
  {
    label: "LeetCode",
    platformKeys: ["leetcode", "leet code"],
    icon: Braces,
  },
  {
    label: "Hugging Face",
    platformKeys: ["hugging face", "huggingface"],
    icon: Sparkles,
  },
];

export default function ContactPage() {
  const { links: socialLinks, isLoading, error } = useSocialLinks();
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const contactLinks = useMemo(() => {
    const hasEmailLink = socialLinks.some((link) => isEmailPlatform(link.platform));

    return hasEmailLink ? socialLinks : [defaultEmailLink, ...socialLinks];
  }, [socialLinks]);

  async function handleCopyPortfolioUrl() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }

    window.setTimeout(() => {
      setCopyState("idle");
    }, 1800);
  }

  return (
    <AnimatedPage>
      <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <SectionHeading
          eyebrow="Contact"
          title="Connect With Devansh"
          description="Find portfolio links, coding profiles, and ways to reach out."
        />

        <section className="mt-10 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                <Link2 size={20} />
              </div>
              <h2 className="text-2xl font-semibold text-white">
                Contact Links
              </h2>
            </div>

            {error ? (
              <p className="rounded-md border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            ) : null}

            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <p className="sr-only" role="status">
                  Loading contact links
                </p>
                {contactCards.map((card) => (
                  <div
                    key={card.label}
                    aria-hidden="true"
                    className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div className="skeleton h-10 w-10 rounded-lg" />
                      <div className="skeleton h-5 w-24" />
                    </div>
                    <div className="skeleton h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : contactLinks.length ? (
              <div className="fade-in grid gap-4 sm:grid-cols-2">
                {contactCards.map((card) => {
                  const Icon = card.icon;
                  const link = findSocialLink(contactLinks, card.platformKeys);
                  const href = link ? safeUrl(getContactHref(link)) : null;

                  return (
                    <div
                      key={card.label}
                      className={`group relative rounded-lg border border-white/10 bg-white/[0.04] p-4 transition-[border-color,background-color] duration-200 ${
                        href ? "hover:border-cyan-300/30 hover:bg-white/[0.07]" : ""
                      }`}
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                          <Icon size={18} />
                        </div>
                        <h3 className="text-lg font-semibold text-white">
                          {card.label}
                        </h3>
                      </div>

                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition-colors duration-200 group-hover:text-white after:absolute after:inset-0 after:rounded-[inherit] after:content-['']"
                        >
                          Open Link
                          <ArrowUpRight
                            size={15}
                            className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                          />
                        </a>
                      ) : (
                        <p className="text-sm text-zinc-400">Not added</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-300">
                No contact links added yet.
              </p>
            )}
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                <Share2 size={20} />
              </div>
              <h2 className="text-2xl font-semibold text-white">
                Share this portfolio
              </h2>
            </div>
            <p className="text-sm leading-6 text-zinc-300">
              Copy the current website URL and share the portfolio directly.
            </p>
            <button
              type="button"
              onClick={() => void handleCopyPortfolioUrl()}
              className="mt-6 inline-flex w-full items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-300/15 px-4 py-3 text-sm font-semibold text-cyan-100 transition-[background-color,scale] duration-200 ease-out hover:bg-cyan-300/25 active:scale-[0.96]"
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={copyState}
                  className="inline-flex items-center gap-2"
                  initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{
                    opacity: 0,
                    y: -6,
                    filter: "blur(4px)",
                    transition: { duration: 0.15, ease: "easeOut" },
                  }}
                  transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                >
                  {copyState === "copied" ? <Check size={16} /> : <Share2 size={16} />}
                  {copyLabels[copyState]}
                </motion.span>
              </AnimatePresence>
            </button>
            <p className="sr-only" aria-live="polite">
              {copyState === "idle" ? "" : copyLabels[copyState]}
            </p>
          </GlassCard>
        </section>
      </main>
    </AnimatedPage>
  );
}
