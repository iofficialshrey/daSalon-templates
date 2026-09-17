/**
 * Explicit service → media mapping for STUDIO / 07.
 * Never assign photographs by catalog index or broad category alone.
 *
 * Visual audit (2026-09):
 * - service-01: stylist hands shaping hair — precision hair craft
 * - service-02: product bowl / oil pour — not treatment photography (unused for services)
 * - service-03: editorial portrait — people / story only
 * - service-04: finished hair presence — soft finish editorial (story / soft hair finish)
 * Massage, colour, facial, nails: no suitable treatment photos → typographic panels
 */

export type ServiceMediaKind = "photo" | "type";

export type ServiceMedia = {
  kind: ServiceMediaKind;
  /** Absolute public path when kind === "photo" */
  src?: string;
  /** Short treatment label for typographic panels */
  label: string;
  alt: string;
};

export type LookDirection = "all" | "sharp" | "soft" | "expressive";

const HAIR_CRAFT = "/brand-home-7/service-01.jpg";
const HAIR_FINISH = "/brand-home-7/service-04.jpg";

/** Optional overrides keyed by live Partner API service IDs. */
export const serviceMediaById: Record<string, ServiceMedia> = {
  // Populate when approved assets are keyed to production service IDs.
};

type NameRule = {
  pattern: RegExp;
  media: ServiceMedia;
};

const nameRules: NameRule[] = [
  {
    pattern: /\b(colour|color|balayage|highlight|bleach|toner|tint)\b/i,
    media: {
      kind: "type",
      label: "COLOUR",
      alt: "Colour service — treatment photography pending",
    },
  },
  {
    pattern: /\b(facial|skin\s*care|cleanse)\b/i,
    media: {
      kind: "type",
      label: "FACIAL",
      alt: "Facial service — treatment photography pending",
    },
  },
  {
    pattern: /\b(nail|manicure|pedicure)\b/i,
    media: {
      kind: "type",
      label: "NAILS",
      alt: "Nail service — treatment photography pending",
    },
  },
  {
    pattern: /\b(massage|aromatherapy|swedish|deep\s*tissue|relaxation)\b/i,
    media: {
      kind: "type",
      label: "MASSAGE",
      alt: "Massage service — treatment photography pending",
    },
  },
  {
    pattern: /\b(haircut|cut|trim|beard|grooming|shape)\b/i,
    media: {
      kind: "photo",
      src: HAIR_CRAFT,
      label: "CUT",
      alt: "Precision hair craft in the studio",
    },
  },
  {
    pattern: /\b(blow[\s-]?dry|wash|styling|finish)\b/i,
    media: {
      kind: "photo",
      src: HAIR_FINISH,
      label: "FINISH",
      alt: "Finished hair presence",
    },
  },
  {
    pattern: /\b(scalp|detox|therapy)\b/i,
    media: {
      kind: "photo",
      src: HAIR_CRAFT,
      label: "SCALP",
      alt: "Scalp and hair treatment craft",
    },
  },
];

export function resolveServiceMedia(input: {
  id: string;
  name: string;
  category?: string | null;
}): ServiceMedia {
  const byId = serviceMediaById[input.id];
  if (byId) return byId;

  const haystack = `${input.name} ${input.category || ""}`.trim();
  for (const rule of nameRules) {
    if (rule.pattern.test(haystack)) return rule.media;
  }

  return {
    kind: "type",
    label: "EDIT",
    alt: `${input.name} — photography pending for this treatment`,
  };
}

export function matchesLookDirection(
  service: { name: string; category?: string | null },
  direction: LookDirection,
): boolean {
  if (direction === "all") return true;
  const haystack = `${service.name} ${service.category || ""}`.toLowerCase();

  if (direction === "sharp") {
    return /\b(cut|trim|beard|grooming|shape|precision|classic\s*haircut)\b/.test(haystack);
  }
  if (direction === "soft") {
    return /\b(massage|aromatherapy|swedish|relax|blow[\s-]?dry|wash|scalp|detox|therapy|finish)\b/.test(haystack);
  }
  // expressive
  return /\b(colour|color|balayage|highlight|creative|expressive|tint)\b/.test(haystack);
}

export const lookDirections: { id: LookDirection; label: string; hint: string }[] = [
  { id: "all", label: "All", hint: "Complete live menu" },
  { id: "sharp", label: "Sharp", hint: "Precision cuts and shape" },
  { id: "soft", label: "Soft", hint: "Flowing finishes and restorative care" },
  { id: "expressive", label: "Expressive", hint: "Colour and expressive styling" },
];
