/** Line icons used across the site (stroke = currentColor). */
const paths: Record<string, React.ReactNode> = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
  user: <><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20c1.4-3.6 4.2-5.3 7.5-5.3s6.1 1.7 7.5 5.3" /></>,
  cart: <><path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8Z" /><path d="M9 10V7a3 3 0 0 1 6 0v3" /></>,
  menu: <path d="M4 8h16M4 16h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  pin: <><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  truck: <><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  wrench: <path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 0-2-2Z" />,
  shield: <><path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  doc: <><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 20h14" /></>,
  phone: <path d="M6.5 3h3l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A17 17 0 0 1 4.5 5a2 2 0 0 1 2-2Z" />,
  chat: <path d="M4 5h16v11H8l-4 4z" />,
  whatsapp: <><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" /><path d="M9 9.5c.5 2 2.5 4 4.5 4.5l1-1.2 1.8.8-.3 1.4c-3 .3-7-3.7-6.7-6.7l1.4-.3.8 1.8z" /></>,
  drop: <><path d="M12 3c4.5 5.5 7 9.4 7 12.5a7 7 0 0 1-14 0C5 12.4 7.5 8.5 12 3Z" /><path d="M9 16a3 3 0 0 0 3 3" /></>,
  bubbles: <><circle cx="12" cy="16" r="4.5" /><circle cx="7" cy="7.5" r="2.5" /><circle cx="16" cy="6" r="1.6" /><circle cx="19" cy="12" r="1" /></>,
  chamber: <><ellipse cx="12" cy="5" rx="5.5" ry="2" /><path d="M6.5 5v14c0 1 2.5 2 5.5 2s5.5-1 5.5-2V5" /><path d="M10 15v-1.5M12 12.5v-2M14 16v-1.5" /></>,
  battery: <><rect x="3" y="8" width="16" height="9" rx="2" /><path d="M19 11h2v3h-2M6.5 11v3M9.5 11v3M12.5 11v3" /></>,
  plates5: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M7 8v8M9.5 8v8M12 8v8M14.5 8v8M17 8v8" /></>,
  plates11: <><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M5 8v8M6.6 8v8M8.2 8v8M9.8 8v8M11.4 8v8M13 8v8M14.6 8v8M16.2 8v8M17.8 8v8M19.4 8v8" /></>,
  modes: <><circle cx="12" cy="12" r="8" strokeDasharray="2 2.6" /><circle cx="12" cy="4" r="1.6" /><circle cx="20" cy="12" r="1.6" /><circle cx="12" cy="20" r="1.6" /><circle cx="4" cy="12" r="1.6" /></>,
  screen: <><rect x="3" y="6" width="18" height="11" rx="2" /><circle cx="12" cy="11.5" r="2" /><path d="M8 20h8" /></>,
  display: <><rect x="3" y="5" width="18" height="11" rx="2" /><path d="M8 20h8M12 16v4M7 12l3-3 3 3 3-3 2 2" /></>,
  filter: <><path d="M5 4h14l-5 7v6l-4 3v-9z" /></>,
  calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>,
  star: <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8L3.5 9.7l5.9-.8z" />,
  home: <><path d="M4 11 12 4l8 7" /><path d="M6 10v10h12V10" /></>,
  bag: <><path d="M6 7h12l1 13H5z" /><path d="M9 7a3 3 0 0 1 6 0" /></>,
  building: <><path d="M5 21V4h9v17M14 9h5v12M8 8h2M8 12h2M8 16h2M17 13h0M17 17h0" /></>,
  logout: <><path d="M9 4H5v16h4M15 8l4 4-4 4M19 12H9" /></>,
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  box: <><path d="m3 7 9-4 9 4-9 4z" /><path d="M3 7v10l9 4 9-4V7M12 11v10" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2 .6 3.2 2.3 3.8 5" /></>,
  inbox: <><path d="M3 13h5l1.5 3h5L16 13h5" /><path d="M5 5h14l2 8v6H3v-6z" /></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
  ticket: <><path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" /><path d="M10 7v10" strokeDasharray="2 2" /></>,
  tag: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.5" /></>,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
  bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  gift: <><rect x="3" y="8" width="18" height="4" /><path d="M5 12v9h14v-9M12 8v13M12 8c-2-4-6-4-6-1.5S10 8 12 8c2 0 6 1 6-1.5S14 4 12 8" /></>,
  print: <><path d="M7 9V3h10v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M7 14h10v7H7z" /></>,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" />,
  play: <path d="M8 5v14l11-7z" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
  alert: <><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17v.5" /></>,
};

export type IconName = keyof typeof paths;

export function Icon({ name, className = 'size-5', strokeWidth = 1.7 }: { name: IconName | string; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {paths[name] ?? paths.info}
    </svg>
  );
}
