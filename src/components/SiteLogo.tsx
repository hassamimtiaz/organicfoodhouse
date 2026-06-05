import { useId } from 'react'
import { SITE } from '../config/site'
import './SiteLogo.css'

interface SiteLogoProps {
  className?: string
  /** Header row layout, stacked full SVG, or leaf mark only */
  variant?: 'header' | 'full' | 'mark'
}

const LEAF_VIEWBOX = '272 68 136 185'

function LeafGraphic({ idPrefix }: { idPrefix: string }) {
  const centerClip = `${idPrefix}-centerLeafClip`
  const leftClip = `${idPrefix}-leftLeafClip`
  const rightClip = `${idPrefix}-rightLeafClip`

  return (
    <>
      <defs>
        <clipPath id={centerClip}>
          <path d="M340 73 C334 93 310 123 318 201 C318 201 340 215 362 201 C370 123 346 93 340 73 Z" />
        </clipPath>
        <clipPath id={leftClip}>
          <path d="M322 200 C322 200 278 175 282 93 C282 93 330 125 322 200 Z" />
        </clipPath>
        <clipPath id={rightClip}>
          <path d="M358 200 C358 200 402 175 398 93 C398 93 350 125 358 200 Z" />
        </clipPath>
      </defs>

      <path
        d="M322 200 C322 200 278 175 282 93 C282 93 330 125 322 200 Z"
        fill="#7BAE5A"
        opacity="0.6"
      />
      <line
        x1="301"
        y1="103"
        x2="319"
        y2="194"
        stroke="#4A8C3F"
        strokeWidth="0.9"
        opacity="0.7"
        clipPath={`url(#${leftClip})`}
      />

      <path
        d="M358 200 C358 200 402 175 398 93 C398 93 350 125 358 200 Z"
        fill="#7BAE5A"
        opacity="0.6"
      />
      <line
        x1="379"
        y1="103"
        x2="361"
        y2="194"
        stroke="#4A8C3F"
        strokeWidth="0.9"
        opacity="0.7"
        clipPath={`url(#${rightClip})`}
      />

      <path
        d="M340 73 C334 93 310 123 318 201 C318 201 340 215 362 201 C370 123 346 93 340 73 Z"
        fill="#2C5F2E"
      />

      <line
        x1="340"
        y1="76"
        x2="340"
        y2="212"
        stroke="#4A8C3F"
        strokeWidth="1.2"
        clipPath={`url(#${centerClip})`}
      />
      <line
        x1="340"
        y1="115"
        x2="324"
        y2="133"
        stroke="#5AA040"
        strokeWidth="0.8"
        clipPath={`url(#${centerClip})`}
      />
      <line
        x1="340"
        y1="138"
        x2="322"
        y2="158"
        stroke="#5AA040"
        strokeWidth="0.8"
        clipPath={`url(#${centerClip})`}
      />
      <line
        x1="340"
        y1="160"
        x2="323"
        y2="178"
        stroke="#5AA040"
        strokeWidth="0.8"
        clipPath={`url(#${centerClip})`}
      />
      <line
        x1="340"
        y1="115"
        x2="356"
        y2="133"
        stroke="#5AA040"
        strokeWidth="0.8"
        clipPath={`url(#${centerClip})`}
      />
      <line
        x1="340"
        y1="138"
        x2="358"
        y2="158"
        stroke="#5AA040"
        strokeWidth="0.8"
        clipPath={`url(#${centerClip})`}
      />
      <line
        x1="340"
        y1="160"
        x2="357"
        y2="178"
        stroke="#5AA040"
        strokeWidth="0.8"
        clipPath={`url(#${centerClip})`}
      />

      <path
        d="M340 215 C338 226 338 238 340 248"
        fill="none"
        stroke="#2C5F2E"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  )
}

function LeafMark({ className = '' }: { className?: string }) {
  const idPrefix = useId().replace(/:/g, '')

  return (
    <svg
      className={`site-logo-mark ${className}`.trim()}
      viewBox={LEAF_VIEWBOX}
      aria-hidden="true"
      focusable="false"
    >
      <LeafGraphic idPrefix={idPrefix} />
    </svg>
  )
}

export default function SiteLogo({
  className = '',
  variant = 'header',
}: SiteLogoProps) {
  const fullIdPrefix = useId().replace(/:/g, '')

  if (variant === 'mark') {
    return (
      <LeafMark
        className={`site-logo site-logo--mark-only ${className}`.trim()}
      />
    )
  }

  if (variant === 'full') {
    return (
      <svg
        className={`site-logo site-logo--full ${className}`.trim()}
        viewBox="0 0 680 340"
        role="img"
        aria-label={SITE.name}
      >
        <LeafGraphic idPrefix={fullIdPrefix} />
        <text
          x="340"
          y="278"
          textAnchor="middle"
          fontFamily="'Cormorant Garamond', Georgia, serif"
          fontWeight="600"
          fontSize="46"
          fill="#2C5F2E"
          letterSpacing="1"
        >
          {SITE.name}
        </text>
        <line x1="220" y1="248" x2="460" y2="248" stroke="#B5C9A0" strokeWidth="0.8" />
        <text
          x="340"
          y="308"
          textAnchor="middle"
          fontFamily="'Jost', sans-serif"
          fontWeight="500"
          fontSize="12"
          fill="#7BAE5A"
          letterSpacing="5"
        >
          FARM FRESH · NATURALLY PURE
        </text>
      </svg>
    )
  }

  return (
    <span
      className={`site-logo site-logo--header ${className}`.trim()}
      role="img"
      aria-label={SITE.name}
    >
      <LeafMark />
      <span className="site-logo-text">
        <span className="site-logo-name">{SITE.name}</span>
        <span className="site-logo-tagline">FARM FRESH · NATURALLY PURE</span>
      </span>
    </span>
  )
}
