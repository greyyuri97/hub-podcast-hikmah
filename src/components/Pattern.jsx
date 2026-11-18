/** 8-pointed star (Rub el Hizb style) geometric lattice. Always used as a 4–6% watermark. */
export function StarPattern({ className = '', opacity = 0.05, id = 'star' }) {
  return (
    <svg aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} style={{ opacity }}>
      <defs>
        <pattern id={id} width="56" height="56" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round">
            <rect x="16" y="16" width="24" height="24" />
            <rect x="16" y="16" width="24" height="24" transform="rotate(45 28 28)" />
            <circle cx="28" cy="28" r="5" />
            <path d="M0 0 L8 8 M56 0 L48 8 M0 56 L8 48 M56 56 L48 48" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Single 8-point star glyph (for logo / ornaments). */
export function Star8({ className = '', ...rest }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" className={className} {...rest}>
      <rect x="6" y="6" width="12" height="12" rx="0.5" />
      <rect x="6" y="6" width="12" height="12" rx="0.5" transform="rotate(45 12 12)" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  );
}
