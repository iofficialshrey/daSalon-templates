"use client";

import { Children, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { JUMP_EVENT } from "@/lib/page/jump";
import { useAtelier } from "./provider";
import styles from "./privileges.module.css";

export type PrivilegeTab = {
  /** Also the panel's id, so #membership, #packages and #gift-cards keep working. */
  id: string;
  label: string;
  /** One quiet line under the tabs, for this panel. */
  text: string;
};

/**
 * Membership, packages and gift cards as three tabs (WAI-ARIA tabs with automatic
 * activation). A jump to a panel's id selects that tab before the jump measures it;
 * a plain #link, a shared link and back/forward do the same.
 */
export function PrivilegeTabs({ tabs, children }: { tabs: readonly PrivilegeTab[]; children: ReactNode }) {
  const panels = Children.toArray(children);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Header and footer links jump to #membership, #packages and #gift-cards.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onJump = (event: Event) => {
      const id = event.target instanceof HTMLElement ? event.target.id : "";
      const index = tabs.findIndex((tab) => tab.id === id);
      if (index >= 0) flushSync(() => setActive(index));
    };
    root.addEventListener(JUMP_EVENT, onJump);
    // A shared link straight to a panel opens it, as do plain #links and back/forward between them.
    const fromHash = () => tabs.findIndex((tab) => `#${tab.id}` === window.location.hash);
    const onHashChange = () => {
      const index = fromHash();
      if (index >= 0) setActive(index);
    };
    window.addEventListener("hashchange", onHashChange);
    const initial = fromHash();
    let frame = 0;
    if (initial > 0) frame = window.requestAnimationFrame(() => setActive(initial));
    return () => {
      root.removeEventListener(JUMP_EVENT, onJump);
      window.removeEventListener("hashchange", onHashChange);
      window.cancelAnimationFrame(frame);
    };
  }, [tabs]);

  // The underline follows the selected tab, and re-measures when fonts or the layout change.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const tab = tabRefs.current[active];
      if (!tab) return;
      list.style.setProperty("--at-tab-x", `${tab.offsetLeft}px`);
      list.style.setProperty("--at-tab-w", `${tab.offsetWidth}px`);
      list.dataset.measured = "";
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [active]);

  const select = (index: number, focus = false) => {
    setActive(index);
    if (focus) tabRefs.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = tabs.length - 1;
    const next = {
      ArrowRight: active === last ? 0 : active + 1,
      ArrowLeft: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next, true);
  };

  return (
    <div ref={rootRef} className={styles.tabs}>
      <div className={styles.tabBar}>
        <div
          ref={listRef}
          role="tablist"
          aria-label="Membership, packages and gift cards"
          className={styles.tabList}
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${tab.id}-tab`}
              aria-controls={tab.id}
              aria-selected={index === active}
              tabIndex={index === active ? 0 : -1}
              className={styles.tab}
              onClick={() => select(index)}
              onKeyDown={onKeyDown}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {tabs.map((tab, index) => (
        <section
          key={tab.id}
          id={tab.id}
          role="tabpanel"
          aria-labelledby={`${tab.id}-tab`}
          hidden={index !== active}
          className={styles.panel}
        >
          <p id={`${tab.id}-title`} className={styles.panelText} tabIndex={-1} data-jump-focus="">
            {tab.text}
          </p>
          {panels[index]}
        </section>
      ))}
    </div>
  );
}

/** The card face opens its offer too: a pointer convenience, hidden from assistive tech (the button below names it). */
export function FaceOpen({ pieceId, className, children }: { pieceId: string; className?: string; children: ReactNode }) {
  const { openPiece, prefetchFittingRoom } = useAtelier();
  return (
    <div
      className={className}
      aria-hidden="true"
      onClick={() => openPiece(pieceId)}
      onPointerEnter={prefetchFittingRoom}
      onTouchStart={prefetchFittingRoom}
    >
      {children}
    </div>
  );
}
