import type { ReactNode, SVGProps } from "react";

/* Inline SVG icons. Manrope has no ↗ → ✓ glyphs, so none of those are used as text. */

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };

function Icon({ size = "1em", children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowUpRight(props: IconProps) {
  return <Icon {...props}><path d="M7 17 17 7M8.5 7H17v8.5" /></Icon>;
}

export function ArrowDown(props: IconProps) {
  return <Icon {...props}><path d="M12 4.5v15M6.5 14 12 19.5 17.5 14" /></Icon>;
}

export function Close(props: IconProps) {
  return <Icon {...props}><path d="m6.5 6.5 11 11M17.5 6.5l-11 11" /></Icon>;
}

/** Two 18px lines: the menu button. */
export function Menu(props: IconProps) {
  return <Icon {...props}><path d="M3 9h18M3 15h18" /></Icon>;
}

export function ChevronLeft(props: IconProps) {
  return <Icon {...props}><path d="M14.5 6 8.5 12l6 6" /></Icon>;
}

export function ChevronRight(props: IconProps) {
  return <Icon {...props}><path d="m9.5 6 6 6-6 6" /></Icon>;
}

export function Plus(props: IconProps) {
  return <Icon {...props}><path d="M12 5v14M5 12h14" /></Icon>;
}

export function Minus(props: IconProps) {
  return <Icon {...props}><path d="M5 12h14" /></Icon>;
}

/** The busy mark: an open ring that breathes while a Book waits (CSS animates it). */
export function Ring(props: IconProps) {
  return <Icon {...props}><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="3" /></Icon>;
}

export function Check(props: IconProps) {
  return <Icon {...props}><path d="m5 12.5 4.5 4.5L19 7.5" /></Icon>;
}
