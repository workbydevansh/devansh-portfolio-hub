"use client";

import Link from "next/link";
import { findSocialLink, getContactHref, useSocialLinks } from "@/lib/social-links";
import { safeUrl } from "@/lib/url";

const footerLinks = [
  { label: "GitHub", platformKeys: ["github", "git hub"], fallbackHref: "/contact" },
  { label: "LinkedIn", platformKeys: ["linkedin", "linked in"], fallbackHref: "/contact" },
  { label: "Codeforces", platformKeys: ["codeforces", "code forces"], fallbackHref: "/cp-stats" },
  { label: "Hugging Face", platformKeys: ["hugging face", "huggingface"], fallbackHref: "/contact" },
];

export function PublicFooter() {
  const { links } = useSocialLinks();

  return (
    <footer className="border-t border-white/10 bg-zinc-950/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="font-medium text-zinc-200">Devansh Portfolio Hub</p>
        <div className="flex flex-wrap gap-3">
          {footerLinks.map((link) => {
            const socialLink = findSocialLink(links, link.platformKeys);
            const href = socialLink ? safeUrl(getContactHref(socialLink)) : null;

            return href ? (
              <a
                key={link.label}
                href={href}
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
