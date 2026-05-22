"use client";
import { useEffect, useRef, useState, ReactNode, CSSProperties } from "react";

type RevealVariant = "fade-up" | "fade-down" | "fade-left" | "fade-right" | "zoom-in" | "scale-up" | "cinematic-3d";

interface ScrollRevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  duration?: number; // ms
  delay?: number; // ms
  threshold?: number; // 0 to 1
  once?: boolean;
  className?: string;
}

export function ScrollReveal({
  children,
  variant = "cinematic-3d", // Setting default to cinematic-3d for maximum "Wow"
  duration = 1000, // Slightly longer duration to fully appreciate the premium 3D movement
  delay = 0,
  threshold = 0.05, // Trigger slightly earlier for immediate responsive scroll feel
  once = true,
  className = ""
}: ScrollRevealProps) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          if (once && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!once) {
          setIsIntersecting(false);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, once]);

  // High performance GPU-accelerated inline transform styles
  const getRevealStyles = (): CSSProperties => {
    if (isIntersecting) {
      return {
        opacity: 1,
        transform: "perspective(1200px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0) scale(1)",
        filter: "blur(0px)"
      };
    }

    switch (variant) {
      case "cinematic-3d":
        return {
          opacity: 0,
          transform: "perspective(1200px) rotateX(15deg) rotateY(-3deg) translate3d(0, 50px, -80px) scale(0.95)",
          filter: "blur(14px)"
        };
      case "fade-up":
        return {
          opacity: 0,
          transform: "perspective(1200px) translate3d(0, 40px, 0)",
          filter: "blur(8px)"
        };
      case "fade-down":
        return {
          opacity: 0,
          transform: "perspective(1200px) translate3d(0, -40px, 0)",
          filter: "blur(8px)"
        };
      case "fade-left":
        return {
          opacity: 0,
          transform: "perspective(1200px) translate3d(40px, 0, 0)",
          filter: "blur(8px)"
        };
      case "fade-right":
        return {
          opacity: 0,
          transform: "perspective(1200px) translate3d(-40px, 0, 0)",
          filter: "blur(8px)"
        };
      case "zoom-in":
        return {
          opacity: 0,
          transform: "perspective(1200px) translate3d(0, 0, -60px) scale(0.94)",
          filter: "blur(10px)"
        };
      case "scale-up":
        return {
          opacity: 0,
          transform: "perspective(1200px) scale(0.8)",
          filter: "blur(12px)"
        };
      default:
        return {
          opacity: 0,
          transform: "perspective(1200px) translate3d(0, 40px, 0)",
          filter: "blur(8px)"
        };
    }
  };

  return (
    <div
      ref={ref}
      className={`will-change-[transform,opacity,filter] motion-reduce:transition-none ${className}`}
      style={{
        ...getRevealStyles(),
        transitionProperty: "transform, opacity, filter",
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" // Premium spring physics curve with physical overshoot & snap back
      }}
    >
      {children}
    </div>
  );
}
