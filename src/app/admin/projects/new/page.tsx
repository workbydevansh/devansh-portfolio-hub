import { ProjectForm } from "@/components/admin/projects/ProjectForm";

export default function NewProjectPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mb-8">
        <p className="text-sm font-medium text-cyan-300">Admin Projects</p>
        <h1 className="mt-2 text-4xl font-semibold text-white">New Project</h1>
      </div>

      <ProjectForm mode="create" />
    </main>
  );
}
