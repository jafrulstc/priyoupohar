"use client";

import { useState, useEffect } from "react";

/**
 * Hydration-safe mounted flag: false during SSR/hydration render,
 * true after mount.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
