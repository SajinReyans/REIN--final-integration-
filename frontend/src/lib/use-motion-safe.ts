import { useReducedMotion } from 'framer-motion';

export function useMotionSafe() {
  return !useReducedMotion();
}
