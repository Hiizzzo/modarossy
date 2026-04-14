"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function usePageTransition() {
  const router = useRouter();

  return useCallback(
    (href: string) => {
      router.push(href);
    },
    [router]
  );
}
