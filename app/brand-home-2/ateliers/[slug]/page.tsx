import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VENUE_SLUGS } from "@/lib/dasalon/venues";
import { AtelierPage } from "../../components/atelier-page";
import { CurrentAtelier, InertScope } from "../../components/provider";
import { atelierBySlug } from "../../data/ateliers";
import styles from "../../layout.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return VENUE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/brand-home-2/ateliers/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const atelier = atelierBySlug(slug);
  if (!atelier) return {};
  return {
    title: `${atelier.name} — Atelier, Singapore`,
    description: `${atelier.subLine} at ${atelier.address}. Live menu and online booking in Singapore time.`,
  };
}

export default async function AtelierRoute({ params }: PageProps<"/brand-home-2/ateliers/[slug]">) {
  const { slug } = await params;
  const atelier = atelierBySlug(slug);
  if (!atelier) notFound();
  return (
    <InertScope as="main" id="main" className={styles.main}>
      <CurrentAtelier slug={atelier.slug} />
      <AtelierPage slug={atelier.slug} />
    </InertScope>
  );
}
