import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 16, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
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
  return <Icon {...props}><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" /></Icon>;
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

export function Plus(props: IconProps) {
  return <Icon {...props}><path d="M12 5v14M5 12h14" /></Icon>;
}

export function Check(props: IconProps) {
  return <Icon {...props}><path d="m5 12.5 4.5 4.5L19 7.5" /></Icon>;
}

export function Info(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.75v.01" />
    </Icon>
  );
}

export function Share(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4v11M7.5 8.5 12 4l4.5 4.5" />
      <path d="M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13" />
    </Icon>
  );
}

export function ChevronLeft(props: IconProps) {
  return <Icon {...props}><path d="M14.5 6 8.5 12l6 6" /></Icon>;
}

export function ChevronRight(props: IconProps) {
  return <Icon {...props}><path d="m9.5 6 6 6-6 6" /></Icon>;
}

export function Menu(props: IconProps) {
  return <Icon {...props}><path d="M4 9h16M4 15h16" /></Icon>;
}

export function Pin(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11Z" />
      <circle cx="12" cy="10" r="2.25" />
    </Icon>
  );
}

/** A refresh arrow for "try again". */
export function Refresh(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 4.5v3.75h-3.75" />
    </Icon>
  );
}
