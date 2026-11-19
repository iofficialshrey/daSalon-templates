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

export function Close(props: IconProps) {
  return <Icon {...props}><path d="M6 6l12 12M18 6 6 18" /></Icon>;
}

export function MenuIcon(props: IconProps) {
  return <Icon {...props}><path d="M4 9h16M4 15h16" /></Icon>;
}

export function Check(props: IconProps) {
  return <Icon {...props}><path d="M5 12.5l4.5 4.5L19 7.5" /></Icon>;
}

/** Oru's mark: two rings that overlap like a breath in and a breath out. */
export function Mark({ size = 26, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden="true" focusable="false" {...props}>
      <circle cx="12.5" cy="16" r="9.5" />
      <circle cx="19.5" cy="16" r="9.5" />
    </svg>
  );
}
