'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type FadeInSectionProps = {
  children: ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  direction?: 'up' | 'left' | 'right';
};

export default function FadeInSection({
  children,
  className = '',
  threshold = 0.2,
  rootMargin = '0px 0px -10% 0px',
  once = true,
  direction = 'up',
}: FadeInSectionProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  const directionClass =
    direction === 'left'
      ? 'reveal-left'
      : direction === 'right'
        ? 'reveal-right'
        : '';

  return (
    <section
      ref={ref}
      className={`reveal ${directionClass} ${visible ? 'reveal-visible' : ''} ${className}`}
    >
      {children}
    </section>
  );
}
