"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { AmbientBackground } from "./AmbientBackground";
import { PublicFooter } from "./PublicFooter";
import { PublicNavbar } from "./PublicNavbar";

// Shared by every public page, so the navbar, footer, and background persist
// across navigation instead of remounting with each page.
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AmbientBackground />
      <div className="flex min-h-screen flex-col">
        <PublicNavbar />
        <div className="flex-1">{children}</div>
        <PublicFooter />
      </div>
    </MotionConfig>
  );
}
