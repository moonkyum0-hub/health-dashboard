export default function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="120%" y2="120%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="50%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="logoChartGradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#0891b2" stopOpacity={0.6} />
          <stop offset="60%" stopColor="#0ea5e9" stopOpacity={0.85} />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>

      <rect width="96" height="96" rx="22" fill="url(#logoGradient)" opacity={0.08} />

      <path
        d="M 44 68
           C 28 54, 18 44, 18 34
           C 18 24, 26 16, 34 16
           C 40 16, 44 22, 44 28
           C 44 22, 48 16, 54 16
           C 62 16, 70 24, 70 34
           C 70 44, 60 54, 44 68 Z"
        fill="url(#logoGradient)"
        transform="translate(2, 2) scale(0.78)"
      />

      <g transform="translate(56, 56)">
        <rect x="0" y="20" width="8" height="16" rx="4" fill="url(#logoChartGradient)" />
        <rect x="12" y="10" width="8" height="26" rx="4" fill="url(#logoChartGradient)" />
        <rect x="24" y="0" width="8" height="36" rx="4" fill="url(#logoChartGradient)" />
      </g>
    </svg>
  );
}
