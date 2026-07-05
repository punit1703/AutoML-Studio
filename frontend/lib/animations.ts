export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3, ease: "easeInOut" as const },
};

export const slideIn = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 20, opacity: 0 },
  transition: { duration: 0.4, ease: "easeOut" as const },
};

export const slideInRight = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

export const scaleUp = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

export const hoverCardLift = {
  whileHover: { y: -4, transition: { duration: 0.2, ease: "easeOut" as const } },
};

export const tapScale = {
  whileTap: { scale: 0.98, transition: { duration: 0.1 } },
};
