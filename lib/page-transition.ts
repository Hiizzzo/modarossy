"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function usePageTransition() {
  const router = useRouter();

  return useCallback(
    (href: string) => {
      const main = document.querySelector("main");
      if (!main) {
        router.push(href);
        return;
      }
      main.classList.add("page-leaving");
      window.setTimeout(() => {
        router.push(href);
      }, 360);
    },
    [router]
  );
}
