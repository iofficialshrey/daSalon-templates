"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type AtelierLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  tabIndex?: number;
  "aria-hidden"?: boolean | "true" | "false";
  "aria-label"?: string;
};

/**
 * A next/link that never prefetches on sight (the four atelier pages would all
 * load as the index scrolls past) but warms its route on the first sign of
 * intent: pointer, focus or touch.
 */
export function AtelierLink({ href, children, ...rest }: AtelierLinkProps) {
  const router = useRouter();
  const warm = () => router.prefetch(href);
  return (
    <Link
      href={href}
      prefetch={false}
      onPointerEnter={warm}
      onFocus={warm}
      onTouchStart={warm}
      {...rest}
    >
      {children}
    </Link>
  );
}
