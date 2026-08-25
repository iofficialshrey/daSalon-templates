"use client";

import { useEffect, useRef, useState } from "react";
import SalonBooking from "../salon-booking";
import { formatCatalogPrice, serviceDescription, useDaSalonCatalog } from "@/lib/dasalon/client";

const embeddedRituals = [
  { name: "Ground", type: "Full-body therapy", duration: "90 min", price: "₹6,800", note: "Warm botanical oils, long-form pressure and a weighted eye ritual bring the nervous system gently back to earth." },
  { name: "Float", type: "Water & mineral ritual", duration: "75 min", price: "₹5,900", note: "A mineral soak, rhythmic scalp release and weightless rest designed to soften physical and mental noise." },
  { name: "Illuminate", type: "Skin renewal facial", duration: "60 min", price: "₹4,900", note: "A slow, sculpting facial with cool stones and barrier-rich hydration for rested, light-reflective skin." },
  { name: "Unwind", type: "Sleep ceremony", duration: "105 min", price: "₹7,600", note: "Steam, quiet touch and a warm cocoon ritual prepare the body for deep, uninterrupted sleep." },
];

export default function BrandHomeThreePage() {
  const catalog = useDaSalonCatalog();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingServiceId, setBookingServiceId] = useState<string | null>(null);

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

      const openLiveBooking = (event: Event) => {
        const eventTarget = event.target as Element | null;
        const target = eventTarget && typeof eventTarget.closest === "function" ? eventTarget.closest("button") : null;
        if (!target || !/(book|reserve|appointment|choose this ritual|make space)/i.test(target.textContent || "")) return;
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
      document.addEventListener("click", openLiveBooking, true);
      removeIntegration = () => {
        observer.disconnect();
        document.removeEventListener("click", openLiveBooking, true);
      };
    };

    frame.addEventListener("load", install);
    if (frame.contentDocument?.readyState === "complete") install();
    return () => {
      frame.removeEventListener("load", install);
      removeIntegration?.();
    };
  }, [catalog.data]);

  return (
    <main className="serein-embed-shell">
      <iframe
        ref={frameRef}
        className="serein-embed-frame"
        src="/brand-home-3-site/index.html"
        title="Serein House spa Brand Home"
        allow="autoplay"
      />
      {bookingOpen && <SalonBooking brand="Serein House" theme="serein" initialBootstrap={catalog.data} initialServiceId={bookingServiceId} onClose={() => setBookingOpen(false)} />}
    </main>
  );
}
