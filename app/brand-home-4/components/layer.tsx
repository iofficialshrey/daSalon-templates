"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePaloma } from "./provider";
import styles from "./layer.module.css";

type LayerProps = {
  open: boolean;
  onClose: () => void;
  /** Called once the closing animation has finished (at once under reduced motion). */
  onExited?: () => void;
  /**
   * spread: a full-viewport two-page spread (offers).
   * contents: a full-viewport ink sheet that rises from the bottom.
   */
  variant: "spread" | "contents";
  /** Id of the element inside `children` that names the dialog. */
  labelledBy: string;
  describedBy?: string;
  id?: string;
  className?: string;
  closeOnEsc?: boolean;
  /** Where focus returns on close. Captured by the opener (Safari does not focus clicked buttons). */
  returnTo?: HTMLElement | null;
  children: ReactNode;
};

const EXIT_MS = 200;

/**
 * The template's one overlay primitive: a portal into the provider's layer host,
 * an inert page behind it (InertScope), focus on [data-layer-focus] (or the
 * dialog), a Tab trap, Escape via the provider, an exit animation and focus
 * returned to the captured opener. The children render the whole dialog.
 */
export function Layer({
  open,
  onClose,
  onExited,
  variant,
  labelledBy,
  describedBy,
  id: dialogId,
  className,
  closeOnEsc = true,
  returnTo,
  children,
}: LayerProps) {
  const { layerHost, registerLayer, topLayerId, bookingOpen } = usePaloma();
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const onExitedRef = useRef(onExited);
  const returnRef = useRef(returnTo);
  const [prevOpen, setPrevOpen] = useState(open);
  const [closing, setClosing] = useState(false);

  // Keep the layer mounted briefly after closing so it can animate out.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) setClosing(true);
  }

  useEffect(() => {
    onCloseRef.current = onClose;
    onExitedRef.current = onExited;
    returnRef.current = returnTo;
  }, [onClose, onExited, returnTo]);

  useEffect(() => {
    if (!closing) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      setClosing(false);
      onExitedRef.current?.();
    }, reduced ? 0 : EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [closing]);

  useEffect(() => {
    if (!open) return;
    return registerLayer({ id, close: () => onCloseRef.current(), closeOnEsc });
  }, [open, id, closeOnEsc, registerLayer]);

  useEffect(() => {
    if (!open || !layerHost) return;
    const fallback = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const frame = window.requestAnimationFrame(() => {
      const target = panel?.querySelector<HTMLElement>("[data-layer-focus]") ?? panel;
      target?.focus({ preventScroll: true });
    });
    return () => {
      window.cancelAnimationFrame(frame);
      const opener = returnRef.current ?? fallback;
      // Return focus once the page is interactive again. Inert lifts a commit after the layer
      // unregisters, so wait a few frames for it; never take focus that has moved elsewhere.
      const restore = (tries: number) => {
        if (!opener?.isConnected) return;
        if (opener.closest("[inert]")) {
          if (tries > 0) window.requestAnimationFrame(() => restore(tries - 1));
          return;
        }
        const active = document.activeElement;
        if (active && active !== document.body && !panel?.contains(active)) return;
        opener.focus({ preventScroll: true });
      };
      window.requestAnimationFrame(() => restore(10));
    };
  }, [open, layerHost]);

  // Keep Tab inside the dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select, textarea, summary, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.closest("[inert]") && element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      // Focus can also sit on something outside the tab order (the panel, or a title focused on
      // open); from before the first stop or after the last, Tab must still wrap inside.
      const outside = active instanceof HTMLElement && !focusable.includes(active);
      const beforeFirst = outside && (active === panel || Boolean(active.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING));
      const afterLast = outside && active !== panel && Boolean(active.compareDocumentPosition(last) & Node.DOCUMENT_POSITION_PRECEDING);
      if (event.shiftKey && (active === first || beforeFirst)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || afterLast)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!layerHost || (!open && !closing)) return null;

  const isTop = topLayerId === id;
  const inert = !open || bookingOpen || (topLayerId !== null && !isTop);

  return createPortal(
    <div className={`${styles.root} ${styles[variant]}`} data-state={open ? "open" : "closing"} inert={inert}>
      <div className={styles.backdrop} onClick={() => closeOnEsc && onCloseRef.current()} aria-hidden="true" />
      <div
        ref={panelRef}
        className={`${styles.panel} ${className ?? ""}`}
        id={dialogId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    layerHost,
  );
}
