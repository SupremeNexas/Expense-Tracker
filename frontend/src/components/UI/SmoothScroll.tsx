import { ReactNode, useEffect } from 'react';
import Lenis from 'lenis';

export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Optional: handle scroll restoration behavior
    const originalScrollRestoration = window.history.scrollRestoration;
    if (originalScrollRestoration === 'manual') {
      window.history.scrollRestoration = 'auto';
    }

    return () => {
      lenis.destroy();
      if (originalScrollRestoration === 'manual') {
        window.history.scrollRestoration = originalScrollRestoration;
      }
    };
  }, []);

  return <>{children}</>;
}