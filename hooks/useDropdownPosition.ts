"use client";

import { useEffect, useState, useCallback, RefObject } from "react";

export interface DropdownPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  minWidth: number;
  maxHeight?: number;
  openUpwards?: boolean;
}

/**
 * Calculates the position of a dropdown menu relative to its trigger element.
 * Supports smart viewport collision detection, auto-flipping upwards when near screen bottom.
 */
export function useDropdownPosition(
  triggerRef: RefObject<HTMLElement | null>,
  align: "left" | "right" = "left",
  isOpen: boolean = false
): DropdownPosition {
  const [pos, setPos] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    minWidth: 0,
    openUpwards: false,
  });

  const recalc = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const estimatedDropdownHeight = 250;
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;

    // Auto-flip upwards if there isn't enough space below and more space above
    const openUpwards = spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow;
    const minWidth = rect.width;

    let top: number | undefined;
    let bottom: number | undefined;
    let maxHeight = 340;

    if (openUpwards) {
      bottom = vh - rect.top + 6;
      maxHeight = Math.max(120, spaceAbove - 16);
      top = Math.max(8, rect.top - estimatedDropdownHeight - 6);
    } else {
      top = rect.bottom + 6;
      maxHeight = Math.max(120, spaceBelow - 16);
    }

    if (align === "right") {
      const right = Math.max(8, vw - rect.right);
      setPos({ top, bottom, right, minWidth, maxHeight, openUpwards });
    } else {
      const left = Math.max(8, rect.left);
      setPos({ top, bottom, left, minWidth, maxHeight, openUpwards });
    }
  }, [triggerRef, align]);

  useEffect(() => {
    if (!isOpen) return;
    recalc();

    window.addEventListener("scroll", recalc, { passive: true });
    window.addEventListener("resize", recalc);
    return () => {
      window.removeEventListener("scroll", recalc);
      window.removeEventListener("resize", recalc);
    };
  }, [isOpen, recalc]);

  return pos;
}
