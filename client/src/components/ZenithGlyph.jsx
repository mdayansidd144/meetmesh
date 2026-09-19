export default function ZenithGlyph({ size = 40, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="zenithGrad" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#F43F5E" />
        </linearGradient>
        <radialGradient id="zenithGlow" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#0A0A1A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background circle */}
      <circle cx="32" cy="32" r="30" fill="#0A0A1A" />
      <circle cx="32" cy="32" r="30" fill="url(#zenithGlow)" />

      {/* Peak / A shape */}
      <g
        stroke="url(#zenithGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {/* Left leg of A */}
        <path d="M 18 50 L 32 12" />
        {/* Right leg of A */}
        <path d="M 46 50 L 32 12" />
        {/* Inner left leg */}
        <path d="M 22 50 L 32 26" opacity="0.55" />
        {/* Inner right leg */}
        <path d="M 42 50 L 32 26" opacity="0.55" />
      </g>

      {/* Vertical beam through center */}
      <line
        x1="32"
        y1="8"
        x2="32"
        y2="56"
        stroke="url(#zenithGrad)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Horizontal converging lines (left side) */}
      <g
        stroke="url(#zenithGrad)"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.85"
      >
        <line x1="6" y1="38" x2="24" y2="38" />
        <line x1="8" y1="42" x2="24" y2="42" opacity="0.7" />
        <line x1="10" y1="46" x2="24" y2="46" opacity="0.5" />
      </g>

      {/* Horizontal converging lines (right side) */}
      <g
        stroke="url(#zenithGrad)"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.85"
      >
        <line x1="40" y1="38" x2="58" y2="38" />
        <line x1="40" y1="42" x2="56" y2="42" opacity="0.7" />
        <line x1="40" y1="46" x2="54" y2="46" opacity="0.5" />
      </g>

      {/* Apex glow node */}
      <circle cx="32" cy="12" r="3" fill="#F43F5E" />
      <circle cx="32" cy="12" r="5" fill="#F43F5E" opacity="0.25" />
    </svg>
  );
}