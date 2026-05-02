// Custom thin-line institutional icons (compass, shield, scale, sprout, candle)

export function CompassIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2"/>
      <path d="M12 3L10.5 9 12 10.5 13.5 9Z" fill="currentColor" stroke="none"/>
      <path d="M12 21L13.5 15 12 13.5 10.5 15Z" fill="currentColor" opacity="0.5" stroke="none"/>
    </svg>
  )
}

export function ShieldIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 2L4 6v6c0 5.5 3.5 10 8 11 4.5-1 8-5.5 8-11V6z"/>
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function ScaleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 3v18M4 21h16" strokeLinecap="round"/>
      <path d="M7 9l-4 8h8L7 9z"/>
      <path d="M17 7l-4 8h8L17 7z"/>
    </svg>
  )
}

export function SproutIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 22V10" strokeLinecap="round"/>
      <path d="M12 10C12 10 9 7 5 7c0 4 3.5 6 7 3z"/>
      <path d="M12 14C12 14 15 11 19 11c0 4-3.5 6-7 3z"/>
    </svg>
  )
}

export function CandleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="7" y="8" width="4" height="10" rx="0.5"/>
      <rect x="13" y="5" width="4" height="13" rx="0.5"/>
      <line x1="9" y1="5" x2="9" y2="8" strokeLinecap="round"/>
      <line x1="15" y1="2" x2="15" y2="5" strokeLinecap="round"/>
    </svg>
  )
}

export function GoalFlagIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 21V4" strokeLinecap="round"/>
      <path d="M4 4l12 4-12 4V4z" fill="currentColor" fillOpacity="0.15"/>
      <path d="M4 4l12 4-12 4" strokeLinejoin="round"/>
    </svg>
  )
}
