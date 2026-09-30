"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export interface FlipButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "icon";
  size?: "sm" | "md" | "lg";
  label?: string;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export function FlipButton({
  children,
  label,
  icon,
  leftIcon,
  rightIcon,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  ...props
}: FlipButtonProps) {
  const containerRef = useRef<HTMLButtonElement | null>(null);
  const primaryTextRef = useRef<HTMLSpanElement | null>(null);
  const cloneTextRef = useRef<HTMLSpanElement | null>(null);
  const iconRef = useRef<HTMLSpanElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const textContent = label ?? (typeof children === "string" ? children : undefined);

  useGSAP(
    () => {
      if (!primaryTextRef.current || !cloneTextRef.current) return;

      timelineRef.current = gsap
        .timeline({ paused: true })
        .to(primaryTextRef.current, {
          yPercent: -100,
          opacity: 0,
          rotateX: 40,
          duration: 0.32,
          ease: "power3.inOut",
        })
        .to(
          cloneTextRef.current,
          {
            yPercent: -100,
            opacity: 1,
            rotateX: 0,
            duration: 0.32,
            ease: "power3.inOut",
          },
          "<"
        );

      if (iconRef.current) {
        timelineRef.current.to(
          iconRef.current,
          {
            scale: 1.1,
            rotate: -4,
            duration: 0.28,
            ease: "back.out(2)",
          },
          "<0.04"
        );
      }
    },
    { scope: containerRef }
  );

  const handleMouseEnter = () => {
    if (disabled) return;
    timelineRef.current?.play();
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    timelineRef.current?.reverse();
  };

  const baseStyles =
    "group relative inline-flex items-center justify-center font-medium transition-colors duration-200 outline-none select-none disabled:opacity-40 disabled:pointer-events-none cursor-pointer";

  const variantStyles = {
    primary:
      "bg-[#00875A] text-white border border-[#00875A] hover:bg-[#00704A] hover:border-[#00704A] shadow-[0_4px_14px_rgba(0,135,90,0.22)] active:translate-y-px",
    secondary:
      "bg-white text-zinc-700 border border-zinc-200/90 hover:bg-zinc-50 hover:text-zinc-950 hover:border-zinc-300 shadow-[0_2px_6px_rgba(0,0,0,0.02)] active:translate-y-px",
    icon:
      "bg-white text-zinc-500 border border-zinc-200/80 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 aspect-square active:scale-95 shadow-sm",
  };

  const sizeStyles = {
    sm: variant === "icon" ? "p-2 rounded-lg" : "text-xs px-2.5 py-1.5 rounded-lg gap-1.5",
    md: variant === "icon" ? "p-2.5 rounded-xl" : "text-sm px-3.5 py-2 rounded-xl gap-2",
    lg: variant === "icon" ? "p-3.5 rounded-2xl" : "text-base px-4.5 py-2.5 rounded-xl gap-2.5",
  };

  return (
    <button
      ref={containerRef}
      type="button"
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
      {icon && (
        <span ref={iconRef} className="inline-flex shrink-0 will-change-transform transform-gpu">
          {icon}
        </span>
      )}

      {textContent ? (
        <span className="relative inline-flex flex-col overflow-hidden h-[1.3em] leading-[1.3em] perspective-[400px]">
          <span
            ref={primaryTextRef}
            className="inline-block transform-gpu will-change-transform origin-bottom"
          >
            {textContent}
          </span>
          <span
            ref={cloneTextRef}
            aria-hidden="true"
            className="absolute top-full left-0 inline-block transform-gpu will-change-transform origin-top opacity-0"
          >
            {textContent}
          </span>
        </span>
      ) : (
        children
      )}

      {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
}
