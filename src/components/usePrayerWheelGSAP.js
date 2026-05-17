import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function usePrayerWheelGSAP() {
  const wheelRef = useRef(null);
  const jewelRef = useRef(null);
  const speedLinesRef = useRef(null);
  const particlesRef = useRef(null);
  const spinCountRef = useRef(0);
  const ctxRef = useRef(null);

  // Detect prefers-reduced-motion
  const prefersReducedMotion = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  // Get duration multiplier based on prefers-reduced-motion
  const getDurationMultiplier = () => (prefersReducedMotion() ? 6 : 1);

  // Trigger mantra reveal animation
  const triggerMantraReveal = () => {
    const chars = document.querySelectorAll('.mantra-char');
    chars.forEach((char, i) => {
      gsap.fromTo(
        char,
        { opacity: 0, attr: { dy: 8 } },
        {
          opacity: 1,
          attr: { dy: 0 },
          duration: 0.3 * getDurationMultiplier(),
          delay: i * 0.06 * getDurationMultiplier(),
          ease: 'power2.out',
        }
      );
    });
  };

  // Emit particle blessing
  const emitParticles = () => {
    if (!particlesRef.current) return;

    const particles = particlesRef.current.querySelectorAll('ellipse');
    const particleCount = Math.min(12, particles.length);
    const angleStep = (Math.PI * 2) / particleCount;

    particles.forEach((particle, i) => {
      if (i >= particleCount) return;

      const angle = angleStep * i;
      const distance = 120;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;

      gsap.set(particle, { opacity: 1, scale: 1, x: 0, y: 0 });
      gsap.to(particle, {
        x: dx,
        y: dy,
        opacity: 0,
        scale: 0,
        duration: 1.2 * getDurationMultiplier(),
        ease: 'power1.out',
        delay: i * 0.05 * getDurationMultiplier(),
      });
    });
  };

  // Handle speed burst on click
  const handleClick = () => {
    if (!wheelRef.current) return;

    const durationMultiplier = getDurationMultiplier();

    // If reduced motion is enabled, skip the speed burst
    if (prefersReducedMotion()) {
      triggerMantraReveal();
      return;
    }

    const tl = gsap.timeline();

    // Speed lines animation
    if (speedLinesRef.current) {
      tl.to(speedLinesRef.current, { opacity: 0.7, duration: 0.15 }, 0);
      tl.to(speedLinesRef.current, { opacity: 0, duration: 0.8 }, 0.4);
    }

    // Wheel spin burst
    tl.to(
      wheelRef.current,
      {
        rotation: '+=1440',
        duration: 2.2 * durationMultiplier,
        ease: 'power2.out',
        overwrite: 'auto',
      },
      0
    );

    // Trigger mantra reveal mid-burst
    tl.add(() => triggerMantraReveal(), 1.8 * durationMultiplier);

    // Emit particles after burst
    tl.add(() => emitParticles(), 1.8 * durationMultiplier);

    spinCountRef.current += 1;
  };

  // Initialize GSAP animations
  useEffect(() => {
    if (!wheelRef.current || !jewelRef.current) return;

    const ctx = gsap.context(() => {
      const durationMultiplier = getDurationMultiplier();

      // Phase 1: Idle breath rotation
      const wheelTl = gsap.timeline({ repeat: -1 });
      wheelTl.to(wheelRef.current, {
        rotation: 360,
        duration: 8 * durationMultiplier,
        ease: 'none',
      });

      // Trigger mantra reveal on repeat
      wheelTl.eventCallback('onRepeat', () => {
        triggerMantraReveal();
      });

      // Phase 1b: Central jewel pulse
      gsap.to(jewelRef.current, {
        scale: 1.08,
        duration: 1.5 * durationMultiplier,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        transformOrigin: 'center',
      });
    });

    ctxRef.current = ctx;

    return () => {
      ctx.revert();
    };
  }, []);

  return {
    wheelRef,
    jewelRef,
    speedLinesRef,
    particlesRef,
    handleClick,
  };
}
