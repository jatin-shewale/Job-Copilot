// Reusable Framer Motion animation variants

export const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

export const slideInLeft = {
  hidden:  { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

export const slideInRight = {
  hidden:  { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

export const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export const staggerFast = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05 } },
};

export const scaleIn = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
};

export const pageTransition = {
  initial:   { opacity: 0, y: 10 },
  animate:   { opacity: 1, y: 0 },
  exit:      { opacity: 0, y: -10 },
  transition: { duration: 0.25 },
};

export const cardHover = {
  rest:  { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  hover: { y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', transition: { duration: 0.2 } },
};

export const float = {
  animate: {
    y: [0, -8, 0],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
  }
};

export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    transition: { duration: 2, repeat: Infinity }
  }
};
