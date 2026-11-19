import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 18, children, ...props }: IconProps & { children: ReactNode }) {
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

export function ArrowRight(props: IconProps) {
  return <Icon {...props}><path d="M4.5 12h14.5M13.5 6.5 19 12l-5.5 5.5" /></Icon>;
}

export function ArrowUp(props: IconProps) {
  return <Icon {...props}><path d="M12 19.5V5M6.5 10.5 12 5l5.5 5.5" /></Icon>;
}

export function ChevronDown(props: IconProps) {
  return <Icon {...props}><path d="M6 9.5 12 15l6-5.5" /></Icon>;
}

export function Close(props: IconProps) {
  return <Icon {...props}><path d="M6 6l12 12M18 6 6 18" /></Icon>;
}

export function Check(props: IconProps) {
  return <Icon {...props}><path d="M5 12.5l4.5 4.5L19 7.5" /></Icon>;
}

export function MenuIcon(props: IconProps) {
  return <Icon {...props}><path d="M4 9h16M4 15h16" /></Icon>;
}

/** Néroli's mark: a drop inside a ring, like the pearl in the basin. */
export function Mark({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false" {...props}>
      <circle cx="16" cy="16" r="14.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="16" cy="16" r="6.5" fill="currentColor" />
    </svg>
  );
}
