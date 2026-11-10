"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { jumpTo } from "@/lib/page/jump";

export const HOME = "/brand-home-2";

export function isAtelierPath(pathname: string | null | undefined) {
  return Boolean(pathname?.startsWith(`${HOME}/ateliers/`));
}

/** A plain primary click; modified clicks keep the browser's own link behaviour. */
export function isPlainClick(event: MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

type SectionLinkProps = {
  /** A section id on the home page, e.g. "ateliers". */
  id: string;
  className?: string;
  children: ReactNode;
  "aria-current"?: "true" | undefined;
  /** Home page: replaces the default jump (the menu closes first, then jumps). */
  onJump?: (id: string) => void;
  /** Atelier pages: runs before the route change (the menu closes itself). */
  onNavigate?: () => void;
};

/**
 * A link to a section of the home page. There it is an in-page jump
 * (instant across the film, focus to the section's heading); on an atelier
 * page it is a route link to /brand-home-2#id.
 */
export function SectionLink({ id, className, children, onJump, onNavigate, ...rest }: SectionLinkProps) {
  const pathname = usePathname();
  if (isAtelierPath(pathname)) {
    return (
      <Link href={`${HOME}#${id}`} className={className} onClick={onNavigate}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={`#${id}`}
      className={className}
      aria-current={rest["aria-current"]}
      onClick={(event) => {
        if (!isPlainClick(event)) return;
        event.preventDefault();
        if (onJump) onJump(id);
        else jumpTo(id);
      }}
    >
      {children}
    </a>
  );
}

type IntentLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
  "aria-current"?: "page" | undefined;
  onClick?: () => void;
};

/** A route link that prefetches on intent (pointer, focus, touch) instead of on sight. */
export function IntentLink({ href, className, children, onClick, ...rest }: IntentLinkProps) {
  const router = useRouter();
  const warm = () => router.prefetch(href);
  return (
    <Link
      href={href}
      prefetch={false}
      className={className}
      aria-label={rest["aria-label"]}
      aria-current={rest["aria-current"]}
      onClick={onClick}
      onPointerEnter={warm}
      onFocus={warm}
      onTouchStart={warm}
    >
      {children}
    </Link>
  );
}
