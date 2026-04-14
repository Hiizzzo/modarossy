"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Inner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const key = `${pathname}?${search.toString()}`;
  return (
    <div key={key} className="page-enter">
      {children}
    </div>
  );
}

export default function PageAnimator({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>{children}</div>}>
      <Inner>{children}</Inner>
    </Suspense>
  );
}
