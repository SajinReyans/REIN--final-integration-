import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface LandingPageProps {
  onEnter: () => void;
  onTransitionStart?: () => void;
}

/** Match the logo plate so the PNG doesn’t read as a floating box */
const LOGO_BG = '#1a1f24';

const HOLD_MS = 1600;
const FADE_MS = 1200;

export function LandingPage({ onEnter, onTransitionStart }: LandingPageProps) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const start = window.setTimeout(() => {
      setLeaving(true);
      onTransitionStart?.();
    }, HOLD_MS);
    return () => window.clearTimeout(start);
  }, [onTransitionStart]);

  useEffect(() => {
    if (!leaving) return;
    const done = window.setTimeout(onEnter, FADE_MS);
    return () => window.clearTimeout(done);
  }, [leaving, onEnter]);

  return (
    <motion.div
      className="landing-page"
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: FADE_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: LOGO_BG,
        overflow: 'hidden',
      }}
    >
      {/* Soft vignette — same family as logo plate */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.35) 100%)',
          pointerEvents: 'none',
        }}
      />

      <motion.img
        src="/rec-logo.png"
        alt="REC Environmental Monitoring"
        initial={{ opacity: 0, scale: 0.985 }}
        animate={
          leaving
            ? { opacity: 0.15, scale: 1.08 }
            : { opacity: 1, scale: 1 }
        }
        transition={{
          duration: leaving ? FADE_MS / 1000 : 0.9,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{
          position: 'relative',
          zIndex: 1,
          width: 'min(520px, 86vw)',
          height: 'auto',
          display: 'block',
          /* Blend charcoal plate into matching page bg */
          mixBlendMode: 'lighten',
          transformOrigin: 'center center',
        }}
        draggable={false}
      />
    </motion.div>
  );
}
