import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>
const base = { viewBox: '0 0 24 24', 'aria-hidden': true, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export const Icons = {
  content: (p: IconProps) => <svg {...base} {...p}><path d="M5 4h14v16H5zM8 8h8m-8 4h8m-8 4h5" /></svg>,
  shapes: (p: IconProps) => <svg {...base} {...p}><circle cx="8" cy="8" r="4"/><path d="M13 13h7v7h-7z"/></svg>,
  colors: (p: IconProps) => <svg {...base} {...p}><path d="M12 3s6 5.5 6 11a6 6 0 0 1-12 0c0-5.5 6-11 6-11Z"/></svg>,
  logo: (p: IconProps) => <svg {...base} {...p}><path d="M4 5h16v14H4zM8 15l3-3 2 2 2-2 3 3"/><circle cx="9" cy="9" r="1"/></svg>,
  frames: (p: IconProps) => <svg {...base} {...p}><path d="M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5"/></svg>,
  templates: (p: IconProps) => <svg {...base} {...p}><path d="M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z"/></svg>,
  export: (p: IconProps) => <svg {...base} {...p}><path d="M12 15V3m0 0 4 4m-4-4L8 7M5 13v7h14v-7"/></svg>,
  link: (p: IconProps) => <svg {...base} {...p}><path d="M10 13a5 5 0 0 0 7.1.1l2-2A5 5 0 0 0 12 4l-1.1 1.1M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/></svg>,
  text: (p: IconProps) => <svg {...base} {...p}><path d="M5 5h14M12 5v14m-4 0h8"/></svg>,
  check: (p: IconProps) => <svg {...base} {...p}><path d="m5 12 4 4L19 6"/></svg>,
  download: (p: IconProps) => <svg {...base} {...p}><path d="M12 3v12m0 0 5-5m-5 5-5-5M5 20h14"/></svg>,
  shield: (p: IconProps) => <svg {...base} {...p}><path d="M12 3 5 6v5c0 4.5 2.8 8.1 7 10 4.2-1.9 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>,
  info: (p: IconProps) => <svg {...base} {...p}><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></svg>,
}
