"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMaison } from "./provider";
import { Close } from "./icons";
import styles from "./layer.module.css";
import ui from "./ui.module.css";

type LayerProps = {
  open: boolean;
  onClose: () => void;
  /** dialog: centred · drawer: right side · sheet: bottom sheet. All become full screen on phones except sheet. */
  variant?: "dialog" | "drawer" | "sheet" | "menu";
  /** Visible title; also labels the dialog. */
  title: ReactNode;
  /** Extra header content, e.g. a DEMO badge or Share button. */
  headerExtra?: ReactNode;
  /** Sticky footer content. */
  footer?: ReactNode;
  closeOnEsc?: boolean;
  wide?: boolean;
  /** Hide the header title visually (the body provides its own heading). */
  hideTitle?: boolean;
  className?: string;
  bodyRef?: React.Ref<HTMLDivElement>;
  /** Optional id for the dialog element (e.g. for aria-controls on a toggle). */
  id?: string;
  /** Id of an element that describes the dialog. */
  describedBy?: string;
  children: ReactNode;
};

const EXIT_MS = 220;

/**
 * The template's one overlay primitive. Content behind it becomes inert, the page
 * stops scrolling, focus moves inside and returns to the opener on close. Escape is
 * owned by the provider so stacked layers and the booking window cooperate.
 */
export function Layer({
  open,
  onClose,
  variant = "dialog",
  title,
  headerExtra,
  footer,
  closeOnEsc = true,
  wide = false,
  hideTitle = false,
  className,
  bodyRef,
  id: dialogId,
  describedBy,
  children,
}: LayerProps) {
  const { layerHost, registerLayer, topLayerId, bookingOpen } = useMaison();
  const id = useId();
  const titleId = `${id}-title`;
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const [prevOpen, setPrevOpen] = useState(open);
  const [closing, setClosing] = useState(false);

  // Keep the layer mounted briefly after closing so it can fade out.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) setClosing(true);
  }

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => setClosing(false), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [closing]);

  useEffect(() => {
    if (!open) return;
    return registerLayer({ id, close: () => onCloseRef.current(), closeOnEsc });
  }, [open, id, closeOnEsc, registerLayer]);

  useEffect(() => {
    if (!open || !layerHost) return;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => {
      // A heading inside the content wins; otherwise the visible title; otherwise the dialog itself.
      const panel = panelRef.current;
      const target = panel?.querySelector<HTMLElement>(`.${styles.body} [data-layer-focus]`)
        ?? panel?.querySelector<HTMLElement>(`.${styles.header} [data-layer-focus]`)
        ?? panel;
      target?.focus({ preventScroll: true });
    });
    return () => {
      window.cancelAnimationFrame(frame);
      const opener = openerRef.current;
      // Return focus to whatever opened the layer, once it is interactive again.
      window.requestAnimationFrame(() => {
        if (opener?.isConnected && !opener.closest("[inert]")) opener.focus({ preventScroll: true });
      });
    };
  }, [open, layerHost]);

  if (!layerHost || (!open && !closing)) return null;

  const isTop = topLayerId === id;
  const inert = !open || bookingOpen || (topLayerId !== null && !isTop);

  return createPortal(
    <div
      className={`${styles.root} ${styles[variant]}`}
      data-state={open ? "open" : "closing"}
      inert={inert}
    >
      <div className={styles.backdrop} onClick={() => closeOnEsc && onCloseRef.current()} aria-hidden="true" />
      <div
        ref={panelRef}
        className={`${styles.panel} ${wide ? styles.wide : ""} ${className ?? ""}`}
        id={dialogId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        tabIndex={-1}
      >
        <header className={styles.header}>
          {hideTitle ? (
            <span id={titleId} className={ui.srOnly}>{title}</span>
          ) : (
            <h2 id={titleId} className={styles.title} data-layer-focus tabIndex={-1}>
              {title}
            </h2>
          )}
          <div className={styles.headerExtra}>
            {headerExtra}
            {closeOnEsc ? (
              <button type="button" className={ui.iconBtn} onClick={() => onCloseRef.current()} aria-label="Close">
                <Close size={20} />
              </button>
            ) : null}
          </div>
        </header>
        <div className={styles.body} ref={bodyRef}>
          {children}
        </div>
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </div>,
    layerHost,
  );
}
