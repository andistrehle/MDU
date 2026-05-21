interface IconProps {
  name: string;
  size?: number;
  stroke?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 18, stroke = 1.75, className, style }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24' as string,
    fill: 'none' as const,
    stroke: 'currentColor' as const,
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    style: { width: size, height: size, ...style },
  };

  switch (name) {
    case 'home':        return <svg {...common}><path d="M3 11.5L12 4l9 7.5"/><path d="M5 10v10h14V10"/></svg>;
    case 'trophy':      return <svg {...common}><path d="M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M5 5H3v2a3 3 0 0 0 3 3"/><path d="M19 5h2v2a3 3 0 0 1-3 3"/><path d="M9 20h6"/><path d="M12 14v6"/></svg>;
    case 'calendar':    return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4M16 3v4"/></svg>;
    case 'list':        return <svg {...common}><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>;
    case 'users':       return <svg {...common}><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M21 20c0-2.5-1.7-4.5-4-4.5"/></svg>;
    case 'pin':         return <svg {...common}><path d="M12 21s7-7.3 7-12a7 7 0 0 0-14 0c0 4.7 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>;
    case 'download':    return <svg {...common}><path d="M12 4v12"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>;
    case 'mail':        return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 7l8 6 8-6"/></svg>;
    case 'search':      return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>;
    case 'bell':        return <svg {...common}><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>;
    case 'user':        return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>;
    case 'menu':        return <svg {...common}><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
    case 'close':       return <svg {...common}><path d="M6 6l12 12M18 6l-12 12"/></svg>;
    case 'chevron':     return <svg {...common}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chevron-down':return <svg {...common}><path d="M6 9l6 6 6-6"/></svg>;
    case 'arrow-up':    return <svg {...common}><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>;
    case 'arrow-right': return <svg {...common}><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></svg>;
    case 'play':        return <svg {...common} fill="currentColor" stroke="none"><path d="M7 4l13 8-13 8z"/></svg>;
    case 'star':        return <svg {...common} fill="currentColor" stroke="none"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.4 6.6L12 17l-6 3.5L7.4 14 2.5 9.4l6.6-.8z"/></svg>;
    case 'star-o':      return <svg {...common}><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.4 6.6L12 17l-6 3.5L7.4 14 2.5 9.4l6.6-.8z"/></svg>;
    case 'plus':        return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'edit':        return <svg {...common}><path d="M14 4l6 6L9 21H3v-6L14 4z"/></svg>;
    case 'image':       return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>;
    case 'file':        return <svg {...common}><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/></svg>;
    case 'settings':    return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1.1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8L4.2 7A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.7 7l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
    case 'bar':         return <svg {...common}><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-8"/><path d="M22 20H2"/></svg>;
    case 'flag':        return <svg {...common}><path d="M5 21V4"/><path d="M5 5h12l-2 4 2 4H5"/></svg>;
    case 'lightning':   return <svg {...common} fill="currentColor" stroke="none"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>;
    case 'logout':      return <svg {...common}><path d="M15 4h4v16h-4"/><path d="M10 17l-5-5 5-5"/><path d="M5 12h12"/></svg>;
    case 'upload':      return <svg {...common}><path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 20h16"/></svg>;
    case 'check':       return <svg {...common}><path d="M4 12l5 5 11-12"/></svg>;
    case 'dart':        return <svg {...common}><circle cx="11" cy="13" r="7"/><circle cx="11" cy="13" r="3"/><path d="M16 8l5-5"/><path d="M18 3h3v3"/></svg>;
    case 'phone':       return <svg {...common}><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>;
    case 'globe':       return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
    default:            return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
  }
}
