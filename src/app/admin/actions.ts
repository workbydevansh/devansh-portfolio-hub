"use server";

import { revalidatePath } from "next/cache";

// /certificates and /achievements are prerendered, so admin changes must
// regenerate them; /projects is rendered per request and needs nothing.
export async function refreshCertificatePages() {
  revalidatePath("/certificates");
  revalidatePath("/admin/certificates");
}

export async function refreshAchievementPages() {
  revalidatePath("/achievements");
  revalidatePath("/admin/achievements");
}
