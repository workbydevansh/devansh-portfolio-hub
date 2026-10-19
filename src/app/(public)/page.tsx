"use client";

import {
  ArrowUpRight,
  Award,
  Braces,
  BriefcaseBusiness,
  Code2,
  FileText,
  Sparkles,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType, CSSProperties } from "react";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "@/lib/supabase/browser";
import type { Achievement, Certificate, Project } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type PreviewState = {
  projects: Project[];
  achievements: Achievement[];
  certificates: Certificate[];
};

type BentoCard = {
  title: string;
  text: string;
  href: string;
  cta: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  anchorId?: string;
  className?: string;
  external?: boolean;
};

const bentoCards: BentoCard[] = [
  {
    title: "Projects",
    text: "Explore shipped builds, experiments, and technical case studies.",
    href: "/projects",
    cta: "View projects",
    icon: BriefcaseBusiness,
    anchorId: "projects",
    className: "md:col-span-2",
  },
  {
    title: "Achievements",
    text: "Track milestones, wins, ranks, and proof-backed highlights.",
    href: "/achievements",
    cta: "View achievements",
    icon: Trophy,
    anchorId: "achievements",
  },
  {
    title: "Certificates",
    text: "Browse credentials, courses, and verified learning records.",
    href: "/certificates",
    cta: "View certificates",
    icon: Award,
    anchorId: "certificates",
  },
  {
    title: "Codeforces",
    text: "Competitive programming rating, contests, and progress signals.",
    href: "/cp-stats",
    cta: "Open CP stats",
    icon: Code2,
    anchorId: "cp-stats",
  },
  {
    title: "LeetCode",
    text: "Problem-solving stats across easy, medium, and hard tracks.",
    href: "/cp-stats",
    cta: "Open CP stats",
    icon: Braces,
  },
  {
    title: "Resume / Links",
    text: "Quick access to resume, profiles, and contact channels.",
    href: "/contact",
    cta: "Open links",
    icon: FileText,
    anchorId: "contact",
    className: "md:col-span-2",
  },
];

const emptyPreview: PreviewState = {
  projects: [],
  achievements: [],
  certificates: [],
};

function revealDelay(ms: number) {
  return { "--delay": `${ms}ms` } as CSSProperties;
}

