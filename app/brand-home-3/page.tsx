"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SalonBooking from "../salon-booking";
import BrandCommerce from "../components/brand-commerce";
import { formatCatalogPrice, serviceDescription, useDaSalonCatalog } from "@/lib/dasalon/client";
import {
  sereinCommerceCopy,
  sereinGifts,
  sereinMemberships,
  sereinPackages,
} from "./commerce";

const embeddedRituals = [
  { name: "Ground", type: "Full-body therapy", duration: "90 min", price: "S$136", note: "Warm botanical oils, long-form pressure and a weighted eye ritual bring the nervous system gently back to earth." },
  { name: "Float", type: "Water & mineral ritual", duration: "75 min", price: "S$118", note: "A mineral soak, rhythmic scalp release and weightless rest designed to soften physical and mental noise." },
  { name: "Illuminate", type: "Skin renewal facial", duration: "60 min", price: "S$98", note: "A slow, sculpting facial with cool stones and barrier-rich hydration for rested, light-reflective skin." },
  { name: "Unwind", type: "Sleep ceremony", duration: "105 min", price: "S$152", note: "Steam, quiet touch and a warm cocoon ritual prepare the body for deep, uninterrupted sleep." },
];

/** Only appointment intent reaches live booking. */
const appointmentIntent = /(book|reserve|appointment|choose this ritual|make space|return to serein house)/i;
/** Commerce intent never reaches booking — it belongs to the catalogue below the embed. */
const commerceIntent = /(membership|request membership|join|gift|package|buy)/i;

export default function BrandHomeThreePage() {
  const catalog = useDaSalonCatalog();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const commerceRef = useRef<HTMLDivElement>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingServiceId, setBookingServiceId] = useState<string | null>(null);

  const revealCommerce = useCallback(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    commerceRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !catalog.data) return;
    let removeIntegration: (() => void) | undefined;

    const install = () => {
      removeIntegration?.();
      const document = frame.contentDocument;
      if (!document?.body) return;
      const liveServices = catalog.data?.services ?? [];
      let syncing = false;
      const setText = (element: HTMLElement | null | undefined, value: string) => {
        if (element && element.textContent !== value) element.textContent = value;
      };

      const syncMenu = () => {
        if (syncing) return;
        syncing = true;
        const ritualArticles = Array.from(document.querySelectorAll<HTMLElement>("article"))
          .filter((article) => article.querySelector("button strong"))
          .slice(0, embeddedRituals.length);

        embeddedRituals.forEach((ritual, index) => {
          const service = liveServices[index];
          const article = ritualArticles[index];
          if (!service || !article) return;
          article.dataset.dasalonServiceId = service.id;
          const title = article.querySelector<HTMLElement>("button strong");
          const firstButton = article.querySelector<HTMLElement>("button");
          const duration = Array.from(firstButton?.querySelectorAll<HTMLElement>("*") ?? [])
            .find((element) => element.children.length === 0 && /^\d+\s*min$/i.test(element.textContent?.trim() || ""));
          const description = article.querySelector<HTMLElement>("p");
          const price = Array.from(article.querySelectorAll<HTMLElement>("strong"))
            .find((element) => element !== title && /[₹$€£]|\d/.test(element.textContent || ""));
          const type = Array.from(article.querySelectorAll<HTMLElement>("span, small"))
            .find((element) => {
              const value = element.textContent?.trim() || "";
              return value === ritual.type || liveServices.some((item) => item.category === value);
            });
          setText(title, service.name);
          setText(duration, `${service.duration} min`);
          setText(description, serviceDescription(service));
          setText(price, formatCatalogPrice(service.price, catalog.data?.currency));
          if (service.category) setText(type, service.category);
        });

        const recommendation = Array.from(document.querySelectorAll<HTMLElement>("body *"))
          .find((element) => element.children.length === 0 && element.textContent?.trim() === "Ground · 90 min");
        if (recommendation && liveServices[0]) setText(recommendation, `${liveServices[0].name} · ${liveServices[0].duration} min`);
        const footerNote = Array.from(document.querySelectorAll<HTMLElement>("footer small"))
          .find((element) => element.textContent?.includes("Booking data is not submitted"));
        setText(footerNote, "© 2026 Serein House · Fictional template concept · Live booking powered by da Salon");
        syncing = false;
      };

      const routeFrameClick = (event: Event) => {
        const eventTarget = event.target as Element | null;
        const target = eventTarget && typeof eventTarget.closest === "function" ? eventTarget.closest("button") : null;
        if (!target) return;
        const label = target.textContent || "";

        // Memberships, packages and gift cards are browse-only and live below the embed.
        if (commerceIntent.test(label)) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          revealCommerce();
          return;
        }

        if (!appointmentIntent.test(label)) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        const article = target.closest<HTMLElement>("article");
        const context = target.closest("article, section")?.textContent || "";
        const selected = liveServices.find((service) => context.includes(service.name));
        setBookingServiceId(article?.dataset.dasalonServiceId || selected?.id || null);
        setBookingOpen(true);
      };

      syncMenu();
      const observer = new MutationObserver(syncMenu);
      observer.observe(document.body, { childList: true, subtree: true });
      document.addEventListener("click", routeFrameClick, true);
      removeIntegration = () => {
        observer.disconnect();
        document.removeEventListener("click", routeFrameClick, true);
      };
    };

    frame.addEventListener("load", install);
    if (frame.contentDocument?.readyState === "complete") install();
    return () => {
      frame.removeEventListener("load", install);
      removeIntegration?.();
    };
  }, [catalog.data, revealCommerce]);

  return (
    <main className="serein-embed-shell">
      <div className="serein-embed-stage">
        <iframe
          ref={frameRef}
          className="serein-embed-frame"
          src="/brand-home-3-site/index.html"
          title="Serein House spa Brand Home"
          allow="autoplay"
        />
        <button type="button" className="serein-embed-continue" onClick={revealCommerce}>
          Membership, packages &amp; gifts <span aria-hidden="true">↓</span>
        </button>
      </div>

      <div ref={commerceRef} className="serein-embed-commerce">
        <BrandCommerce
          theme="serein"
          brandName="Serein House"
          brandMark="S"
          memberships={sereinMemberships}
          packages={sereinPackages}
          gifts={sereinGifts}
          copy={sereinCommerceCopy}
        />
      </div>

      {bookingOpen && <SalonBooking brand="Serein House" theme="serein" initialBootstrap={catalog.data} initialServiceId={bookingServiceId} onClose={() => setBookingOpen(false)} />}
    </main>
  );
}
