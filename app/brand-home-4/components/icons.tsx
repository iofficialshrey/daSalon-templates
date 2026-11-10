import type { ReactNode, SVGProps } from "react";

/* Inline SVG icons. Manrope has no ↗ → ◆ ✓ glyphs, so none of those are used as text. */

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };

function Icon({ size = "1em", children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowRight(props: IconProps) {
  return <Icon {...props}><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" /></Icon>;
}

export function ArrowDown(props: IconProps) {
  return <Icon {...props}><path d="M12 4v15M6.5 13.5 12 19l5.5-5.5" /></Icon>;
}

export function ArrowUpRight(props: IconProps) {
  return <Icon {...props}><path d="M7 17 17 7M8.5 7H17v8.5" /></Icon>;
}

export function Plus(props: IconProps) {
  return <Icon {...props}><path d="M12 5v14M5 12h14" /></Icon>;
}

export function Minus(props: IconProps) {
  return <Icon {...props}><path d="M5 12h14" /></Icon>;
}

export function Close(props: IconProps) {
  return <Icon {...props}><path d="m6 6 12 12M18 6 6 18" /></Icon>;
}

export function Check(props: IconProps) {
  return <Icon {...props}><path d="m5 12.5 4.5 4.5L19 7.5" /></Icon>;
}

export function Pause(props: IconProps) {
  return <Icon {...props}><path d="M9 6v12M15 6v12" /></Icon>;
}

export function Play(props: IconProps) {
  return <Icon {...props} fill="currentColor" stroke="none"><path d="M8 5.5v13l10.5-6.5z" /></Icon>;
}

export function Replay(props: IconProps) {
  return <Icon {...props}><path d="M5 12a7 7 0 1 0 2.1-5M5 4v4.5h4.5" /></Icon>;
}

/** Two bars: the Contents mark. */
export function ContentsIcon(props: IconProps) {
  return <Icon {...props}><path d="M4 9h16M4 15h10" /></Icon>;
}

export function Diamond(props: IconProps) {
  return <Icon {...props} fill="currentColor" stroke="none"><path d="M12 3 21 12 12 21 3 12z" /></Icon>;
}

export function Pin(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s-6-5.6-6-10.5a6 6 0 0 1 12 0C18 15.4 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2" />
    </Icon>
  );
}
