"use client";

import type { MouseEvent, ReactNode } from "react";
import { jumpTo } from "@/lib/page/jump";
import { ArrowRight } from "./icons";

/** An in-page link that moves to a section and hands its heading the focus. */
export function JumpLink({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  const go = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    jumpTo(to);
  };
  return (
    <a href={`#${to}`} className={className} onClick={go}>
      <span>{children}</span>
      <ArrowRight size={16} />
    </a>
  );
}
