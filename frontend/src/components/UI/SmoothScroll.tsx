import React, { useEffect, useRef } from 'react';
// import Lenis from 'lenis'; // Note: Users must have "lenis" installed locally!

interface SmoothScrollProps {
  children: React.ReactNode;
}

export function SmoothScroll({ children }: SmoothScrollProps) {
  const lenisRef = useRef<any | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Preserve browser history and scroll restoration by avoiding forced position adjustments
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Initialize Lenis directly if imported or loaded via standard script/module paths
    import('lenis')
      .then((module) => {
        const LenisClass: any = module.default || module;
        if (!lenisRef.current && LenisClass) {
          lenisRef.current = new LenisClass({
            duration: 1.2,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
            infinite: false,
          });

          // Start a single loop once Lenis class finishes loading
          const raf = (time: number) => {
            if (lenisRef.current) {
              lenisRef.current.raf(time);
            }
            rafIdRef.current = requestAnimationFrame(raf);
          };

          if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
          }
          rafIdRef.current = requestAnimationFrame(raf);
        }
      })
      .catch(() => {
        console.warn('Lenis module not available. Fallback to native smooth scrolling.');
      });

    // Anchor link handling without overriding standard history
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const el = document.querySelector(link.getAttribute('href') || '');
        if (el && lenisRef.current) {
          lenisRef.current.scrollTo(el, {
            offset: 0,
            duration: 1.2,
          });
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);

    // Clean up cleanly on unmount without leaking memory
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      document.removeEventListener('click', handleAnchorClick);
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  return <>{children}</>;
}
