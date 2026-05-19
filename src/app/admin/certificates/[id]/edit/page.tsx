import { revalidatePath } from "next/cache";
import { CertificateForm } from "@/components/admin/certificates/CertificateForm";

type EditCertificatePageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function refreshCertificatePages() {
  "use server";

  revalidatePath("/certificates");
  revalidatePath("/admin/certificates");
}

export default async function EditCertificatePage({
  params,
}: EditCertificatePageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mb-8">
        <p className="text-sm font-medium text-cyan-300">
          Admin Certificates
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-white">
          Edit Certificate
        </h1>
      </div>

      <CertificateForm
        mode="edit"
        certificateId={id}
        onMutate={refreshCertificatePages}
      />
    </main>
  );
}
