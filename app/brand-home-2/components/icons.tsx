import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 16, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
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

export function ArrowLeft(props: IconProps) {
  return <Icon {...props}><path d="M20 12H5M10.5 6.5 5 12l5.5 5.5" /></Icon>;
}

export function ArrowDown(props: IconProps) {
  return <Icon {...props}><path d="M12 4v15M6.5 13.5 12 19l5.5-5.5" /></Icon>;
}

export function ArrowUp(props: IconProps) {
  return <Icon {...props}><path d="M12 20V5M6.5 10.5 12 5l5.5 5.5" /></Icon>;
}

export function ArrowUpRight(props: IconProps) {
  return <Icon {...props}><path d="M7 17 17 7M8.5 7H17v8.5" /></Icon>;
}

export function Close(props: IconProps) {
  return <Icon {...props}><path d="m6 6 12 12M18 6 6 18" /></Icon>;
}

/** Two lines: the menu toggle. */
export function MenuIcon(props: IconProps) {
  return <Icon {...props}><path d="M4 9h16M4 15h16" /></Icon>;
}

export function Check(props: IconProps) {
  return <Icon {...props}><path d="m5 12.5 4.5 4.5L19 7.5" /></Icon>;
}

export function Alert(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v6M12 16.25v.01" />
    </Icon>
  );
}

export function Share(props: IconProps) {
  return <Icon {...props}><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 12v8h14v-8" /></Icon>;
}

export function ChevronLeft(props: IconProps) {
  return <Icon {...props}><path d="m14.5 6-6 6 6 6" /></Icon>;
}

export function ChevronRight(props: IconProps) {
  return <Icon {...props}><path d="m9.5 6 6 6-6 6" /></Icon>;
}
