import { revalidatePath } from "next/cache";
import { CertificateForm } from "@/components/admin/certificates/CertificateForm";

async function refreshCertificatePages() {
  "use server";

  revalidatePath("/certificates");
  revalidatePath("/admin/certificates");
}

export default function NewCertificatePage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mb-8">
        <p className="text-sm font-medium text-cyan-300">
          Admin Certificates
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-white">
          New Certificate
        </h1>
      </div>

      <CertificateForm mode="create" onMutate={refreshCertificatePages} />
    </main>
  );
}
