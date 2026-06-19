export function Logo({ size = 36, className = "" }: { size?: number; className?: string }) {
  // CF monogram: stylized "C" arc + ascending bar chart inside, evoking growth & security
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-label="CloseFinance">
      <defs>
        <linearGradient id="cf-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#540BD3" />
          <stop offset="100%" stopColor="#B388FF" />
        </linearGradient>
        <linearGradient id="cf-grad2" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#FFCC00" />
          <stop offset="100%" stopColor="#FFE066" />
        </linearGradient>
      </defs>
      {/* shield-rounded square */}
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#cf-grad)" />
      <rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="rgba(255,255,255,0.18)" />
      {/* C arc */}
      <path
        d="M44 20 A14 14 0 1 0 44 44"
        stroke="white" strokeWidth="4.5" strokeLinecap="round" fill="none"
      />
      {/* F ascending bars (the "F" with chart bars) */}
      <rect x="24" y="34" width="4" height="10" rx="1.5" fill="url(#cf-grad2)" />
      <rect x="31" y="28" width="4" height="16" rx="1.5" fill="url(#cf-grad2)" />
      <rect x="38" y="22" width="4" height="22" rx="1.5" fill="url(#cf-grad2)" />
    </svg>
  );
}
