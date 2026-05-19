import Link from "next/link";

const footerLinks = ["GitHub", "LinkedIn", "Codeforces", "Hugging Face"];

export function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="font-medium text-slate-200">Devansh Portfolio Hub</p>
        <div className="flex flex-wrap gap-3">
          {footerLinks.map((label) => (
            <Link
              key={label}
              href="#"
              className="transition-colors duration-200 hover:text-cyan-200"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
