interface LogoProps { size?: 'sm' | 'md' | 'lg'; className?: string; showWordmark?: boolean }

export function Logo({ size = 'md', className = '', showWordmark = true }: LogoProps) {
  const sizes = { sm: 24, md: 32, lg: 48 }
  const s = sizes[size]
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Compass mark — custom SVG, GS line-art inspired */}
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="15" stroke="#B89D5E" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="2" fill="#B89D5E" />
        {/* N arrow */}
        <path d="M16 4L14 14L16 13.5L18 14Z" fill="#0B1F3A" />
        {/* S arrow */}
        <path d="M16 28L18 18L16 18.5L14 18Z" fill="#B89D5E" />
        {/* Tick marks */}
        <line x1="16" y1="2" x2="16" y2="5" stroke="#0B1F3A" strokeWidth="1.5" />
        <line x1="16" y1="27" x2="16" y2="30" stroke="#B89D5E" strokeWidth="1.5" />
        <line x1="2" y1="16" x2="5" y2="16" stroke="#0B1F3A" strokeWidth="1.5" />
        <line x1="27" y1="16" x2="30" y2="16" stroke="#0B1F3A" strokeWidth="1.5" />
      </svg>
      {showWordmark && (
        <span style={{ fontFamily: 'Goldman Sans, Inter, sans-serif' }} className="font-semibold tracking-tight text-ink">
          <span style={{ fontSize: size === 'sm' ? 14 : size === 'md' ? 18 : 24 }}>Portfolio</span>
          <span style={{ fontSize: size === 'sm' ? 14 : size === 'md' ? 18 : 24, color: '#B89D5E', marginLeft: 3 }}>GPS</span>
        </span>
      )}
    </div>
  )
}
export default Logo
