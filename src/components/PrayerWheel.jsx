import React, { useEffect, useRef } from 'react';
import { usePrayerWheelGSAP } from './usePrayerWheelGSAP';
import './PrayerWheel.css';

const WHEEL_CENTER_X = 200;
const WHEEL_CENTER_Y = 220;
const WHEEL_OUTER_RADIUS = 145;
const HUB_RADIUS = 48;

// Generate 8-fold mandala ring (decorative, static)
function MandalaRing() {
  const segments = 8;
  const rings = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x1 = WHEEL_CENTER_X + Math.cos(angle) * 160;
    const y1 = WHEEL_CENTER_Y + Math.sin(angle) * 160;
    const x2 = WHEEL_CENTER_X + Math.cos(angle) * 155;
    const y2 = WHEEL_CENTER_Y + Math.sin(angle) * 155;

    rings.push(
      <line
        key={`mandala-line-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#111"
        strokeWidth="1"
        opacity="0.3"
      />
    );

    // Decorative circles at cardinal points
    if (i % 2 === 0) {
      rings.push(
        <circle
          key={`mandala-dot-${i}`}
          cx={x1}
          cy={y1}
          r="2"
          fill="#E8890C"
          stroke="#111"
          strokeWidth="0.5"
        />
      );
    }
  }

  return <g>{rings}</g>;
}

// Outer ring with 8 decorative panels
function OuterRing() {
  const panels = [];
  const segmentAngle = (Math.PI * 2) / 8;

  for (let i = 0; i < 8; i++) {
    const angle1 = i * segmentAngle;
    const angle2 = (i + 1) * segmentAngle;
    const midAngle = (angle1 + angle2) / 2;

    const color = i % 2 === 0 ? '#C0392B' : '#F5C842';

    // Create curved panel segment
    const r1 = WHEEL_OUTER_RADIUS;
    const r2 = HUB_RADIUS + 5;

    const x1 = WHEEL_CENTER_X + Math.cos(angle1) * r1;
    const y1 = WHEEL_CENTER_Y + Math.sin(angle1) * r1;
    const x2 = WHEEL_CENTER_X + Math.cos(angle2) * r1;
    const y2 = WHEEL_CENTER_Y + Math.sin(angle2) * r1;
    const x3 = WHEEL_CENTER_X + Math.cos(angle2) * r2;
    const y3 = WHEEL_CENTER_Y + Math.sin(angle2) * r2;
    const x4 = WHEEL_CENTER_X + Math.cos(angle1) * r2;
    const y4 = WHEEL_CENTER_Y + Math.sin(angle1) * r2;

    const pathData = `
      M ${x1} ${y1}
      A ${r1} ${r1} 0 0 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${r2} ${r2} 0 0 0 ${x4} ${y4}
      Z
    `;

    panels.push(
      <path
        key={`panel-${i}`}
        d={pathData}
        fill={color}
        stroke="#111"
        strokeWidth="2"
      />
    );

    // Divider lines between panels
    const divX1 = WHEEL_CENTER_X + Math.cos(angle2) * r1;
    const divY1 = WHEEL_CENTER_Y + Math.sin(angle2) * r1;
    const divX2 = WHEEL_CENTER_X + Math.cos(angle2) * (r2 + 2);
    const divY2 = WHEEL_CENTER_Y + Math.sin(angle2) * (r2 + 2);

    panels.push(
      <line
        key={`divider-${i}`}
        x1={divX1}
        y1={divY1}
        x2={divX2}
        y2={divY2}
        stroke="#111"
        strokeWidth="3"
      />
    );
  }

  return <g>{panels}</g>;
}

// Tibetan mantra text curved along the ring
function MantraText() {
  const mantras = 'ཨོཾ་མ་ཎི་པདྨེ་ཧཱུྃ';
  const circleRadius = 110;

  return (
    <g>
      <defs>
        <path
          id="mantra-circle"
          d={`M ${WHEEL_CENTER_X - circleRadius}, ${WHEEL_CENTER_Y}
             a ${circleRadius},${circleRadius} 0 1,1 ${circleRadius * 2},0
             a ${circleRadius},${circleRadius} 0 1,1 ${-circleRadius * 2},0`}
          fill="none"
        />
      </defs>

      {/* Repeat mantra 3 times */}
      {[0, 1, 2].map((repetition) => (
        <text
          key={`mantra-rep-${repetition}`}
          fill="#FFF8E7"
          fontSize="14"
          fontFamily="'Noto Serif Tibetan', serif"
          fontWeight="400"
          letterSpacing="2"
        >
          <textPath href="#mantra-circle" startOffset={`${(repetition / 3) * 100}%`}>
            {mantras.split('').map((char, i) => (
              <tspan
                key={`char-${repetition}-${i}`}
                className="mantra-char"
                opacity="1"
              >
                {char}
              </tspan>
            ))}
          </textPath>
        </text>
      ))}
    </g>
  );
}

// Inner hub with 8-spoke dharma wheel (dharmachakra)
function InnerHub() {
  const spokes = [];
  const spokeCount = 8;

  for (let i = 0; i < spokeCount; i++) {
    const angle = (i / spokeCount) * Math.PI * 2;
    const x1 = WHEEL_CENTER_X + Math.cos(angle) * 8;
    const y1 = WHEEL_CENTER_Y + Math.sin(angle) * 8;
    const x2 = WHEEL_CENTER_X + Math.cos(angle) * 40;
    const y2 = WHEEL_CENTER_Y + Math.sin(angle) * 40;

    spokes.push(
      <line
        key={`spoke-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#111"
        strokeWidth="1.5"
      />
    );
  }

  return (
    <g>
      {/* Outer hub circle */}
      <circle
        cx={WHEEL_CENTER_X}
        cy={WHEEL_CENTER_Y}
        r={HUB_RADIUS}
        fill="#E8890C"
        stroke="#111"
        strokeWidth="2"
      />

      {/* Spoke lines */}
      {spokes}

      {/* Inner decorative circle */}
      <circle
        cx={WHEEL_CENTER_X}
        cy={WHEEL_CENTER_Y}
        r={HUB_RADIUS - 8}
        fill="none"
        stroke="#111"
        strokeWidth="1"
        opacity="0.5"
      />
    </g>
  );
}

