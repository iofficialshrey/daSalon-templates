"use client";

import { useEffect, useSyncExternalStore } from "react";
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

let snapshot: CatalogSnapshot = { data: null, error: "", loading: false };
const serverSnapshot: CatalogSnapshot = { data: null, error: "", loading: true };
let pendingRequest: Promise<void> | null = null;
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

  publish({ ...snapshot, error: "", loading: true });
  pendingRequest = fetch("/api/dasalon/bootstrap", { cache: "no-store" })
    .then(async (response) => {
      const payload = await response.json().catch(() => null) as ApiResult<BookingBootstrap> | null;
      if (!response.ok || !payload?.success || !payload.data) {
        throw new Error(payload?.message || "The live menu is temporarily unavailable.");
      }
      publish({ data: payload.data, error: "", loading: false });
    })
    .catch((error) => {
      publish({
        data: snapshot.data,
        error: error instanceof Error ? error.message : "The live menu is temporarily unavailable.",
        loading: false,
      });
    })
    .finally(() => {
      pendingRequest = null;
    });

  return pendingRequest;
}

export function useDaSalonCatalog() {
  const state = useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);

  useEffect(() => {
    void loadDefaultCatalog();
    const refreshInterval = window.setInterval(() => void loadDefaultCatalog(true), 30_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void loadDefaultCatalog(true);
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(refreshInterval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  return { ...state, refresh: () => loadDefaultCatalog(true) };
}

export function formatCatalogPrice(amount: number, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${amount.toFixed(0)}`;
  }
}

export function serviceDescription(service: PublicService) {
  return service.description?.trim() || `A ${service.duration}-minute ${service.category?.toLowerCase() || "salon"} appointment.`;
}