export default function Home() {
  const [preview, setPreview] = useState<PreviewState>(emptyPreview);
  const [isLoading, setIsLoading] = useState(hasSupabaseConfig);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let isMounted = true;

    async function loadPreviewData() {
      try {
        const [projectsResult, achievementsResult, certificatesResult] =
          await Promise.all([
            supabase
              .from("projects")
              .select("*")
              .eq("featured", true)
              .order("display_order", { ascending: true })
              .order("created_at", { ascending: false })
              .limit(3),
            supabase
              .from("achievements")
              .select("*")
              .order("achievement_date", { ascending: false })
              .order("display_order", { ascending: true })
              .limit(3),
            supabase
              .from("certificates")
              .select("*")
              .order("issue_date", { ascending: false })
              .limit(3),
          ]);

        if (!isMounted) {
          return;
        }

        setPreview({
          projects: projectsResult.data ?? [],
          achievements: achievementsResult.data ?? [],
          certificates: certificatesResult.data ?? [],
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPreviewData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main id="dashboard">
      <HeroSection />
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8">
        <CommandCenter />
        <PreviewSection preview={preview} isLoading={isLoading} />
      </div>
    </main>
  );
}

function HeroSection() {
  return (
    <section className="flex min-h-[calc(100svh-73px)] flex-col items-center justify-center px-6 py-20 text-center">
      <span
        className="reveal mb-6 inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm font-medium text-cyan-200"
        style={revealDelay(0)}
      >
        <Sparkles size={15} />
        Portfolio
      </span>
      <h1 className="font-semibold tracking-tight">
        <span
          className="hero-name gradient-text inline-block pb-2 text-5xl sm:text-7xl"
          style={revealDelay(120)}
        >
          Devansh Verma
        </span>
      </h1>
      <p
        className="reveal mt-5 max-w-xl text-lg font-medium text-zinc-100 sm:text-xl"
        style={revealDelay(480)}
      >
        Computer Science Student | Competitive Programmer | AI/ML & Deep
        Learning Enthusiast
      </p>
      <p
        className="reveal mt-4 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg"
        style={revealDelay(560)}
      >
        A living portfolio of my projects, achievements, certificates, and
        competitive programming journey.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <HeroButton href="/projects" label="View Projects" delay={640} />
        <HeroButton href="/achievements" label="View Achievements" delay={700} />
        <HeroButton href="/cp-stats" label="CP Stats" delay={760} />
      </div>
    </section>
  );
}

function HeroButton({
  href,
  label,
  delay,
}: {
  href: string;
  label: string;
  delay: number;
}) {
  return (
    <Link
      href={href}
      className="reveal group inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-zinc-900 py-3 pl-5 pr-[18px] text-sm font-semibold text-white transition-[color,background-color,border-color,scale] duration-200 ease-out hover:border-cyan-300/40 hover:bg-zinc-800 hover:text-cyan-100 active:scale-[0.96]"
      style={revealDelay(delay)}
    >
      {label}
      <ArrowUpRight
        size={16}
        className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />
    </Link>
  );
}

function CommandCenter() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mb-6">
        <p className="text-sm font-medium text-cyan-300">Command Center</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          Portfolio dashboard
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {bentoCards.map((card) => (
          <BentoCard key={card.title} card={card} />
        ))}
      </div>
    </section>
  );
}

function BentoCard({ card }: { card: BentoCard }) {
  const Icon = card.icon;
  // The link's ::after stretches over the card, so the whole card is clickable.
  const linkClassName =
    "inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition-colors duration-200 group-hover:text-white after:absolute after:inset-0 after:rounded-[inherit] after:content-['']";
  const linkContent = (
    <>
      {card.cta}
      <ArrowUpRight
        size={15}
        className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />
    </>
  );

  return (
    <div id={card.anchorId} className={cn("scroll-reveal", card.className)}>
      <GlassCard className="glass-card-interactive group h-full p-5">
        <div className="flex h-full min-h-44 flex-col justify-between gap-6">
          <div>
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 transition-[border-color,background-color] duration-300 group-hover:border-cyan-300/40 group-hover:bg-cyan-300/15">
              <Icon size={21} />
            </div>
            <h3 className="text-xl font-semibold text-white">{card.title}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{card.text}</p>
          </div>
          {card.external ? (
            <a
              href={card.href}
              target="_blank"
              rel="noreferrer"
              className={linkClassName}
            >
              {linkContent}
            </a>
          ) : (
            <Link href={card.href} className={linkClassName}>
              {linkContent}
            </Link>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function PreviewSection({
  preview,
  isLoading,
}: {
  preview: PreviewState;
  isLoading: boolean;
}) {
  return (
    <section className="py-12 pb-16 sm:py-16 sm:pb-20">
      <div className="mb-6">
        <p className="text-sm font-medium text-cyan-300">Featured Preview</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          Latest portfolio records
        </h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <PreviewCard
          title="Featured Projects"
          icon={BriefcaseBusiness}
          items={preview.projects}
          isLoading={isLoading}
          getTitle={(item) => item.title}
          getText={(item) => item.short_description}
        />
        <PreviewCard
          title="Recent Achievements"
          icon={Trophy}
          items={preview.achievements}
          isLoading={isLoading}
          getTitle={(item) => item.title}
          getText={(item) => item.rank_or_result ?? item.description}
        />
        <PreviewCard
          title="Certificates"
          icon={Award}
          items={preview.certificates}
          isLoading={isLoading}
          getTitle={(item) => item.title}
          getText={(item) => item.issuer ?? item.category ?? "Certificate"}
        />
      </div>
    </section>
  );
}

function PreviewCard<T>({
  title,
  icon: Icon,
  items,
  isLoading,
  getTitle,
  getText,
}: {
  title: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  items: T[];
  isLoading: boolean;
  getTitle: (item: T) => string;
  getText: (item: T) => string;
}) {
  return (
    <GlassCard className="p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-cyan-200">
          <Icon size={19} />
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          <p className="sr-only" role="status">
            Loading {title.toLowerCase()}
          </p>
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              aria-hidden="true"
              className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="skeleton h-4 w-3/5" />
              <div className="skeleton mt-3 h-3 w-full" />
              <div className="skeleton mt-2 h-3 w-4/5" />
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="fade-in space-y-3">
          {items.map((item) => (
            <div
              key={getTitle(item)}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
            >
              <p className="font-medium text-white">{getTitle(item)}</p>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-300">
                {getText(item)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="fade-in rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-300">
          No records added yet.
        </p>
      )}
    </GlassCard>
  );
}
