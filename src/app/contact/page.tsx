"use client";

import { createClient } from "@supabase/supabase-js";
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
import { useEffect, useMemo, useState } from "react";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { AnimatedPage } from "@/components/shared/AnimatedPage";
import { GlassCard } from "@/components/shared/GlassCard";
import { SectionHeading } from "@/components/shared/SectionHeading";
import type { SocialLink } from "@/lib/supabase/types";

type ContactCardConfig = {
  label: string;
  platformKeys: string[];
  icon: React.ComponentType<{ size?: number; className?: string }>;
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

function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function normalizePlatform(platform: string) {
  return platform.trim().toLowerCase();
}

function getContactHref(link: SocialLink) {
  if (normalizePlatform(link.platform) === "email" && !link.url.startsWith("mailto:")) {
    return `mailto:${link.url}`;
  }

  return link.url;
}

export default function ContactPage() {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("Copy Website URL");

  useEffect(() => {
    let isMounted = true;

    async function loadSocialLinks() {
      const supabase = createSupabaseBrowserClient();

      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: loadError } = await supabase
          .from("social_links")
          .select("*")
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: true });

        if (!isMounted) {
          return;
        }

        if (loadError) {
          setError(loadError.message);
          return;
        }

        setSocialLinks((data ?? []) as SocialLink[]);
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load contact links.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSocialLinks();

    return () => {
      isMounted = false;
    };
  }, []);

  const socialLinksByPlatform = useMemo(() => {
    const map = new Map<string, SocialLink>();

    for (const link of socialLinks) {
      map.set(normalizePlatform(link.platform), link);
    }

    return map;
  }, [socialLinks]);

  async function handleCopyPortfolioUrl() {
    const portfolioUrl = window.location.origin;
    await navigator.clipboard.writeText(portfolioUrl);
    setCopyMessage("Copied");

    window.setTimeout(() => {
      setCopyMessage("Copy Website URL");
    }, 1800);
  }

  return (
    <div className="gradient-aurora min-h-screen">
      <PublicNavbar />
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
                <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
                  Loading contact links...
                </p>
              ) : socialLinks.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {contactCards.map((card) => {
                    const Icon = card.icon;
                    const link = card.platformKeys
                      .map((key) => socialLinksByPlatform.get(key))
                      .find(Boolean);

                    return (
                      <div
                        key={card.label}
                        className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
                      >
                        <div className="mb-4 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                            <Icon size={18} />
                          </div>
                          <h3 className="text-lg font-semibold text-white">
                            {card.label}
                          </h3>
                        </div>

                        {link ? (
                          <a
                            href={getContactHref(link)}
                            target={
                              normalizePlatform(link.platform) === "email"
                                ? undefined
                                : "_blank"
                            }
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition-colors duration-200 hover:text-white"
                          >
                            Open Link
                            <ArrowUpRight size={15} />
                          </a>
                        ) : (
                          <p className="text-sm text-slate-400">Not added</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
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
              <p className="text-sm leading-6 text-slate-300">
                Copy the current website URL and share the portfolio directly.
              </p>
              <button
                type="button"
                onClick={() => void handleCopyPortfolioUrl()}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/15 px-4 py-3 text-sm font-semibold text-cyan-100 transition-colors duration-200 hover:bg-cyan-300/25"
              >
                {copyMessage === "Copied" ? <Check size={16} /> : <Share2 size={16} />}
                {copyMessage}
              </button>
            </GlassCard>
          </section>
        </main>
      </AnimatedPage>
      <PublicFooter />
    </div>
  );
}
