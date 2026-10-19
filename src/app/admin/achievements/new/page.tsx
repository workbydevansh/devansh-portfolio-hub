import { refreshAchievementPages } from "@/app/admin/actions";
import { AchievementForm } from "@/components/admin/achievements/AchievementForm";

export default function NewAchievementPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mb-8">
        <p className="text-sm font-medium text-cyan-300">
          Admin Achievements
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-white">
          New Achievement
        </h1>
      </div>

      <AchievementForm mode="create" onMutate={refreshAchievementPages} />
    </main>
  );
}
