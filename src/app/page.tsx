"use client";

import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Award,
  BarChart3,
  BookOpenCheck,
  Braces,
  BriefcaseBusiness,
  Code2,
  FileText,
  Sparkles,
  Terminal,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { AnimatedPage } from "@/components/shared/AnimatedPage";
import { DVLogo } from "@/components/shared/DVLogo";
import { GlassCard } from "@/components/shared/GlassCard";
import type {
  Achievement,
  Certificate,
  Database,
  Project,
} from "@/lib/supabase/types";

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
    href: "#projects",
    cta: "View projects",
    icon: BriefcaseBusiness,
    anchorId: "projects",
    className: "md:col-span-2",
  },
  {
    title: "Achievements",
    text: "Track milestones, wins, ranks, and proof-backed highlights.",
    href: "#achievements",
    cta: "View achievements",
    icon: Trophy,
    anchorId: "achievements",
  },
  {
    title: "Certificates",
    text: "Browse credentials, courses, and verified learning records.",
    href: "#certificates",
    cta: "View certificates",
    icon: Award,
    anchorId: "certificates",
  },
  {
    title: "Codeforces",
    text: "Competitive programming rating, contests, and progress signals.",
    href: "#cp-stats",
    cta: "Open CP stats",
    icon: Code2,
    anchorId: "cp-stats",
  },
  {
    title: "LeetCode",
    text: "Problem-solving stats across easy, medium, and hard tracks.",
    href: "#cp-stats",
    cta: "Open CP stats",
    icon: Braces,
  },
  {
    title: "Resume / Links",
    text: "Quick access to resume, profiles, and contact channels.",
    href: "#contact",
    cta: "Open links",
    icon: FileText,
    anchorId: "contact",
    className: "md:col-span-2",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.45, ease: "easeOut" },
} as const;

const emptyPreview: PreviewState = {
  projects: [],
  achievements: [],
  certificates: [],
};

export default function Home() {
  const [preview, setPreview] = useState<PreviewState>(emptyPreview);
  const [resumeUrl, setResumeUrl] = useState("");

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return;
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
    let isMounted = true;

    async function loadPreviewData() {
      const [
        projectsResult,
        achievementsResult,
        certificatesResult,
        resumeResult,
      ] =
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
          supabase
            .from("portfolio_settings")
            .select("value")
            .eq("key", "resume_url")
            .maybeSingle(),
        ]);

      if (!isMounted) {
        return;
      }

      const resumeSetting = resumeResult.data as { value?: unknown } | null;

      setPreview({
        projects: projectsResult.data ?? [],
        achievements: achievementsResult.data ?? [],
        certificates: certificatesResult.data ?? [],
      });
      setResumeUrl(
        typeof resumeSetting?.value === "string" ? resumeSetting.value : "",
      );
    }

    void loadPreviewData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="gradient-aurora min-h-screen">
      <PublicNavbar />
      <AnimatedPage>
        <main id="dashboard" className="mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8">
          <HeroSection />
          <CommandCenter resumeUrl={resumeUrl} />
          <PreviewSection preview={preview} />
        </main>
      </AnimatedPage>
      <PublicFooter />
    </div>
  );
}

function HeroSection() {
  return (
    <motion.section
      className="flex min-h-[calc(100vh-75px)] items-center py-16 sm:py-20"
      {...fadeUp}
    >
      <GlassCard className="w-full overflow-hidden p-6 sm:p-10 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <DVLogo className="mb-6 h-14 w-14 text-base" />
            <p className="mb-4 inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm font-medium text-cyan-200">
              <Sparkles size={15} />
              Portfolio Command Center
            </p>
            <h1 className="gradient-text text-5xl font-semibold text-white sm:text-6xl lg:text-7xl">
              Devansh Verma
            </h1>
            <p className="mt-5 text-lg font-medium text-slate-100 sm:text-xl">
              Computer Science Student | Competitive Programmer | AI/Web Builder
            </p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              A living portfolio of my projects, achievements, certificates, and
              competitive programming journey.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <HeroButton href="#projects" label="View Projects" />
              <HeroButton href="#achievements" label="View Achievements" />
              <HeroButton href="#cp-stats" label="CP Stats" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <SignalCard icon={BarChart3} label="Dashboard" value="Live system" />
            <SignalCard icon={Terminal} label="Build style" value="AI + Web" />
            <SignalCard icon={BookOpenCheck} label="Portfolio" value="No-photo hub" />
          </div>
        </div>
      </GlassCard>
    </motion.section>
  );
}

function HeroButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:border-cyan-300/40 hover:bg-cyan-300/15 hover:text-cyan-100"
    >
      {label}
      <ArrowUpRight size={16} />
    </Link>
  );
}

function SignalCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string; size?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <Icon className="mb-4 text-cyan-200" size={20} />
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function CommandCenter({ resumeUrl }: { resumeUrl: string }) {
  const cards = bentoCards.map((card) =>
    card.title === "Resume / Links" && resumeUrl
      ? {
          ...card,
          href: resumeUrl,
          cta: "Open resume",
          external: true,
        }
      : card,
  );

  return (
    <motion.section className="py-12 sm:py-16" {...fadeUp}>
      <div className="mb-6">
        <p className="text-sm font-medium text-cyan-300">Command Center</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          Portfolio dashboard
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <BentoCard key={card.title} card={card} />
        ))}
      </div>
    </motion.section>
  );
}

function BentoCard({ card }: { card: BentoCard }) {
  const Icon = card.icon;

  return (
    <motion.div
      id={card.anchorId}
      whileHover={{ scale: 1.015 }}
      transition={{ duration: 0.2 }}
    >
      <GlassCard className={`h-full p-5 ${card.className ?? ""}`}>
        <div className="flex h-full min-h-44 flex-col justify-between gap-6">
          <div>
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
              <Icon size={21} />
            </div>
            <h3 className="text-xl font-semibold text-white">{card.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{card.text}</p>
          </div>
          {card.external ? (
            <a
              href={card.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition-colors duration-200 hover:text-white"
            >
              {card.cta}
              <ArrowUpRight size={15} />
            </a>
          ) : (
            <Link
              href={card.href}
              className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition-colors duration-200 hover:text-white"
            >
              {card.cta}
              <ArrowUpRight size={15} />
            </Link>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

function PreviewSection({ preview }: { preview: PreviewState }) {
  return (
    <motion.section className="py-12 pb-16 sm:py-16 sm:pb-20" {...fadeUp}>
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
          getTitle={(item) => item.title}
          getText={(item) => item.short_description}
        />
        <PreviewCard
          title="Recent Achievements"
          icon={Trophy}
          items={preview.achievements}
          getTitle={(item) => item.title}
          getText={(item) => item.rank_or_result ?? item.description}
        />
        <PreviewCard
          title="Certificates"
          icon={Award}
          items={preview.certificates}
          getTitle={(item) => item.title}
          getText={(item) => item.issuer ?? item.category ?? "Certificate"}
        />
      </div>
    </motion.section>
  );
}

function PreviewCard<T>({
  title,
  icon: Icon,
  items,
  getTitle,
  getText,
}: {
  title: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  items: T[];
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
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={getTitle(item)}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
            >
              <p className="font-medium text-white">{getTitle(item)}</p>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                {getText(item)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
          No records added yet.
        </p>
      )}
    </GlassCard>
  );
}
