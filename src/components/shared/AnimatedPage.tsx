import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AnimatedPageProps = {
  children: ReactNode;
  className?: string;
};

// CSS-only entrance: the server-rendered page is visible even before (or
// without) JavaScript, and the animation only enhances it.
export function AnimatedPage({ children, className }: AnimatedPageProps) {
  return <div className={cn("page-enter", className)}>{children}</div>;
}
