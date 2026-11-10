"use client";

import { scrollToTop } from "@/lib/page/jump";
import { ArrowDown, ContentsIcon } from "./icons";
import { usePaloma } from "./provider";

type ActionProps = { className?: string; iconClassName?: string };

/** Opens the Contents sheet; focus returns here when it closes. */
export function AllContentsButton({ className, iconClassName }: ActionProps) {
  const { openContents, prefetchContents, contentsOpen } = usePaloma();
  return (
    <button
      type="button"
      className={className}
      aria-haspopup="dialog"
      aria-expanded={contentsOpen}
      aria-controls="p4-contents"
      onClick={(event) => openContents({ returnTo: event.currentTarget })}
      onPointerEnter={prefetchContents}
      onFocus={prefetchContents}
      onTouchStart={prefetchContents}
    >
      All contents
      <ContentsIcon className={iconClassName} />
    </button>
  );
}

/** An instant return to the top, then focus on the cover's H1 (#cover-title). */
export function BackToCoverButton({ className, iconClassName }: ActionProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        scrollToTop();
        const title = document.getElementById("cover-title");
        if (!title) return;
        if (!title.hasAttribute("tabindex")) title.setAttribute("tabindex", "-1");
        title.focus({ preventScroll: true });
      }}
    >
      Back to the cover
      <ArrowDown className={iconClassName} />
    </button>
  );
}
