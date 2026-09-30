"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: React.ReactNode;
}

/**
 * Renders children directly into document.body via a React Portal.
 * This escapes all ancestor stacking contexts (including GSAP-animated elements
 * that get will-change:transform applied, which creates a new stacking context).
 */
export function Portal({ children }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}
