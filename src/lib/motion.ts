// Cards leaving a filtered grid fade and shrink slightly while the remaining
// cards glide into their new positions.
export const gridItemMotion = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.15, ease: "easeOut" },
  },
  transition: { type: "spring", duration: 0.4, bounce: 0 },
} as const;

export const expandTransition = {
  duration: 0.35,
  ease: [0.16, 1, 0.3, 1],
} as const;
