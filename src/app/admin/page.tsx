import {
  BarChart3,
  FileBadge,
  FolderKanban,
  Settings,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/shared/GlassCard";

const adminCards = [
  {
    title: "Manage Projects",
    href: "/admin/projects",
    icon: FolderKanban,
  },
  {
    title: "Manage Achievements",
    href: "/admin/achievements",
    icon: Trophy,
  },
  {
    title: "Manage Certificates",
    href: "/admin/certificates",
    icon: FileBadge,
  },
  {
    title: "Sync Stats",
    href: "/admin/stats",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminDashboardPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mb-8">
        <p className="text-sm font-medium text-cyan-300">Admin</p>
        <h1 className="mt-2 text-4xl font-semibold text-white">
          Dashboard Shell
        </h1>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {adminCards.map((card) => {
          const Icon = card.icon;

          return (
            <Link key={card.href} href={card.href}>
              <GlassCard className="h-full p-5 transition-transform duration-200 hover:scale-[1.01]">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                  <Icon size={21} />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  {card.title}
                </h2>
              </GlassCard>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
