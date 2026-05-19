"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SocialLink } from "@/lib/supabase/types";

type FooterLinkConfig = {
  label: string;
  platformKeys: string[];
  fallbackHref: string;
};

const footerLinks: FooterLinkConfig[] = [
  {
    label: "GitHub",
    platformKeys: ["github", "git hub"],
    fallbackHref: "/contact",
  },
  {
    label: "LinkedIn",
    platformKeys: ["linkedin", "linked in"],
    fallbackHref: "/contact",
  },
  {
    label: "Codeforces",
    platformKeys: ["codeforces", "code forces"],
    fallbackHref: "/cp-stats",
  },
  {
    label: "Hugging Face",
    platformKeys: ["hugging face", "huggingface"],
    fallbackHref: "/contact",
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

export function PublicFooter() {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadSocialLinks() {
      const supabase = createSupabaseBrowserClient();

      if (!supabase) {
        return;
      }

      const { data } = await supabase
        .from("social_links")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (isMounted) {
        setSocialLinks((data ?? []) as SocialLink[]);
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

  return (
    <footer className="border-t border-white/10 bg-slate-950/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="font-medium text-slate-200">Devansh Portfolio Hub</p>
        <div className="flex flex-wrap gap-3">
          {footerLinks.map((link) => {
            const socialLink = link.platformKeys
              .map((key) => socialLinksByPlatform.get(key))
              .find(Boolean);

            return socialLink ? (
              <a
                key={link.label}
                href={getContactHref(socialLink)}
                target="_blank"
                rel="noreferrer"
                className="transition-colors duration-200 hover:text-cyan-200"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.fallbackHref}
                className="transition-colors duration-200 hover:text-cyan-200"
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </footer>
  );
}
