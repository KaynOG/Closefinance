"use client";

import { motion, useReducedMotion } from "framer-motion";

interface DottedArcGaugeProps {
  centerLabel?: string;
  centerValue: string;
  /** 0..1 — fração do arco preenchida */
  progress?: number;
  leftLabel?: string;
  leftValue?: string;
  leftHint?: string;
  rightLabel?: string;
  rightValue?: string;
  rightHint?: string;
  colorLeft?: string;
  colorRight?: string;
  outerDotsCount?: number;
  innerDotsCount?: number;
  enableAnimations?: boolean;
  footer?: React.ReactNode;
}

function generateDots(count: number, radius: number, cx: number, cy: number) {
  // Semicírculo superior: de 180° até 0°
  return Array.from({ length: count }, (_, i) => {
    const angle = Math.PI - (i / (count - 1)) * Math.PI;
    return {
      x: Math.round((cx + radius * Math.cos(angle)) * 100) / 100,
      y: Math.round((cy - radius * Math.sin(angle)) * 100) / 100,
      t: i / (count - 1),
      delay: i * 0.02,
    };
  });
}

export function DottedArcGauge({
  centerLabel = "TOTAL",
  centerValue,
  progress = 1,
  leftLabel,
  leftValue,
  leftHint,
  rightLabel,
  rightValue,
  rightHint,
  colorLeft = "var(--secondary)",
  colorRight = "#FF7A29",
  outerDotsCount = 34,
  innerDotsCount = 28,
  enableAnimations = true,
  footer,
}: DottedArcGaugeProps) {
  const reduce = useReducedMotion();
  const animate = enableAnimations && !reduce;

  const outer = generateDots(outerDotsCount, 150, 170, 168);
  const inner = generateDots(innerDotsCount, 120, 170, 168);

  const dot = (
    d: { x: number; y: number; t: number; delay: number },
    i: number,
    size: number,
    color: string,
    active: boolean,
  ) => (
    <motion.circle
      key={`${size}-${i}`}
      cx={d.x}
      cy={d.y}
      r={size}
      fill={color}
      initial={animate ? { opacity: 0, scale: 0 } : false}
      animate={{ opacity: active ? 0.95 : 0.14, scale: 1 }}
      transition={{ duration: 0.45, delay: animate ? d.delay : 0, ease: "easeOut" }}
      style={{ transformOrigin: `${d.x}px ${d.y}px` }}
    />
  );

  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 left-1/2 size-72 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: `color-mix(in oklab, ${colorLeft} 22%, transparent)` }}
      />
      <div className="relative">
        <svg viewBox="0 0 340 200" className="w-full h-[190px] sm:h-[220px]">
          {outer.map((d, i) => dot(d, i, 5, d.t <= 0.5 ? colorLeft : colorRight, d.t <= progress))}
          {inner.map((d, i) => dot(d, i, 4, d.t <= 0.5 ? colorLeft : colorRight, d.t <= progress))}
        </svg>

        <div className="absolute inset-x-0 top-[42%] -translate-y-1/2 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {centerLabel}
          </p>
          <motion.p
            key={centerValue}
            initial={animate ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="font-mono text-2xl sm:text-3xl font-bold tracking-tight"
          >
            {centerValue}
          </motion.p>
        </div>
      </div>

      {(leftValue || rightValue) && (
        <div className="grid grid-cols-2 gap-3 -mt-6">
          <motion.div
            initial={animate ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="border-l-2 pl-2"
            style={{ borderColor: colorLeft }}
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{leftLabel}</p>
            <p className="font-mono text-base font-bold">{leftValue}</p>
            {leftHint && <p className="font-mono text-[10px]" style={{ color: colorLeft }}>{leftHint}</p>}
          </motion.div>
          <motion.div
            initial={animate ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            className="border-l-2 pl-2 text-left"
            style={{ borderColor: colorRight }}
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{rightLabel}</p>
            <p className="font-mono text-base font-bold">{rightValue}</p>
            {rightHint && <p className="font-mono text-[10px]" style={{ color: colorRight }}>{rightHint}</p>}
          </motion.div>
        </div>
      )}

      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}
