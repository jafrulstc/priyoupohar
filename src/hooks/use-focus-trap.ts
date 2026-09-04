"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps Tab focus inside `ref` while `active`, focuses the first control on
 * open and restores focus to the previously-focused element on close.
 * Escape handling stays with the component (most drawers already own it).
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;

    const prev = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0
      );

    // give spring animations a beat before stealing focus
    const focusTimer = window.setTimeout(() => {
      const first = focusables()[0];
      first?.focus();
    }, 60);

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const activeEl = document.activeElement;
      if (e.shiftKey && (activeEl === first || !node.contains(activeEl))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (activeEl === last || !node.contains(activeEl))) {
        e.preventDefault();
        first.focus();
      }
    };

    node.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      node.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [active]);

  return ref;
}