// Central jewel (octagon)
function CentralJewel({ jewelRef }) {
  const size = 12;
  const angle = Math.PI / 8;

  let points = [];
  for (let i = 0; i < 8; i++) {
    const a = i * (Math.PI / 4) + angle;
    const x = WHEEL_CENTER_X + Math.cos(a) * size;
    const y = WHEEL_CENTER_Y + Math.sin(a) * size;
    points.push([x, y]);
  }

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') + ' Z';

  return (
    <g ref={jewelRef}>
      <path
        d={pathData}
        fill="#C0392B"
        stroke="#F5C842"
        strokeWidth="1.5"
      />
      <circle
        cx={WHEEL_CENTER_X}
        cy={WHEEL_CENTER_Y}
        r="3"
        fill="#FFF8E7"
      />
    </g>
  );
}

// Speed lines radiating from center
function SpeedLines({ speedLinesRef }) {
  const lines = [];
  const lineCount = 16;

  for (let i = 0; i < lineCount; i++) {
    const angle = (i / lineCount) * Math.PI * 2;
    const x1 = WHEEL_CENTER_X + Math.cos(angle) * 60;
    const y1 = WHEEL_CENTER_Y + Math.sin(angle) * 60;
    const x2 = WHEEL_CENTER_X + Math.cos(angle) * 120;
    const y2 = WHEEL_CENTER_Y + Math.sin(angle) * 120;

    lines.push(
      <line
        key={`speed-line-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#7FFFD4"
        strokeWidth="0.5"
        opacity="0"
      />
    );
  }

  return (
    <g ref={speedLinesRef} opacity="0">
      {lines}
    </g>
  );
}

// Particle blessing (lotus petals)
function Particles({ particlesRef }) {
  const particles = [];

  for (let i = 0; i < 12; i++) {
    particles.push(
      <ellipse
        key={`particle-${i}`}
        cx={WHEEL_CENTER_X}
        cy={WHEEL_CENTER_Y}
        rx="6"
        ry="3"
        fill="#E8567A"
        opacity="0"
      />
    );
  }

  return <g ref={particlesRef}>{particles}</g>;
}

// Axle rod (handle)
function AxleRod() {
  return (
    <g>
      {/* Main rod */}
      <rect
        x={194}
        y={360}
        width={12}
        height={120}
        fill="#8B4513"
        stroke="#111"
        strokeWidth="1"
      />
      {/* Highlight stripe */}
      <rect
        x={196}
        y={360}
        width={3}
        height={120}
        fill="#A0522D"
        opacity="0.6"
      />
      {/* Wood texture lines */}
      <line x1="200" y1="360" x2="200" y2="480" stroke="#111" strokeWidth="0.5" opacity="0.3" />
    </g>
  );
}

// Lotus petals at base (decorative)
function LotusPetals() {
  const petals = [];
  const petalCount = 5;

  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
    const petalWidth = 18;
    const petalHeight = 28;
    const petalX = WHEEL_CENTER_X + Math.cos(angle) * 110;
    const petalY = WHEEL_CENTER_Y + Math.sin(angle) * 110;

    petals.push(
      <ellipse
        key={`petal-${i}`}
        cx={petalX}
        cy={petalY}
        rx={petalWidth}
        ry={petalHeight}
        fill="#E8567A"
        stroke="#111"
        strokeWidth="1"
        transform={`rotate(${(angle * 180) / Math.PI} ${petalX} ${petalY})`}
        opacity="0.8"
      />
    );
  }

  return <g>{petals}</g>;
}

export default function PrayerWheel() {
  const { wheelRef, jewelRef, speedLinesRef, particlesRef, handleClick } = usePrayerWheelGSAP();

  return (
    <div className="prayer-wheel-wrap">
      <div
        className="prayer-wheel-container"
        onClick={handleClick}
        role="img"
        aria-label="Rotating Buddhist prayer wheel. Click to spin."
      >
        <svg
          className="prayer-wheel-svg"
          viewBox="0 0 400 500"
          width="300"
          height="375"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background */}
          <rect width="400" height="500" fill="#0a0814" />

          {/* Axle rod (behind wheel) */}
          <AxleRod />

          {/* Mandala ring (static) */}
          <MandalaRing />

          {/* Main rotating group - contains outer ring, mantra, and inner hub */}
          <g ref={wheelRef} style={{ transformOrigin: `${WHEEL_CENTER_X}px ${WHEEL_CENTER_Y}px` }}>
            {/* Outer ring */}
            <OuterRing />

            {/* Mantra text */}
            <MantraText />

            {/* Speed lines */}
            <SpeedLines speedLinesRef={speedLinesRef} />

            {/* Inner hub (rotates with wheel) */}
            <InnerHub />
          </g>

          {/* Central jewel */}
          <CentralJewel jewelRef={jewelRef} />

          {/* Particles */}
          <Particles particlesRef={particlesRef} />

          {/* Lotus petals at base */}
          <LotusPetals />
        </svg>
      </div>
    </div>
  );
}
