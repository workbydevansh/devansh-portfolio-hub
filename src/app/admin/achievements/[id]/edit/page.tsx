import { revalidatePath } from "next/cache";
import { AchievementForm } from "@/components/admin/achievements/AchievementForm";

type EditAchievementPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function refreshAchievementPages() {
  "use server";

  revalidatePath("/achievements");
  revalidatePath("/admin/achievements");
}

export default async function EditAchievementPage({
  params,
}: EditAchievementPageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mb-8">
        <p className="text-sm font-medium text-cyan-300">
          Admin Achievements
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-white">
          Edit Achievement
        </h1>
      </div>

      <AchievementForm
        mode="edit"
        achievementId={id}
        onMutate={refreshAchievementPages}
      />
    </main>
  );
}
