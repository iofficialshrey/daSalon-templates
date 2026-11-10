"use client";

import { useEffect, useSyncExternalStore } from "react";
import { formatPrice } from "./locale";
import type { BookingBootstrap, PublicService } from "./types";

type CatalogSnapshot = {
  data: BookingBootstrap | null;
  error: string;
  loading: boolean;
};

type ApiResult<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

// Loading until the first fetch settles, so pages never flash an empty menu.
let snapshot: CatalogSnapshot = { data: null, error: "", loading: true };
const serverSnapshot: CatalogSnapshot = { data: null, error: "", loading: true };
let pendingRequest: Promise<void> | null = null;
let lastPayload = "";
const subscribers = new Set<() => void>();

function publish(next: CatalogSnapshot) {
  snapshot = next;
  subscribers.forEach((subscriber) => subscriber());
}

function subscribe(subscriber: () => void) {
  subscribers.add(subscriber);
  return () => subscribers.delete(subscriber);
}

async function loadDefaultCatalog(force = false) {
  if (pendingRequest) return pendingRequest;
  if (snapshot.data && !force) return;

  // Background refreshes keep showing the current menu instead of a loading state.
  if (!snapshot.data && !snapshot.loading) publish({ ...snapshot, error: "", loading: true });
  // A request that hangs (a stalled proxy, say) fails after 15s into the unavailable state, not an endless skeleton.
  const signal = typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(15_000) : undefined;
  pendingRequest = fetch("/api/dasalon/bootstrap", { cache: "no-store", signal })
    .then(async (response) => {
      const payload = await response.json().catch(() => null) as ApiResult<BookingBootstrap> | null;
      if (!response.ok || !payload?.success || !payload.data) {
        // Credential and server faults keep their wording off the page.
        const internal = response.status === 401 || response.status === 403 || response.status >= 500;
        throw new Error((!internal && payload?.message) || "The live menu is temporarily unavailable.");
      }
      // An unchanged menu does not re-render the page.
      const serialized = JSON.stringify(payload.data);
      if (serialized === lastPayload && snapshot.data && !snapshot.error && !snapshot.loading) return;
      lastPayload = serialized;
      publish({ data: payload.data, error: "", loading: false });
    })
    .catch((error) => {
      publish({
        data: snapshot.data,
        // Network failures and timeouts reject with the browser's own wording; show only messages written here.
        error: error instanceof Error && !(error instanceof TypeError) && !(error instanceof DOMException)
          ? error.message
          : "The live menu is temporarily unavailable.",
        loading: false,
      });
    })
    .finally(() => {
      pendingRequest = null;
    });

  return pendingRequest;
}

/**
 * The default venue's live catalog. It refreshes when the tab becomes visible
 * and, unless `poll` is false, every 30 seconds while the page is open.
 */
export function useDaSalonCatalog(options: { poll?: boolean } = {}) {
  const poll = options.poll !== false;
  const state = useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);

  useEffect(() => {
    void loadDefaultCatalog();
    const refreshInterval = poll ? window.setInterval(() => void loadDefaultCatalog(true), 30_000) : 0;
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void loadDefaultCatalog(true);
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      if (refreshInterval) window.clearInterval(refreshInterval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [poll]);

  return { ...state, refresh: () => loadDefaultCatalog(true) };
}

/** Always display catalog prices in Singapore dollars (S$); the currency argument is accepted for older callers. */
export const formatCatalogPrice: (amount: number, currency?: string) => string = (amount) => formatPrice(amount);

export function serviceDescription(service: PublicService) {
  return service.description?.trim() || `A ${service.duration}-minute ${service.category?.toLowerCase() || "salon"} appointment.`;
}
