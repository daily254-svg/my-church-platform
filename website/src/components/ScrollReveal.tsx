import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  once?: boolean;
  threshold?: number;
}

const directionClasses: Record<NonNullable<ScrollRevealProps['direction']>, string> = {
  up: '-translate-y-8',
  down: 'translate-y-8',
  left: '-translate-x-8',
  right: 'translate-x-8',
};

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  as: Component = 'div',
  className = '',
  delay = 0,
  direction = 'up',
  once = true,
  threshold = 0.15,
  style,
  ...rest
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = elementRef.current;
    if (!node) return;

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(node);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -8% 0px',
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [once, threshold]);

  const Tag = Component as keyof React.JSX.IntrinsicElements;

  return (
    <Tag
      ref={elementRef as React.Ref<HTMLElement>}
      className={`${className} transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-x-0 translate-y-0' : `opacity-0 ${directionClasses[direction]}`
      }`}
      style={{
        transitionDelay: `${delay}ms`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
};
