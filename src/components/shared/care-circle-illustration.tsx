/**
 * Hero illustration that makes the product's core metaphor literal: a
 * Member at the center, orbited by their consistent Primary/Secondary
 * Support Partners. Pure inline SVG — no external image assets, themes
 * automatically via CSS custom properties (works in light and dark).
 * Each partner gets a distinct accent color to read as a group of
 * different people, not one repeated icon.
 */
const ORBIT_RADIUS = 150;
const CENTER = 200;

const partners = [
  { angle: -90, label: "Primary", color: "var(--primary)" },
  { angle: 30, label: "Secondary", color: "var(--success)" },
  { angle: 150, label: "Secondary", color: "var(--chart-3)" },
];

function pointOnOrbit(angleDeg: number) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + ORBIT_RADIUS * Math.cos(angleRad),
    y: CENTER + ORBIT_RADIUS * Math.sin(angleRad),
  };
}

export function CareCircleIllustration() {
  return (
    <svg
      viewBox="0 0 400 400"
      role="img"
      aria-label="A member at the center of their Care Circle, connected to three consistent Support Partners"
      className="h-full w-full"
    >
      <circle
        cx={CENTER}
        cy={CENTER}
        r={ORBIT_RADIUS}
        fill="none"
        stroke="var(--border)"
        strokeWidth={2}
        strokeDasharray="4 8"
      />

      {partners.map((partner) => {
        const { x, y } = pointOnOrbit(partner.angle);
        return (
          <line
            key={`line-${partner.angle}`}
            x1={CENTER}
            y1={CENTER}
            x2={x}
            y2={y}
            stroke={partner.color}
            strokeOpacity={0.5}
            strokeWidth={2}
          />
        );
      })}

      {partners.map((partner) => {
        const { x, y } = pointOnOrbit(partner.angle);
        return (
          <g key={`node-${partner.angle}`}>
            <circle cx={x} cy={y} r={34} fill="var(--card)" stroke={partner.color} strokeWidth={3} />
            <circle cx={x} cy={y - 6} r={9} fill={partner.color} />
            <path d={`M ${x - 13} ${y + 16} a 13 11 0 0 1 26 0 z`} fill={partner.color} />
          </g>
        );
      })}

      <circle cx={CENTER} cy={CENTER} r={58} fill="var(--primary)" stroke="var(--success)" strokeWidth={3} />
      <circle cx={CENTER} cy={CENTER - 10} r={15} fill="var(--primary-foreground)" />
      <path
        d={`M ${CENTER - 22} ${CENTER + 26} a 22 18 0 0 1 44 0 z`}
        fill="var(--primary-foreground)"
      />
    </svg>
  );
}
