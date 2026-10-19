"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DVLogo } from "@/components/shared/DVLogo";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Dashboard", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Achievements", href: "/achievements" },
  { label: "Certificates", href: "/certificates" },
  { label: "CP Stats", href: "/cp-stats" },
  { label: "Contact", href: "/contact" },
];

const pillTransition = { type: "spring", duration: 0.35, bounce: 0 } as const;
const iconTransition = { type: "spring", duration: 0.3, bounce: 0 } as const;

export function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  // The pill rests on the active page and follows the pointer or focus.
  const highlightedHref =
    hoveredHref ?? navLinks.find((link) => isActive(link.href))?.href;

  return (
    <header className="nav-surface sticky top-0 z-50 border-b backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-3 text-sm font-semibold text-white transition-colors duration-200 hover:text-cyan-200"
          onClick={() => setIsOpen(false)}
        >
          <DVLogo className="transition-[border-color,box-shadow] duration-300 group-hover:border-cyan-300/50 group-hover:shadow-cyan-500/25" />
          <span>Devansh Portfolio Hub</span>
        </Link>

        <div
          className="hidden items-center gap-1 md:flex"
          onMouseLeave={() => setHoveredHref(null)}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              onMouseEnter={() => setHoveredHref(link.href)}
              onFocus={() => setHoveredHref(link.href)}
              onBlur={() => setHoveredHref(null)}
              className={cn(
                "relative rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
                isActive(link.href)
                  ? "text-cyan-100"
                  : "text-slate-300 hover:text-white",
              )}
            >
              {highlightedHref === link.href ? (
                <motion.span
                  layoutId="nav-pill"
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 rounded-md transition-colors duration-200",
                    isActive(link.href)
                      ? "bg-cyan-300/15 ring-1 ring-cyan-300/25"
                      : "bg-white/10",
                  )}
                  transition={pillTransition}
                />
              ) : null}
              <span className="relative">{link.label}</span>
            </Link>
          ))}
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-100 transition-[background-color,scale] duration-200 ease-out hover:bg-white/10 active:scale-[0.96] md:hidden"
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsOpen((current) => !current)}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={isOpen ? "close" : "open"}
              className="flex"
              initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
              transition={iconTransition}
            >
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </motion.span>
          </AnimatePresence>
        </button>
      </nav>

      <div
        id="mobile-navigation"
        inert={!isOpen}
        className={cn(
          "grid border-t transition-[grid-template-rows,opacity,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden",
          isOpen
            ? "grid-rows-[1fr] border-white/10 opacity-100"
            : "grid-rows-[0fr] border-transparent opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 pb-4 pt-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                  isActive(link.href)
                    ? "bg-cyan-300/15 text-cyan-100 ring-1 ring-cyan-300/20"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                )}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
